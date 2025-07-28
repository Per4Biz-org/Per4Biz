#!/bin/bash

# Script de déploiement pour Per4Biz
# Usage: ./deploy.sh [platform]
# Platforms supportées: vercel, netlify, local

PLATFORM=${1:-local}

echo "🚀 Démarrage du déploiement pour: $PLATFORM"

# Vérification des prérequis
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

# Nettoyage et installation des dépendances
echo "📦 Installation des dépendances..."
npm ci

# Vérification du linting
echo "🔍 Vérification du code..."
npm run lint

# Build de production
echo "🏗️ Build de production..."
npm run build

# Vérification du build
if [ ! -d "dist" ]; then
    echo "❌ Le build a échoué - dossier dist manquant"
    exit 1
fi

echo "✅ Build réussi!"

case $PLATFORM in
    "vercel")
        echo "🌐 Déploiement sur Vercel..."
        if command -v vercel &> /dev/null; then
            vercel --prod
        else
            echo "❌ Vercel CLI n'est pas installé. Installez avec: npm i -g vercel"
            exit 1
        fi
        ;;
    "netlify")
        echo "🌐 Déploiement sur Netlify..."
        if command -v netlify &> /dev/null; then
            netlify deploy --prod --dir=dist
        else
            echo "❌ Netlify CLI n'est pas installé. Installez avec: npm i -g netlify-cli"
            exit 1
        fi
        ;;
    "local")
        echo "🏠 Test local..."
        npm run preview &
        PREVIEW_PID=$!
        echo "Application disponible sur http://localhost:4173"
        echo "Appuyez sur Ctrl+C pour arrêter"
        wait $PREVIEW_PID
        ;;
    *)
        echo "❌ Platform non supportée: $PLATFORM"
        echo "Platforms disponibles: vercel, netlify, local"
        exit 1
        ;;
esac

echo "🎉 Déploiement terminé!"