require('dotenv').config();
const { Client } = require('revolt.js');
const fs = require('fs');
const path = require('path');

const client = new Client();

// Chargement des données
const dataPath = path.join(__dirname, 'data.json');
let data = {
    welcomeMessages: {
        default: "Bienvenue, camarade {username} ! ✊\nRejoins la lutte pour un monde plus juste et égalitaire.\nUtilise `!help` pour découvrir toutes les commandes disponibles."
    },
    questionnaire: {
        defaultQuestions: {
            "Présentation": [
                "Quel est ton nom et ton âge ?",
                "D'où viens-tu ?",
                "Quels sont tes centres d'intérêt ?"
            ],
            "Anarchisme et luttes sociales": [
                "Qu'est-ce que l'anarchisme pour toi ?",
                "Quelles sont les luttes sociales qui te tiennent à cœur ?",
                "Comment penses-tu que l'on peut créer un monde plus juste et égalitaire ?"
            ]
        },
        serverQuestions: {}
    },
    moderation: {
        warnings: {},
        logs: {},
        mutes: {},
        automod: {},
        antiraid: {}
    }
};

// Charger les données existantes
try {
    if (fs.existsSync(dataPath)) {
        const fileContent = fs.readFileSync(dataPath, 'utf8');
        data = JSON.parse(fileContent);
    }
} catch (error) {
    console.error('Erreur lors du chargement des données:', error);
}

// Fonction pour sauvegarder les données
const saveData = () => {
    try {
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 4));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des données:', error);
    }
};

// Fonction pour créer un message de bienvenue embed
const createWelcomeEmbed = (member, message) => {
    const userAvatar = member.user.avatarURL || 'https://autumn.revolt.chat/default_avatar.png';
    const serverName = member.server.name;
    const memberCount = member.server.member_count;

    return {
        title: "🌟 Nouveau Membre !",
        description: message,
        color: "#ff0000", // Rouge révolutionnaire
        media: userAvatar, // Avatar de l'utilisateur
        fields: [
            {
                name: "📊 Statistiques",
                value: `Tu es notre ${memberCount}ème membre !`,
                inline: true
            },
            {
                name: "🏠 Serveur",
                value: serverName,
                inline: true
            }
        ],
        footer: {
            text: "Ensemble vers un monde meilleur ! ✊"
        }
    };
};

// Fonction pour créer un embed de rôles-réactions
const createRoleMenuEmbed = (title, description, roleConfigs) => {
    const fields = roleConfigs.map(config => ({
        name: `${config.emoji} ${config.role.name}`,
        value: config.description || "Réagissez pour obtenir ce rôle",
        inline: true
    }));

    return {
        title: title || "🎭 Menu des Rôles",
        description: description || "Réagissez avec les émojis correspondants pour obtenir vos rôles !",
        color: "#ff0000",
        fields: fields
    };
};

// Fonction pour sauvegarder une configuration de rôles-réactions
const saveReactionRoleConfig = (messageId, config) => {
    if (!data.reactionRoles) {
        data.reactionRoles = { messages: {}, configs: {} };
    }
    data.reactionRoles.messages[messageId] = config;
    saveData();
};

// Fonction pour obtenir les questions pour un serveur
const getServerQuestions = (serverId) => {
    return data.questionnaire.serverQuestions[serverId] || data.questionnaire.defaultQuestions;
};

// Fonction pour créer un embed de questionnaire
const createQuestionnaireEmbed = (member) => {
    const questions = getServerQuestions(member.server.id);
    const fields = [];

    for (const [category, categoryQuestions] of Object.entries(questions)) {
        fields.push({
            name: `📝 ${category}`,
            value: categoryQuestions.map(q => `• ${q}`).join('\n'),
            inline: false
        });
    }

    return {
        title: "🌟 Questionnaire d'Accueil",
        description: `Bienvenue, Camarade ${member.user.username} !\n\nPour rejoindre notre union dans la lutte contre toutes les formes d'oppression, nous te demandons de partager ta vision de l'anarchisme et des luttes sociales.\n\nRéponds aux questions suivantes :`,
        color: "#ff0000",
        fields: fields,
        footer: {
            text: "Une fois que tu auras répondu à ces questions, les camarades modérateur·ices examineront tes réponses et t'accorderont l'accès à l'ensemble des salons."
        }
    };
};

// Citations révolutionnaires
const citations = [
    "Les travailleurs n'ont rien à perdre que leurs chaînes. Ils ont un monde à gagner. - Karl Marx",
    "Un autre monde est possible. - Slogan altermondialiste",
    "Celui qui lutte peut perdre, celui qui ne lutte pas a déjà perdu. - Bertolt Brecht",
    "La révolution est la seule forme de guerre où la victoire finale ne peut être obtenue qu'en donnant le plus possible au lieu de prendre le plus possible. - Rosa Luxemburg"
];

// Ressources anticapitalistes
const ressources = [
    "Le Capital - Karl Marx",
    "L'État et la Révolution - Lénine",
    "La Révolution trahie - Léon Trotsky",
    "Les Damnés de la Terre - Frantz Fanon",
    "Le Droit à la Paresse - Paul Lafargue"
];

// Événements historiques
const evenements = {
    "Commune de Paris": "18 mars 1871 - Premier gouvernement ouvrier de l'histoire",
    "Révolution d'Octobre": "7 novembre 1917 - Première révolution socialiste victorieuse",
    "Mai 68": "Mai 1968 - Plus grande grève générale de l'histoire de France",
    "Révolution Zapatiste": "1er janvier 1994 - Soulèvement au Chiapas contre le néolibéralisme"
};

// Événement lorsque le bot est prêt
client.on('ready', () => {
    console.log(`Connecté en tant que ${client.user.username}!`);
    console.log('Prêt à diffuser la conscience de classe !');
});

// Fonction pour vérifier les permissions de modération
const hasModPermission = (member) => {
    return member?.hasPermission('BanMembers') || member?.hasPermission('KickMembers');
};

// Fonction pour formater la durée
const formatDuration = (duration) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
};

// Fonction pour obtenir les avertissements d'un utilisateur
const getUserWarnings = (serverId, userId) => {
    if (!data.moderation.warnings[serverId]) {
        data.moderation.warnings[serverId] = {};
    }
    if (!data.moderation.warnings[serverId][userId]) {
        data.moderation.warnings[serverId][userId] = [];
    }
    return data.moderation.warnings[serverId][userId];
};

// Fonction pour logger une action de modération
const logModAction = async (server, moderator, target, action, reason) => {
    const serverId = server.id;
    if (!data.moderation.logs[serverId]) {
        data.moderation.logs[serverId] = [];
    }

    const logEntry = {
        timestamp: new Date().toISOString(),
        moderator: {
            id: moderator.id,
            username: moderator.username
        },
        target: {
            id: target.id,
            username: target.username
        },
        action,
        reason
    };

    data.moderation.logs[serverId].push(logEntry);
    saveData();

    // Si un canal de logs est configuré, y envoyer le message
    const logEmbed = {
        title: `🛡️ Action de Modération : ${action}`,
        color: "#ff0000",
        fields: [
            {
                name: "👤 Modérateur",
                value: moderator.username,
                inline: true
            },
            {
                name: "🎯 Cible",
                value: target.username,
                inline: true
            },
            {
                name: "📝 Raison",
                value: reason || "Aucune raison fournie",
                inline: false
            }
        ],
        footer: {
            text: new Date().toLocaleString()
        }
    };

    // Trouver un canal de logs approprié
    const logsChannel = server.channels.find(c => 
        c.name.toLowerCase().includes('logs') || 
        c.name.toLowerCase().includes('moderation')
    );

    if (logsChannel) {
        await logsChannel.sendMessage({ embeds: [logEmbed] });
    }
};

// Fonction pour vérifier les paramètres d'automodération
const getAutomodConfig = (serverId) => {
    if (!data.moderation.automod) {
        data.moderation.automod = {};
    }
    if (!data.moderation.automod[serverId]) {
        data.moderation.automod[serverId] = {
            enabled: false,
            bannedWords: [],
            spamThreshold: 5,
            capsThreshold: 70,
            inviteFilter: false,
            linkFilter: false
        };
    }
    return data.moderation.automod[serverId];
};

// Fonction pour vérifier si un message contient du spam
const isSpam = (message, config) => {
    // Implémenter la détection de spam basée sur la répétition de caractères
    const repeatedChars = message.match(/(.)\1{4,}/g);
    if (repeatedChars && repeatedChars.length > config.spamThreshold) {
        return true;
    }

    // Détecter les messages identiques répétés rapidement
    const recentMessages = messageHistory.get(message.author.id) || [];
    const similarMessages = recentMessages.filter(m => 
        m.content === message.content && 
        Date.now() - m.timestamp < 5000
    );
    return similarMessages.length >= config.spamThreshold;
};

