# Smart Olive Grove - Lecteur de Port Série Arduino (Version Ultra-Simplifiée)

Bienvenue dans la version la plus simple du projet **Smart Olive Grove**. Cette interface utilise uniquement **HTML, CSS et JavaScript pur** pour lire les données directement depuis le port série de votre carte Arduino/ESP32.

**Il n'y a pas de Firebase, pas de serveur intermédiaire, et pas de dépendances complexes.**

## Fonctionnalités

*   **Connexion Directe** : Utilise l'API Web Serial de votre navigateur pour se connecter directement à votre carte.
*   **Affichage en Temps Réel** : Affiche les valeurs des capteurs (humidité du sol, pluie, température) au fur et à mesure qu'elles sont envoyées par l'Arduino.
*   **Journal des Données** : Affiche les lignes brutes reçues du port série pour le débogage.

## Prérequis

1.  **Navigateur Compatible** : Vous devez utiliser un navigateur basé sur Chromium (comme **Google Chrome** ou **Microsoft Edge**) qui supporte l'API Web Serial.
2.  **Carte Arduino/ESP32** : Votre carte doit être connectée à votre PC via USB.

## Configuration du Projet

### 1. Configuration de l'Arduino

Le code Arduino (`arduino_code.ino`) est prêt à être utilisé. Il envoie les données au port série dans un format spécifique que l'interface web peut lire.

1.  **Ouvrez le fichier `arduino_code.ino`** dans l'IDE Arduino.
2.  **Téléversez** le code sur votre carte Arduino/ESP32.
3.  **Assurez-vous que le débit en bauds est de `115200`** dans le code Arduino, car c'est ce que l'interface web attend.

### 2. Lancement de l'Interface Web

1.  **Ouvrez le fichier `index.html`** directement dans votre navigateur web compatible (Chrome/Edge).

    *   *Note* : L'API Web Serial fonctionne généralement bien même en ouvrant le fichier localement.

### 3. Utilisation

1.  Cliquez sur le bouton **"Connecter Arduino"**.
2.  Une fenêtre de sélection de port s'ouvrira. **Sélectionnez le port série** correspondant à votre carte Arduino/ESP32.
3.  Cliquez sur **"Connecter"**.
4.  L'interface commencera à afficher les données en temps réel et à mettre à jour le journal.

## Structure du Projet

*   \`index.html\` : La structure de l'interface utilisateur.
*   \`style.css\` : Le style et la mise en page.
*   \`script.js\` : La logique JavaScript pour la connexion au port série et l'analyse/affichage des données.
*   \`arduino_code.ino\` : Le code pour l'Arduino/ESP32.
\`\`\`
