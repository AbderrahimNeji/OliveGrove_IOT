// script.js - Gestion de la connexion au port série Arduino

let port = null;
let reader = null;
let isConnected = false;

// Éléments du DOM
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const connectionStatus = document.getElementById('connectionStatus');
const logsContainer = document.getElementById('logsContainer');
const clearLogsBtn = document.getElementById('clearLogsBtn');
const predictionContainer = document.getElementById('predictionContainer');
const historyContainer = document.getElementById('historyContainer');
const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');

console.log('✓ DOM Elements:', {
  connectBtn: !!connectBtn,
  historyContainer: !!historyContainer,
  refreshHistoryBtn: !!refreshHistoryBtn
});

// Éléments des capteurs
const soilPctEl = document.getElementById('soilPct');
const soilRawEl = document.getElementById('soilRaw');
const tempCEl = document.getElementById('tempC');
const rainPctEl = document.getElementById('rainPct');
const rainRawEl = document.getElementById('rainRaw');
const rainDOEl = document.getElementById('rainDO');
const lastUpdateEl = document.getElementById('lastUpdate');

// ========== Événements ==========
if (connectBtn) connectBtn.addEventListener('click', connectToArduino);
if (disconnectBtn) disconnectBtn.addEventListener('click', disconnectFromArduino);
if (clearLogsBtn) clearLogsBtn.addEventListener('click', clearLogs);
if (refreshHistoryBtn) {
    console.log('✓ Ajout listener sur refreshHistoryBtn');
    refreshHistoryBtn.addEventListener('click', loadHistory);
} else {
    console.warn('⚠️ refreshHistoryBtn non trouvé!');
}

// ========== Connexion à Arduino ==========
async function connectToArduino() {
    try {
        // Ouvrir le sélecteur de port
        port = await navigator.serial.requestPort();

        // Ouvrir le port avec les paramètres corrects
        await port.open({ 
            baudRate: 115200,
            dataBits: 8,
            stopBits: 1,
            parity: 'none',
            flowControl: 'none'
        });

        isConnected = true;
        updateConnectionStatus(true);
        addLog('✓ Connecté à Arduino');

        // Commencer à lire les données
        readFromArduino();

    } catch (error) {
        console.error('Erreur de connexion:', error);
        addLog('✗ Erreur: ' + error.message);
        isConnected = false;
        updateConnectionStatus(false);
    }
}

// ========== Déconnexion d'Arduino ==========
async function disconnectFromArduino() {
    try {
        isConnected = false;
        
        if (reader) {
            try {
                await reader.cancel();
            } catch (e) {
                console.log('Cancel reader:', e);
            }
            reader = null;
        }
        
        if (port) {
            try {
                await port.close();
            } catch (e) {
                console.log('Close port:', e);
            }
            port = null;
        }
        
        updateConnectionStatus(false);
        addLog('✓ Déconnecté d\'Arduino');
    } catch (error) {
        console.error('Erreur de déconnexion:', error);
        addLog('✗ Erreur de déconnexion: ' + error.message);
        isConnected = false;
        updateConnectionStatus(false);
    }
}

// ========== Lecture des Données ==========
async function readFromArduino() {
    try {
        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
        reader = textDecoder.readable.getReader();

        let buffer = '';

        while (isConnected) {
            const { value, done } = await reader.read();

            if (done || !isConnected) {
                reader.releaseLock();
                break;
            }

            // Ajouter les données au buffer
            buffer += value;

            // Traiter les lignes complètes
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Garder la dernière ligne incomplète

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine && isConnected) {
                    parseAndDisplayData(trimmedLine);
                }
            }
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Erreur de lecture:', error);
            addLog('✗ Erreur de lecture: ' + error.message);
        }
        isConnected = false;
        updateConnectionStatus(false);
    }
}