// Fonction pour vérifier le pourcentage de majuscules
const getCapsPercentage = (text) => {
    const upperCase = text.replace(/[^A-Z]/g, '').length;
    const totalChars = text.replace(/[^A-Za-z]/g, '').length;
    return totalChars > 0 ? (upperCase / totalChars) * 100 : 0;
};

// Historique des messages pour la détection du spam
const messageHistory = new Map();

// Fonction pour nettoyer l'historique des messages
setInterval(() => {
    for (const [userId, messages] of messageHistory.entries()) {
        const recentMessages = messages.filter(m => Date.now() - m.timestamp < 10000);
        if (recentMessages.length === 0) {
            messageHistory.delete(userId);
        } else {
            messageHistory.set(userId, recentMessages);
        }
    }
}, 10000);

// Structure pour suivre les nouveaux membres
const newMemberTracker = new Map();
// Structure pour suivre les actions des utilisateurs
const userActionTracker = new Map();

// Fonction pour obtenir la configuration anti-raid
const getAntiRaidConfig = (serverId) => {
    if (!data.moderation.antiraid) {
        data.moderation.antiraid = {};
    }
    if (!data.moderation.antiraid[serverId]) {
        data.moderation.antiraid[serverId] = {
            enabled: false,
            joinThreshold: 5,
            joinTimeWindow: 10,
            actionThreshold: 8,
            actionTimeWindow: 10,
            punishment: 'ban',
            lockdown: false
        };
    }
    return data.moderation.antiraid[serverId];
};

// Fonction pour nettoyer les trackers
setInterval(() => {
    const now = Date.now();
    
    // Nettoyer newMemberTracker
    for (const [serverId, members] of newMemberTracker.entries()) {
        const config = getAntiRaidConfig(serverId);
        const filtered = members.filter(time => now - time < config.joinTimeWindow * 1000);
        if (filtered.length === 0) {
            newMemberTracker.delete(serverId);
        } else {
            newMemberTracker.set(serverId, filtered);
        }
    }
    
    // Nettoyer userActionTracker
    for (const [key, actions] of userActionTracker.entries()) {
        const [serverId] = key.split(':');
        const config = getAntiRaidConfig(serverId);
        const filtered = actions.filter(time => now - time < config.actionTimeWindow * 1000);
        if (filtered.length === 0) {
            userActionTracker.delete(key);
        } else {
            userActionTracker.set(key, filtered);
        }
    }
}, 30000);

// Fonction pour gérer les actions suspectes
const handleSuspiciousActivity = async (server, user, reason) => {
    const config = getAntiRaidConfig(server.id);
    
    try {
        // Appliquer la punition configurée
        switch (config.punishment.toLowerCase()) {
            case 'ban':
                await server.banUser(user.id, { reason: `Anti-raid: ${reason}` });
                break;
            case 'kick':
                await server.kickUser(user.id, `Anti-raid: ${reason}`);
                break;
            case 'mute':
                const duration = 3600000; // 1 heure
                await muteUser(server, user, duration, `Anti-raid: ${reason}`);
                break;
        }

        // Logger l'action
        await logModAction(
            server,
            client.user,
            user,
            "Anti-raid",
            reason
        );
    } catch (error) {
        console.error("Erreur lors de l'application de la punition anti-raid:", error);
    }
};

// Fonction pour activer/désactiver le mode lockdown
const toggleLockdown = async (server, enabled, reason) => {
    const config = getAntiRaidConfig(server.id);
    config.lockdown = enabled;
    
    try {
        // Modifier les permissions du rôle @everyone
        const everyoneRole = server.roles.find(r => r.name === '@everyone');
        if (everyoneRole) {
            const permissions = everyoneRole.permissions;
            if (enabled) {
                // Désactiver les permissions sensibles
                permissions.sendMessage = false;
                permissions.addReactions = false;
                permissions.connect = false;
            } else {
                // Réactiver les permissions
                permissions.sendMessage = true;
                permissions.addReactions = true;
                permissions.connect = true;
            }
            await server.editRole(everyoneRole.id, { permissions });
        }

        // Notifier dans tous les canaux
        const notification = {
            title: enabled ? "🔒 Mode Lockdown Activé" : "🔓 Mode Lockdown Désactivé",
            description: reason,
            color: enabled ? "#ff0000" : "#00ff00"
        };

        for (const channel of server.channels.values()) {
            if (channel.type === 'TextChannel') {
                await channel.sendMessage({ embeds: [notification] });
            }
        }

        saveData();
    } catch (error) {
        console.error("Erreur lors du changement de mode lockdown:", error);
    }
};

// Fonction pour créer une backup du serveur
const createServerBackup = async (server) => {
    try {
        const backup = {
            timestamp: Date.now(),
            serverInfo: {
                name: server.name,
                description: server.description,
                iconUrl: server.iconUrl
            },
            roles: [],
            channels: [],
            settings: {
                welcomeMessage: data.welcomeMessages[server.id],
                welcomeChannel: data.welcomeChannels[server.id],
                moderation: {
                    automod: data.moderation.automod[server.id],
                    antiraid: data.moderation.antiraid[server.id]
                }
            }
        };

        // Sauvegarder les rôles
        for (const role of server.roles.values()) {
            backup.roles.push({
                name: role.name,
                color: role.color,
                hoist: role.hoist,
                permissions: role.permissions
            });
        }

        // Sauvegarder les canaux
        const saveChannel = (channel) => ({
            name: channel.name,
            type: channel.type,
            description: channel.description,
            position: channel.position,
            permissions: channel.permissionOverwrites
        });

        for (const channel of server.channels.values()) {
            backup.channels.push(saveChannel(channel));
        }

        // Créer le nom du fichier de backup
        const fileName = `backup_${server.id}_${Date.now()}.json`;
        const backupPath = path.join(__dirname, 'backups', fileName);

        // Sauvegarder la backup
        await fs.promises.writeFile(
            backupPath,
            JSON.stringify(backup, null, 2),
            'utf-8'
        );

        return fileName;
    } catch (error) {
        console.error('Erreur lors de la création de la backup:', error);
        throw error;
    }
};

// Fonction pour restaurer une backup
const restoreServerBackup = async (server, backupFileName) => {
    try {
        const backupPath = path.join(__dirname, 'backups', backupFileName);
        const backupData = JSON.parse(
            await fs.promises.readFile(backupPath, 'utf-8')
        );

        // Restaurer les informations du serveur
        await server.edit({
            name: backupData.serverInfo.name,
            description: backupData.serverInfo.description,
            iconUrl: backupData.serverInfo.iconUrl
        });

        // Supprimer les anciens rôles (sauf @everyone)
        for (const role of server.roles.values()) {
            if (role.name !== '@everyone') {
                await server.deleteRole(role.id).catch(() => {});
            }
        }

        // Restaurer les rôles
        for (const roleData of backupData.roles) {
            if (roleData.name !== '@everyone') {
                await server.createRole(roleData);
            }
        }

        // Supprimer les anciens canaux
        for (const channel of server.channels.values()) {
            await channel.delete().catch(() => {});
        }

        // Restaurer les canaux
        for (const channelData of backupData.channels) {
            const newChannel = await server.createChannel(channelData);
            
            // Restaurer les permissions
            if (channelData.permissions) {
                for (const [roleId, perms] of Object.entries(channelData.permissions)) {
                    await newChannel.updatePermission(roleId, perms);
                }
            }
        }

        // Restaurer les paramètres
        if (backupData.settings) {
            if (backupData.settings.welcomeMessage) {
                data.welcomeMessages[server.id] = backupData.settings.welcomeMessage;
            }
            if (backupData.settings.welcomeChannel) {
                data.welcomeChannels[server.id] = backupData.settings.welcomeChannel;
            }
            if (backupData.settings.moderation) {
                if (backupData.settings.moderation.automod) {
                    data.moderation.automod[server.id] = backupData.settings.moderation.automod;
                }
                if (backupData.settings.moderation.antiraid) {
                    data.moderation.antiraid[server.id] = backupData.settings.moderation.antiraid;
                }
            }
            saveData();
        }

        return true;
    } catch (error) {
        console.error('Erreur lors de la restauration de la backup:', error);
        throw error;
    }
};

