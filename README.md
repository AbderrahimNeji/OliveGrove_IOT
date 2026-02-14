# Smart Olive Grove

IoT monitoring system for olive groves using Arduino sensors and machine learning predictions.

## Overview

This project connects to Arduino sensors via the Web Serial API to collect real-time environmental data (soil moisture, temperature, rainfall) and uses a Random Forest ML model to predict olive tree health status and recommend actions.

## Components

| Component | File | Description |
|-----------|------|-------------|
| Backend | `server.js` | Express API server with MongoDB integration |
| Frontend | `index.html`, `script.js`, `style.css` | Dashboard with Web Serial API |
| ML Model | `ml_api.py` | Python prediction API (Random Forest) |
| Arduino | `arduino_code/sketch_nov3a.ino` | Sensor data collection firmware |

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Python 3](https://www.python.org/) with `pandas`, `scikit-learn`, `joblib`
- [MongoDB](https://www.mongodb.com/) (optional, for data persistence)
- Chrome or Edge browser (Web Serial API support)

### Installation

```bash
git clone https://github.com/AbderrahimNeji/OliveGrove_IOT.git
cd OliveGrove_IOT
npm install
```

### Configuration

Copy `.env.example` to `.env` and adjust values if needed:

```bash
cp .env.example .env
```

### Running

```bash
# Using npm
npm start

# Or on Windows
start.bat
```

Then open [http://localhost:3000](http://localhost:3000) in Chrome/Edge.

### Connect Arduino

1. Click **"Connecter Arduino"**
2. Select the COM port for your board
3. Real-time data and ML predictions will appear automatically

## ML Predictions

The model predicts olive tree status based on weather conditions:

| Status | Description |
|--------|-------------|
| Sain | Tree is healthy |
| Stress Hydrique | Water stress detected |
| Stress Chaleur | Heat stress detected |
| Risque Fongique | Fungal risk (high humidity) |
| Maladie Grave | Severe disease alert |

See the [ML model documentation](Créer%20un%20modèle%20pour%20prédire%20l'état%20des%20arbres%20d'olives/ml/Modèle%20de%20Prédiction%20pour%20l'Olivier%20(Olive%20Tree%20Predictor%20Model).md) for details on training and prediction rules.

## Project Structure

```
├── server.js                  # Express backend + ML bridge
├── index.html                 # Dashboard UI
├── script.js                  # Frontend logic + Web Serial
├── style.css                  # Responsive styles
├── ml_api.py                  # Python ML prediction script
├── start.bat / start.ps1      # Windows startup scripts
├── arduino_code/
│   └── sketch_nov3a.ino       # Arduino sensor firmware
└── Créer un modèle.../ml/
    ├── olive_tree_predictor_model.joblib
    ├── target_encoders.joblib
    ├── feature_names.txt
    ├── train_model.py
    ├── predict.py
    └── generate_synthetic_data.py
```

## License

MIT

arduino/
└── sketch_nov3a.ino - Code Arduino

══════════════════════════════════════════════════════════════

💾 PRÉREQUIS:
=============

Obligatoire:
✓ Node.js v14+
✓ Python 3.7+
✓ npm

Optionnel:
• MongoDB (pour archivage des données)

Navigateur:
✓ Chrome/Edge/Firefox (Web Serial API)

══════════════════════════════════════════════════════════════

📝 NOTES:
=========

- Les prédictions se font automatiquement
- MongoDB est optionnel (pas bloquant)
- L'interface charge les dernières données au démarrage
- Les données sont mises à jour en temps réel
- Les prédictions apparaissent dans la section "Prédiction IA"

══════════════════════════════════════════════════════════════

✅ STATUS: PRÊT À UTILISER!

Lancez start.bat et consultez http://localhost:3000

══════════════════════════════════════════════════════════════
