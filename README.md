🌳 SMART OLIVE GROVE - v2.0 AVEC ML INTÉGRÉ

══════════════════════════════════════════════════════════════

📊 COMPOSANTS:
==============
✓ Backend Node.js (server.js)      - API + gestion requêtes
✓ Frontend JavaScript (script.js)  - Interface + Web Serial API
✓ Modèle ML Python (ml_api.py)    - Prédictions d'état
✓ Interface Web (index.html)       - Dashboard
✓ Styles (style.css)              - Design réactif
✓ Arduino (sketch_nov3a.ino)       - Capteurs temps réel

══════════════════════════════════════════════════════════════

🚀 DÉMARRAGE RAPIDE:
====================

1. Lancez le serveur:
   → Double-cliquez start.bat (Windows)
   ou lancez: npm install && node server.js

2. Ouvrez l'interface:
   → http://localhost:3000

3. Connectez Arduino:
   → Cliquez "Connecter Arduino"
   → Sélectionnez le port COM

4. Observez les prédictions!
   → Les données s'affichent en temps réel
   → Les prédictions ML apparaissent automatiquement
   → Consultez les recommandations

══════════════════════════════════════════════════════════════

✨ FONCTIONNALITÉS:
===================

✓ Lecture données Arduino en temps réel
✓ Web Serial API pour connexion directe
✓ Prédiction ML automatique
✓ Affichage prédictions et recommandations
✓ Gestion des états (Sain, Stress, Risque, etc)
✓ Sauvegarde MongoDB (optionnel)
✓ Design responsive et intuitif

══════════════════════════════════════════════════════════════

🤖 PRÉDICTIONS ML:
==================

Le modèle prédit l'état de l'olivier:
- 🌳 Sain: L'olivier va bien
- 💧 Stress Hydrique: Besoin d'eau
- 🌡️ Stress Chaleur: Trop chaud
- 🍄 Risque Fongique: Trop d'humidité
- 🚨 Maladie Grave: Urgence

Avec des actions recommandées adaptées!

══════════════════════════════════════════════════════════════

📋 FICHIERS ESSENTIELS:
=======================

src/
├── server.js        - Backend Express + ML
├── script.js        - Frontend + Web Serial
├── ml_api.py        - API prédictions Python
├── index.html       - Interface HTML
├── style.css        - Styles CSS
└── start.bat        - Démarrage Windows

ml/
└── Modèles ML (joblib)
    ├── olive_tree_predictor_model.joblib
    ├── target_encoders.joblib
    └── feature_names.txt

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
