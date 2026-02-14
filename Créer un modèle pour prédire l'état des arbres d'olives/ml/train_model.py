import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score
import joblib
import numpy as np

# Chemin vers le jeu de données étiqueté
input_file = 'labeled_olive_data.csv'
model_file = 'olive_tree_predictor_model.joblib'
encoder_file = 'target_encoders.joblib'

# Charger le jeu de données
df = pd.read_csv(input_file)

# Colonnes de caractéristiques (features) à utiliser pour la prédiction
# On exclut 'date', 'city', 'latitude', 'longitude', 'precipitation_totale_mm' (car redondant avec 'pluie_mm')
features = [
    'temperature_c', 'temperature_max_c', 'temperature_min_c',
    'humidite_pct', 'pluie_mm', 'vitesse_vent_max_kmh', 'code_meteo_dominant'
]

# Colonnes cibles (targets)
targets = ['etat_olivier', 'action_recommandee']

# --- 1. Préparation des données ---

# Encodage des variables cibles (Label Encoding)
target_encoders = {}
for target in targets:
    le = LabelEncoder()
    df[target + '_encoded'] = le.fit_transform(df[target])
    target_encoders[target] = le

# Encodage des variables catégorielles (One-Hot Encoding pour 'code_meteo_dominant')
# La colonne 'city' n'est pas utilisée car elle est redondante avec lat/lon, mais on pourrait l'utiliser si nécessaire.
df = pd.get_dummies(df, columns=['code_meteo_dominant'], prefix='meteo_code')

# Mise à jour de la liste des features après one-hot encoding
feature_cols = [col for col in df.columns if col in features or col.startswith('meteo_code_')]
X = df[feature_cols]
Y = df[[t + '_encoded' for t in targets]]

# Remplacer les valeurs manquantes (NaN) par la moyenne (imputation simple)
X = X.fillna(X.mean())

# Séparation des données d'entraînement et de test (bien que l'objectif soit d'apprendre les règles)
X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size=0.2, random_state=42)

# --- 2. Entraînement du modèle ---

# Utilisation d'un RandomForestClassifier pour la classification multi-output
# On utilise un modèle qui peut gérer les deux sorties simultanément
model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
model.fit(X_train, Y_train)

# --- 3. Évaluation (pour vérification) ---

Y_pred = model.predict(X_test)

# Calcul de la précision pour chaque cible
accuracy_etat = accuracy_score(Y_test['etat_olivier_encoded'], Y_pred[:, 0])
accuracy_action = accuracy_score(Y_test['action_recommandee_encoded'], Y_pred[:, 1])

print(f"Précision (État de l'olivier): {accuracy_etat:.4f}")
print(f"Précision (Action recommandée): {accuracy_action:.4f}")

# --- 4. Sauvegarde du modèle et des encodeurs ---

joblib.dump(model, model_file)
joblib.dump(target_encoders, encoder_file)

print(f"\nModèle sauvegardé dans {model_file}")
print(f"Encodeurs sauvegardés dans {encoder_file}")

# Sauvegarde de la liste des colonnes de caractéristiques pour l'inférence future
feature_names_file = 'feature_names.txt'
with open(feature_names_file, 'w') as f:
    for name in X.columns:
        f.write(f"{name}\n")
print(f"Noms des caractéristiques sauvegardés dans {feature_names_file}")
