require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');

// Initialisation Express
const app = express();
const PORT = process.env.PORT || 10000;

// Configuration CORS pour autoriser les origines
app.use(cors({
  origin: '*', // Pour être sûr que Netlify puisse appeler Railway sans blocage
  methods: ['GET', 'POST']
}));

app.use(express.json());
app.use(express.static('public'));

// Initialisation Client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// Connexion du bot Discord
client.once('ready', () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
  console.log(`📊 Bot présent sur ${client.guilds.cache.size} serveurs`);
});

// Debug de la tentative de connexion
console.log("🔑 Tentative de connexion avec le token (longueur: " + (process.env.DISCORD_TOKEN?.length || 0) + ")...");

client.on('error', (err) => console.error("❌ ERREUR TECHNIQUE BOT :", err));
client.on('shardError', (err) => console.error("❌ ERREUR DE CONNEXION (Shard) :", err));

client.login(process.env.DISCORD_TOKEN)
  .then(() => {
    console.log("✅ LOGIN RÉUSSI ! Le bot est authentifié.");
  })
  .catch(err => {
    console.error("💥 ÉCHEC CRITIQUE DU LOGIN !");
    console.error("RAISON :", err.message);
    if (err.message.includes("Privileged intents")) {
      console.error("👉 SOLUTION : Active les 3 interrupteurs 'Intents' sur le portail Discord !");
    }
    if (err.message.includes("An invalid token")) {
      console.error("👉 SOLUTION : Ton token est expiré ou mal copié sur Render !");
    }
  });

// Fonction pour nettoyer la réponse IA et extraire le JSON
function cleanAIResponse(response) {
  try {
    // RegEx robuste pour extraire le JSON même avec du texte avant/après (ex: "json {...}")
    const jsonMatch = response.match(/(?:json\s*)?(\{[\s\S]*\})/i);
    if (jsonMatch) {
      const jsonContent = jsonMatch[1];
      // Validation supplémentaire : vérifier que c'est du JSON valide
      try {
        JSON.parse(jsonContent);
        return jsonContent;
      } catch (parseError) {
        throw new Error('JSON extrait invalide');
      }
    }
    throw new Error('Aucun JSON trouvé dans la réponse');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage de la réponse IA:', error.message);
    console.error('Réponse brute:', response);
    throw error;
  }
}

