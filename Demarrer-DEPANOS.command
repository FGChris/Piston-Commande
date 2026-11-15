#!/bin/bash
set -eu
cd -- "$(dirname -- "$0")"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v node >/dev/null 2>&1; then
  echo "Installez Node.js 24 LTS pour macOS depuis nodejs.org, puis relancez ce fichier."
  open 'https://nodejs.org/en/download'
  read -r -p "Appuyez sur Entrée pour fermer… " ignored
  exit 1
fi
if ! node scripts/mac-start.mjs; then
  echo "Le démarrage n’a pas abouti. Le message ci-dessus indique l’étape à vérifier."
  read -r -p "Appuyez sur Entrée pour fermer… " ignored
  exit 1
fi
