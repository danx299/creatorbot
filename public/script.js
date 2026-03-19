// Éléments DOM
const themeInput = document.getElementById('theme-input');
const guildInput = document.getElementById('guild-input');
const generateBtn = document.getElementById('generate-btn');
const logsContainer = document.getElementById('logs');
const clearLogsBtn = document.getElementById('clear-logs');
const statusIndicator = document.getElementById('status');
const statusDot = statusIndicator.querySelector('.status-dot');
const statusText = statusIndicator.querySelector('.status-text');

// Éléments de preview et modal
const previewContainer = document.getElementById('preview-container');
const previewStatus = document.getElementById('preview-status');
const channelModal = document.getElementById('channel-modal');
const modalChannelName = document.getElementById('modal-channel-name');
const modalChannelType = document.getElementById('modal-channel-type');
const privateOption = document.getElementById('private-option');
const readonlyOption = document.getElementById('readonly-option');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');
const modalSave = document.getElementById('modal-save');

// URL de l'API backend - REMPLACER PAR VOTRE URL RAILWAY
const API_URL = 'https://creatorbot-production.up.railway.app';

// État de l'application
let isGenerating = false;
let currentStructure = null;
let currentChannel = null;
let channelPermissions = new Map();

// Fonction pour ajouter un log
function addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.innerHTML = `
        <span class="log-timestamp">[${timestamp}]</span>
        <span class="log-message">${message}</span>
    `;
    
    logsContainer.appendChild(logEntry);
    logsContainer.scrollTop = logsContainer.scrollHeight;
    
    // Limiter le nombre de logs à 100
    const logs = logsContainer.querySelectorAll('.log-entry');
    if (logs.length > 100) {
        logs[0].remove();
    }
}

// Fonction pour mettre à jour le statut
function updateStatus(text, state = 'ready') {
    statusText.textContent = text;
    statusDot.className = `status-dot ${state}`;
}

// Fonction pour vérifier la connexion du bot
async function checkBotStatus() {
    try {
        const response = await fetch(`${API_URL}/status`);
        const data = await response.json();
        
        if (data.connected) {
            addLog(`✅ Bot connecté: ${data.username}`, 'success');
            addLog(`📊 Serveurs disponibles: ${data.guilds}`, 'info');
            updateStatus('Bot connecté', 'ready');
            return true;
        } else {
            addLog('❌ Bot non connecté', 'error');
            updateStatus('Bot déconnecté', 'error');
            return false;
        }
    } catch (error) {
        addLog(`❌ Erreur de connexion au backend: ${error.message}`, 'error');
        
        // Message clair pour l'utilisateur si le backend est en cours de réveil
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            addLog('⏳ Le serveur Railway est en cours de réveil, réessayez dans 30 secondes', 'warning');
        }
        
        updateStatus('Erreur de connexion', 'error');
        return false;
    }
}