// Fonction pour lister les backups disponibles
const listServerBackups = async (serverId) => {
    try {
        const backupDir = path.join(__dirname, 'backups');
        const files = await fs.promises.readdir(backupDir);
        
        return files
            .filter(file => file.startsWith(`backup_${serverId}_`))
            .map(file => {
                const stats = fs.statSync(path.join(backupDir, file));
                return {
                    fileName: file,
                    createdAt: stats.birthtime
                };
            })
            .sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
        console.error('Erreur lors de la liste des backups:', error);
        throw error;
    }
};

// Gestion des messages
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    // Vérifier l'automodération si activée
    if (message.channel.server) {
        const automodConfig = getAutomodConfig(message.channel.server.id);
        if (automodConfig.enabled) {
            // Mettre à jour l'historique des messages pour la détection du spam
            const userMessages = messageHistory.get(message.author.id) || [];
            userMessages.push({
                content: message.content,
                timestamp: Date.now()
            });
            messageHistory.set(message.author.id, userMessages);

            // Vérifier les mots bannis
            const containsBannedWord = automodConfig.bannedWords.some(word => 
                message.content.toLowerCase().includes(word)
            );

            // Vérifier le spam
            const isSpamMessage = isSpam(message.content, automodConfig);

            // Vérifier les majuscules
            const capsPercentage = getCapsPercentage(message.content);
            const tooManyCaps = message.content.length > 10 && 
                               capsPercentage > automodConfig.capsThreshold;

            // Vérifier les invitations Discord
            const containsInvite = automodConfig.inviteFilter && 
                                 /discord\.gg\/|discord\.com\/invite/i.test(message.content);

            // Vérifier les liens
            const containsLink = automodConfig.linkFilter && 
                               /https?:\/\/[^\s]+/i.test(message.content);

            if (containsBannedWord || isSpamMessage || tooManyCaps || containsInvite || containsLink) {
                try {
                    await message.delete();
                    
                    let reason = "Message supprimé pour ";
                    if (containsBannedWord) reason += "utilisation de mots bannis";
                    else if (isSpamMessage) reason += "spam";
                    else if (tooManyCaps) reason += "abus de majuscules";
                    else if (containsInvite) reason += "invitation Discord non autorisée";
                    else if (containsLink) reason += "lien non autorisé";

                    // Notifier l'utilisateur
                    const warningEmbed = {
                        title: "⚠️ Message Supprimé",
                        description: reason,
                        color: "#ff0000",
                        footer: {
                            text: "L'abus de ces comportements peut entraîner des sanctions."
                        }
                    };
                    
                    const warningMessage = await message.channel.sendMessage({
                        content: `<@${message.author.id}>`,
                        embeds: [warningEmbed]
                    });

                    // Supprimer l'avertissement après 5 secondes
                    setTimeout(() => {
                        warningMessage.delete().catch(() => {});
                    }, 5000);

                    // Logger l'action
                    await logModAction(
                        message.channel.server,
                        client.user,
                        message.author,
                        "Automodération",
                        reason
                    );
                } catch (error) {
                    console.error("Erreur lors de l'automodération:", error);
                }
            }
        }
    }

    // Vérification anti-raid pour les messages
    if (message.channel.server) {
        const server = message.channel.server;
        const config = getAntiRaidConfig(server.id);
        
        if (config.enabled) {
            const key = `${server.id}:${message.author.id}`;
            const actions = userActionTracker.get(key) || [];
            actions.push(Date.now());
            userActionTracker.set(key, actions);
            
            // Vérifier le seuil d'actions
            const timeWindow = config.actionTimeWindow * 1000;
            const recentActions = actions.filter(time => Date.now() - time < timeWindow);
            
            if (recentActions.length >= config.actionThreshold) {
                await handleSuspiciousActivity(
                    server,
                    message.author,
                    `Spam détecté : ${recentActions.length} messages en ${config.actionTimeWindow} secondes`
                );
                return;
            }
        }
    }

    // Continuer avec le traitement normal des commandes
    const prefix = '!';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    switch (command) {
        case 'citation':
            const citation = citations[Math.floor(Math.random() * citations.length)];
            await message.reply(`📢 **Citation révolutionnaire:**\n${citation}`);
            break;

        case 'ressources':
            const ressourcesList = ressources.map((r, i) => `${i + 1}. ${r}`).join('\n');
            await message.reply(`📚 **Lectures recommandées:**\n${ressourcesList}`);
            break;

        case 'histoire':
            const event = args.join(' ');
            if (event && evenements[event]) {
                await message.reply(`📅 **${event}:**\n${evenements[event]}`);
            } else {
                const eventsList = Object.entries(evenements)
                    .map(([nom, desc]) => `- **${nom}**: ${desc}`)
                    .join('\n');
                await message.reply(`📅 **Événements historiques importants:**\n${eventsList}`);
            }
            break;

        case 'analyse':
            if (args.length === 0) {
                await message.reply("Veuillez fournir un sujet à analyser d'un point de vue marxiste.");
                return;
            }
            const sujet = args.join(' ');
            await message.reply(`🔍 **Analyse marxiste de "${sujet}":**\n` +
                "1. Conditions matérielles:\n" +
                "- Analyse des rapports de production\n" +
                "- Impact sur les classes sociales\n\n" +
                "2. Contradictions:\n" +
                "- Identification des antagonismes de classe\n" +
                "- Conflits systémiques\n\n" +
                "3. Perspectives révolutionnaires:\n" +
                "- Potentiel de transformation sociale\n" +
                "- Pistes d'action collective");
            break;

        case 'action':
            await message.reply(`🚩 **Guide d'action militante:**\n` +
                "1. S'organiser collectivement\n" +
                "2. Participer aux luttes sociales\n" +
                "3. Développer la conscience de classe\n" +
                "4. Soutenir les mouvements sociaux\n" +
                "5. Pratiquer la solidarité internationale");
            break;

        case 'solidarite':
            await message.reply(`✊ **Actions de solidarité:**\n` +
                "- Soutien aux grèves en cours\n" +
                "- Aide mutuelle locale\n" +
                "- Participation aux manifestations\n" +
                "- Boycott des multinationales\n" +
                "- Défense des droits des travailleurs");
            break;

        case 'setwelcome':
            // Vérifier si l'utilisateur a les permissions d'administrateur
            const welcomeMessageMember = message.member;
            if (!welcomeMessageMember?.hasPermission('ManageServer')) {
                await message.reply("❌ Vous n'avez pas la permission de configurer le message de bienvenue.");
                return;
            }

            if (args.length === 0) {
                await message.reply("Usage: !setwelcome <message>\nUtilisez {username} pour inclure le nom de l'utilisateur.");
                return;
            }

            const welcomeMessageServerId = message.channel.server.id;
            const newMessage = args.join(' ');
            
            // Sauvegarder le message de bienvenue pour ce serveur
            if (!data.welcomeMessages) {
                data.welcomeMessages = {
                    default: "Bienvenue, {username} ! ✊"
                };
            }
            data.welcomeMessages[welcomeMessageServerId] = newMessage;
            saveData();

            await message.reply("✅ Message de bienvenue mis à jour avec succès !");
            break;

        case 'viewwelcome':
            const currentServerId = message.channel.server.id;
            const currentMessage = data.welcomeMessages[currentServerId] || data.welcomeMessages.default;
            const previewMessage = currentMessage.replace('{username}', message.author.username);
            
            const previewEmbed = createWelcomeEmbed(
                await message.channel.server.fetchMember(message.author.id),
                previewMessage
            );
            
            await message.reply({
                content: "📝 **Aperçu du message de bienvenue:**",
                embeds: [previewEmbed]
            });
            break;

        case 'resetwelcome':
            // Vérifier les permissions d'administrateur
            const adminMember = await message.channel.server.fetchMember(message.author.id);
            if (!adminMember.hasPermission('ManageServer')) {
                await message.reply("❌ Vous n'avez pas la permission de réinitialiser le message de bienvenue.");
                return;
            }

            const serverIdToReset = message.channel.server.id;
            if (data.welcomeMessages[serverIdToReset]) {
                delete data.welcomeMessages[serverIdToReset];
                saveData();
                await message.reply("✅ Message de bienvenue réinitialisé au message par défaut.");
            } else {
                await message.reply("ℹ️ Ce serveur utilise déjà le message par défaut.");
            }
            break;

        case 'setwelcomechannel':
            // Vérifier si l'utilisateur a les permissions d'administrateur
            const welcomeChannelTargetChannel = message.mentionedChannels[0] || message.channel;
            const welcomeChannelServerId = message.channel.server.id;
            
            // Vérifier les permissions
            if (!message.member?.hasPermission('ManageServer')) {
                await message.reply("❌ Vous n'avez pas la permission de configurer le canal de bienvenue.");
                return;
            }

            // Sauvegarder le canal de bienvenue pour ce serveur
            if (!data.welcomeChannels) {
                data.welcomeChannels = {};
            }
            data.welcomeChannels[welcomeChannelServerId] = welcomeChannelTargetChannel.id;
            saveData();

            await message.reply(`✅ Canal de bienvenue configuré sur ${welcomeChannelTargetChannel.name} !`);
            break;

        case 'viewwelcomechannel':
            // Vérifier les permissions
            if (!message.member?.hasPermission('ManageServer')) {
                await message.reply("❌ Vous n'avez pas la permission de voir le canal de bienvenue.");
                return;
            }

            const viewWelcomeTargetChannel = message.mentionedChannels[0] || message.channel;
            const viewWelcomeServerId = message.channel.server.id;

            if (data.welcomeChannels[viewWelcomeServerId]) {
                const channelId = data.welcomeChannels[viewWelcomeServerId];
                const channel = message.channel.server.channels.get(channelId);
                if (channel) {
                    await message.reply(`📢 Le canal de bienvenue actuel est : ${channel.name}`);
                } else {
                    await message.reply("⚠️ Le canal de bienvenue configuré n'existe plus.");
                }
            } else {
                await message.reply("ℹ️ Aucun canal de bienvenue n'est configuré. Le premier canal disponible sera utilisé.");
            }
            break;

        case 'resetwelcomechannel':
            // Vérifier les permissions d'administrateur
            const resetMember = await message.channel.server.fetchMember(message.author.id);
            if (!resetMember.hasPermission('ManageServer')) {
                await message.reply("❌ Vous n'avez pas la permission de réinitialiser le canal de bienvenue.");
                return;
            }

            const resetServerId = message.channel.server.id;
            if (data.welcomeChannels[resetServerId]) {
                delete data.welcomeChannels[resetServerId];
                saveData();
                await message.reply("✅ Canal de bienvenue réinitialisé. Les messages seront envoyés dans le premier canal textuel disponible.");
            } else {
                await message.reply("ℹ️ Aucun canal de bienvenue n'était configuré.");
            }
            break;

        case 'createroles':
            // Vérifier les permissions
            if (!message.member?.hasPermission('ManageRoles')) {
                await message.reply("❌ Vous n'avez pas la permission de gérer les rôles.");
                return;
            }

            // Vérifier les arguments
            if (args.length < 1) {
                await message.reply(`Usage: !createroles <titre>
Exemple: !createroles Choisissez vos rôles
Ensuite, utilisez !addrole pour ajouter des rôles au menu.`);
                return;
            }

            const menuTitle = args.join(' ');
            const serverId = message.channel.server.id;
            
            // Créer un nouveau menu vide
            const menuEmbed = createRoleMenuEmbed(menuTitle, "Utilisez !addrole pour ajouter des rôles à ce menu.", []);
            
            // Envoyer le message et sauvegarder la configuration
            const menuMessage = await message.channel.sendMessage({ embeds: [menuEmbed] });
            saveReactionRoleConfig(menuMessage.id, {
                serverId: serverId,
                channelId: message.channel.id,
                title: menuTitle,
                roles: []
            });

            await message.reply("✅ Menu de rôles créé ! Utilisez !addrole pour ajouter des rôles.");
            break;

        case 'addrole':
            // Vérifier les permissions
            if (!message.member?.hasPermission('ManageRoles')) {
                await message.reply("❌ Vous n'avez pas la permission de gérer les rôles.");
                return;
            }

            // Vérifier les arguments
            if (args.length < 3) {
                await message.reply(`Usage: !addrole <messageId> <emoji> <@role> [description]
Exemple: !addrole 123456789 🎮 @Gamers Les passionnés de jeux vidéo`);
                return;
            }

            const [targetMessageId, emoji, roleId, ...descriptionParts] = args;
            const description = descriptionParts.join(' ');
            
            // Vérifier si le menu existe
            const menuConfig = data.reactionRoles.messages[targetMessageId];
            if (!menuConfig) {
                await message.reply("❌ Menu de rôles introuvable. Créez d'abord un menu avec !createroles");
                return;
            }

            // Récupérer le rôle
            const role = message.channel.server.roles.find(r => r.id === roleId.replace(/[<@&>]/g, ''));
            if (!role) {
                await message.reply("❌ Rôle introuvable. Assurez-vous de mentionner un rôle valide.");
                return;
            }

            // Ajouter le rôle à la configuration
            menuConfig.roles.push({
                emoji: emoji,
                roleId: role.id,
                description: description
            });
            saveReactionRoleConfig(targetMessageId, menuConfig);

            // Mettre à jour l'embed
            const updatedEmbed = createRoleMenuEmbed(
                menuConfig.title,
                "Réagissez avec les émojis correspondants pour obtenir vos rôles !",
                menuConfig.roles.map(r => ({
                    emoji: r.emoji,
                    role: message.channel.server.roles.get(r.roleId),
                    description: r.description
                }))
            );

            // Mettre à jour le message
            const targetChannel = message.channel.server.channels.get(menuConfig.channelId);
            if (targetChannel) {
                try {
                    const targetMessage = await targetChannel.fetchMessage(targetMessageId);
                    await targetMessage.edit({ embeds: [updatedEmbed] });
                    await targetMessage.react(emoji);
                    await message.reply(`✅ Rôle ${role.name} ajouté au menu avec l'emoji ${emoji}`);
                } catch (error) {
                    await message.reply("❌ Erreur lors de la mise à jour du message. Vérifiez que le message existe toujours.");
                }
            }
            break;

        case 'removerole':
            // Vérifier les permissions
            if (!message.member?.hasPermission('ManageRoles')) {
                await message.reply("❌ Vous n'avez pas la permission de gérer les rôles.");
                return;
            }

            if (args.length < 2) {
                await message.reply(`Usage: !removerole <messageId> <emoji>
Exemple: !removerole 123456789 🎮`);
                return;
            }

            const [removeMessageId, removeEmoji] = args;
            const removeConfig = data.reactionRoles.messages[removeMessageId];
            
            if (!removeConfig) {
                await message.reply("❌ Menu de rôles introuvable.");
                return;
            }

            // Retirer le rôle de la configuration
            const roleIndex = removeConfig.roles.findIndex(r => r.emoji === removeEmoji);
            if (roleIndex === -1) {
                await message.reply("❌ Emoji introuvable dans ce menu.");
                return;
            }

            removeConfig.roles.splice(roleIndex, 1);
            saveReactionRoleConfig(removeMessageId, removeConfig);

            // Mettre à jour l'embed
            const removedEmbed = createRoleMenuEmbed(
                removeConfig.title,
                "Réagissez avec les émojis correspondants pour obtenir vos rôles !",
                removeConfig.roles.map(r => ({
                    emoji: r.emoji,
                    role: message.channel.server.roles.get(r.roleId),
                    description: r.description
                }))
            );

            // Mettre à jour le message
            const removeChannel = message.channel.server.channels.get(removeConfig.channelId);
            if (removeChannel) {
                try {
                    const removeMessage = await removeChannel.fetchMessage(removeMessageId);
                    await removeMessage.edit({ embeds: [removedEmbed] });
                    await message.reply("✅ Rôle retiré du menu avec succès !");
                } catch (error) {
                    await message.reply("❌ Erreur lors de la mise à jour du message.");
                }
            }
            break;

        case 'setquestionnaire':
            // Vérifier les permissions
            if (!message.member?.hasPermission('ManageServer')) {
                await message.reply("❌ Vous n'avez pas la permission de configurer le questionnaire.");
                return;
            }

            // Sauvegarder le canal pour le questionnaire
            if (!data.questionnaire) {
                data.questionnaire = { channels: {} };
            }
            const questionnaireServerId = message.channel.server.id;
            data.questionnaire.channels[questionnaireServerId] = message.channel.id;
            saveData();

            await message.reply("✅ Canal de questionnaire configuré ! Les nouveaux membres recevront le questionnaire dans ce canal.");
            
            // Montrer un aperçu du questionnaire
            const questionnairePreviewEmbed = createQuestionnaireEmbed(message.member);
            await message.channel.sendMessage({
                content: "📋 Aperçu du questionnaire :",
                embeds: [questionnairePreviewEmbed]
            });
            break;

        case 'removequestionnaire':
            // Vérifier les permissions
            if (!message.member?.hasPermission('ManageServer')) {
                await message.reply("❌ Vous n'avez pas la permission de configurer le questionnaire.");
                return;
            }

            // Supprimer la configuration du questionnaire
            if (data.questionnaire?.channels[message.channel.server.id]) {
                delete data.questionnaire.channels[message.channel.server.id];
                saveData();
                await message.reply("✅ Configuration du questionnaire supprimée.");
            } else {
                await message.reply("ℹ️ Aucun canal de questionnaire n'était configuré.");
            }
            break;

        case 'addquestion':
            // Vérifier les permissions
            if (!message.member?.hasPermission('ManageServer')) {
                await message.reply("❌ Vous n'avez pas la permission de modifier les questions.");
                return;
            }

            // Vérifier les arguments
            if (args.length < 2) {
                await message.reply(`Usage: !addquestion <catégorie> <question>
Exemple: !addquestion "Identité Politique" "Quelle est ta vision de l'anarchisme ?"
                
Catégories disponibles :
- Identité Politique
- Analyse du Système
- Action Directe
- Luttes Intersectionnelles`);
                return;
            }

            const category = args[0];
            const question = args.slice(1).join(' ');
            const addQuestionServerId = message.channel.server.id;

            // Initialiser les questions du serveur si nécessaire
            if (!data.questionnaire.serverQuestions[addQuestionServerId]) {
                data.questionnaire.serverQuestions[addQuestionServerId] = JSON.parse(JSON.stringify(data.questionnaire.defaultQuestions));
            }

            // Ajouter la question
            if (!data.questionnaire.serverQuestions[addQuestionServerId][category]) {
                data.questionnaire.serverQuestions[addQuestionServerId][category] = [];
            }
            data.questionnaire.serverQuestions[addQuestionServerId][category].push(question);
            saveData();

            await message.reply(`✅ Question ajoutée à la catégorie "${category}" !`);
            break;

        case 'removequestion':
            // Vérifier les permissions
            if (!message.member?.hasPermission('ManageServer')) {
                await message.reply("❌ Vous n'avez pas la permission de modifier les questions.");
                return;
            }

            // Vérifier les arguments
            if (args.length < 2) {
                await message.reply(`Usage: !removequestion <catégorie> <numéro>
Exemple: !removequestion "Identité Politique" 2
                
Utilisez !viewquestions pour voir les numéros des questions.`);
                return;
            }

            const removeCategory = args[0];
            const questionIndex = parseInt(args[1]) - 1;
            const removeQuestionServerId = message.channel.server.id;

            // Vérifier si la catégorie existe
            if (!data.questionnaire.serverQuestions[removeQuestionServerId]?.[removeCategory]) {
                await message.reply(`❌ La catégorie "${removeCategory}" n'existe pas.`);
                return;
            }

            // Vérifier si l'index est valide
            if (isNaN(questionIndex) || questionIndex < 0 || 
                questionIndex >= data.questionnaire.serverQuestions[removeQuestionServerId][removeCategory].length) {
                await message.reply("❌ Numéro de question invalide.");
                return;
            }

            // Supprimer la question
            data.questionnaire.serverQuestions[removeQuestionServerId][removeCategory].splice(questionIndex, 1);
            
            // Si la catégorie est vide, la supprimer
            if (data.questionnaire.serverQuestions[removeQuestionServerId][removeCategory].length === 0) {
                delete data.questionnaire.serverQuestions[removeQuestionServerId][removeCategory];
            }
            
            saveData();
            await message.reply("✅ Question supprimée !");
            break;

        case 'viewquestions':
            const viewQuestionsServerId = message.channel.server.id;
            const serverQuestions = getServerQuestions(viewQuestionsServerId);
            let questionList = "📋 **Questions du questionnaire :**\n\n";

            for (const [cat, questions] of Object.entries(serverQuestions)) {
                questionList += `**${cat}**\n`;
                questions.forEach((q, i) => {
                    questionList += `${i + 1}. ${q}\n`;
                });
                questionList += "\n";
            }

            await message.reply(questionList);
            break;

        case 'resetquestions':
            // Vérifier les permissions
            if (!message.member?.hasPermission('ManageServer')) {
                await message.reply("❌ Vous n'avez pas la permission de modifier les questions.");
                return;
            }

            const questionsResetServerId = message.channel.server.id;
            
            // Supprimer les questions personnalisées
            if (data.questionnaire.serverQuestions[questionsResetServerId]) {
                delete data.questionnaire.serverQuestions[questionsResetServerId];
                saveData();
                await message.reply("✅ Questions réinitialisées aux questions par défaut !");
            } else {
                await message.reply("ℹ️ Ce serveur utilise déjà les questions par défaut.");
            }
            break;

        case 'automod':
            // Vérifier les permissions
            if (!message.member?.hasPermission('ManageServer')) {
                await message.reply("❌ Vous n'avez pas la permission de configurer l'automodération.");
                return;
            }

            const automodServerId = message.channel.server.id;
            const config = getAutomodConfig(automodServerId);

            if (args.length === 0) {
                const statusEmbed = {
                    title: "⚙️ Configuration de l'Automodération",
                    color: "#ff0000",
                    fields: [
                        {
                            name: "État",
                            value: config.enabled ? "✅ Activé" : "❌ Désactivé",
                            inline: true
                        },
                        {
                            name: "Seuil de spam",
                            value: `${config.spamThreshold} messages`,
                            inline: true
                        },
                        {
                            name: "Seuil de majuscules",
                            value: `${config.capsThreshold}%`,
                            inline: true
                        },
                        {
                            name: "Filtre d'invitations",
                            value: config.inviteFilter ? "✅ Activé" : "❌ Désactivé",
                            inline: true
                        },
                        {
                            name: "Filtre de liens",
                            value: config.linkFilter ? "✅ Activé" : "❌ Désactivé",
                            inline: true
                        },
                        {
                            name: "Mots bannis",
                            value: config.bannedWords.length > 0 ? config.bannedWords.join(", ") : "Aucun",
                            inline: false
                        }
                    ]
                };
                await message.reply({ embeds: [statusEmbed] });
                return;
            }

            const [setting, ...value] = args;
            
            switch (setting.toLowerCase()) {
                case 'enable':
                    config.enabled = true;
                    await message.reply("✅ Automodération activée !");
                    break;
                    
                case 'disable':
                    config.enabled = false;
                    await message.reply("✅ Automodération désactivée !");
                    break;

                case 'spam':
                    const threshold = parseInt(value[0]);
                    if (isNaN(threshold) || threshold < 1) {
                        await message.reply("❌ Le seuil doit être un nombre positif.");
                        return;
                    }
                    config.spamThreshold = threshold;
                    await message.reply(`✅ Seuil de spam défini à ${threshold} messages.`);
                    break;

                case 'caps':
                    const capsThreshold = parseInt(value[0]);
                    if (isNaN(capsThreshold) || capsThreshold < 1 || capsThreshold > 100) {
                        await message.reply("❌ Le seuil doit être un pourcentage entre 1 et 100.");
                        return;
                    }
                    config.capsThreshold = capsThreshold;
                    await message.reply(`✅ Seuil de majuscules défini à ${capsThreshold}%.`);
                    break;

                case 'invites':
                    config.inviteFilter = value[0]?.toLowerCase() === 'on';
                    await message.reply(`✅ Filtre d'invitations ${config.inviteFilter ? 'activé' : 'désactivé'}.`);
                    break;

                case 'links':
                    config.linkFilter = value[0]?.toLowerCase() === 'on';
                    await message.reply(`✅ Filtre de liens ${config.linkFilter ? 'activé' : 'désactivé'}.`);
                    break;

                case 'addword':
                    const word = value.join(' ').toLowerCase();
                    if (!word) {
                        await message.reply("❌ Vous devez spécifier un mot à bannir.");
                        return;
                    }
                    if (!config.bannedWords.includes(word)) {
                        config.bannedWords.push(word);
                        await message.reply(`✅ Le mot "${word}" a été ajouté à la liste des mots bannis.`);
                    } else {
                        await message.reply("❌ Ce mot est déjà dans la liste.");
                    }
                    break;

                case 'removeword':
                    const wordToRemove = value.join(' ').toLowerCase();
                    const index = config.bannedWords.indexOf(wordToRemove);
                    if (index > -1) {
                        config.bannedWords.splice(index, 1);
                        await message.reply(`✅ Le mot "${wordToRemove}" a été retiré de la liste des mots bannis.`);
                    } else {
                        await message.reply("❌ Ce mot n'est pas dans la liste.");
                    }
                    break;

                default:
                    await message.reply(`Usage: !automod [paramètre] [valeur]
Paramètres disponibles :
- enable/disable : Active/désactive l'automodération
- spam <nombre> : Définit le seuil de détection du spam
- caps <pourcentage> : Définit le seuil de majuscules autorisé
- invites <on/off> : Active/désactive le filtre d'invitations
- links <on/off> : Active/désactive le filtre de liens
- addword <mot> : Ajoute un mot à la liste des mots bannis
- removeword <mot> : Retire un mot de la liste des mots bannis`);
            }

            saveData();
            break;

        case 'antiraid':
            // Vérifier les permissions
            if (!message.member?.hasPermission('ManageServer')) {
                await message.reply("❌ Vous n'avez pas la permission de configurer l'anti-raid.");
                return;
            }

            const antiRaidServerId = message.channel.server.id;
            const antiRaidConfig = getAntiRaidConfig(antiRaidServerId);

            if (args.length === 0) {
                const statusEmbed = {
                    title: "⚔️ Configuration Anti-Raid",
                    color: "#ff0000",
                    fields: [
                        {
                            name: "État",
                            value: antiRaidConfig.enabled ? "✅ Activé" : "❌ Désactivé",
                            inline: true
                        },
                        {
                            name: "Mode Lockdown",
                            value: antiRaidConfig.lockdown ? "🔒 Actif" : "🔓 Inactif",
                            inline: true
                        },
                        {
                            name: "Seuil de joins",
                            value: `${antiRaidConfig.joinThreshold} joins en ${antiRaidConfig.joinTimeWindow}s`,
                            inline: true
                        },
                        {
                            name: "Seuil d'actions",
                            value: `${antiRaidConfig.actionThreshold} actions en ${antiRaidConfig.actionTimeWindow}s`,
                            inline: true
                        },
                        {
                            name: "Punition",
                            value: antiRaidConfig.punishment,
                            inline: true
                        }
                    ]
                };
                await message.reply({ embeds: [statusEmbed] });
                return;
            }

            const [antiRaidSetting, ...antiRaidValue] = args;
            
            switch (antiRaidSetting.toLowerCase()) {
                case 'enable':
                    antiRaidConfig.enabled = true;
                    await message.reply("✅ Protection anti-raid activée !");
                    break;
                    
                case 'disable':
                    antiRaidConfig.enabled = false;
                    await message.reply("✅ Protection anti-raid désactivée !");
                    break;

                case 'lockdown':
                    const lockdownState = antiRaidValue[0]?.toLowerCase();
                    if (lockdownState !== 'on' && lockdownState !== 'off') {
                        await message.reply("❌ Utilisez 'on' ou 'off' pour le mode lockdown.");
                        return;
                    }
                    await toggleLockdown(
                        message.channel.server,
                        lockdownState === 'on',
                        `Mode lockdown ${lockdownState === 'on' ? 'activé' : 'désactivé'} par ${message.author.username}`
                    );
                    break;

                case 'joins':
                    const [joinThreshold, joinWindow] = antiRaidValue.map(Number);
                    if (isNaN(joinThreshold) || isNaN(joinWindow) || joinThreshold < 1 || joinWindow < 1) {
                        await message.reply("❌ Le seuil et la fenêtre de temps doivent être des nombres positifs.");
                        return;
                    }
                    antiRaidConfig.joinThreshold = joinThreshold;
                    antiRaidConfig.joinTimeWindow = joinWindow;
                    await message.reply(`✅ Seuil de joins défini à ${joinThreshold} joins en ${joinWindow} secondes.`);
                    break;

                case 'actions':
                    const [actionThreshold, actionWindow] = antiRaidValue.map(Number);
                    if (isNaN(actionThreshold) || isNaN(actionWindow) || actionThreshold < 1 || actionWindow < 1) {
                        await message.reply("❌ Le seuil et la fenêtre de temps doivent être des nombres positifs.");
                        return;
                    }
                    antiRaidConfig.actionThreshold = actionThreshold;
                    antiRaidConfig.actionTimeWindow = actionWindow;
                    await message.reply(`✅ Seuil d'actions défini à ${actionThreshold} actions en ${actionWindow} secondes.`);
                    break;

                case 'punishment':
                    const punishment = antiRaidValue[0]?.toLowerCase();
                    if (!['ban', 'kick', 'mute'].includes(punishment)) {
                        await message.reply("❌ La punition doit être 'ban', 'kick' ou 'mute'.");
                        return;
                    }
                    antiRaidConfig.punishment = punishment;
                    await message.reply(`✅ Punition définie sur : ${punishment}`);
                    break;

                default:
                    await message.reply(`Usage: !antiraid [paramètre] [valeur]
Paramètres disponibles :
- enable/disable : Active/désactive la protection anti-raid
- lockdown <on/off> : Active/désactive le mode lockdown
- joins <seuil> <secondes> : Configure le seuil de nouveaux membres
- actions <seuil> <secondes> : Configure le seuil d'actions par utilisateur
- punishment <ban/kick/mute> : Définit la punition pour les raiders`);
            }

            saveData();
            break;

        case 'backup':
            // Vérifier les permissions
            if (!message.member?.hasPermission('ManageServer')) {
                await message.reply("❌ Vous n'avez pas la permission de gérer les backups.");
                return;
            }

            if (args.length === 0) {
                await message.reply(`Usage: !backup [action] [nom_backup]
Actions disponibles :
- create : Crée une nouvelle backup
- list : Liste les backups disponibles
- restore <nom_backup> : Restaure une backup
- delete <nom_backup> : Supprime une backup`);
                return;
            }

            const backupAction = args[0].toLowerCase();
            const backupServer = message.channel.server;

            switch (backupAction) {
                case 'create':
                    try {
                        const fileName = await createServerBackup(backupServer);
                        await message.reply(`✅ Backup créée avec succès : \`${fileName}\``);
                    } catch (error) {
                        await message.reply("❌ Une erreur est survenue lors de la création de la backup.");
                    }
                    break;

                case 'list':
                    try {
                        const backups = await listServerBackups(backupServer.id);
                        if (backups.length === 0) {
                            await message.reply("❌ Aucune backup trouvée pour ce serveur.");
                            return;
                        }

                        const backupList = backups.map(backup => 
                            `- \`${backup.fileName}\` (${new Date(backup.createdAt).toLocaleString()})`
                        ).join('\n');

                        await message.reply(`📋 Backups disponibles :\n${backupList}`);
                    } catch (error) {
                        await message.reply("❌ Une erreur est survenue lors de la liste des backups.");
                    }
                    break;

                case 'restore':
                    if (args.length < 2) {
                        await message.reply("❌ Veuillez spécifier le nom de la backup à restaurer.");
                        return;
                    }

                    const backupToRestore = args[1];
                    try {
                        await message.reply("⚠️ Début de la restauration... Cela peut prendre quelques minutes.");
                        await restoreServerBackup(backupServer, backupToRestore);
                        await message.reply("✅ Backup restaurée avec succès !");
                    } catch (error) {
                        await message.reply("❌ Une erreur est survenue lors de la restauration de la backup.");
                    }
                    break;

                case 'delete':
                    if (args.length < 2) {
                        await message.reply("❌ Veuillez spécifier le nom de la backup à supprimer.");
                        return;
                    }

                    const backupToDelete = args[1];
                    try {
                        const backupPath = path.join(__dirname, 'backups', backupToDelete);
                        await fs.promises.unlink(backupPath);
                        await message.reply("✅ Backup supprimée avec succès !");
                    } catch (error) {
                        await message.reply("❌ Une erreur est survenue lors de la suppression de la backup.");
                    }
                    break;

                default:
                    await message.reply("❌ Action invalide. Utilisez create, list, restore ou delete.");
            }
            break;

        case 'help':
            const helpMessage = `
**Commandes disponibles:**
\`!citation\` - Affiche une citation révolutionnaire
\`!ressources\` - Liste de lectures recommandées
\`!histoire\` - Événements historiques importants
\`!analyse [sujet]\` - Analyse marxiste d'un sujet
\`!action\` - Guide d'action militante
\`!solidarite\` - Actions de solidarité
\`!setwelcome [message]\` - Définit un message de bienvenue personnalisé
\`!viewwelcome\` - Affiche le message de bienvenue actuel
\`!resetwelcome\` - Réinitialise le message de bienvenue
\`!setwelcomechannel [#canal]\` - Définit le canal pour les messages de bienvenue
\`!viewwelcomechannel\` - Affiche le canal de bienvenue actuel
\`!resetwelcomechannel\` - Réinitialise le canal de bienvenue
\`!createroles <titre>\` - Crée un nouveau menu de rôles-réactions
\`!addrole <messageId> <emoji> <@role> [description]\` - Ajoute un rôle au menu
\`!removerole <messageId> <emoji>\` - Retire un rôle du menu
\`!setquestionnaire\` - Configure le canal pour le questionnaire d'accueil
\`!removequestionnaire\` - Désactive le questionnaire d'accueil
\`!addquestion <catégorie> <question>\` - Ajoute une question au questionnaire
\`!removequestion <catégorie> <numéro>\` - Supprime une question du questionnaire
\`!viewquestions\` - Affiche toutes les questions actuelles
\`!resetquestions\` - Réinitialise les questions par défaut
\`!info\` - Informations sur le serveur
\`!user\` - Informations sur l'utilisateur
\`!warn <@user> [raison]\` - Avertit un utilisateur
\`!warnings <@user>\` - Affiche les avertissements d'un utilisateur
\`!clearwarnings <@user>\` - Supprime les avertissements d'un utilisateur
\`!kick <@user> [raison]\` - Expulse un utilisateur
\`!ban <@user> [raison]\` - Bannit un utilisateur
\`!unban <userId>\` - Débannit un utilisateur
\`!mute <@user> [durée] [raison]\` - Réduit un utilisateur au silence
\`!unmute <@user>\` - Rend la parole à un utilisateur
\`!modlogs [user]\` - Affiche les actions de modération
            `;
            await message.reply(helpMessage);
            break;

        case 'info':
            const infoServerId = message.channel.server.id;
            const server = message.channel.server;
            const memberCount = server.members.size;
            const channelCount = server.channels.size;
            const roleCount = server.roles.size;

            const infoEmbed = {
                title: `ℹ️ Informations sur ${server.name}`,
                description: "Statistiques du serveur",
                color: "#ff0000",
                fields: [
                    {
                        name: "👥 Membres",
                        value: memberCount.toString(),
                        inline: true
                    },
                    {
                        name: "📝 Canaux",
                        value: channelCount.toString(),
                        inline: true
                    },
                    {
                        name: "🎭 Rôles",
                        value: roleCount.toString(),
                        inline: true
                    }
                ]
            };

            await message.reply({ embeds: [infoEmbed] });
            break;

        case 'user':
            const userTargetChannel = message.channel;
            const user = message.author;
            const userMember = message.member;

            if (!userMember) {
                await message.reply("❌ Impossible de trouver vos informations de membre.");
                return;
            }

            const roles = userMember.roles.map(roleId => {
                const role = message.channel.server.roles.get(roleId);
                return role ? role.name : 'Role inconnu';
            }).join(', ') || 'Aucun rôle';

            const userEmbed = {
                title: `👤 Profil de ${user.username}`,
                color: "#ff0000",
                fields: [
                    {
                        name: "🆔 Identifiant",
                        value: user.id,
                        inline: true
                    },
                    {
                        name: "🎭 Rôles",
                        value: roles,
                        inline: false
                    }
                ]
            };

            await userTargetChannel.sendMessage({ embeds: [userEmbed] });
            break;

        case 'warn':
            // Vérifier les permissions
            if (!hasModPermission(message.member)) {
                await message.reply("❌ Vous n'avez pas la permission d'utiliser cette commande.");
                return;
            }

            // Vérifier les arguments
            const warnTarget = message.mentionedUsers[0];
            if (!warnTarget) {
                await message.reply("❌ Vous devez mentionner un utilisateur à avertir.");
                return;
            }

            const warnReason = args.slice(1).join(' ') || "Aucune raison fournie";
            const warnServerId = message.channel.server.id;

            // Ajouter l'avertissement
            const warnings = getUserWarnings(warnServerId, warnTarget.id);
            warnings.push({
                timestamp: new Date().toISOString(),
                reason: warnReason,
                moderator: message.author.id
            });
            saveData();

            // Logger l'action
            await logModAction(
                message.channel.server,
                message.author,
                warnTarget,
                "Avertissement",
                warnReason
            );

            await message.reply(`✅ ${warnTarget.username} a été averti. Raison : ${warnReason}`);
            break;

        case 'warnings':
            const warningsTarget = message.mentionedUsers[0] || message.author;
            const warningsServerId = message.channel.server.id;
            const userWarnings = getUserWarnings(warningsServerId, warningsTarget.id);

            if (userWarnings.length === 0) {
                await message.reply(`${warningsTarget.username} n'a aucun avertissement.`);
                return;
            }

            const warningsEmbed = {
                title: `⚠️ Avertissements de ${warningsTarget.username}`,
                color: "#ff0000",
                fields: userWarnings.map((warning, index) => ({
                    name: `Avertissement #${index + 1}`,
                    value: `**Raison:** ${warning.reason}\n**Date:** ${new Date(warning.timestamp).toLocaleString()}`
                }))
            };

            await message.reply({ embeds: [warningsEmbed] });
            break;

        case 'clearwarnings':
            // Vérifier les permissions
            if (!hasModPermission(message.member)) {
                await message.reply("❌ Vous n'avez pas la permission d'utiliser cette commande.");
                return;
            }

            const clearTarget = message.mentionedUsers[0];
            if (!clearTarget) {
                await message.reply("❌ Vous devez mentionner un utilisateur.");
                return;
            }

            const clearServerId = message.channel.server.id;
            if (data.moderation.warnings[clearServerId]) {
                delete data.moderation.warnings[clearServerId][clearTarget.id];
                saveData();
            }

            await message.reply(`✅ Les avertissements de ${clearTarget.username} ont été supprimés.`);
            break;

        case 'kick':
            // Vérifier les permissions
            if (!message.member?.hasPermission('KickMembers')) {
                await message.reply("❌ Vous n'avez pas la permission d'expulser des membres.");
                return;
            }

            const kickTarget = message.mentionedUsers[0];
            if (!kickTarget) {
                await message.reply("❌ Vous devez mentionner un utilisateur à expulser.");
                return;
            }

            const kickReason = args.slice(1).join(' ') || "Aucune raison fournie";

            try {
                const targetMember = await message.channel.server.fetchMember(kickTarget.id);
                await targetMember.kick(kickReason);

                // Logger l'action
                await logModAction(
                    message.channel.server,
                    message.author,
                    kickTarget,
                    "Expulsion",
                    kickReason
                );

                await message.reply(`✅ ${kickTarget.username} a été expulsé. Raison : ${kickReason}`);
            } catch (error) {
                await message.reply("❌ Impossible d'expulser cet utilisateur. Vérifiez mes permissions et la hiérarchie des rôles.");
            }
            break;

        case 'ban':
            // Vérifier les permissions
            if (!message.member?.hasPermission('BanMembers')) {
                await message.reply("❌ Vous n'avez pas la permission de bannir des membres.");
                return;
            }

            const banTarget = message.mentionedUsers[0];
            if (!banTarget) {
                await message.reply("❌ Vous devez mentionner un utilisateur à bannir.");
                return;
            }

            const banReason = args.slice(1).join(' ') || "Aucune raison fournie";

            try {
                await message.channel.server.banMember(banTarget.id, banReason);

                // Logger l'action
                await logModAction(
                    message.channel.server,
                    message.author,
                    banTarget,
                    "Bannissement",
                    banReason
                );

                await message.reply(`✅ ${banTarget.username} a été banni. Raison : ${banReason}`);
            } catch (error) {
                await message.reply("❌ Impossible de bannir cet utilisateur. Vérifiez mes permissions et la hiérarchie des rôles.");
            }
            break;

        case 'unban':
            // Vérifier les permissions
            if (!message.member?.hasPermission('BanMembers')) {
                await message.reply("❌ Vous n'avez pas la permission de débannir des membres.");
                return;
            }

            const unbanUserId = args[0];
            if (!unbanUserId) {
                await message.reply("❌ Vous devez fournir l'ID de l'utilisateur à débannir.");
                return;
            }

            try {
                await message.channel.server.unbanMember(unbanUserId);
                await message.reply("✅ L'utilisateur a été débanni.");
            } catch (error) {
                await message.reply("❌ Impossible de débannir cet utilisateur. Vérifiez l'ID et mes permissions.");
            }
            break;

        case 'mute':
            // Vérifier les permissions
            if (!hasModPermission(message.member)) {
                await message.reply("❌ Vous n'avez pas la permission d'utiliser cette commande.");
                return;
            }

            if (args.length < 1) {
                await message.reply("❌ Veuillez mentionner un utilisateur à muter.");
                return;
            }

            const targetMuteUser = await getUserFromMention(args[0]);
            if (!targetMuteUser) {
                await message.reply("❌ Utilisateur introuvable.");
                return;
            }

            const targetMuteMember = await message.channel.server.fetchMember(targetMuteUser.id);
            if (!targetMuteMember) {
                await message.reply("❌ Le membre n'est pas sur le serveur.");
                return;
            }

            // Vérifier si l'utilisateur est déjà mute
            if (data.moderation.mutes[message.channel.server.id]?.[targetMuteUser.id]) {
                await message.reply("❌ Cet utilisateur est déjà mute.");
                return;
            }

            // Durée par défaut : 1 heure
            let muteDuration = 3600000;
            if (args[1]) {
                const duration = parseDuration(args[1]);
                if (duration === null) {
                    await message.reply("❌ Format de durée invalide. Utilisez : 1h, 30m, etc.");
                    return;
                }
                muteDuration = duration;
            }

            const muteReason = args.slice(2).join(' ') || 'Aucune raison spécifiée';
            
            // Créer ou obtenir le rôle mute
            const muteRoleConfig = await getMuteRole(message.channel.server);
            
            if (!muteRoleConfig) {
                await message.reply("❌ Impossible de créer ou trouver le rôle mute.");
                return;
            }

            try {
                await targetMuteMember.addRole(muteRoleConfig.id);
                await muteUser(message.channel.server, targetMuteUser, muteDuration, muteReason);
                await message.reply(`✅ ${targetMuteUser.username} a été mute pendant ${formatDuration(muteDuration)}.\nRaison : ${muteReason}`);
                
                // Logger l'action
                await logModAction(
                    message.channel.server,
                    message.author,
                    targetMuteUser,
                    "Mute",
                    `${formatDuration(muteDuration)} - ${muteReason}`
                );
            } catch (error) {
                console.error('Erreur lors du mute:', error);
                await message.reply("❌ Une erreur est survenue lors du mute.");
            }
            break;

        case 'unmute':
            // Vérifier les permissions
            if (!hasModPermission(message.member)) {
                await message.reply("❌ Vous n'avez pas la permission d'utiliser cette commande.");
                return;
            }

            if (args.length < 1) {
                await message.reply("❌ Veuillez mentionner un utilisateur à démuter.");
                return;
            }

            const targetUnmuteUser = await getUserFromMention(args[0]);
            if (!targetUnmuteUser) {
                await message.reply("❌ Utilisateur introuvable.");
                return;
            }

            const targetUnmuteMember = await message.channel.server.fetchMember(targetUnmuteUser.id);
            if (!targetUnmuteMember) {
                await message.reply("❌ Le membre n'est pas sur le serveur.");
                return;
            }

            // Vérifier si l'utilisateur est mute
            if (!data.moderation.mutes[message.channel.server.id]?.[targetUnmuteUser.id]) {
                await message.reply("❌ Cet utilisateur n'est pas mute.");
                return;
            }

            const unmuteReason = args.slice(1).join(' ') || 'Aucune raison spécifiée';
            
            // Obtenir le rôle mute
            const unmuteRoleConfig = await getMuteRole(message.channel.server);
            
            if (!unmuteRoleConfig) {
                await message.reply("❌ Impossible de trouver le rôle mute.");
                return;
            }

            try {
                await targetUnmuteMember.removeRole(unmuteRoleConfig.id);
                await unmuteUser(message.channel.server, targetUnmuteUser);
                await message.reply(`✅ ${targetUnmuteUser.username} a été démute.\nRaison : ${unmuteReason}`);
                
                // Logger l'action
                await logModAction(
                    message.channel.server,
                    message.author,
                    targetUnmuteUser,
                    "Unmute",
                    unmuteReason
                );
            } catch (error) {
                console.error('Erreur lors du unmute:', error);
                await message.reply("❌ Une erreur est survenue lors du unmute.");
            }
            break;

        case 'modlogs':
            // Vérifier les permissions
            if (!hasModPermission(message.member)) {
                await message.reply("❌ Vous n'avez pas la permission d'utiliser cette commande.");
                return;
            }

            const logsServerId = message.channel.server.id;
            const targetUser = message.mentionedUsers[0];

            let logs = data.moderation.logs[logsServerId] || [];
            if (targetUser) {
                logs = logs.filter(log => log.target.id === targetUser.id);
            }

            if (logs.length === 0) {
                await message.reply(targetUser ? 
                    `Aucune action de modération n'a été prise contre ${targetUser.username}.` :
                    "Aucune action de modération n'a été enregistrée."
                );
                return;
            }

            // Limiter à 10 dernières actions pour éviter un message trop long
            logs = logs.slice(-10);

            const logsEmbed = {
                title: targetUser ? 
                    `📋 Actions de modération contre ${targetUser.username}` :
                    "📋 Dernières actions de modération",
                color: "#ff0000",
                fields: logs.map(log => ({
                    name: `${log.action} - ${new Date(log.timestamp).toLocaleString()}`,
                    value: `**Modérateur:** ${log.moderator.username}\n**Cible:** ${log.target.username}\n**Raison:** ${log.reason}`
                }))
            };

            await message.reply({ embeds: [logsEmbed] });
            break;

        default:
            await message.reply(`❌ Commande inconnue. Utilisez !help pour voir la liste des commandes disponibles.`);
            break;
    }
});

