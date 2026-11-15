#!/bin/bash
set -eu
cd -- "$(dirname -- "$0")"
if [ ! -f .local/connexion-mac.txt ]; then
  echo "Lancez d’abord Demarrer-DEPANOS.command."
  read -r -p "Appuyez sur Entrée pour fermer… " ignored
  exit 1
fi
open -a TextEdit .local/connexion-mac.txt
