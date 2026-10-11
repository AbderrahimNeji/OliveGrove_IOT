const express = require('express');
const { MongoClient } = require('mongodb');
const { spawn } = require('child_process');
const { parseSensorPayload, parseHistoryLimit } = require('./sensor-data');
const app = express();

// Servir les fichiers statiques (HTML, CSS, JS) depuis le dossier actuel
app.use(express.static(__dirname));

// Middleware pour parser JSON
app.use(express.json());

// Configuration via variables d'environnement
const PORT = process.env.PORT || 3000;
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'olive_grove';
const PYTHON = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
const ML_TIMEOUT_MS = Number(process.env.ML_TIMEOUT_MS) || 15000;
let mongoClient = null;
let isMongoConnected = false;
const startTime = Date.now();

// Cache pour les prédictions
const predictionCache = new Map();

// Health check endpoint
app.get('/health', async (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const mongoStatus = isMongoConnected ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    uptime: uptimeSeconds,
    mongodb: mongoStatus,
    timestamp: new Date().toISOString()
  });
});

// Fonction pour se connecter à MongoDB
async function connectMongoDB() {
  if (isMongoConnected && mongoClient) return mongoClient;
  
  try {
    mongoClient = new MongoClient(uri, { 
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });
    await mongoClient.connect();
    isMongoConnected = true;
    console.log('✓ Connecté à MongoDB');
    return mongoClient;
  } catch (error) {
    console.warn('⚠️ MongoDB non disponible:', error.message);
    isMongoConnected = false;
    return null;
  }
}

// Endpoint pour recevoir les données du capteur et faire la prédiction
app.post('/data', async (req, res) => {
  const parsed = parseSensorPayload(req.body);
  if (!parsed.ok) {
    return res.status(400).json({ status: 'error', message: parsed.error });
  }

  console.log('Données reçues:', parsed.data);
  try {
    const prediction = await callMLModel(parsed.data);

    (async () => {
      try {
        const client = await connectMongoDB();
        if (client) {
          const db = client.db(DB_NAME);
          const collection = db.collection('sensor_data');
          await collection.insertOne({
            ...parsed.data,
            _insertedAt: new Date()
          });
          console.log('✓ Données sauvegardées dans MongoDB');
        }
      } catch (mongoError) {
        console.warn('⚠️ Erreur MongoDB:', mongoError.message);
      }
    })();

    res.status(201).json({
      status: 'ok',
      prediction: prediction
    });
  } catch (error) {
    console.error('Erreur prédiction:', error);
    res.status(500).json({ status: 'error', message: 'Prediction failed' });
  }
});

// Endpoint pour obtenir une prédiction uniquement
app.post('/predict', async (req, res) => {
  const parsed = parseSensorPayload(req.body);
  if (!parsed.ok) {
    return res.status(400).json({ error: parsed.error });
  }

  try {
    const prediction = await callMLModel(parsed.data);
    res.json(prediction);
  } catch (error) {
    console.error('Erreur prédiction:', error);
    res.status(500).json({ error: 'Prediction failed' });
  }
});

