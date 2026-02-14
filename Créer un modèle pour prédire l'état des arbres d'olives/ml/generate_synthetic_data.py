import pandas as pd
import numpy as np

# Chemin vers le fichier de données original
input_file = 'tunisia_weather_data.csv'
output_file = 'labeled_olive_data.csv'

def generate_labels(df):
    """
    Applique des règles agronomiques simplifiées pour étiqueter l'état de l'olivier
    et les actions recommandées.
    """
    # Convertir la colonne 'date' en datetime et s'assurer que les colonnes numériques sont du bon type
    df['date'] = pd.to_datetime(df['date'])
    numeric_cols = [
        'temperature_c', 'temperature_max_c', 'temperature_min_c',
        'humidite_pct', 'pluie_mm', 'precipitation_totale_mm',
        'vitesse_vent_max_kmh'
    ]
    for col in numeric_cols:
        # Remplacer les virgules par des points et convertir en float, en gérant les erreurs
        df[col] = df[col].astype(str).str.replace(',', '.', regex=False)
        df[col] = pd.to_numeric(df[col], errors='coerce')

    # Calculer la pluie cumulée sur les 3 derniers jours (pour le risque fongique)
    df['pluie_3j'] = df.groupby('city')['pluie_mm'].rolling(window=3, min_periods=1).sum().reset_index(level=0, drop=True)

    # Initialisation des colonnes cibles
    df['etat_olivier'] = 'État Sain'
    df['action_recommandee'] = 'Ne rien faire'

    # 1. Stress Froid (Température Min < 5°C)
    cold_stress = df['temperature_min_c'] < 5
    df.loc[cold_stress, 'etat_olivier'] = 'Stress Froid'
    df.loc[cold_stress, 'action_recommandee'] = 'Couvrir/Protéger'

    # 2. Stress Chaleur (Température Max > 35°C)
    heat_stress = df['temperature_max_c'] > 35
    df.loc[heat_stress, 'etat_olivier'] = 'Stress Chaleur'
    df.loc[heat_stress, 'action_recommandee'] = 'Ombrage/Rafraîchissement'

    # 3. Stress Hydrique (Humidité < 40% et Pluie faible)
    # On considère une pluie faible si la pluie du jour est < 1mm
    water_stress = (df['humidite_pct'] < 40) & (df['pluie_mm'] < 1)
    # On ne remplace que si ce n'est pas déjà un stress plus critique (froid/chaleur)
    df.loc[water_stress & (df['etat_olivier'] == 'État Sain'), 'etat_olivier'] = 'Stress Hydrique'
    df.loc[water_stress & (df['action_recommandee'] == 'Ne rien faire'), 'action_recommandee'] = 'Irrigation'

    # 4. Risque Fongique (Pluie cumulée > 10 mm sur 3 jours)
    fungal_risk = df['pluie_3j'] > 10
    # On ne remplace que si ce n'est pas déjà un stress plus critique (froid/chaleur)
    df.loc[fungal_risk & (df['etat_olivier'] == 'État Sain'), 'etat_olivier'] = 'Risque Fongique'
    df.loc[fungal_risk & (df['action_recommandee'] == 'Ne rien faire'), 'action_recommandee'] = 'Traitement Préventif'

    # 5. Risque de Maladie (Humidité > 80% et Température moyenne > 20°C)
    disease_risk = (df['humidite_pct'] > 80) & (df['temperature_c'] > 20)
    # On ne remplace que si ce n'est pas déjà un stress plus critique
    df.loc[disease_risk & (df['etat_olivier'] == 'État Sain'), 'etat_olivier'] = 'Risque de Maladie'
    df.loc[disease_risk & (df['action_recommandee'] == 'Ne rien faire'), 'action_recommandee'] = 'Surveillance Accrue'

    # Nettoyage
    df = df.drop(columns=['pluie_3j'])

    return df

try:
    # Charger le dataset
    df = pd.read_csv(input_file)

    # Générer les étiquettes
    df_labeled = generate_labels(df.copy())

    # Sauvegarder le nouveau dataset
    df_labeled.to_csv(output_file, index=False)

    print(f"Jeu de données étiqueté sauvegardé dans {output_file}")
    print("\nStatistiques des étiquettes générées:")
    print(df_labeled['etat_olivier'].value_counts())
    print(df_labeled['action_recommandee'].value_counts())

except Exception as e:
    print(f"Une erreur est survenue: {e}")