function parseAndDisplayData(line) {
    try {
        // Extraire les valeurs avec des expressions régulières
        const soilRawMatch = line.match(/Soil raw:\s*(\d+)/);
        const soilPctMatch = line.match(/Soil %:\s*(\d+)/);
        const rainRawMatch = line.match(/Rain raw:\s*(\d+)/);
        const rainPctMatch = line.match(/Rain %:\s*(\d+)/);
        const tempMatch = line.match(/Temp:\s*([\d.]+)/);
        const rainDOMatch = line.match(/Rain DO:\s*(\d+)/);

        if (soilPctMatch && tempMatch && rainPctMatch) {
            // Mettre à jour l'affichage
            const soilPct = parseInt(soilPctMatch[1]);
            const soilRaw = soilRawMatch ? parseInt(soilRawMatch[1]) : 0;
            const tempC = parseFloat(tempMatch[1]);
            const rainPct = parseInt(rainPctMatch[1]);
            const rainRaw = rainRawMatch ? parseInt(rainRawMatch[1]) : 0;
            const rainDO = rainDOMatch ? parseInt(rainDOMatch[1]) : 0;

            // Afficher les valeurs
            soilPctEl.textContent = soilPct + '%';
            soilRawEl.textContent = soilRaw;
            tempCEl.textContent = tempC.toFixed(2) + '°C';
            rainPctEl.textContent = rainPct + '%';
            rainRawEl.textContent = rainRaw;
            rainDOEl.textContent = rainDO === 0 ? 'Pluie Détectée 💧' : 'Sec ☀️';

            // Mettre à jour l'heure
            const now = new Date();
            lastUpdateEl.textContent = now.toLocaleTimeString('fr-FR');

            // Ajouter au journal
            addLog(`📊 Données reçues: Sol ${soilPct}% | Temp ${tempC.toFixed(1)}°C | Pluie ${rainPct}%`);

            // ========== ENVOYER À MONGODB ET AU MODÈLE ==========
            const sensorData = {
                soil_pct: soilPct,
                rain_pct: rainPct,
                temp_c: tempC,
                rain_raw: rainRaw,
                soil_raw: soilRaw,
                rain_do: rainDO,
                timestamp: new Date().toISOString(),
                humidite_pct: rainPct,
                pluie_mm: rainPct * 0.1, // Conversion approximative
                code_meteo_dominant: rainDO === 0 ? 61 : 3 // 61 = pluie, 3 = dégagé
            };

            fetch('http://localhost:3000/data', {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sensorData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'ok') {
                    addLog('✔️ Données reçues et sauvegardées');
                    
                    // Afficher la prédiction si disponible
                    if (data.prediction) {
                        if (data.prediction.success === false) {
                            addLog('⚠️ Erreur prédiction: ' + data.prediction.error);
                        } else {
                            displayPrediction(data.prediction);
                        }
                    }
                } else {
                    addLog('⚠️ Erreur lors du traitement');
                }
            })
            .catch(error => {
                addLog('⚠️ Erreur réseau: ' + error.message);
                console.error('Erreur:', error);
            });
        }
    } catch (error) {
        console.error('Erreur d\'analyse:', error);
    }
}

// ========== Affichage de la Prédiction ==========
function displayPrediction(prediction) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR');
    
    let statusClass = 'success';
    if (prediction.etat_olivier === 'Stress Hydrique' || prediction.etat_olivier === 'Stress Chaleur') {
        statusClass = 'warning';
    } else if (prediction.etat_olivier.includes('Risque') || prediction.etat_olivier === 'Maladie Grave') {
        statusClass = 'danger';
    }
    
    const html = `
        <div class="prediction-result ${statusClass}">
            <div class="prediction-status">
                <span class="prediction-icon">${getIconForState(prediction.etat_olivier)}</span>
                <div>
                    <div class="prediction-state">${prediction.etat_olivier}</div>
                </div>
            </div>
            <div class="prediction-action">
                <strong>Action recommandée:</strong> ${prediction.action_recommandee}
            </div>
            <div class="prediction-conclusion">
                ${prediction.conclusion}
            </div>
            <div class="prediction-timestamp">
                🕐 ${timeStr}
            </div>
        </div>
    `;
    
    predictionContainer.innerHTML = html;
    addLog(`🤖 Prédiction IA: ${prediction.etat_olivier}`);
}