// Gestion des nouveaux membres
client.on('memberJoin', async (member) => {
    const memberServer = member.server;
    const config = getAntiRaidConfig(memberServer.id);
    
    if (config.enabled) {
        // Suivre les nouveaux membres
        const joins = newMemberTracker.get(memberServer.id) || [];
        joins.push(Date.now());
        newMemberTracker.set(memberServer.id, joins);
        
        // Vérifier le seuil de joins
        if (joins.length >= config.joinThreshold) {
            const timeWindow = config.joinTimeWindow * 1000;
            const recentJoins = joins.filter(time => Date.now() - time < timeWindow);
            
            if (recentJoins.length >= config.joinThreshold) {
                // Activer le mode lockdown
                if (!config.lockdown) {
                    await toggleLockdown(
                        memberServer,
                        true,
                        `Raid détecté : ${recentJoins.length} membres ont rejoint en ${config.joinTimeWindow} secondes.`
                    );
                }
                
                // Punir le nouveau membre
                await handleSuspiciousActivity(
                    memberServer,
                    member.user,
                    "Rejoint pendant une vague suspecte de nouveaux membres"
                );
            }
        }
    }

    // Envoyer le message de bienvenue standard
    const welcomeMessage = (data.welcomeMessages[memberServer.id] || data.welcomeMessages.default)
        .replace('{username}', member.user.username);
    
    // Utiliser le canal configuré ou le premier canal textuel disponible
    const welcomeChannelId = data.welcomeChannels[memberServer.id];
    let welcomeChannel;
    
    if (welcomeChannelId) {
        welcomeChannel = memberServer.channels.get(welcomeChannelId);
    }
    
    if (!welcomeChannel) {
        welcomeChannel = memberServer.channels.find(c => c.type === 'TextChannel');
    }
    
    if (welcomeChannel) {
        await welcomeChannel.sendMessage(welcomeMessage);
    }

    // Envoyer le questionnaire si configuré
    const questionnaireChannelId = data.questionnaire?.channels[memberServer.id];
    if (questionnaireChannelId) {
        const questionnaireChannel = memberServer.channels.get(questionnaireChannelId);
        if (questionnaireChannel) {
            const questionnaireEmbed = createQuestionnaireEmbed(member);
            await questionnaireChannel.sendMessage({
                content: `<@${member.user.id}>`,
                embeds: [questionnaireEmbed]
            });
        }
    }
});

