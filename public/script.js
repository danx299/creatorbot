// Éléments DOM
const themeInput = document.getElementById('theme-input');
const guildInput = document.getElementById('guild-input');
const generateBtn = document.getElementById('generate-btn');
const deployBtn = document.getElementById('deploy-btn');
const logsContainer = document.getElementById('logs');
const clearLogsBtn = document.getElementById('clear-logs');
const statusIndicator = document.getElementById('status');
const statusDot = statusIndicator.querySelector('.status-dot');
const statusText = statusIndicator.querySelector('.status-text');

// Éléments de preview
const previewContainer = document.getElementById('preview-container');
const previewStatus = document.getElementById('preview-status');

// URL de l'API backend - REMPLACER PAR VOTRE URL RAILWAY
const API_URL = 'https://creatorbot-production.up.railway.app';

// État de l'application
let isGenerating = false;
let isDeploying = false;
let currentStructure = null;

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

// Fonction pour générer la structure (Étape 1)
async function generateStructure() {
    const theme = themeInput.value.trim();
    
    if (!theme) {
        addLog('⚠️ Veuillez entrer un thème pour le serveur', 'warning');
        themeInput.focus();
        return;
    }
    
    if (isGenerating) {
        addLog('⚠️ Génération déjà en cours...', 'warning');
        return;
    }
    
    isGenerating = true;
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="btn-icon">⏳</span> Génération en cours...';
    updateStatus('Génération de la structure', 'loading');
    
    addLog(`🎨 Début de la génération pour le thème: "${theme}"`, 'info');
    
    try {
        const response = await fetch(`${API_URL}/generate-structure`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ theme })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la génération');
        }
        
        // Succès
        currentStructure = data.structure;
        addLog('✅ Structure générée avec succès!', 'success');
        addLog(`📁 ${data.structure.categories.length} catégories proposées`, 'info');
        addLog(`💬 ${data.structure.categories.reduce((acc, cat) => acc + cat.channels.length, 0)} salons proposés`, 'info');
        addLog(`👑 ${data.structure.roles.length} rôles proposés`, 'info');
        updateStatus('Structure prête', 'ready');
        
        // Afficher la preview
        displayPreview(data.structure);
        addLog('👁️ Preview interactive disponible', 'info');
        
        // Afficher le bouton de déploiement
        deployBtn.style.display = 'flex';
        addLog('🚀 Bouton de déploiement disponible', 'info');
        
    } catch (error) {
        addLog(`❌ Erreur lors de la génération: ${error.message}`, 'error');
        updateStatus('Erreur de génération', 'error');
    } finally {
        isGenerating = false;
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<span class="btn-icon">✨</span> Générer la structure';
    }
}

