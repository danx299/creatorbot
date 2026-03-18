# Discord Server Generator

Un générateur de serveurs Discord intelligent qui utilise l'IA pour créer des structures de serveurs complètes avec des catégories, salons et rôles personnalisés.

## 🚀 Fonctionnalités

- **Génération par IA**: Utilise OpenRouter avec Google Gemini 2.0 Flash
- **Structure complète**: Crée catégories, salons textuels/vocaux et rôles
- **Emojis intégrés**: Ajoute automatiquement des emojis pertinents à chaque élément
- **Interface moderne**: Design Dark Mode inspiré de Discord
- **Nettoyage automatique**: Supprime les anciens salons et rôles avant la création
- **Logs en temps réel**: Suivi détaillé de toutes les opérations
- **Fallback multi-modèles**: Essaie plusieurs modèles IA en cas d'échec

## 📋 Prérequis

- Node.js 18+
- Un bot Discord avec les permissions nécessaires
- Une clé API OpenRouter
- Un serveur Discord où le bot est administrateur

## 🌐 Déploiement

### Backend (Render)

1. **Fork et déployer sur Render**
   - Connectez votre repository GitHub à Render
   - Choisissez "Web Service"
   - Configurez les variables d'environnement ci-dessous

2. **Variables d'environnement sur Render**
   ```
   DISCORD_TOKEN=VOTRE_TOKEN_DISCORD_ICI
   OPENROUTER_API_KEY=VOTRE_CLE_OPENROUTER_ICI
   PORT=10000
   ```

3. **Configuration CORS**
   - Modifiez `server.js` ligne 14
   - Remplacez `origin: '*'` par `origin: ['https://VOTRE_URL_NETLIFY.netlify.app']`

### Frontend (Netlify)

1. **Déployer le dossier `/public`**
   - Connectez votre repository à Netlify
   - Configurez le répertoire de publication : `public`
   - Le fichier `netlify.toml` gère automatiquement les redirects

2. **Modifier l'URL API**
   - Dans `public/script.js` ligne 12
   - Remplacez `https://TON-NOM-SUR-RENDER.onrender.com` par votre URL Render

## 🔧 Installation locale

```bash
# Cloner le projet
git clone <repository-url>
cd discord-server-generator

# Installer les dépendances
npm install

# Configurer .env
cp .env.example .env
# Remplir .env avec vos clés

# Démarrer le serveur
npm start
```

## 📝 Variables d'environnement (.env)

```env
DISCORD_TOKEN=VOTRE_TOKEN_DISCORD_ICI
OPENROUTER_API_KEY=VOTRE_CLE_OPENROUTER_ICI
# GUILD_ID n'est plus nécessaire - il est fourni par le frontend
```

### Obtenir les clés :

1. **Discord Token** :
   - Allez sur le [Portail Développeur Discord](https://discord.com/developers/applications)
   - Créez une application → Bot → Copy Token
   - Activez les intents : Server Members, Message Content

2. **OpenRouter API Key** :
   - Inscrivez-vous sur [OpenRouter](https://openrouter.ai)
   - Allez dans API Keys → Create new key
   - Copiez la clé (commence par `sk-or-v1-`)

3. **Guild ID** (dynamique) :
   - Activez le mode développeur Discord
   - Clic droit sur votre serveur → Copier l'ID du serveur
   - Entrez-le dans l'interface web

## 🎯 Utilisation

### Via l'interface web
1. Allez sur votre URL Netlify
2. Entrez un thème (ex: "Gaming Community")
3. Entrez l'ID de votre serveur Discord
4. Cliquez sur "Générer le serveur"

### Thèmes supportés
Exemples de thèmes que vous pouvez utiliser :
- Gaming, Esports
- Community, Social
- Programming, Tech
- Music, Art
- Education, Learning

## 🔐 Permissions requises pour le bot

Le bot Discord nécessite les permissions suivantes sur le serveur cible :
- **Administrateur** (recommandé)
- Ou permissions individuelles :
  - Gérer les canaux
  - Gérer les rôles
  - Lire les messages
  - Envoyer des messages

## 📁 Structure du projet

```
discord-server-generator/
├── public/                 # Frontend
│   ├── index.html         # Page principale
│   ├── style.css          # Styles Dark Mode
│   └── script.js          # Logique frontend
├── server.js              # Backend Node.js
├── package.json           # Dépendances
├── .env                   # Variables d'environnement
├── .gitignore            # Fichiers ignorés par Git
├── netlify.toml          # Configuration Netlify
└── README.md             # Documentation
```

## 🤖 Configuration de l'IA

Le système utilise :
- **Modèles** : stepfun/step-3.5-flash, google/gemini-2.0-pro-exp, gemini-pro, llama-3.1-8b
- **Prompt système** : Force la génération de JSON pur avec emojis et kebab-case
- **Fallback** : Essaie automatiquement plusieurs modèles en cas d'échec
- **Timeout** : 30 secondes pour les réponses IA

## 🐛 Dépannage

### Problèmes courants
1. **Bot non connecté** : Vérifiez le DISCORD_TOKEN
2. **Serveur non trouvé** : Vérifiez l'ID du serveur et que le bot est dessus
3. **Erreur IA** : Vérifiez votre clé OPENROUTER_API_KEY
4. **Permissions** : Assurez-vous que le bot est admin sur le serveur
5. **CORS** : Vérifiez la configuration des origines dans server.js

### Logs détaillés
Toutes les opérations sont loggées dans :
- Console du serveur Render
- Interface frontend (onglet Logs)
- Fichiers de logs Render

## 📝 API Endpoints

### POST /generate
Génère un nouveau serveur Discord
```json
{
  "theme": "gaming community",
  "guildId": "123456789012345678"
}
```

### GET /status
Vérifie le statut du bot Discord
```json
{
  "connected": true,
  "username": "BotName#1234",
  "guilds": 1
}
```

## 🛠️ Technologies utilisées

- **Backend**: Node.js, Express.js
- **Discord**: Discord.js v14
- **IA**: OpenRouter, Google Gemini 2.0 Flash
- **Frontend**: HTML5, CSS3, JavaScript Vanilla
- **Design**: Dark Mode inspiré de Discord
- **Déploiement**: Render (backend), Netlify (frontend)

## 📄 Licence

MIT License - voir le fichier LICENSE pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou submit un PR.

---

**Made with ❤️ by CreatorBot**
