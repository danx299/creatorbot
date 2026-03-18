# Discord Server Generator

Un générateur de serveurs Discord intelligent qui utilise l'IA pour créer des structures de serveurs complètes avec des catégories, salons et rôles personnalisés.

## 🚀 Fonctionnalités

- **Génération par IA**: Utilise OpenRouter avec Google Gemini 2.0 Flash
- **Structure complète**: Crée catégories, salons textuels/vocaux et rôles
- **Emojis intégrés**: Ajoute automatiquement des emojis pertinents à chaque élément
- **Interface moderne**: Design Dark Mode inspiré de Discord
- **Nettoyage automatique**: Supprime les anciens salons et rôles avant la création
- **Logs en temps réel**: Suivi détaillé de toutes les opérations

## 📋 Prérequis

- Node.js 18+
- Un bot Discord avec les permissions nécessaires
- Une clé API OpenRouter
- Un serveur Discord où le bot est administrateur

## 🔧 Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd discord-server-generator
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
```bash
# Renommer .env.example en .env
cp .env.example .env
```

4. **Remplir le fichier .env**
```env
DISCORD_TOKEN=votre_token_discord_ici
OPENROUTER_API_KEY=votre_cle_openrouter_ici
GUILD_ID=votre_id_serveur_discord_ici
```

## 🎯 Utilisation

### Démarrage local
```bash
npm start
```
Le serveur démarrera sur le port 10000.

### Déploiement (Render)
1. Connectez votre repository GitHub à Render
2. Configurez les variables d'environnement dans Render
3. Déployez automatiquement

### Frontend (Netlify)
1. Déployez le dossier `/public` sur Netlify
2. Configurez l'URL de votre backend dans `script.js`

## 🔐 Permissions requises pour le bot

Le bot Discord nécessite les permissions suivantes sur le serveur cible :
- Administrateur (recommandé)
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
└── README.md             # Documentation
```

## 🤖 Configuration de l'IA

Le système utilise :
- **Modèle**: `google/gemini-2.0-flash-lite-preview-02-05:free`
- **Prompt système**: Force la génération de JSON pur avec emojis
- **Nettoyage**: RegEx pour extraire uniquement le JSON valide

## 🎨 Personnalisation

### Thèmes supportés
Exemples de thèmes que vous pouvez utiliser :
- Gaming, Esports
- Community, Social
- Programming, Tech
- Music, Art
- Education, Learning

### Modification du prompt IA
Éditez la variable `systemPrompt` dans `server.js` pour personnaliser le comportement de l'IA.

## 🐛 Dépannage

### Problèmes courants
1. **Bot non connecté**: Vérifiez le DISCORD_TOKEN
2. **Serveur non trouvé**: Vérifiez le GUILD_ID
3. **Erreur IA**: Vérifiez votre clé OPENROUTER_API_KEY
4. **Permissions**: Assurez-vous que le bot est admin sur le serveur

### Logs détaillés
Toutes les opérations sont loggées dans la console et dans l'interface frontend.

## 📝 API Endpoints

### POST /generate
Génère un nouveau serveur Discord
```json
{
  "theme": "gaming community"
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

## 📄 Licence

MIT License - voir le fichier LICENSE pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou submit un PR.

---

**Made with ❤️ by CreatorBot**
