@echo off
REM start.bat - Script pour démarrer Smart Olive Grove sous Windows

echo.
echo ================================================
echo.
echo 🌳 Smart Olive Grove - Démarrage
echo.
echo ================================================
echo.

REM Vérifier si Node.js est installé
echo ✓ Vérification de Node.js...
node --version > nul 2>&1
if errorlevel 1 (
    echo ✗ Node.js non trouvé. Veuillez installer Node.js
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION% trouvé

REM Vérifier si Python est installé
echo ✓ Vérification de Python...
python --version > nul 2>&1
if errorlevel 1 (
    echo ✗ Python non trouvé. Veuillez installer Python
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo ✓ %PYTHON_VERSION% trouvé

REM Vérifier si node_modules existe
echo.
echo ✓ Vérification des dépendances Node.js...
if not exist "node_modules" (
    echo Installation des dépendances...
    call npm install
) else (
    echo ✓ Dépendances Node.js déjà installées
)

REM Afficher les informations
echo.
echo ================================================
echo.
echo 📊 Configuration du projet
echo.
echo ================================================
echo ✓ Node.js: Serveur et API
echo ✓ Python: Modèle ML pour prédictions
echo ✓ Web Serial API: Connexion Arduino
echo ✓ MongoDB: Archivage des données
echo.

REM Afficher les URLs
echo ================================================
echo.
echo 🚀 Démarrage du serveur
echo.
echo ================================================
echo.
echo Interface web: http://localhost:3000
echo API REST: http://localhost:3000
echo.
echo Raccourci clavier pour arrêter: Ctrl+C
echo.

REM Démarrer le serveur
node server.js
pause