// Fonction pour appeler l'IA OpenRouter avec fallback
async function generateServerStructure(theme) {
  try {
    const systemPrompt = `Tu es un expert en création de serveurs Discord. Génère UNIQUEMENT un objet JSON pur sans aucun texte supplémentaire.
Le schéma doit être: { "categories": [ { "name": "Emoji + Nom", "channels": [ { "name": "emoji-nom-en-kebab-case", "type": "text|voice" } ] } ], "roles": [ { "name": "Emoji + Nom", "color": "HEX" } ] }

CONTRAINTES OBLIGATOIRES:
1. Chaque nom de salon, catégorie et rôle DOIT commencer par un emoji pertinent (ex: 💬-général, 📁-ADMIN, 👑-Fondateur)
2. Les noms de salons textuels DOIVENT être en kebab-case (ex: 💬-general-discussion, 🎮-gaming-talk)
3. Les salons vocaux peuvent être en camelCase ou normal (ex: 🎤-Voice Chat)
4. Les couleurs hex doivent être valides (ex: #FF0000, #00FF00)
5. Ne réponds QUE par le JSON, aucun texte avant ou après`;

    // Liste des modèles à essayer (par ordre de préférence)
    const models = [
      'stepfun/step-3.5-flash:free',
      'google/gemini-2.0-pro-exp-02-05:free',
      'google/gemini-pro:free',
      'meta-llama/llama-3.1-8b-instruct:free'
    ];

    let lastError = null;
    
    // Essayer chaque modèle jusqu'à ce qu'un fonctionne
    for (const model of models) {
      try {
        console.log(`🤖 Tentative avec le modèle: ${model}`);
        
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Génère une structure de serveur Discord pour le thème: ${theme}` }
          ]
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://botcreator1.netlify.app',
            'X-Title': 'Discord Server Generator'
          },
          timeout: 30000 // 30 secondes de timeout
        });

        const aiResponse = response.data.choices[0].message.content;
        console.log(`✅ Réponse reçue du modèle ${model}:`, aiResponse.substring(0, 200) + '...');
        
        const cleanedJson = cleanAIResponse(aiResponse);
        return JSON.parse(cleanedJson);
        
      } catch (error) {
        lastError = error;
        console.error(`❌ Erreur avec le modèle ${model}:`, error.response?.data || error.message);
        
        // Si c'est une erreur de quota ou de clé invalide, ne pas essayer les autres modèles
        if (error.response?.status === 401 || error.response?.status === 429) {
          console.error('💥 Erreur critique (clé/quota), arrêt des tentatives');
          break;
        }
        
        console.log(`⏭️ Passage au modèle suivant...`);
        continue;
      }
    }
    
    // Si tous les modèles ont échoué
    console.error('❌ Détails erreur finale OpenRouter:', lastError?.response?.data || lastError?.message);
    throw new Error(`Échec de la génération par IA: ${lastError?.response?.data?.error?.message || lastError?.message || 'Modèles indisponibles'}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération IA:', error.message);
    console.error('🔍 Détails complets de l\'erreur OpenRouter:', error.response?.data || error.message);
    throw new Error('Échec de la génération par IA');
  }
}

// Fonction pour vider le serveur Discord
async function clearServer(guild) {
  try {
    console.log('🧹 Nettoyage du serveur...');
    
    // Supprimer tous les salons en parallèle avec gestion d'erreurs robuste
    console.log(`📊 ${guild.channels.cache.size} salons à supprimer`);
    await Promise.all(
      guild.channels.cache.map(channel => 
        channel.delete().catch(error => {
          console.log(`⚠️ Impossible de supprimer le salon ${channel.name}:`, error.message);
        })
      )
    );
    console.log('✅ Tous les salons ont été traités');

    // Supprimer les rôles (sauf ceux protégés)
    console.log(`👑 ${guild.roles.cache.size} rôles à vérifier`);
    const rolesToDelete = guild.roles.cache.filter(role => {
      // Ne pas supprimer : @everyone, rôles gérés par intégrations, ou rôle du bot
      return role.name !== '@everyone' && 
             !role.managed && 
             role.id !== guild.members.me.roles.highest.id;
    });

    await Promise.all(
      rolesToDelete.map(role => 
        role.delete().catch(error => {
          console.log(`⚠️ Impossible de supprimer le rôle ${role.name}:`, error.message);
        })
      )
    );
    console.log('✅ Tous les rôles ont été traités');
    console.log('✅ Serveur nettoyé avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage du serveur:', error.message);
    throw error;
  }
}

// Fonction pour créer la structure du serveur avec permissions intégrées
async function createServerStructure(guild, structure) {
  try {
    console.log('🏗️ Création de la structure du serveur...');
    console.log('📋 Structure à créer:', JSON.stringify(structure, null, 2));
    
    // Étape 1: Créer toutes les catégories d'abord
    const createdCategories = [];
    for (const category of structure.categories) {
      try {
        const createdCategory = await guild.channels.create({
          name: category.name,
          type: ChannelType.GuildCategory
        });
        createdCategories.push({
          original: category,
          created: createdCategory
        });
        console.log(`📁 Catégorie créée: ${category.name} (ID: ${createdCategory.id})`);
      } catch (error) {
        console.error(`❌ Erreur création catégorie ${category.name}:`, error.message);
      }
    }

    // Étape 2: Créer les salons dans leurs catégories respectives avec permissions
    const createdChannels = new Map();
    for (const categoryData of createdCategories) {
      for (const channel of categoryData.original.channels) {
        try {
          const channelType = channel.type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText;
          
          // Préparer les permission overwrites depuis les attributs du salon
          const permissionOverwrites = [];
          
          console.log(`🔧 Configuration du salon: ${channel.name}`);
          console.log(`   - isPrivate: ${channel.isPrivate}`);
          console.log(`   - readOnly: ${channel.readOnly}`);
          
          // Si le salon est privé (isPrivate)
          if (channel.isPrivate) {
            permissionOverwrites.push({
              id: guild.id, // Utiliser guild.id pour @everyone
              deny: [PermissionsBitField.Flags.ViewChannel]
            });
            console.log(`🔒 Ajout permission ViewChannel:deny pour ${channel.name}`);
          }
          
          // Si le salon est en lecture seule (readOnly)
          if (channel.readOnly) {
            permissionOverwrites.push({
              id: guild.id, // Utiliser guild.id pour @everyone
              deny: [PermissionsBitField.Flags.SendMessages]
            });
            console.log(`📖 Ajout permission SendMessages:deny pour ${channel.name}`);
          }
          
          console.log(`📋 Permission overwrites finales pour ${channel.name}:`, JSON.stringify(permissionOverwrites, null, 2));
          
          const createdChannel = await guild.channels.create({
            name: channel.name,
            type: channelType,
            parent: categoryData.created.id,
            permissionOverwrites: permissionOverwrites
          });
          
          createdChannels.set(`${categoryData.original.name}-${channel.name}`, createdChannel);
          console.log(`💬 Salon créé: ${channel.name} dans ${categoryData.original.name} (ID: ${createdChannel.id})`);
          
          if (channel.isPrivate || channel.readOnly) {
            console.log(`🔒 Permissions appliquées: privé=${channel.isPrivate}, lecture seule=${channel.readOnly}`);
          }
        } catch (error) {
          console.error(`❌ Erreur création salon ${channel.name}:`, error.message);
        }
      }
    }

    // Étape 3: Créer les rôles (en parallèle sans bloquer)
    const rolePromises = structure.roles.map(async (role) => {
      try {
        const createdRole = await guild.roles.create({
          name: role.name,
          color: role.color,
          permissions: [PermissionsBitField.Flags.SendMessages]
        });
        console.log(`👑 Rôle créé: ${role.name} (ID: ${createdRole.id})`);
        return createdRole;
      } catch (error) {
        console.error(`❌ Erreur création rôle ${role.name}:`, error.message);
        return null;
      }
    });

    // Attendre tous les rôles en parallèle
    await Promise.allSettled(rolePromises);

    console.log('✅ Structure du serveur créée avec succès');
    return createdChannels;
  } catch (error) {
    console.error('❌ Erreur lors de la création de la structure:', error.message);
    throw error;
  }
}

// Route pour générer uniquement la structure (sans déploiement)
app.post('/generate-structure', async (req, res) => {
  try {
    const { theme } = req.body;
    
    if (!theme) {
      return res.status(400).json({ error: 'Le thème est requis' });
    }

    console.log(`🎨 Génération de structure pour le thème: ${theme}`);

    // Générer la structure via IA
    console.log('🤖 Génération de la structure par IA...');
    const structure = await generateServerStructure(theme);

    res.json({ 
      success: true, 
      message: 'Structure générée avec succès',
      structure: structure,
      stats: {
        categories: structure.categories.length,
        channels: structure.categories.reduce((acc, cat) => acc + cat.channels.length, 0),
        roles: structure.roles.length
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la génération de la structure:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Route principale pour la génération (compatibilité)
app.post('/generate', async (req, res) => {
  try {
    const { theme, guildId } = req.body;
    
    if (!theme) {
      return res.status(400).json({ error: 'Le thème est requis' });
    }
    
    if (!guildId) {
      return res.status(400).json({ error: 'L\'ID du serveur Discord est requis' });
    }

    console.log(`🎨 Génération pour le thème: ${theme} sur le serveur: ${guildId}`);

    // Vérifier que le bot est connecté
    if (!client.isReady()) {
      return res.status(500).json({ error: 'Bot Discord non connecté' });
    }

    // Récupérer le serveur avec l'ID fourni
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      return res.status(404).json({ error: 'Serveur Discord non trouvé. Le bot doit être sur ce serveur.' });
    }

    // Générer la structure via IA
    console.log('🤖 Génération de la structure par IA...');
    const structure = await generateServerStructure(theme);

    // Nettoyer le serveur
    await clearServer(guild);

    // Créer la nouvelle structure
    await createServerStructure(guild, structure);

    res.json({ 
      success: true, 
      message: 'Serveur généré avec succès',
      structure: structure,
      stats: {
        categories: structure.categories.length,
        channels: structure.categories.reduce((acc, cat) => acc + cat.channels.length, 0),
        roles: structure.roles.length
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Route pour déployer la structure sur Discord
app.post('/deploy', async (req, res) => {
  try {
    const { guildId, structure } = req.body;
    
    if (!guildId) {
      return res.status(400).json({ error: 'L\'ID du serveur Discord est requis' });
    }
    
    if (!structure) {
      return res.status(400).json({ error: 'La structure est requise' });
    }

    console.log(`🚀 Déploiement sur le serveur: ${guildId}`);
    console.log('📋 Structure reçue:', JSON.stringify(structure, null, 2));

    // Vérifier que le bot est connecté
    if (!client.isReady()) {
      return res.status(500).json({ error: 'Bot Discord non connecté' });
    }

    // Récupérer le serveur avec l'ID fourni
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      return res.status(404).json({ error: 'Serveur Discord non trouvé. Le bot doit être sur ce serveur.' });
    }

    // Nettoyer le serveur
    await clearServer(guild);

    // Créer la nouvelle structure avec permissions
    const createdChannels = await createServerStructure(guild, structure);

    // Compter les salons avec permissions spéciales
    let privateChannels = 0;
    let readonlyChannels = 0;
    
    structure.categories.forEach(category => {
      category.channels.forEach(channel => {
        if (channel.isPrivate) privateChannels++;
        if (channel.readOnly) readonlyChannels++;
      });
    });

    res.json({ 
      success: true, 
      message: 'Serveur déployé avec succès',
      stats: {
        categories: structure.categories.length,
        channels: structure.categories.reduce((acc, cat) => acc + cat.channels.length, 0),
        roles: structure.roles.length,
        privateChannels,
        readonlyChannels
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors du déploiement:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Route pour appliquer les permissions aux salons existants
app.post('/apply-permissions', async (req, res) => {
  try {
    const { guildId, permissions } = req.body;
    
    if (!guildId) {
      return res.status(400).json({ error: 'L\'ID du serveur Discord est requis' });
    }
    
    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Les permissions sont requises' });
    }

    console.log(`🔒 Application des permissions pour le serveur: ${guildId}`);

    // Vérifier que le bot est connecté
    if (!client.isReady()) {
      return res.status(500).json({ error: 'Bot Discord non connecté' });
    }

    // Récupérer le serveur
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      return res.status(404).json({ error: 'Serveur Discord non trouvé. Le bot doit être sur ce serveur.' });
    }

    let privateChannels = 0;
    let readonlyChannels = 0;

    // Appliquer les permissions à chaque salon
    for (const permissionData of permissions) {
      try {
        // Trouver le salon par son nom
        const [categoryName, channelName] = permissionData.channelId.split('-');
        const category = guild.channels.cache.find(c => 
          c.type === ChannelType.GuildCategory && c.name === categoryName
        );
        
        if (!category) {
          console.log(`⚠️ Catégorie non trouvée: ${categoryName}`);
          continue;
        }

        const channel = guild.channels.cache.find(c => 
          c.parentId === category.id && c.name === channelName
        );

        if (!channel) {
          console.log(`⚠️ Salon non trouvé: ${channelName} dans ${categoryName}`);
          continue;
        }

        // Préparer les permission overwrites
        const overwrites = [];

        // Si le salon est privé
        if (permissionData.private) {
          overwrites.push({
            id: guild.roles.everyone.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          });
          privateChannels++;
        }

        // Si le salon est en lecture seule
        if (permissionData.readonly) {
          overwrites.push({
            id: guild.roles.everyone.id,
            deny: [PermissionsBitField.Flags.SendMessages]
          });
          readonlyChannels++;
        }

        // Appliquer les permissions
        if (overwrites.length > 0) {
          await channel.permissionOverwrites.set(overwrites);
          console.log(`✅ Permissions appliquées pour ${channel.name}: privé=${permissionData.private}, lecture seule=${permissionData.readonly}`);
        }

      } catch (error) {
        console.error(`❌ Erreur lors de l'application des permissions pour ${permissionData.channelId}:`, error.message);
      }
    }

    res.json({ 
      success: true, 
      message: 'Permissions appliquées avec succès',
      stats: {
        privateChannels,
        readonlyChannels,
        totalProcessed: permissions.length
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'application des permissions:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Route racine pour tester l'URL
app.get('/', (req, res) => {
  res.send('Serveur OK - Discord Server Generator Backend');
});

// Route pour vérifier l'état du bot
app.get('/status', (req, res) => {
  try {
    const isBotReady = client && client.user && client.isReady();
    
    const status = {
      connected: !!isBotReady,
      username: isBotReady ? client.user.tag : 'En attente...',
      guilds: isBotReady ? client.guilds.cache.size : 0,
      // Utilise l'état du WebSocket (0 = READY)
      wsStatus: client?.ws?.status === 0 ? 'CONNECTED' : 'CONNECTING',
      tokenConfigured: !!process.env.DISCORD_TOKEN
    };
    
    console.log("🔍 Status Check envoyé :", status.connected ? "✅ CONNECTÉ" : "⏳ EN ATTENTE");
    res.json(status);
  } catch (error) {
    console.error("❌ Erreur dans la route /status:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🌐 Frontend disponible: https://botcreator1.netlify.app`);
});
