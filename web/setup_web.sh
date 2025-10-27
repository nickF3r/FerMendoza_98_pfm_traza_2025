#!/bin/bash
# Script de limpieza e instalación completa para proyecto React + Vite + Tailwind en WSL

set -e

echo "=== 1️⃣ Verificando Node.js y NPM ==="
node_version=$(node -v || echo "none")
npm_version=$(npm -v || echo "none")

if [[ "$node_version" == "none" || ${node_version:1:2} -lt 18 ]]; then
    echo "Node.js no encontrado o versión < 18. Instalando Node 20 con NVM..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.6/install.sh | bash
    source ~/.bashrc
    nvm install 20
    nvm use 20
    nvm alias default 20
fi

echo "Node.js: $(node -v)"
echo "NPM: $(npm -v)"

echo "=== 2️⃣ Instalando Yarn globalmente ==="
npm install -g yarn || true
echo "Yarn: $(yarn -v || echo 'no instalado')"

echo "=== 3️⃣ Limpiando proyecto web ==="
cd ~/proyectoETH/98_pfm_traza_2025/supply-chain-tracker/web
rm -rf node_modules package-lock.json yarn.lock
echo "node_modules y locks eliminados"

echo "=== 4️⃣ Instalando dependencias base ==="
yarn || npm install
echo "Dependencias base instaladas"

echo "=== 5️⃣ Instalando Tailwind CSS + PostCSS + Autoprefixer ==="
yarn add -D tailwindcss postcss autoprefixer || npm install -D tailwindcss postcss autoprefixer

# Verificar binario de Tailwind
if [ -f node_modules/.bin/tailwindcss ]; then
    echo "✅ Tailwind CSS instalado correctamente"
else
    echo "❌ Error: tailwindcss aún no existe en node_modules/.bin"
    exit 1
fi

echo "=== 6️⃣ Inicializando Tailwind ==="
npx tailwindcss init -p

echo "=== 7️⃣ Configuración completa ==="
echo "Asegúrate de tener en tailwind.config.js:"
echo 'content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"]'

echo "=== 8️⃣ Importa Tailwind en src/index.css ==="
echo '@tailwind base; @tailwind components; @tailwind utilities;'

echo "=== 9️⃣ Listo para levantar el dev server ==="
echo "Ejecuta: yarn dev"

