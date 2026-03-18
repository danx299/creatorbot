// Éléments DOM
const themeInput = document.getElementById('theme-input');
const guildInput = document.getElementById('guild-input');
const generateBtn = document.getElementById('generate-btn');
const logsContainer = document.getElementById('logs');
const clearLogsBtn = document.getElementById('clear-logs');
const statusIndicator = document.getElementById('status');
const statusDot = statusIndicator.querySelector('.status-dot');
const statusText = statusIndicator.querySelector('.status-text');

// URL de l'API backend - REMPLACER PAR VOTRE URL RENDER
const API_URL = 'https://creatorbot-xy90.onrender.com';

// État de l'application
let isGenerating = false;

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
        
    } catch (error) {
        addLog(`❌ Erreur lors de la génération: ${error.message}`, 'error');
        updateStatus('Erreur de génération', 'error');
    } finally {
        isGenerating = false;
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<span class="btn-icon">✨</span> Générer le serveur';
    }
}

// Fonction pour effacer les logs
function clearLogs() {
    logsContainer.innerHTML = '';
    addLog('📋 Logs effacés', 'info');
}

// Écouteurs d'événements
generateBtn.addEventListener('click', generateServer);

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
