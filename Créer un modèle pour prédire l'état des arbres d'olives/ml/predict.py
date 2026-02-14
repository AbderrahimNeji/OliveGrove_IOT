import pandas as pd
import joblib
import numpy as np
import os

# Noms des fichiers sauvegardés
MODEL_FILE = 'olive_tree_predictor_model.joblib'
ENCODER_FILE = 'target_encoders.joblib'
FEATURE_NAMES_FILE = 'feature_names.txt'

# Charger le modèle, les encodeurs et les noms des caractéristiques
try:
    model = joblib.load(MODEL_FILE)
    target_encoders = joblib.load(ENCODER_FILE)
    with open(FEATURE_NAMES_FILE, 'r') as f:
        feature_names = [line.strip() for line in f]
except FileNotFoundError as e:
    print(f"Erreur: Fichier non trouvé - {e.filename}. Assurez-vous que les fichiers de modèle et d'encodeur existent.")
    exit()

def preprocess_data(new_data: pd.DataFrame, feature_names: list) -> pd.DataFrame:
    """
    Prétraite les nouvelles données pour qu'elles correspondent au format d'entraînement du modèle.
    Ceci inclut le One-Hot Encoding pour 'code_meteo_dominant' et l'alignement des colonnes.
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

    # Remplacer les NaN par 0 ou une valeur par défaut si nécessaire (ici, on suppose 0 pour les colonnes manquantes après OHE)
    X_processed = X_processed.fillna(0)

    return X_processed

def predict_olive_status(new_data: pd.DataFrame) -> pd.DataFrame:
    """
    Fait des prédictions sur l'état de l'olivier et les actions recommandées.
    """
    # Prétraitement des données
    X_processed = preprocess_data(new_data.copy(), feature_names)

    # Faire la prédiction
    predictions_encoded = model.predict(X_processed)

    # Décoder les prédictions
    predictions = pd.DataFrame({
        'etat_olivier_encoded': predictions_encoded[:, 0],
        'action_recommandee_encoded': predictions_encoded[:, 1]
    }, index=new_data.index)

    # Décoder les labels
    predictions['etat_olivier'] = target_encoders['etat_olivier'].inverse_transform(predictions['etat_olivier_encoded'])
    predictions['action_recommandee'] = target_encoders['action_recommandee'].inverse_transform(predictions['action_recommandee_encoded'])

    # Ajouter les prédictions aux données originales pour le résultat
    result = new_data.copy()
    result['etat_olivier_predit'] = predictions['etat_olivier']
    result['action_recommandee'] = predictions['action_recommandee']

    return result[['date', 'city', 'temperature_c', 'humidite_pct', 'pluie_mm', 'etat_olivier_predit', 'action_recommandee']]

if __name__ == '__main__':
    print("--- Modèle de Prédiction pour l'Olivier ---")
    print("Le modèle est prêt à être appliqué sur de nouvelles données.")
    print(f"Modèle chargé: {MODEL_FILE}")

    # Exemple d'utilisation avec des données simulées (ce que l'utilisateur enverrait)
    print("\nExemple de prédiction avec des données simulées:")

    # Cas 1: Conditions normales (Température moyenne, humidité moyenne, pas de pluie)
    data_normal = {
        'date': ['2025-05-01'],
        'city': ['Sfax'],
        'temperature_c': [22.0],
        'temperature_max_c': [28.0],
        'temperature_min_c': [16.0],
        'humidite_pct': [60],
        'pluie_mm': [0.0],
        'vitesse_vent_max_kmh': [15.0],
        'code_meteo_dominant': [3] # Ciel dégagé
    }
    df_normal = pd.DataFrame(data_normal)
    
    # Cas 2: Stress Chaleur (Température Max très élevée)
    data_heat_stress = {
        'date': ['2025-07-15'],
        'city': ['Tozeur'],
        'temperature_c': [38.0],
        'temperature_max_c': [42.0],
        'temperature_min_c': [34.0],
        'humidite_pct': [30],
        'pluie_mm': [0.0],
        'vitesse_vent_max_kmh': [10.0],
        'code_meteo_dominant': [0] # Soleil
    }
    df_heat_stress = pd.DataFrame(data_heat_stress)

    # Cas 3: Risque Fongique (Pluie forte - bien que le modèle ait été entraîné sur 3 jours cumulés,
    # une forte pluie ponctuelle peut indiquer un risque dans le modèle simplifié)
    data_fungal_risk = {
        'date': ['2025-11-10'],
        'city': ['Bizerte'],
        'temperature_c': [18.0],
        'temperature_max_c': [20.0],
        'temperature_min_c': [16.0],
        'humidite_pct': [90],
        'pluie_mm': [15.0],
        'vitesse_vent_max_kmh': [25.0],
        'code_meteo_dominant': [61] # Pluie
    }
    df_fungal_risk = pd.DataFrame(data_fungal_risk)

    # Concaténer les exemples pour une seule prédiction
    df_test = pd.concat([df_normal, df_heat_stress, df_fungal_risk], ignore_index=True)

    # Faire la prédiction
    predictions = predict_olive_status(df_test)

    print(predictions.to_markdown(index=False))

    print("\nPour utiliser le modèle, vous pouvez appeler la fonction `predict_olive_status` avec un DataFrame contenant vos nouvelles données.")
    print("Les colonnes d'entrée requises sont: date, city, temperature_c, temperature_max_c, temperature_min_c, humidite_pct, pluie_mm, vitesse_vent_max_kmh, code_meteo_dominant.")
