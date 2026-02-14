import pandas as pd
import joblib
import numpy as np
import os
import sys
import json
from datetime import datetime
import warnings
import io

# Force UTF-8 encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Supprime les warnings sklearn
warnings.filterwarnings('ignore')

# Noms des fichiers sauvegardés
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'Créer un modèle pour prédire l\'état des arbres d\'olives', 'ml')
MODEL_FILE = os.path.join(MODEL_DIR, 'olive_tree_predictor_model.joblib')
ENCODER_FILE = os.path.join(MODEL_DIR, 'target_encoders.joblib')
FEATURE_NAMES_FILE = os.path.join(MODEL_DIR, 'feature_names.txt')

# Charger le modèle, les encodeurs et les noms des caractéristiques
try:
    model = joblib.load(MODEL_FILE)
    target_encoders = joblib.load(ENCODER_FILE)
    with open(FEATURE_NAMES_FILE, 'r', encoding='utf-8') as f:
        feature_names = [line.strip() for line in f]
except FileNotFoundError as e:
    print(f"Erreur: Fichier non trouve - {e.filename}")
    print(f"Dossier attendu: {MODEL_DIR}")
    sys.exit(1)

def preprocess_data(new_data: pd.DataFrame, feature_names: list) -> pd.DataFrame:
    """
    Prétraite les nouvelles données pour qu'elles correspondent au format d'entraînement du modèle.
    """
    # S'assurer que les colonnes numériques sont du bon type
    numeric_cols = [
        'temperature_c', 'temperature_max_c', 'temperature_min_c',
        'humidite_pct', 'pluie_mm', 'vitesse_vent_max_kmh', 'code_meteo_dominant'
    ]
    for col in numeric_cols:
        if col in new_data.columns:
            new_data[col] = pd.to_numeric(new_data[col], errors='coerce')

    # One-Hot Encoding pour 'code_meteo_dominant'
    new_data = pd.get_dummies(new_data, columns=['code_meteo_dominant'], prefix='meteo_code')

    # Créer un DataFrame vide avec toutes les colonnes de caractéristiques attendues
    X_processed = pd.DataFrame(0, index=new_data.index, columns=feature_names)

    # Remplir les colonnes existantes
    for col in new_data.columns:
        if col in feature_names:
            X_processed[col] = new_data[col]

    # Remplacer les NaN par 0
    X_processed = X_processed.fillna(0)

    return X_processed

def predict_olive_status(sensor_data: dict) -> dict:
    """
    Fait des prédictions sur l'état de l'olivier et les actions recommandées.
    
    sensor_data doit contenir:
    - temperature_c: température en Celsius
    - humidite_pct: humidité en pourcentage
    - pluie_mm: pluie en mm
    """
    try:
        # Valeurs par défaut pour les données manquantes
        data = {
            'date': [datetime.now().strftime('%Y-%m-%d')],
            'city': ['Olive Grove'],
            'temperature_c': [float(sensor_data.get('temp_c', 20.0))],
            'temperature_max_c': [float(sensor_data.get('temp_max_c', sensor_data.get('temp_c', 20.0))) + 3],
            'temperature_min_c': [float(sensor_data.get('temp_min_c', sensor_data.get('temp_c', 20.0))) - 3],
            'humidite_pct': [int(sensor_data.get('humidite_pct', 60))],
            'pluie_mm': [float(sensor_data.get('pluie_mm', 0.0))],
            'vitesse_vent_max_kmh': [float(sensor_data.get('vitesse_vent_max_kmh', 10.0))],
            'code_meteo_dominant': [int(sensor_data.get('code_meteo_dominant', 3))]
        }
        
        df = pd.DataFrame(data)
        
        # Prétraitement
        X_processed = preprocess_data(df.copy(), feature_names)
        
        # Prédiction
        predictions_encoded = model.predict(X_processed)
        
        # Décoder
        etat_olivier = target_encoders['etat_olivier'].inverse_transform([predictions_encoded[0][0]])[0]
        action_recommandee = target_encoders['action_recommandee'].inverse_transform([predictions_encoded[0][1]])[0]
        
        # Générer une conclusion en français
        conclusion = generate_conclusion(etat_olivier, action_recommandee, sensor_data)
        
        return {
            'success': True,
            'etat_olivier': etat_olivier,
            'action_recommandee': action_recommandee,
            'conclusion': conclusion,
            'timestamp': datetime.now().isoformat(),
            'input_data': {
                'temperature': sensor_data.get('temp_c', 'N/A'),
                'humidite': sensor_data.get('humidite_pct', 'N/A'),
                'pluie': sensor_data.get('pluie_mm', 'N/A')
            }
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }

def generate_conclusion(etat_olivier: str, action_recommandee: str, sensor_data: dict) -> str:
    """
    Génère une conclusion détaillée en français basée sur l'état et les actions.
    """
    temp = sensor_data.get('temp_c', 0)
    humidite = sensor_data.get('humidite_pct', 0)
    pluie = sensor_data.get('pluie_mm', 0)
    
    conclusion = f"État de l'olivier: {etat_olivier}\n"
    
    # Ajouter des détails basés sur l'état
    if etat_olivier == 'Sain':
        conclusion += "Votre olivier est en bon état.\n"
    elif etat_olivier == 'Stress Hydrique':
        conclusion += "Détecté: Stress hydrique.\n"
    elif etat_olivier == 'Stress Chaleur':
        conclusion += "Détecté: Stress de chaleur.\n"
    elif etat_olivier == 'Risque Fongique':
        conclusion += "Détecté: Risque fongique.\n"
    elif etat_olivier == 'Maladie Grave':
        conclusion += "Alerte: Maladie grave détectée.\n"
    
    # Ajouter l'action recommandée
    conclusion += f"Action recommandée: {action_recommandee}\n"
    
    # Ajouter des conseils contextuels
    if temp > 35:
        conclusion += "Il fait très chaud. Augmentez l'irrigation.\n"
    elif temp < 0:
        conclusion += "Risque de gel. Protégez les plants.\n"
    
    if humidite > 80:
        conclusion += "Humidité élevée: Risque de maladies fongiques. Améliorez la ventilation.\n"
    elif humidite < 30:
        conclusion += "Très sec: Vérifiez l'irrigation.\n"
    
    if pluie > 10:
        conclusion += "Pluie importante. Vérifiez le drainage.\n"
    
    return conclusion


if __name__ == '__main__':
    if len(sys.argv) > 1:
        # Mode API: données reçues via argument
        try:
            sensor_data = json.loads(sys.argv[1])
            result = predict_olive_status(sensor_data)
            print(json.dumps(result, indent=2, ensure_ascii=False))
        except Exception as e:
            print(json.dumps({
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }, indent=2, ensure_ascii=False))
    else:
        # Mode test: données simulées
        pass
