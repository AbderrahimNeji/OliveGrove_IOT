# start.ps1 - Script pour démarrer Smart Olive Grove

Write-Host "================================================"
Write-Host "Smart Olive Grove - Demarrage"
Write-Host "================================================"
Write-Host ""

# Verifier Node.js
Write-Host "Verification de Node.js..."
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK - Node.js $nodeVersion"
}
else {
    Write-Host "ERREUR - Node.js non trouve"
    exit 1
}

# Verifier Python
Write-Host "Verification de Python..."
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK - $pythonVersion"
}
else {
    Write-Host "ERREUR - Python non trouve"
    exit 1
}

# Verifier node_modules
Write-Host ""
Write-Host "Verification des dependances..."
if (!(Test-Path "node_modules")) {
    Write-Host "Installation en cours..."
    npm install
}
else {
    Write-Host "OK - Dependances deja installees"
}

# Afficher info
Write-Host ""
Write-Host "================================================"
Write-Host "Configuration"
Write-Host "================================================"
Write-Host "Node.js: Serveur et API"
Write-Host "Python: Modele ML"
Write-Host "Web Serial API: Arduino"
Write-Host ""

# Afficher URLs
Write-Host "================================================"
Write-Host "Demarrage du serveur"
Write-Host "================================================"
Write-Host ""
Write-Host "Interface: http://localhost:3000"
Write-Host "Appuyez sur Ctrl+C pour arreter"
Write-Host ""

# Demarrer serveur
node server.js