// Gestion des réactions
client.on('reactionAdd', async (reaction, userId) => {
    const messageId = reaction.messageId;
    const config = data.reactionRoles.messages[messageId];
    
    if (!config) return; // Ce n'est pas un message de rôles-réactions

    const roleConfig = config.roles.find(r => r.emoji === reaction.emoji.name);
    if (!roleConfig) return; // Emoji non configuré

    try {
        const server = client.servers.get(config.serverId);
        const member = await server.fetchMember(userId);
        await member.addRole(roleConfig.roleId);
    } catch (error) {
        console.error('Erreur lors de l\'ajout du rôle:', error);
    }
});

client.on('reactionRemove', async (reaction, userId) => {
    const messageId = reaction.messageId;
    const config = data.reactionRoles.messages[messageId];
    
    if (!config) return;

    const roleConfig = config.roles.find(r => r.emoji === reaction.emoji.name);
    if (!roleConfig) return;

    try {
        const server = client.servers.get(config.serverId);
        const member = await server.fetchMember(userId);
        await member.removeRole(roleConfig.roleId);
    } catch (error) {
        console.error('Erreur lors du retrait du rôle:', error);
    }
});

// Gestion des erreurs
client.on('error', error => {
    console.error('Une erreur est survenue:', error);
});

// Connexion du bot
client.loginBot(process.env.BOT_TOKEN);