// Fonction pour déployer sur Discord (Étape 2)
async function deployToDiscord() {
    const guildId = guildInput.value.trim();
    
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
    
    if (!currentStructure) {
        addLog('⚠️ Veuillez d\'abord générer une structure', 'warning');
        return;
    }
    
    if (isDeploying) {
        addLog('⚠️ Déploiement déjà en cours...', 'warning');
        return;
    }
    
    // Vérifier le statut du bot
    const botReady = await checkBotStatus();
    if (!botReady) {
        addLog('❌ Impossible de continuer sans bot connecté', 'error');
        return;
    }
    
    isDeploying = true;
    deployBtn.disabled = true;
    deployBtn.innerHTML = '<span class="btn-icon">⏳</span> Déploiement en cours...';
    updateStatus('Déploiement sur Discord', 'loading');
    
    addLog(`🚀 Début du déploiement sur le serveur: ${guildId}`, 'info');
    
    try {
        const response = await fetch(`${API_URL}/deploy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                guildId,
                structure: currentStructure
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors du déploiement');
        }
        
        // Succès
        addLog('🎉 Serveur déployé avec succès!', 'success');
        addLog(`📁 ${data.stats.categories} catégories créées`, 'info');
        addLog(`💬 ${data.stats.channels} salons créés`, 'info');
        addLog(`👑 ${data.stats.roles} rôles créés`, 'info');
        addLog(`🔒 ${data.stats.privateChannels} salons privés`, 'info');
        addLog(`📖 ${data.stats.readonlyChannels} salons en lecture seule`, 'info');
        updateStatus('Déploiement terminé', 'ready');
        
        // Masquer le bouton de déploiement après succès
        deployBtn.style.display = 'none';
        
    } catch (error) {
        addLog(`❌ Erreur lors du déploiement: ${error.message}`, 'error');
        updateStatus('Erreur de déploiement', 'error');
    } finally {
        isDeploying = false;
        deployBtn.disabled = false;
        deployBtn.innerHTML = '<span class="btn-icon">🚀</span> Déployer sur Discord';
    }
}

// Fonction pour afficher la preview avec switchs inline
function displayPreview(structure) {
    currentStructure = structure;
    previewStatus.textContent = 'Prêt';
    previewStatus.style.color = 'var(--success)';
    
    let html = '';
    
    structure.categories.forEach((category, categoryIndex) => {
        html += `
            <div class="preview-category" style="animation: fadeInUp 0.5s ease ${categoryIndex * 0.1}s both">
                <div class="preview-category-name">
                    ${category.name}
                </div>
                <div class="preview-channels">
        `;
        
        category.channels.forEach((channel, channelIndex) => {
            const channelId = `${category.name}-${channel.name}`;
            const channelData = {
                ...channel,
                isPrivate: channel.isPrivate || false,
                readOnly: channel.readOnly || false
            };
            
            const classes = [
                'preview-channel',
                channel.type,
                channelData.isPrivate ? 'private' : '',
                channelData.readOnly ? 'readonly' : ''
            ].filter(Boolean).join(' ');
            
            const icon = channel.type === 'voice' ? '🎤' : '💬';
            
            html += `
                <div class="${classes}" data-channel-id="${channelId}" 
                     data-category="${category.name}" data-channel="${channel.name}" 
                     data-type="${channel.type}"
                     style="animation: fadeInUp 0.5s ease ${(categoryIndex * 0.1) + (channelIndex * 0.05)}s both">
                    <div class="channel-info">
                        <span>${icon}</span>
                        <span>${channel.name}</span>
                    </div>
                    <div class="channel-toggles">
                        <div class="toggle-wrapper">
                            <label class="toggle-switch private">
                                <input type="checkbox" ${channelData.isPrivate ? 'checked' : ''} 
                                       onchange="toggleChannelPermission('${channelId}', 'isPrivate', this.checked)">
                                <span class="toggle-slider"></span>
                            </label>
                            <span class="toggle-label">🔒</span>
                        </div>
                        <div class="toggle-wrapper">
                            <label class="toggle-switch readonly">
                                <input type="checkbox" ${channelData.readOnly ? 'checked' : ''} 
                                       onchange="toggleChannelPermission('${channelId}', 'readOnly', this.checked)">
                                <span class="toggle-slider"></span>
                            </label>
                            <span class="toggle-label">📝</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    previewContainer.innerHTML = html;
    
    // Ajouter les animations CSS si elles n'existent pas déjà
    if (!document.querySelector('#preview-animations')) {
        const style = document.createElement('style');
        style.id = 'preview-animations';
        style.textContent = `
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .toggle-wrapper {
                display: flex;
                align-items: center;
                gap: 2px;
            }
        `;
        document.head.appendChild(style);
    }
}

// Fonction pour basculer les permissions d'un salon
function toggleChannelPermission(channelId, permission, value) {
    // Mettre à jour la structure
    const [categoryName, channelName] = channelId.split('-');
    const category = currentStructure.categories.find(cat => cat.name === categoryName);
    
    if (category) {
        const channel = category.channels.find(ch => ch.name === channelName);
        if (channel) {
            if (permission === 'isPrivate') {
                channel.isPrivate = value;
            } else if (permission === 'readOnly') {
                channel.readOnly = value;
            }
            
            // Mettre à jour les classes CSS
            const channelElement = document.querySelector(`[data-channel-id="${channelId}"]`);
            if (channelElement) {
                channelElement.classList.toggle('private', channel.isPrivate);
                channelElement.classList.toggle('readonly', channel.readOnly);
            }
            
            addLog(`🔧 ${channelName}: ${permission} = ${value}`, 'info');
        }
    }
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
        if (currentStructure) {
            deployToDiscord();
        } else {
            generateStructure();
        }
    }
});

// Écouteurs d'événements
generateBtn.addEventListener('click', generateStructure);
deployBtn.addEventListener('click', deployToDiscord);
clearLogsBtn.addEventListener('click', clearLogs);

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