// Fonction pour générer le serveur
async function generateServer() {
    const theme = themeInput.value.trim();
    const guildId = guildInput.value.trim();
    
    if (!theme) {
        addLog('⚠️ Veuillez entrer un thème pour le serveur', 'warning');
        themeInput.focus();
        return;
    }
    
    if (!guildId) {
        addLog('⚠️ Veuillez entrer l\'ID du serveur Discord', 'warning');
        guildInput.focus();
        return;
    }
    
    if (isNaN(guildId) || guildId.length < 17 || guildId.length > 19) {
        addLog('⚠️ L\'ID du serveur doit être un nombre entre 17 et 19 chiffres', 'warning');
        guildInput.focus();
        return;
    }
    
    if (isGenerating) {
        addLog('⚠️ Génération déjà en cours...', 'warning');
        return;
    }
    
    // Vérifier le statut du bot
    const botReady = await checkBotStatus();
    if (!botReady) {
        addLog('❌ Impossible de continuer sans bot connecté', 'error');
        return;
    }
    
    isGenerating = true;
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="btn-icon">⏳</span> Génération en cours...';
    updateStatus('Génération en cours', 'loading');
    
    addLog(`🎨 Début de la génération pour le thème: "${theme}"`, 'info');
    addLog(`🏰 Serveur cible: ${guildId}`, 'info');
    
    try {
        const response = await fetch(`${API_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ theme, guildId })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la génération');
        }
        
        // Succès
        addLog('✅ Serveur généré avec succès!', 'success');
        addLog(`📁 ${data.stats.categories} catégories créées`, 'info');
        addLog(`💬 ${data.stats.channels} salons créés`, 'info');
        addLog(`👑 ${data.stats.roles} rôles créés`, 'info');
        updateStatus('Génération terminée', 'ready');
        
        // Afficher la preview
        if (data.structure) {
            displayPreview(data.structure);
            addLog('👁️ Preview interactive disponible', 'info');
        }
        
    } catch (error) {
        addLog(`❌ Erreur lors de la génération: ${error.message}`, 'error');
        updateStatus('Erreur de génération', 'error');
    } finally {
        isGenerating = false;
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<span class="btn-icon">✨</span> Générer le serveur';
    }
}

// Fonction pour afficher la preview de la structure
function displayPreview(structure) {
    currentStructure = structure;
    previewStatus.textContent = 'Prêt';
    previewStatus.style.color = 'var(--success)';
    
    let html = '';
    
    structure.categories.forEach(category => {
        html += `
            <div class="preview-category">
                <div class="preview-category-name">
                    ${category.name}
                </div>
                <div class="preview-channels">
        `;
        
        category.channels.forEach(channel => {
            const channelId = `${category.name}-${channel.name}`;
            const permissions = channelPermissions.get(channelId) || {};
            const classes = [
                'preview-channel',
                channel.type,
                permissions.private ? 'private' : '',
                permissions.readonly ? 'readonly' : ''
            ].filter(Boolean).join(' ');
            
            const icon = channel.type === 'voice' ? '🎤' : '💬';
            const badges = [];
            if (permissions.private) badges.push('🔒');
            if (permissions.readonly) badges.push('📖');
            
            html += `
                <div class="${classes}" data-channel-id="${channelId}" 
                     data-category="${category.name}" data-channel="${channel.name}" 
                     data-type="${channel.type}">
                    <span>${icon}</span>
                    <span>${channel.name}</span>
                    <span class="channel-badges">${badges.join(' ')}</span>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    previewContainer.innerHTML = html;
    
    // Ajouter les écouteurs d'événements pour les salons cliquables
    document.querySelectorAll('.preview-channel').forEach(channel => {
        channel.addEventListener('click', () => openChannelModal(channel));
    });
}

// Fonction pour ouvrir la modal d'options de salon
function openChannelModal(channelElement) {
    const categoryId = channelElement.dataset.category;
    const channelName = channelElement.dataset.channel;
    const channelType = channelElement.dataset.type;
    const channelId = channelElement.dataset.channelId;
    
    currentChannel = {
        id: channelId,
        name: channelName,
        type: channelType,
        category: categoryId
    };
    
    // Mettre à jour la modal
    modalChannelName.textContent = channelType === 'voice' ? '🎤 ' : '💬 ' + channelName;
    modalChannelType.textContent = channelType === 'voice' ? 'Vocal' : 'Texte';
    
    // Charger les permissions existantes
    const permissions = channelPermissions.get(channelId) || {};
    privateOption.checked = permissions.private || false;
    readonlyOption.checked = permissions.readonly || false;
    
    // Afficher la modal
    channelModal.classList.add('show');
}

// Fonction pour fermer la modal
function closeModal() {
    channelModal.classList.remove('show');
    currentChannel = null;
}

// Fonction pour sauvegarder les permissions du salon
function saveChannelPermissions() {
    if (!currentChannel) return;
    
    const permissions = {
        private: privateOption.checked,
        readonly: readonlyOption.checked
    };
    
    channelPermissions.set(currentChannel.id, permissions);
    
    // Mettre à jour l'affichage du salon
    const channelElement = document.querySelector(`[data-channel-id="${currentChannel.id}"]`);
    if (channelElement) {
        // Mettre à jour les classes
        channelElement.classList.toggle('private', permissions.private);
        channelElement.classList.toggle('readonly', permissions.readonly);
        
        // Mettre à jour les badges
        const badges = [];
        if (permissions.private) badges.push('🔒');
        if (permissions.readonly) badges.push('📖');
        
        const badgesElement = channelElement.querySelector('.channel-badges');
        if (badgesElement) {
            badgesElement.textContent = badges.join(' ');
        }
    }
    
    addLog(`✅ Permissions mises à jour pour ${currentChannel.name}`, 'success');
    closeModal();
}

// Fonction pour effacer les logs
function clearLogs() {
    logsContainer.innerHTML = '';
    addLog('📋 Logs effacés', 'info');
}

// Fonction pour envoyer les permissions au backend
async function applyPermissionsToServer() {
    if (!currentStructure || channelPermissions.size === 0) {
        addLog('⚠️ Aucune permission à appliquer', 'warning');
        return;
    }
    
    try {
        const permissionsArray = Array.from(channelPermissions.entries()).map(([channelId, perms]) => ({
            channelId,
            ...perms
        }));
        
        const response = await fetch(`${API_URL}/apply-permissions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                guildId: guildInput.value.trim(),
                permissions: permissionsArray
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de l\'application des permissions');
        }
        
        addLog('✅ Permissions appliquées avec succès!', 'success');
        addLog(`🔒 ${data.privateChannels} salons privés configurés`, 'info');
        addLog(`📖 ${data.readonlyChannels} salons en lecture seule configurés`, 'info');
        
    } catch (error) {
        addLog(`❌ Erreur lors de l'application des permissions: ${error.message}`, 'error');
    }
}

themeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        guildInput.focus();
    }
});

guildInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        generateServer();
    }
});

// Écouteurs d'événements
generateBtn.addEventListener('click', generateServer);
clearLogsBtn.addEventListener('click', clearLogs);

// Écouteurs pour la modal
modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
modalSave.addEventListener('click', saveChannelPermissions);

// Fermer la modal en cliquant à l'extérieur
channelModal.addEventListener('click', (e) => {
    if (e.target === channelModal) {
        closeModal();
    }
});

// Fermer la modal avec la touche Échap
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && channelModal.classList.contains('show')) {
        closeModal();
    }
});

// Auto-focus sur le premier input
themeInput.focus();

// Vérifier le statut du bot au chargement
window.addEventListener('load', () => {
    addLog('🚀 Application chargée', 'success');
    addLog('🔍 Vérification du statut du bot...', 'info');
    checkBotStatus();
});

// Gérer les erreurs globales
window.addEventListener('error', (e) => {
    addLog(`❌ Erreur globale: ${e.message}`, 'error');
});

window.addEventListener('unhandledrejection', (e) => {
    addLog(`❌ Erreur de promesse non gérée: ${e.reason}`, 'error');
});

// Animation de typing dans l'input
themeInput.addEventListener('input', (e) => {
    const value = e.target.value;
    if (value.length > 0 && value.length % 10 === 0) {
        addLog(`💭 Thème en cours: "${value}"`, 'info');
    }
});

// Effet de hover sur le bouton
generateBtn.addEventListener('mouseenter', () => {
    if (!generateBtn.disabled) {
        generateBtn.style.transform = 'translateY(-2px)';
    }
});

generateBtn.addEventListener('mouseleave', () => {
    if (!generateBtn.disabled) {
        generateBtn.style.transform = 'translateY(0)';
    }
});
