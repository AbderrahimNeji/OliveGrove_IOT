# Modèle de Prédiction pour l'Olivier (Olive Tree Predictor Model)

Ce projet a pour objectif de créer un modèle de Machine Learning capable de prédire l'état de l'olivier et de recommander des actions agronomiques basées sur des données météorologiques.

Étant donné que le jeu de données initial ne contenait pas les variables cibles ("état de l'olivier" et "action recommandée"), un jeu de données synthétique a été généré en appliquant des règles agronomiques simplifiées.

## Fichiers du Projet

| Fichier | Description |
| :--- | :--- |
| `tunisia_weather_data.csv` | Le jeu de données météorologiques initial fourni par l'utilisateur. |
| `labeled_olive_data.csv` | Le jeu de données synthétique généré, incluant les colonnes cibles (`etat_olivier` et `action_recommandee`). |
| `generate_synthetic_data.py` | Script Python utilisé pour générer le jeu de données étiqueté à partir des règles agronomiques. |
| `train_model.py` | Script Python pour la préparation des données, l'entraînement du modèle `RandomForestClassifier` et la sauvegarde des artefacts. |
| `predict.py` | Script Python contenant la fonction de prédiction et un exemple d'utilisation sur de nouvelles données. **C'est le fichier à utiliser pour les prédictions.** |
| `olive_tree_predictor_model.joblib` | Le modèle de Machine Learning entraîné (Random Forest). |
| `target_encoders.joblib` | Les encodeurs de labels nécessaires pour décoder les prédictions du modèle. |
| `feature_names.txt` | Liste des noms de colonnes de caractéristiques utilisées par le modèle. |

## Installation et Utilisation

### 1. Prérequis

Assurez-vous d'avoir Python 3.x installé. Les bibliothèques nécessaires sont `pandas`, `scikit-learn` et `joblib`.

Dans l'environnement de travail (un environnement virtuel est recommandé, comme celui créé lors du développement), exécutez :

```bash
pip install pandas scikit-learn joblib tabulate
```

### 2. Entraînement du Modèle (Déjà effectué)

Le modèle a déjà été entraîné et sauvegardé. Si vous souhaitez le ré-entraîner :

```bash
python3 generate_synthetic_data.py
python3 train_model.py
```

### 3. Utilisation pour la Prédiction

Le script `predict.py` contient la logique pour charger le modèle et faire des prédictions.

Vous pouvez l'exécuter directement pour voir un exemple de prédiction :

```bash
python3 predict.py
```

**Pour appliquer le modèle sur vos propres données :**

1.  Assurez-vous que vos nouvelles données sont dans un format `pandas.DataFrame` avec les colonnes d'entrée suivantes :
    *   `date`
    *   `city`
    *   `temperature_c` (moyenne)
    *   `temperature_max_c`
    *   `temperature_min_c`
    *   `humidite_pct`
    *   `pluie_mm`
    *   `vitesse_vent_max_kmh`
    *   `code_meteo_dominant` (Code numérique du temps, ex: 0 pour ciel dégagé, 61 pour pluie)

2.  Importez la fonction `predict_olive_status` dans votre propre script :

    ```python
    import pandas as pd
    from predict import predict_olive_status

    # Chargez vos nouvelles données (exemple)
    new_data = pd.DataFrame({
        'date': ['2025-01-01'],
        'city': ['Tunis'],
        'temperature_c': [10.0],
        'temperature_max_c': [15.0],
        'temperature_min_c': [5.0],
        'humidite_pct': [70],
        'pluie_mm': [0.0],
        'vitesse_vent_max_kmh': [10.0],
        'code_meteo_dominant': [3]
    })

    # Obtenez les prédictions
    predictions = predict_olive_status(new_data)

    print(predictions)
    ```

## Règles Agronomiques Utilisées (pour la génération des données synthétiques)

Le modèle a appris les règles suivantes :

| Variable Météo | Seuil | État de l'Olivier | Action Recommandée |
| :--- | :--- | :--- | :--- |
| **Température Min** | < 5°C | Stress Froid | Couvrir/Protéger |
| **Température Max** | > 35°C | Stress Chaleur | Ombrage/Rafraîchissement |
| **Humidité** | < 40% et **Pluie** < 1mm | Stress Hydrique | Irrigation |
| **Pluie cumulée (3j)** | > 10 mm | Risque Fongique | Traitement Préventif |
| **Humidité** | > 80% et **Température** > 20°C | Risque de Maladie | Surveillance Accrue |
| **Autres cas** | - | État Sain | Ne rien faire |

**Note Importante :** Ce modèle est basé sur des règles simplifiées et ne remplace pas l'expertise agronomique. Il sert de démonstration et de point de départ pour un système plus sophistiqué. Pour une application réelle, les règles devraient être affinées par des experts.