function getIconForState(state) {
    const icons = {
        'Sain': '🌳',
        'Stress Hydrique': '💧',
        'Stress Chaleur': '🌡️',
        'Risque Fongique': '🍄',
        'Maladie Grave': '🚨'
    };
    return icons[state] || '🤖';
}

// ========== Mise à Jour du Statut de Connexion ==========
function updateConnectionStatus(connected) {
    if (connected) {
        connectionStatus.textContent = 'Connecté';
        connectionStatus.classList.remove('offline');
        connectionStatus.classList.add('online');
        connectBtn.disabled = true;
        disconnectBtn.disabled = false;
    } else {
        connectionStatus.textContent = 'Déconnecté';
        connectionStatus.classList.remove('online');
        connectionStatus.classList.add('offline');
        connectBtn.disabled = false;
        disconnectBtn.disabled = true;
    }
}

// ========== Gestion du Journal ==========
function addLog(message) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR');
    const logEntry = document.createElement('p');
    logEntry.className = 'log-entry';
    logEntry.textContent = `[${timeStr}] ${message}`;

    logsContainer.insertBefore(logEntry, logsContainer.firstChild);

    // Garder seulement les 50 dernières entrées
    while (logsContainer.children.length > 50) {
        logsContainer.removeChild(logsContainer.lastChild);
    }
}

function clearLogs() {
    logsContainer.innerHTML = '<p class="log-entry">Journal effacé</p>';
}

// ========== Charger les dernières données ==========
async function loadLatestData() {
    try {
        const response = await fetch('http://localhost:3000/latest-data');
        if (response.ok) {
            const data = await response.json();
            if (data.sensor_data) {
                // Afficher les données du capteur
                soilPctEl.textContent = data.sensor_data.soil_pct + '%';
                tempCEl.textContent = data.sensor_data.temp_c + '°C';
                rainPctEl.textContent = data.sensor_data.rain_pct + '%';
                rainDOEl.textContent = data.sensor_data.rain_do === 0 ? 'Pluie 💧' : 'Sec ☀️';
                
                // Afficher la prédiction si disponible
                if (data.prediction) {
                    displayPrediction(data.prediction);
                }
                
                addLog('✔️ Dernières données chargées');
            }
        }
    } catch (error) {
        console.log('Première connexion ou pas de données sauvegardées');
    }
}

// ========== Charger l'Historique ==========
async function loadHistory() {
    try {
        if (!historyContainer) {
            console.error('⚠️ historyContainer n\'existe pas!');
            return;
        }
        
        console.log('📊 Chargement de l\'historique depuis MongoDB...');
        addLog('📊 Chargement de l\'historique depuis MongoDB...');
        
        const response = await fetch('http://localhost:3000/history');
        console.log('Réponse status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✓ Données reçues:', data);
            
            if (data.history && data.history.length > 0) {
                console.log(`📊 ${data.history.length} entrées trouvées`);
                displayHistory(data.history);
                addLog(`✔️ Historique chargé: ${data.history.length} entrées`);
            } else {
                console.warn('⚠️ Pas de données historiques');
                historyContainer.innerHTML = '<p class="history-placeholder">Pas de données historiques disponibles. Connectez Arduino pour enregistrer des données.</p>';
                addLog('⚠️ Aucune donnée historique trouvée dans MongoDB');
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Erreur serveur:', response.status, errorData);
            historyContainer.innerHTML = '<p class="history-placeholder">Erreur: ' + (errorData.error || 'Erreur serveur ' + response.status) + '</p>';
            addLog('⚠️ Erreur serveur: ' + (errorData.error || 'inconnue'));
        }
    } catch (error) {
        console.error('Erreur historique:', error);
        addLog('⚠️ Erreur: ' + error.message);
        if (historyContainer) {
            historyContainer.innerHTML = '<p class="history-placeholder">Erreur: ' + error.message + '. MongoDB est-il disponible?</p>';
        }
    }
}