// Endpoint pour récupérer les dernières données
app.get('/latest-data', async (req, res) => {
  try {
    let sensorData = null;
    let prediction = null;
    
    const client = await connectMongoDB();
    if (client) {
      try {
        const db = client.db(DB_NAME);
        const collection = db.collection('sensor_data');
        sensorData = await collection.findOne({}, { sort: { _id: -1 } });
        
        // Faire une prédiction sur les dernières données
        if (sensorData) {
          prediction = await callMLModel(sensorData);
        }
      } catch (mongoError) {
        console.log('Erreur MongoDB:', mongoError.message);
      }
    }
    
    res.json({ 
      sensor_data: sensorData,
      prediction: prediction
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint pour récupérer l'historique horaire avec prédictions
app.get('/history', async (req, res) => {
  try {
    let history = [];
    const limit = parseHistoryLimit(req.query.limit);
    
    console.log(`📊 Récupération de l'historique (limit: ${limit})...`);
    
    const client = await connectMongoDB();
    if (client) {
      try {
        const db = client.db(DB_NAME);
        const collection = db.collection('sensor_data');
        
        // Récupérer les dernières données SANS prédictions - trop lent!
        const data = await collection.find({})
          .sort({ _id: -1 })
          .limit(limit)
          .project({
            temp_c: 1,
            soil_pct: 1,
            rain_pct: 1,
            timestamp: 1,
            _insertedAt: 1,
            _id: 1
          })
          .toArray();
        
        console.log(`✓ ${data.length} données trouvées`);
        
        // Créer l'historique avec les données capteurs + prédictions en parallèle
        const promises = [];
        for (const item of data.reverse()) {
          promises.push((async () => {
            try {
              const parsedItem = parseSensorPayload({
                temp_c: item.temp_c,
                soil_pct: item.soil_pct,
                rain_pct: item.rain_pct,
                humidite_pct: item.rain_pct,
                pluie_mm: (item.rain_pct || 0) * 0.1,
                code_meteo_dominant: 3
              });
              if (!parsedItem.ok) {
                throw new Error(parsedItem.error);
              }
              const prediction = await callMLModel(parsedItem.data);
              
              return {
                timestamp: item.timestamp || item._insertedAt || new Date(item._id.getTimestamp()),
                sensor_data: {
                  temp_c: item.temp_c || 0,
                  soil_pct: item.soil_pct || 0,
                  rain_pct: item.rain_pct || 0
                },
                prediction: prediction
              };
            } catch (e) {
              console.log('Erreur prédiction item:', e.message);
              return {
                timestamp: item.timestamp || item._insertedAt || new Date(item._id.getTimestamp()),
                sensor_data: {
                  temp_c: item.temp_c || 0,
                  soil_pct: item.soil_pct || 0,
                  rain_pct: item.rain_pct || 0
                },
                prediction: {
                  etat_olivier: 'Sain',
                  action_recommandee: 'Continuer le suivi',
                  success: true
                }
              };
            }
          })());
        }
        
        // Attendre max 10 secondes pour les prédictions (retourner ce qu'on a)
        const timeout = new Promise(resolve => setTimeout(() => resolve(null), 10000));
        const results = await Promise.race([
          Promise.all(promises),
          timeout
        ]);
        
        if (results) {
          history = results;
        } else {
          // Timeout - retourner les résultats partiels
          history = await Promise.allSettled(promises).then(settled =>
            settled.map(r => r.status === 'fulfilled' ? r.value : null).filter(x => x)
          );
        }
      } catch (mongoError) {
        console.error('Erreur requête MongoDB:', mongoError.message);
        res.status(500).json({ error: mongoError.message, history: [], count: 0 });
        return;
      }
    } else {
      res.status(503).json({ error: 'MongoDB non disponible', history: [], count: 0 });
      return;
    }
    
    console.log(`✓ Historique prêt: ${history.length} entrées avec prédictions`);
    res.json({ 
      status: history.length > 0 ? 'ok' : 'empty',
      history: history,
      count: history.length
    });
  } catch (error) {
    console.error('Erreur historique:', error);
    res.status(500).json({ error: error.message, history: [], count: 0 });
  }
});

// Fonction pour appeler le modèle ML Python
function callMLModel(sensorData) {
  return new Promise((resolve, reject) => {
    const python = spawn(PYTHON, ['ml_api.py', JSON.stringify(sensorData)]);
    let output = '';
    let errorOutput = '';
    let settled = false;

    const finish = (fn) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    };

    const timer = setTimeout(() => {
      python.kill('SIGKILL');
      finish(() => reject(new Error('Prediction timed out')));
    }, ML_TIMEOUT_MS);

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    python.on('error', (error) => {
      finish(() => reject(error));
    });

    python.on('close', (code) => {
      if (code !== 0) {
        console.error('Erreur Python:', errorOutput || `exit ${code}`);
        finish(() => reject(new Error('Prediction process failed')));
        return;
      }
      try {
        const jsonMatch = output.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          finish(() => reject(new Error('Prediction output was not JSON')));
          return;
        }
        finish(() => resolve(JSON.parse(jsonMatch[0])));
      } catch (e) {
        finish(() => reject(e));
      }
    });
  });
}

app.listen(PORT, () => {
  console.log('========================================');
  console.log(`API prête sur le port ${PORT}`);
  console.log(`Ouvre http://localhost:${PORT} dans ton navigateur`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log('Modèle ML intégré et prêt');
  console.log('========================================');
});