// ========== Afficher l'Historique ==========
function displayHistory(history) {
    if (!history || history.length === 0) {
        console.warn('Pas de données à afficher');
        historyContainer.innerHTML = '<p class="history-placeholder">Pas de données</p>';
        return;
    }
    
    console.log(`Affichage de ${history.length} entrées`);
    let html = '';
    let errorCount = 0;
    
    for (let i = 0; i < history.length; i++) {
        try {
            const item = history[i];
            
            if (!item.timestamp || !item.sensor_data) {
                console.warn(`Item ${i} incomplet:`, item);
                errorCount++;
                continue;
            }
            
            const time = new Date(item.timestamp);
            const timeStr = time.toLocaleString('fr-FR');
            
            // Déterminer l'état basé sur les données capteurs
            let statusClass = 'warning';
            let etat = 'Analyse en cours...';
            let action = 'Chargement...';
            
            if (item.prediction && item.prediction.etat_olivier) {
                etat = item.prediction.etat_olivier;
                action = item.prediction.action_recommandee || 'Pas d\'action';
                
                if (etat === 'Sain') {
                    statusClass = 'success';
                } else if (etat.includes('Grave') || etat.includes('Risque')) {
                    statusClass = 'danger';
                }
            } else {
                // Analyse simple basée sur les capteurs
                const temp = item.sensor_data.temp_c || 0;
                const soil = item.sensor_data.soil_pct || 0;
                const rain = item.sensor_data.rain_pct || 0;
                
                if (temp > 40 || soil < 20) {
                    etat = 'Stress Hydrique';
                    action = 'Arroser immédiatement';
                    statusClass = 'danger';
                } else if (temp > 35 || soil < 30) {
                    etat = 'Alerte';
                    action = 'Surveiller l\'humidité';
                    statusClass = 'warning';
                } else {
                    etat = 'Sain';
                    action = 'Continuer le suivi';
                    statusClass = 'success';
                }
            }
            
            const icon = getIconForState(etat);
            
            html += `
                <div class="history-item">
                    <div class="history-item-header">
                        <span class="history-time">🕐 ${timeStr}</span>
                        <span class="history-state ${statusClass}">${icon} ${etat}</span>
                    </div>
                    
                    <div class="history-sensors">
                        <div class="history-sensor-item">
                            <div class="history-sensor-label">Température</div>
                            <div class="history-sensor-value">${(item.sensor_data.temp_c || 0).toFixed(1)}°C</div>
                        </div>
                        <div class="history-sensor-item">
                            <div class="history-sensor-label">Sol</div>
                            <div class="history-sensor-value">${item.sensor_data.soil_pct || 0}%</div>
                        </div>
                        <div class="history-sensor-item">
                            <div class="history-sensor-label">Pluie</div>
                            <div class="history-sensor-value">${item.sensor_data.rain_pct || 0}%</div>
                        </div>
                    </div>
                    
                    <div class="history-prediction ${statusClass}">
                        <div class="history-state">${icon} État: ${etat}</div>
                        <div class="history-action">📋 ${action}</div>
                    </div>
                </div>
            `;
        } catch (e) {
            console.error(`Erreur affichage item ${i}:`, e);
            errorCount++;
        }
    }
    
    if (html === '') {
        console.error('Aucun HTML généré!');
        historyContainer.innerHTML = '<p class="history-placeholder">Erreur lors de l\'affichage des données (' + errorCount + ' erreurs)</p>';
    } else {
        console.log('✓ HTML généré, affichage...');
        historyContainer.innerHTML = html;
        console.log('✓ Historique affiché avec succès');
    }
}

// ========== Vérification de la Compatibilité ==========
window.addEventListener('load', function() {
    console.log('🔄 Page chargée, initialisation...');
    
    if (!navigator.serial) {
        addLog('⚠️ Votre navigateur ne supporte pas la Web Serial API');
        addLog('Utilisez Chrome, Edge ou un navigateur compatible');
        connectBtn.disabled = true;
    } else {
        addLog('✓ Web Serial API disponible');
    }
    
    // Charger les dernières données au démarrage
    console.log('📊 Chargement des dernières données...');
    loadLatestData();
    
    // Charger l'historique au démarrage
    console.log('📈 Chargement de l\'historique au démarrage...');
    setTimeout(() => {
        loadHistory();
    }, 1000);
});    
