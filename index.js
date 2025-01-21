// Required imports
const { Client } = require('revolt.js');
const fs = require('fs');
require('dotenv').config();

// Default questions for the questionnaire
const defaultQuestions = {
    "Identité Politique": [
        "Quelle est ta vision de l'anarchisme ?",
        "Comment définirais-tu ta position politique ?",
        "Quels sont tes penseurs anarchistes préférés ?"
    ],
    "Analyse du Système": [
        "Quelle est ton analyse du capitalisme ?",
        "Comment vois-tu la hiérarchie dans la société actuelle ?",
        "Quelles alternatives proposes-tu au système actuel ?"
    ],
    "Action Militante": [
        "As-tu déjà participé à des actions militantes ?",
        "Quelles formes d'organisation privilégies-tu ?",
        "Comment vois-tu la convergence des luttes ?"
    ]
};

// Initialize data structure
let data = {
    serverConfigs: {},
    questionnaire: {
        defaultQuestions: defaultQuestions,
        serverQuestions: {}
    },
    backups: {},
    moderation: {
        automod: {},
        antiraid: {},
        logs: {},
        mutes: {},
        warnings: {},
        lockdowns: {}
    }
};

// Load existing data if available
try {
    const existingData = JSON.parse(fs.readFileSync('./data.json', 'utf8'));
    data = { ...data, ...existingData };
    console.log('Loaded existing data');
} catch (error) {
    console.log('No existing data found, using default configuration');
}

// Save data function
function saveData() {
    try {
        console.log('Saving data...');
        fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));
        console.log('Data saved successfully');
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

// Définition des permissions Revolt.js
const PERMISSIONS = {
    ADMINISTRATOR: 1,
    MANAGE_SERVER: 2,
    KICK_MEMBERS: 4,
    BAN_MEMBERS: 8,
    MANAGE_MESSAGES: 16,
    MANAGE_CHANNELS: 32,
    MANAGE_ROLES: 64,
    VIEW_CHANNELS: 128,
    SEND_MESSAGES: 256,
    MANAGE_NICKNAMES: 512,
    CHANGE_NICKNAMES: 1024,
    CREATE_INVITES: 2048,
    MASQUERADE: 4096,
    REACT: 8192
};

// Fonction pour vérifier les permissions
function hasPermission(member) {
    if (!member) {
        console.log("Debug - hasPermission: member est null");
        return false;
    }
    
    try {
        console.log("Debug - hasPermission: Vérification pour membre:", member.user.username);
        
        // Vérifier si l'utilisateur est le propriétaire du serveur
        if (member.server && member.server.owner === member.user._id) {
            console.log("Debug - hasPermission: Est propriétaire du serveur");
            return true;
        }
        
        // Vérifier les permissions du membre
        const roles = member.roles || [];
        console.log("Debug - hasPermission: Rôles du membre:", roles);
        
        for (const roleId of roles) {
            const role = member.server.roles.get(roleId);
            console.log("Debug - hasPermission: Vérification du rôle:", role ? role.name : 'rôle non trouvé');
            
            if (role) {
                console.log("Debug - hasPermission: Permissions du rôle:", role.permissions);
                // Vérifier si le rôle a des permissions d'administrateur
                if (role.permissions) {
                    if (role.permissions.a || role.permissions.administrator || role.permissions.Administrator) {
                        console.log("Debug - hasPermission: A la permission admin");
                        return true;
                    }
                    if (role.permissions.ms || role.permissions.manageServer || role.permissions.ManageServer) {
                        console.log("Debug - hasPermission: A la permission de gérer le serveur");
                        return true;
                    }
                }
            }
        }
        
        console.log("Debug - hasPermission: Aucune permission admin trouvée");
    } catch (error) {
        console.error("Erreur lors de la vérification des permissions:", error);
    }
    
    return false;
}

// Fonction pour vérifier les permissions de modération
function hasModPermission(member) {
    if (!member) {
        console.log("Debug - hasModPermission: member est null");
        return false;
    }
    
    try {
        console.log("Debug - hasModPermission: Vérification pour membre:", member.user.username);
        
        // Si l'utilisateur a les permissions d'admin, il a aussi les permissions de mod
        if (hasPermission(member)) {
            console.log("Debug - hasModPermission: A les permissions admin");
            return true;
        }
        
        // Vérifier les permissions de modération
        const roles = member.roles || [];
        console.log("Debug - hasModPermission: Rôles du membre:", roles);
        
        for (const roleId of roles) {
            const role = member.server.roles.get(roleId);
            console.log("Debug - hasModPermission: Vérification du rôle:", role ? role.name : 'rôle non trouvé');
            
            if (role) {
                console.log("Debug - hasModPermission: Permissions du rôle:", role.permissions);
                if (role.permissions) {
                    if (role.permissions.k || role.permissions.kickMembers || role.permissions.KickMembers) {
                        console.log("Debug - hasModPermission: A la permission de kick");
                        return true;
                    }
                    if (role.permissions.b || role.permissions.banMembers || role.permissions.BanMembers) {
                        console.log("Debug - hasModPermission: A la permission de ban");
                        return true;
                    }
                    if (role.permissions.mm || role.permissions.manageMessages || role.permissions.ManageMessages) {
                        console.log("Debug - hasModPermission: A la permission de gérer les messages");
                        return true;
                    }
                }
            }
        }
        
        console.log("Debug - hasModPermission: Aucune permission mod trouvée");
    } catch (error) {
        console.error("Erreur lors de la vérification des permissions de modération:", error);
    }
    
    return false;
}

// Fonction pour créer un message de bienvenue embed
function createWelcomeEmbed(member) {
    return {
        content: `👋 Bienvenue ${member.user.username} !`,
        embeds: [{
            title: "Bienvenue !",
            description: `Nous sommes ravis de t'accueillir, ${member.user.username} !`,
            colour: "#ff0000"
        }]
    };
}

// Fonction pour créer un embed de questionnaire
function createQuestionnaireEmbed(questions) {
    console.log('Creating questionnaire embed with questions:', questions);
    
    let description = "Pour mieux te connaître, merci de répondre aux questions suivantes :\n\n";
    
    // Add questions by category
    for (const [category, categoryQuestions] of Object.entries(questions)) {
        description += `**${category}**\n`;
        categoryQuestions.forEach((question, index) => {
            description += `${index + 1}. ${question}\n`;
        });
        description += '\n';
    }
    
    description += "\nPrends ton temps pour répondre. Tes réponses nous aideront à mieux t'accueillir dans notre communauté ! ✊";
    
    return {
        content: "📋 Questions",
        embeds: [{
            title: "Questionnaire",
            description: description,
            colour: "#ff0000"
        }]
    };
}

// Fonction pour obtenir les questions pour un serveur
function getServerQuestions(serverId) {
    console.log('Getting questions for server:', serverId);
    
    // Get server-specific questions or use defaults
    const serverQuestions = data.questionnaire.serverQuestions[serverId];
    console.log('Server-specific questions:', serverQuestions);
    
    // If server has custom questions, use those
    if (serverQuestions && Object.keys(serverQuestions).length > 0) {
        console.log('Using server-specific questions');
        return serverQuestions;
    }
    
    // Otherwise, use default questions
    console.log('Using default questions');
    return data.questionnaire.defaultQuestions;
}

// Initialize or load data
if (!data.serverConfigs) {
    data.serverConfigs = {};
}

if (!data.questionnaire) {
    data.questionnaire = {
        defaultQuestions: defaultQuestions,
        serverQuestions: {}
    };
}

// Create client instance
const client = new Client();

// Initialize bot
async function initializeBot() {
    console.log('=== INITIALIZING BOT ===');
    
    try {
        // Verify token
        const token = process.env.BOT_TOKEN;
        if (!token) {
            throw new Error('BOT_TOKEN not found in environment variables');
        }
        console.log('Token found in environment');
        
        // Connect to Revolt
        console.log('Attempting to connect to Revolt...');
        await client.loginBot(token);
        console.log('Successfully connected to Revolt!');
        
        // Set up error handling
        client.on('error', (error) => {
            console.error('Client error:', error);
        });
        
        // Set up disconnect handling
        client.on('disconnect', () => {
            console.log('Disconnected from Revolt, attempting to reconnect...');
        });
        
    } catch (error) {
        console.error('Failed to initialize bot:', error);
        process.exit(1);
    }
}

// Start the bot
initializeBot().catch(error => {
    console.error('Fatal error during initialization:', error);
    process.exit(1);
});

// Événement ready
client.on('ready', () => {
    console.log(`Bot connecté en tant que ${client.user.username}`);
    console.log('Événements enregistrés:');
    console.log('- messageCreate');
    console.log('- serverMemberJoin');
});

// Événement de test pour voir tous les événements
client.on('any', (event) => {
    if (event !== 'Ping' && event !== 'Pong') {
        console.log('Événement reçu:', event);
    }
});

// Gestion des erreurs
client.on('error', error => {
    console.error('Erreur du bot:', error);
});

// Helper function to wait
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to handle rate limits
async function handleRateLimit(error) {
    if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || 5;
        console.log(`Rate limited. Waiting ${retryAfter} seconds...`);
        await wait(retryAfter * 1000);
        return true;
    }
    return false;
}

// Helper function to send a message safely
async function sendMessageSafely(channel, messageData, maxRetries = 3) {
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
        try {
            // Send content first
            if (messageData.content) {
                await channel.sendMessage(messageData.content);
                await wait(3000); // Wait 3 seconds between messages
            }
            
            // Then send embeds if they exist
            if (messageData.embeds && messageData.embeds.length > 0) {
                // Split long descriptions into multiple messages if needed
                for (const embed of messageData.embeds) {
                    if (embed.description && embed.description.length > 1000) {
                        const parts = embed.description.match(/.{1,1000}(\s|$)/g);
                        for (let i = 0; i < parts.length; i++) {
                            const partEmbed = {
                                ...embed,
                                description: parts[i].trim(),
                                title: i === 0 ? embed.title : `${embed.title} (suite ${i + 1})`
                            };
                            await channel.sendMessage({ embeds: [partEmbed] });
                            await wait(3000); // Wait 3 seconds between parts
                        }
                    } else {
                        await channel.sendMessage({ embeds: [embed] });
                    }
                }
            }
            
            return true;
        } catch (error) {
            console.error(`Attempt ${retryCount + 1} failed:`, error.message);
            
            if (await handleRateLimit(error)) {
                retryCount++; // Only increment retry count for rate limits
                continue;
            }
            
            if (error.response?.status === 409) {
                await wait(5000); // Wait longer for conflicts
                retryCount++;
                continue;
            }
            
            // For other errors, try simplified message
            try {
                if (retryCount === maxRetries - 1) { // Last attempt
                    const simpleContent = messageData.content || 
                        (messageData.embeds?.[0]?.title || 'Message') + 
                        (messageData.embeds?.[0]?.description ? 
                            ': ' + messageData.embeds[0].description.slice(0, 100) + '...' : 
                            '');
                    await channel.sendMessage(simpleContent);
                    return true;
                }
            } catch (finalError) {
                console.error('Even simple message failed:', finalError);
            }
            
            retryCount++;
            await wait(3000); // Wait before retry
        }
    }
    
    return false;
}

// Server member join event
client.on('serverMemberJoin', async (member) => {
    try {
        console.log('\n=== NEW MEMBER DETECTED ===');
        
        // Validate member object
        if (!member) {
            throw new Error('Member object is undefined');
        }
        console.log('Member object:', JSON.stringify(member, null, 2));
        
        // Validate user object
        if (!member.user?.username) {
            throw new Error('Invalid user object in member');
        }
        console.log(`Username: ${member.user.username}`);
        
        // Get server from member
        const server = member.server;
        console.log('Server object:', JSON.stringify(server, null, 2));
        
        // Validate server object
        if (!server) {
            throw new Error('Server object is undefined');
        }
        
        // Get server ID
        const serverId = server._id || server.id;
        if (!serverId) {
            throw new Error('Server ID not found');
        }
        console.log(`Server ID: ${serverId}`);
        
        // Initialize or get server config
        if (!data.serverConfigs[serverId]) {
            console.log('Initializing server config...');
            data.serverConfigs[serverId] = {
                welcomeChannelId: null,
                welcomeMessage: "Bienvenue {username} sur notre serveur !",
                automodConfig: getAutomodConfig(serverId),
                antiRaidConfig: getAntiRaidConfig(serverId)
            };
            saveData();
            console.log('Server config initialized');
        }
        
        // Find appropriate channel
        let welcomeChannel = null;
        const channels = Array.from(server.channels?.values() || []);
        console.log(`Found ${channels.length} channels`);
        
        // Try configured channel first
        if (data.serverConfigs[serverId].welcomeChannelId) {
            welcomeChannel = channels.find(c => c.id === data.serverConfigs[serverId].welcomeChannelId);
            if (welcomeChannel) {
                console.log('Using configured welcome channel:', welcomeChannel.name);
            }
        }
        
        // Try to find a suitable channel by name
        if (!welcomeChannel) {
            welcomeChannel = channels.find(c => 
                c.type === 'TextChannel' && 
                (c.name.toLowerCase().includes('welcome') ||
                 c.name.toLowerCase().includes('bienvenue') ||
                 c.name.toLowerCase().includes('general'))
            );
            if (welcomeChannel) {
                console.log('Using channel found by name:', welcomeChannel.name);
            }
        }
        
        // Fall back to first text channel
        if (!welcomeChannel) {
            welcomeChannel = channels.find(c => c.type === 'TextChannel');
            if (welcomeChannel) {
                console.log('Using first available text channel:', welcomeChannel.name);
            }
        }
        
        if (!welcomeChannel) {
            throw new Error('No suitable channel found for welcome message');
        }
        
        // Send welcome message
        console.log('Sending welcome message...');
        const welcomeMessage = createWelcomeEmbed(member);
        const welcomeSent = await sendMessageSafely(welcomeChannel, welcomeMessage);
        
        if (!welcomeSent) {
            console.log('Failed to send welcome message, trying simple message...');
            await welcomeChannel.sendMessage(`👋 Bienvenue ${member.user.username} !`);
        }
        
        // Wait a bit before sending questionnaire
        await wait(5000);
        
        // Send questionnaire if configured
        try {
            console.log('Getting questions for new member...');
            const questions = getServerQuestions(serverId);
            console.log('Questions retrieved:', questions);
            
            if (questions && Object.keys(questions).length > 0) {
                console.log('Creating questionnaire embed...');
                const questionnaireMessage = createQuestionnaireEmbed(questions);
                console.log('Sending questionnaire...');
                
                const questionnaireSent = await sendMessageSafely(welcomeChannel, questionnaireMessage);
                
                if (!questionnaireSent) {
                    console.log('Failed to send questionnaire embed, trying simple message...');
                    await welcomeChannel.sendMessage('📋 Un questionnaire te sera envoyé bientôt.');
                }
            } else {
                console.log('No questions found for server');
            }
        } catch (error) {
            console.error('Error sending questionnaire:', error);
            console.error('Error details:', error.response?.data || error.message);
        }
        
        // Gestion des nouveaux membres pour l'anti-raid
        const config = getAntiRaidConfig(serverId);
        
        if (config.enabled) {
            const now = Date.now();
            newMembers.set(member.id, now);

            // Vérifier si le serveur est sous raid
            if (isServerUnderRaid(serverId)) {
                console.log(`Raid détecté sur le serveur ${serverId}`);
                await enableLockdown(member.server, "Trop de nouveaux membres en peu de temps");
                
                // Expulser le membre si configuré
                if (config.kickOnRaid) {
                    try {
                        await member.kick("Protection anti-raid activée");
                        console.log(`Membre ${member.id} expulsé (anti-raid)`);
                    } catch (error) {
                        console.error('Erreur lors de l\'expulsion:', error);
                    }
                }
                return;
            }
        }
        
    } catch (error) {
        console.error('Error handling new member:', error);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
    }
});

// Gestion des messages
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    // Vérification anti-raid pour les messages
    if (message.channel.server) {
        const serverId = message.channel.server._id;
        const antiRaidConfig = getAntiRaidConfig(serverId);
        
        if (antiRaidConfig.enabled) {
            const now = Date.now();
            const userId = message.author.id;
            const key = `${serverId}:${userId}`;
            
            // Suivre les actions de l'utilisateur
            if (!userActions.has(key)) {
                userActions.set(key, []);
            }
            userActions.get(key).push(now);

            // Nettoyer les anciennes actions
            const actionWindow = now - (antiRaidConfig.actionWindow * 1000);
            const recentActions = userActions.get(key).filter(time => time > actionWindow);
            userActions.set(key, recentActions);

            // Vérifier le seuil d'actions
            if (recentActions.length >= antiRaidConfig.actionThreshold) {
                console.log(`Trop d'actions détectées pour l'utilisateur ${userId} sur le serveur ${serverId}`);
                
                // Mute temporaire si configuré
                if (antiRaidConfig.muteOnSpam) {
                    try {
                        // Vérifier si l'utilisateur n'est pas déjà muet
                        if (!data.moderation.mutes[serverId]?.[userId]) {
                            const duration = 5 * 60 * 1000; // 5 minutes par défaut
                            const muteMember = await message.channel.server.fetchMember(userId);
                            if (muteMember) {
                                // Ajouter le rôle muet
                                if (antiRaidConfig.muteRole) {
                                    await muteMember.addRole(antiRaidConfig.muteRole);
                                }
                                
                                // Enregistrer le mute
                                if (!data.moderation.mutes[serverId]) {
                                    data.moderation.mutes[serverId] = {};
                                }
                                data.moderation.mutes[serverId][userId] = {
                                    timestamp: now,
                                    duration: duration,
                                    reason: "Spam détecté (anti-raid)"
                                };
                                saveData();

                                // Planifier le unmute
                                setTimeout(async () => {
                                    try {
                                        if (antiRaidConfig.muteRole) {
                                            await muteMember.removeRole(antiRaidConfig.muteRole);
                                        }
                                        delete data.moderation.mutes[serverId][userId];
                                        saveData();
                                    } catch (error) {
                                        console.error('Erreur lors du unmute automatique:', error);
                                    }
                                }, duration);

                                // Notifier
                                await message.channel.sendMessage(`⚠️ ${message.author.mention} a été muet pendant 5 minutes pour spam.`);
                            }
                        }
                    } catch (error) {
                        console.error('Erreur lors du mute pour spam:', error);
                    }
                }

                // Supprimer les messages si configuré
                if (antiRaidConfig.deleteSpam) {
                    try {
                        const messages = await message.channel.fetchMessages({
                            limit: 50,
                            before: message.id
                        });
                        
                        const userMessages = messages.filter(m => m.author.id === userId);
                        for (const msg of userMessages) {
                            try {
                                await msg.delete();
                            } catch (error) {
                                console.error('Erreur lors de la suppression d\'un message:', error);
                            }
                        }
                    } catch (error) {
                        console.error('Erreur lors de la récupération des messages:', error);
                    }
                }
            }
        }
    }
    
    if (!message.content.startsWith('!')) return;
    
    const args = message.content.slice(1).trim().split(/ +/);
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
            await message.reply(analyseMarxiste(sujet));
            break;

        case 'action':
            const guideActions = {
                "organisation": {
                    titre: "S'organiser collectivement",
                    details: [
                        "Rejoindre un syndicat ou une organisation politique",
                        "Créer un collectif local",
                        "Participer aux assemblées générales",
                        "Former des comités d'action"
                    ]
                },
                "education": {
                    titre: "Éducation politique",
                    details: [
                        "Organiser des cercles de lecture",
                        "Partager des ressources théoriques",
                        "Animer des ateliers de formation",
                        "Développer l'analyse critique"
                    ]
                },
                "action": {
                    titre: "Actions directes",
                    details: [
                        "Participer aux manifestations",
                        "Soutenir les grèves",
                        "Organiser des boycotts",
                        "Mener des actions de sensibilisation"
                    ]
                },
                "solidarite": {
                    titre: "Solidarité concrète",
                    details: [
                        "Créer des caisses de grève",
                        "Organiser l'aide mutuelle",
                        "Soutenir les luttes locales",
                        "Développer des réseaux d'entraide"
                    ]
                }
            };

            if (args.length === 0) {
                const categories = Object.keys(guideActions)
                    .map(cat => `- !action ${cat} : ${guideActions[cat].titre}`)
                    .join('\n');
                
                await message.reply(`🚩 **Guide d'action militante**\n\nUtilisez une des commandes suivantes :\n${categories}`);
            } else {
                const category = args[0].toLowerCase();
                if (guideActions[category]) {
                    const guide = guideActions[category];
                    const details = guide.details.map(d => `- ${d}`).join('\n');
                    await message.reply(`🚩 **${guide.titre}**\n\n${details}`);
                } else {
                    await message.reply("❌ Catégorie non reconnue. Utilisez !action sans argument pour voir la liste des catégories.");
                }
            }
            break;

        case 'solidarite':
            const actionsSolidarite = {
                "urgentes": [
                    "🚨 Grèves en cours",
                    "🏥 Soutien médical mutuel",
                    "🏠 Protection contre les expulsions",
                    "🥘 Distribution alimentaire"
                ],
                "locales": [
                    "🏘️ Assemblées de quartier",
                    "📚 Bibliothèques alternatives",
                    "🌱 Jardins partagés",
                    "🔧 Ateliers de réparation"
                ],
                "numeriques": [
                    "💻 Protection numérique",
                    "📱 Communication sécurisée",
                    "🔒 Hébergement militant",
                    "📢 Contre-information"
                ],
                "internationales": [
                    "🌍 Campagnes internationales",
                    "✊ Solidarité sans frontières",
                    "🤝 Jumelages militants",
                    "📣 Relais d'information"
                ]
            };

            if (args.length === 0) {
                const categories = Object.keys(actionsSolidarite)
                    .map(cat => `- !solidarite ${cat} : Actions ${cat}`)
                    .join('\n');
                
                await message.reply(`✊ **Actions de solidarité**\n\nChoisissez une catégorie :\n${categories}`);
            } else {
                const category = args[0].toLowerCase();
                if (actionsSolidarite[category]) {
                    const actions = actionsSolidarite[category].join('\n');
                    await message.reply(`✊ **Actions de solidarité - ${category}**\n\n${actions}`);
                } else {
                    await message.reply("❌ Catégorie non reconnue. Utilisez !solidarite sans argument pour voir la liste des catégories.");
                }
            }
            break;

        case 'setwelcome':
            // Vérifier les permissions
            try {
                const member = await message.channel.server.fetchMember(message.author.id);
                if (!member) {
                    await message.reply("❌ Impossible de vérifier vos permissions.");
                    return;
                }
                
                try {
                    if (!hasPermission(member)) {
                        await message.reply("❌ Vous n'avez pas la permission de configurer le message de bienvenue.");
                        return;
                    }
                } catch (permError) {
                    console.error('Permission check error:', permError);
                    await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                    return;
                }
            } catch (error) {
                console.error('Error checking permissions:', error);
                await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                return;
            }

            if (args.length === 0) {
                await message.reply("Usage: !setwelcome <message>\nUtilisez {username} pour inclure le nom de l'utilisateur.");
                return;
            }

            const welcomeMessageServerId = message.channel.server._id;
            const newMessage = args.join(' ');
            
            // Sauvegarder le message de bienvenue pour ce serveur
            if (!data.serverConfigs[welcomeMessageServerId]) {
                data.serverConfigs[welcomeMessageServerId] = {};
            }
            data.serverConfigs[welcomeMessageServerId].welcomeMessage = newMessage;
            saveData();

            await message.reply("✅ Message de bienvenue mis à jour avec succès !");
            break;

        case 'viewwelcome':
            const currentServerId = message.channel.server._id;
            const currentMessage = data.serverConfigs[currentServerId]?.welcomeMessage;
            const previewMessage = currentMessage?.replace('{username}', message.author.username);
            
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
            try {
                const adminMember = await message.channel.server.fetchMember(message.author.id);
                if (!adminMember) {
                    await message.reply("❌ Impossible de vérifier vos permissions.");
                    return;
                }
                
                try {
                    if (!hasPermission(adminMember)) {
                        await message.reply("❌ Vous n'avez pas la permission de réinitialiser le message de bienvenue.");
                        return;
                    }
                } catch (permError) {
                    console.error('Permission check error:', permError);
                    await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                    return;
                }
            } catch (error) {
                console.error('Error checking permissions:', error);
                await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                return;
            }

            const serverIdToReset = message.channel.server._id;
            if (data.serverConfigs[serverIdToReset]?.welcomeMessage) {
                delete data.serverConfigs[serverIdToReset].welcomeMessage;
                saveData();
                await message.reply("✅ Message de bienvenue réinitialisé au message par défaut.");
            } else {
                await message.reply("ℹ️ Ce serveur utilise déjà le message par défaut.");
            }
            break;

        case 'setwelcomechannel':
            // Vérifier les permissions d'administrateur
            try {
                const welcomeChannelTargetMember = await message.channel.server.fetchMember(message.author.id);
                if (!welcomeChannelTargetMember) {
                    await message.reply("❌ Impossible de vérifier vos permissions.");
                    return;
                }
                
                try {
                    if (!hasPermission(welcomeChannelTargetMember)) {
                        await message.reply("❌ Vous n'avez pas la permission de configurer le canal de bienvenue.");
                        return;
                    }
                } catch (permError) {
                    console.error('Permission check error:', permError);
                    await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                    return;
                }
            } catch (error) {
                console.error('Error checking permissions:', error);
                await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                return;
            }

            const welcomeChannelTargetChannel = message.mentionedChannels?.[0] || message.channel;
            const welcomeChannelServerId = message.channel.server._id;
            
            // Sauvegarder le canal de bienvenue pour ce serveur
            if (!data.serverConfigs[welcomeChannelServerId]) {
                data.serverConfigs[welcomeChannelServerId] = {};
            }
            data.serverConfigs[welcomeChannelServerId].welcomeChannel = welcomeChannelTargetChannel.id;
            saveData();

            await message.reply(`✅ Canal de bienvenue configuré sur ${welcomeChannelTargetChannel.name} !`);
            break;

        case 'viewwelcomechannel':
            // Vérifier les permissions
            try {
                const viewWelcomeTargetMember = await message.channel.server.fetchMember(message.author.id);
                if (!viewWelcomeTargetMember) {
                    await message.reply("❌ Impossible de vérifier vos permissions.");
                    return;
                }
                
                try {
                    if (!hasPermission(viewWelcomeTargetMember)) {
                        await message.reply("❌ Vous n'avez pas la permission de voir le canal de bienvenue.");
                        return;
                    }
                } catch (permError) {
                    console.error('Permission check error:', permError);
                    await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                    return;
                }
            } catch (error) {
                console.error('Error checking permissions:', error);
                await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                return;
            }

            const viewWelcomeTargetChannel = message.mentionedChannels?.[0] || message.channel;
            const viewWelcomeServerId = message.channel.server._id;

            if (data.serverConfigs[viewWelcomeServerId]?.welcomeChannel) {
                const channelId = data.serverConfigs[viewWelcomeServerId].welcomeChannel;
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
            try {
                const resetMember = await message.channel.server.fetchMember(message.author.id);
                if (!resetMember) {
                    await message.reply("❌ Impossible de vérifier vos permissions.");
                    return;
                }
                
                try {
                    if (!hasPermission(resetMember)) {
                        await message.reply("❌ Vous n'avez pas la permission de réinitialiser le canal de bienvenue.");
                        return;
                    }
                } catch (permError) {
                    console.error('Permission check error:', permError);
                    await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                    return;
                }
            } catch (error) {
                console.error('Error checking permissions:', error);
                await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                return;
            }

            const resetServerId = message.channel.server._id;
            if (data.serverConfigs[resetServerId]?.welcomeChannel) {
                delete data.serverConfigs[resetServerId].welcomeChannel;
                saveData();
                await message.reply("✅ Canal de bienvenue réinitialisé. Les messages seront envoyés dans le premier canal textuel disponible.");
            } else {
                await message.reply("ℹ️ Aucun canal de bienvenue n'était configuré.");
            }
            break;

        case 'setquestionnaire':
            // Vérifier les permissions
            try {
                const member = await message.channel.server.fetchMember(message.author.id);
                if (!member) {
                    await message.reply("❌ Impossible de vérifier vos permissions.");
                    return;
                }
                
                try {
                    if (!hasPermission(member)) {
                        await message.reply("❌ Vous n'avez pas la permission de configurer le questionnaire.");
                        return;
                    }
                } catch (permError) {
                    console.error('Permission check error:', permError);
                    await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                    return;
                }
            } catch (error) {
                console.error('Error checking permissions:', error);
                await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                return;
            }

            // Sauvegarder le canal pour le questionnaire
            if (!data.serverConfigs[message.channel.server._id]) {
                data.serverConfigs[message.channel.server._id] = {};
            }
            data.serverConfigs[message.channel.server._id].questionnaireChannel = message.channel.id;
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
            try {
                const member = await message.channel.server.fetchMember(message.author.id);
                if (!member) {
                    await message.reply("❌ Impossible de vérifier vos permissions.");
                    return;
                }
                
                try {
                    if (!hasPermission(member)) {
                        await message.reply("❌ Vous n'avez pas la permission de configurer le questionnaire.");
                        return;
                    }
                } catch (permError) {
                    console.error('Permission check error:', permError);
                    await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                    return;
                }
            } catch (error) {
                console.error('Error checking permissions:', error);
                await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                return;
            }

            // Supprimer la configuration du questionnaire
            if (data.serverConfigs[message.channel.server._id]?.questionnaireChannel) {
                delete data.serverConfigs[message.channel.server._id].questionnaireChannel;
                saveData();
                await message.reply("✅ Configuration du questionnaire supprimée.");
            } else {
                await message.reply("ℹ️ Aucun canal de questionnaire n'était configuré.");
            }
            break;

        case 'addquestion':
            // Vérifier les permissions
            try {
                const member = await message.channel.server.fetchMember(message.author.id);
                if (!member) {
                    await message.reply("❌ Impossible de vérifier vos permissions.");
                    return;
                }
                
                try {
                    if (!hasPermission(member)) {
                        await message.reply("❌ Vous n'avez pas la permission de modifier les questions.");
                        return;
                    }
                } catch (permError) {
                    console.error('Permission check error:', permError);
                    await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                    return;
                }
            } catch (error) {
                console.error('Error checking permissions:', error);
                await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
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
            const addQuestionServerId = message.channel.server._id;
            
            // Initialiser les questions du serveur si nécessaire
            if (!data.questionnaire.serverQuestions[addQuestionServerId]) {
                data.questionnaire.serverQuestions[addQuestionServerId] = {};
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
            try {
                const member = await message.channel.server.fetchMember(message.author.id);
                if (!member) {
                    await message.reply("❌ Impossible de vérifier vos permissions.");
                    return;
                }
                
                try {
                    if (!hasPermission(member)) {
                        await message.reply("❌ Vous n'avez pas la permission de modifier les questions.");
                        return;
                    }
                } catch (permError) {
                    console.error('Permission check error:', permError);
                    await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                    return;
                }
            } catch (error) {
                console.error('Error checking permissions:', error);
                await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
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
            const removeQuestionServerId = message.channel.server._id;

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
            try {
                console.log('=== DEBUG VIEWQUESTIONS ===');
                
                let questions;
                
                // S'assurer que les questions sont dans le bon format
                if (data.questionnaire && 
                    data.questionnaire.serverQuestions && 
                    data.questionnaire.serverQuestions[message.channel.server._id] &&
                    typeof data.questionnaire.serverQuestions[message.channel.server._id] === 'object') {
                    
                    questions = data.questionnaire.serverQuestions[message.channel.server._id];
                } else {
                    // Réinitialiser les questions par défaut si le format est incorrect
                    questions = {};
                    
                    // Mettre à jour data avec les questions réinitialisées
                    if (!data.questionnaire) data.questionnaire = {};
                    if (!data.questionnaire.serverQuestions) data.questionnaire.serverQuestions = {};
                    data.questionnaire.serverQuestions[message.channel.server._id] = questions;
                    saveData();
                }
                
                console.log('Questions finales utilisées:', JSON.stringify(questions, null, 2));
                const questionnaireMessage = createQuestionnaireEmbed(questions);
                await message.reply(questionnaireMessage);
                
            } catch (error) {
                console.error('Erreur lors de l\'affichage des questions:', error);
                await message.reply({
                    embeds: [{
                        title: "❌ Erreur",
                        description: "Une erreur est survenue lors de l'affichage des questions.",
                        colour: "#FF0000"
                    }]
                });
            }
            break;

        case 'resetquestions':
            // Vérifier les permissions
            try {
                const member = await message.channel.server.fetchMember(message.author.id);
                if (!member) {
                    await message.reply("❌ Impossible de vérifier vos permissions.");
                    return;
                }
                
                try {
                    if (!hasPermission(member)) {
                        await message.reply("❌ Vous n'avez pas la permission de modifier les questions.");
                        return;
                    }
                } catch (permError) {
                    console.error('Permission check error:', permError);
                    await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                    return;
                }
            } catch (error) {
                console.error('Error checking permissions:', error);
                await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                return;
            }

            const questionsResetServerId = message.channel.server._id;
            
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
            try {
                const member = await message.channel.server.fetchMember(message.author.id);
                if (!member) {
                    await message.reply("❌ Impossible de vérifier vos permissions.");
                    return;
                }
                
                try {
                    if (!hasPermission(member)) {
                        await message.reply("❌ Vous n'avez pas la permission de configurer l'automodération.");
                        return;
                    }
                } catch (permError) {
                    console.error('Permission check error:', permError);
                    await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                    return;
                }
            } catch (error) {
                console.error('Error checking permissions:', error);
                await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                return;
            }

            const automodServerId = message.channel.server._id;
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
            try {
                const member = await message.channel.server.fetchMember(message.author.id);
                if (!member) {
                    await message.reply("❌ Impossible de vérifier vos permissions.");
                    return;
                }
                
                try {
                    if (!hasPermission(member)) {
                        await message.reply("❌ Vous n'avez pas la permission de configurer l'anti-raid.");
                        return;
                    }
                } catch (permError) {
                    console.error('Permission check error:', permError);
                    await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                    return;
                }
            } catch (error) {
                console.error('Error checking permissions:', error);
                await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                return;
            }

            const antiRaidServerId = message.channel.server._id;
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
            try {
                // Vérifier les permissions
                if (!hasPermission(message.member)) {
                    await message.reply("❌ Vous n'avez pas la permission de gérer les backups.");
                    return;
                }

                if (args.length < 1) {
                    await message.reply("❌ Utilisation: !backup <create/list/load/delete> [nom]");
                    return;
                }

                const action = args[0].toLowerCase();
                const backupName = args[1];
                const server = message.channel.server;

                switch (action) {
                    case 'create':
                        if (!backupName) {
                            await message.reply("❌ Vous devez spécifier un nom pour la backup.\nExemple: !backup create sauvegarde1");
                            return;
                        }
                        await message.reply("⏳ Création de la backup en cours...");
                        try {
                            await createBackup(server, backupName);
                            await message.reply("✅ Backup créée avec succès !");
                        } catch (error) {
                            console.error('Erreur lors de la création de la backup:', error);
                            await message.reply("❌ Une erreur est survenue lors de la création de la backup.");
                        }
                        break;

                    case 'list':
                        const serverBackups = data.backups && data.backups[server.id];
                        if (!serverBackups || Object.keys(serverBackups).length === 0) {
                            await message.reply("❌ Aucune backup trouvée pour ce serveur.");
                            return;
                        }
                        
                        let backupList = "📋 **Liste des backups disponibles:**\n```\n";
                        for (const [name, backup] of Object.entries(serverBackups)) {
                            const date = new Date(backup.date).toLocaleString('fr-FR');
                            backupList += `${name} - Créée le ${date}\n`;
                        }
                        backupList += "```\nPour charger une backup: !backup load <nom>";
                        
                        await message.reply(backupList);
                        break;

                    case 'load':
                        if (!backupName) {
                            await message.reply("❌ Vous devez spécifier le nom de la backup à charger.\nExemple: !backup load sauvegarde1");
                            return;
                        }
                        
                        await message.reply("⚠️ Attention: Le chargement d'une backup va modifier le serveur. Êtes-vous sûr ? Tapez `!backup confirm` pour confirmer.");
                        // Stocker temporairement la backup à charger
                        pendingBackups.set(message.author.id, {
                            name: backupName,
                            server: server,
                            timestamp: Date.now()
                        });
                        
                        // Supprimer la backup en attente après 60 secondes
                        setTimeout(() => {
                            if (pendingBackups.has(message.author.id)) {
                                pendingBackups.delete(message.author.id);
                            }
                        }, 60000);
                        break;

                    case 'confirm':
                        const pendingBackup = pendingBackups.get(message.author.id);
                        if (!pendingBackup || Date.now() - pendingBackup.timestamp > 60000) {
                            await message.reply("❌ Aucune backup en attente de confirmation ou délai expiré.");
                            pendingBackups.delete(message.author.id);
                            return;
                        }

                        await message.reply("⏳ Chargement de la backup en cours...");
                        try {
                            await loadBackup(pendingBackup.server, pendingBackup.name);
                            await message.reply("✅ Backup chargée avec succès !");
                        } catch (error) {
                            console.error('Erreur lors du chargement de la backup:', error);
                            await message.reply("❌ Une erreur est survenue lors du chargement de la backup.");
                        }
                        pendingBackups.delete(message.author.id);
                        break;

                    default:
                        await message.reply("❌ Action invalide. Utilisez create, list, load ou delete.");
                }
            } catch (error) {
                console.error('Erreur lors de la gestion de backup:', error);
                await message.reply("❌ Une erreur est survenue lors de la gestion de la backup.");
            }
            break;

        case 'setstatus':
            // Vérifier les permissions
            try {
                const member = await message.channel.server.fetchMember(message.author.id);
                if (!member) {
                    await message.reply("❌ Impossible de vérifier vos permissions.");
                    return;
                }
                
                try {
                    if (!hasPermission(member)) {
                        await message.reply("❌ Vous n'avez pas la permission de modifier le statut du bot.");
                        return;
                    }
                } catch (permError) {
                    console.error('Permission check error:', permError);
                    await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                    return;
                }
            } catch (error) {
                console.error('Error checking permissions:', error);
                await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                return;
            }

            const newStatus = args.join(' ');
            if (!newStatus) {
                await message.reply("❌ Vous devez spécifier un statut. Exemple: !setstatus En train de lutter ✊");
                return;
            }

            try {
                await client.user.edit({
                    status: {
                        text: newStatus,
                        presence: "Online"
                    }
                });
                await message.reply(`✅ Statut mis à jour : ${newStatus}`);
            } catch (error) {
                console.error('Erreur lors de la mise à jour du statut:', error);
                await message.reply("❌ Une erreur est survenue lors de la mise à jour du statut.");
            }
            break;

        case 'help':
            try {
                // Message d'aide complet
                const helpMessage = "📚 **Liste des Commandes**\n\n" +
                    "**🔧 Commandes de Base**\n" +
                    "```\n" +
                    "!help - Afficher cette aide\n" +
                    "!ping - Vérifier si le bot est en ligne\n" +
                    "!info - Informations sur le serveur\n" +
                    "!user - Informations sur un utilisateur\n" +
                    "!citation - Afficher une citation révolutionnaire\n" +
                    "!ressources - Afficher les lectures recommandées\n" +
                    "!histoire - Afficher les événements historiques\n" +
                    "!analyse - Analyser un sujet d'un point de vue marxiste\n" +
                    "!action - Afficher le guide d'action militante\n" +
                    "!solidarite - Afficher les actions de solidarité\n" +
                    "```\n\n" +
                    "**🛡️ Commandes de Modération**\n" +
                    "```\n" +
                    "!warn @user [raison] - Avertir un utilisateur\n" +
                    "!kick @user [raison] - Expulser un utilisateur\n" +
                    "!ban @user [raison] - Bannir un utilisateur\n" +
                    "!unban @user - Débannir un utilisateur\n" +
                    "!mute @user [durée] [raison] - Rendre muet un utilisateur\n" +
                    "!unmute @user - Retirer le mute\n" +
                    "!clear [nombre] - Supprimer des messages\n" +
                    "!modlogs @user - Voir l'historique de modération\n" +
                    "```\n\n" +
                    "**⚙️ Configuration & Administration**\n" +
                    "```\n" +
                    "!antiraid status - Voir le statut de l'anti-raid\n" +
                    "!antiraid enable/disable - Activer/désactiver l'anti-raid\n" +
                    "!antiraid config - Configurer l'anti-raid\n" +
                    "!automod enable/disable - Activer/désactiver l'automod\n" +
                    "!automod config - Configurer l'automod\n" +
                    "!backup create - Créer une sauvegarde\n" +
                    "!backup list - Lister les sauvegardes\n" +
                    "!backup load - Charger une sauvegarde\n" +
                    "!config muterole - Configurer le rôle muet\n" +
                    "!config logchannel - Configurer le canal de logs\n" +
                    "!setquestionnaire - Configurer le questionnaire\n" +
                    "!viewquestions - Voir les questions\n" +
                    "!addquestion - Ajouter une question\n" +
                    "!removequestion - Retirer une question\n" +
                    "!resetquestions - Réinitialiser les questions\n" +
                    "```\n\n" +
                    "*Pour plus de détails sur une commande: !help <commande>*";

                await message.channel.sendMessage(helpMessage);
            } catch (error) {
                console.error('Erreur lors de la commande help:', error);
                await message.reply("❌ Une erreur est survenue. Réessayez plus tard.");
            }
            break;

        case 'info':
            try {
                // Obtenir les informations du serveur
                const server = message.channel.server;
                const memberCount = server.members ? server.members.size || 0 : 0;
                const channelCount = server.channels ? server.channels.size || 0 : 0;
                const roleCount = server.roles ? server.roles.size || 0 : 0;

                // Obtenir les configurations
                const serverConfig = data.serverConfigs[server._id] || {};
                const automodConfig = getAutomodConfig(server._id);
                const antiRaidConfig = getAntiRaidConfig(server._id);

                const infoEmbed = {
                    title: `ℹ️ Informations sur ${server.name}`,
                    description: "Statistiques et configuration du serveur",
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
                        },
                        {
                            name: "🤖 Configuration",
                            value: `Canal de bienvenue: ${serverConfig.welcomeChannel || "Non configuré"}\nMessage de bienvenue: ${serverConfig.welcomeMessage ? "Configuré" : "Non configuré"}`,
                            inline: false
                        },
                        {
                            name: "🛡️ Protection",
                            value: `Automod: ${automodConfig.enabled ? "✅" : "❌"}\nAnti-raid: ${antiRaidConfig.enabled ? "✅" : "❌"}`,
                            inline: false
                        },
                        {
                            name: "📋 Questionnaire",
                            value: serverConfig.questionnaire ? "✅ Configuré" : "❌ Non configuré",
                            inline: true
                        },
                        {
                            name: "📊 Statistiques de modération",
                            value: `Avertissements: ${Object.keys(data.moderation.warnings[server._id] || {}).length}\nMutes actifs: ${Object.keys(data.moderation.mutes[server._id] || {}).length}`,
                            inline: false
                        }
                    ]
                };

                await message.reply({ embeds: [infoEmbed] });
            } catch (error) {
                console.error('Erreur lors de l\'affichage des informations:', error);
                await message.reply("❌ Une erreur est survenue lors de l'affichage des informations du serveur.");
            }
            break;

        case 'user':
            try {
                // Obtenir l'utilisateur cible
                let targetUser;
                let targetMember;
                
                if (args.length > 0) {
                    const mentionMatch = args[0].match(/<@([0-9A-Z]+)>/i);
                    if (mentionMatch) {
                        const userId = mentionMatch[1];
                        targetMember = await message.channel.server.fetchMember(userId);
                        if (targetMember) {
                            targetUser = targetMember.user;
                        }
                    }
                }

                if (!targetUser) {
                    targetUser = message.author;
                    targetMember = await message.channel.server.fetchMember(message.author.id);
                }

                // Obtenir les données de modération
                const serverId = message.channel.server._id;
                const warnings = data.moderation.warnings[serverId]?.[targetUser.id] || [];
                const isMuted = data.moderation.mutes[serverId]?.[targetUser.id] || false;

                // Calculer la date de création du compte
                const createdAt = new Date(targetUser.createdAt);
                const joinedAt = targetMember ? new Date(targetMember.joinedAt) : null;

                const userEmbed = {
                    title: `👤 Informations sur ${targetUser.username}`,
                    description: "Détails de l'utilisateur",
                    color: "#ff0000",
                    fields: [
                        {
                            name: "🆔 ID",
                            value: targetUser.id,
                            inline: true
                        },
                        {
                            name: "📅 Compte créé le",
                            value: createdAt.toLocaleDateString('fr-FR'),
                            inline: true
                        }
                    ]
                };

                if (joinedAt) {
                    userEmbed.fields.push({
                        name: "🎉 A rejoint le",
                        value: joinedAt.toLocaleDateString('fr-FR'),
                        inline: true
                    });
                }

                if (targetMember) {
                    userEmbed.fields.push({
                        name: "🎭 Rôles",
                        value: targetMember.roles?.length > 0 ? targetMember.roles.join(", ") : "Aucun rôle",
                        inline: false
                    });

                    userEmbed.fields.push({
                        name: "📊 Statut de modération",
                        value: `Avertissements: ${warnings.length}\nMuet: ${isMuted ? "✅" : "❌"}`,
                        inline: false
                    });

                    if (warnings.length > 0) {
                        const warningsList = warnings
                            .map((w, i) => `${i + 1}. ${w.reason} (${new Date(w.date).toLocaleString()})`)
                            .join('\n');
                        
                        userEmbed.fields.push({
                            name: "⚠️ Derniers avertissements",
                            value: warningsList,
                            inline: false
                        });
                    }
                }

                await message.reply({ embeds: [userEmbed] });
            } catch (error) {
                console.error('Erreur lors de l\'affichage des informations utilisateur:', error);
                await message.reply("❌ Une erreur est survenue lors de l'affichage des informations utilisateur.");
            }
            break;

        case 'warn':
            // Vérifier les permissions
            try {
                const member = await message.channel.server.fetchMember(message.author.id);
                if (!member) {
                    await message.reply("❌ Impossible de vérifier vos permissions.");
                    return;
                }
                
                try {
                    if (!hasModPermission(member)) {
                        await message.reply("❌ Vous n'avez pas la permission d'utiliser cette commande.");
                        return;
                    }
                } catch (permError) {
                    console.error('Permission check error:', permError);
                    await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                    return;
                }
            } catch (error) {
                console.error('Error checking permissions:', error);
                await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                return;
            }

            const warnTarget = message.mentionedUsers?.[0];
            if (!warnTarget) {
                await message.reply("❌ Vous devez mentionner un utilisateur à avertir.");
                return;
            }

            const warnReason = args.slice(1).join(' ');
            const warnServerId = message.channel.server._id;
            
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
            const warningsTarget = message.mentionedUsers?.[0] || message.author;
            const warningsServerId = message.channel.server._id;
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
            try {
                const member = await message.channel.server.fetchMember(message.author.id);
                if (!member) {
                    await message.reply("❌ Impossible de vérifier vos permissions.");
                    return;
                }
                
                try {
                    if (!hasModPermission(member)) {
                        await message.reply("❌ Vous n'avez pas la permission d'utiliser cette commande.");
                        return;
                    }
                } catch (permError) {
                    console.error('Permission check error:', permError);
                    await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                    return;
                }
            } catch (error) {
                console.error('Error checking permissions:', error);
                await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                return;
            }

            const clearTarget = message.mentionedUsers?.[0];
            if (!clearTarget) {
                await message.reply("❌ Vous devez mentionner un utilisateur.");
                return;
            }

            const clearServerId = message.channel.server._id;
            if (data.moderation.warnings[clearServerId]) {
                delete data.moderation.warnings[clearServerId][clearTarget.id];
                saveData();
            }

            await message.reply(`✅ Les avertissements de ${clearTarget.username} ont été supprimés.`);
            break;

        case 'kick':
            try {
                // Vérifier les permissions
                if (!hasModPermission(message.member)) {
                    await message.reply("❌ Vous n'avez pas la permission d'expulser des utilisateurs.");
                    return;
                }

                // Vérifier les arguments
                if (args.length < 1) {
                    await message.reply("❌ Utilisation : !kick [@utilisateur] [raison]");
                    return;
                }

                // Extraire l'ID de l'utilisateur
                const targetId = args[0].replace(/[<@>]/g, '');
                const reason = args.slice(1).join(' ') || "Aucune raison spécifiée";

                try {
                    const targetMember = await message.channel.server.fetchMember(targetId);
                    if (!targetMember) {
                        await message.reply("❌ Impossible de trouver cet utilisateur.");
                        return;
                    }

                    // Vérifier si l'utilisateur peut être expulsé
                    if (targetMember.id === message.author.id) {
                        await message.reply("❌ Vous ne pouvez pas vous expulser vous-même.");
                        return;
                    }

                    // Vérifier si l'utilisateur a des permissions supérieures
                    if (hasModPermission(targetMember)) {
                        await message.reply("❌ Vous ne pouvez pas expulser un modérateur.");
                        return;
                    }

                    // Expulser l'utilisateur
                    await targetMember.kick();

                    // Enregistrer le kick dans les logs
                    if (!data.moderation) data.moderation = {};
                    if (!data.moderation.kicks) data.moderation.kicks = {};
                    if (!data.moderation.kicks[message.channel.server.id]) {
                        data.moderation.kicks[message.channel.server.id] = {};
                    }

                    const kickData = {
                        timestamp: new Date().toISOString(),
                        reason: reason,
                        moderator: message.author.username
                    };

                    if (!data.moderation.kicks[message.channel.server.id][targetId]) {
                        data.moderation.kicks[message.channel.server.id][targetId] = [];
                    }
                    data.moderation.kicks[message.channel.server.id][targetId].push(kickData);
                    saveData();

                    // Envoyer un message de confirmation
                    await message.reply(`✅ **${targetMember.user.username}** a été expulsé.\nRaison: ${reason}`);

                    // Logger l'action
                    await logModAction(message.channel.server, message.author, targetMember.user, "Expulsion", reason);
                } catch (error) {
                    console.error('Erreur lors du kick:', error);
                    await message.reply("❌ Une erreur est survenue lors de l'expulsion.");
                }
            } catch (error) {
                console.error('Erreur lors de la commande kick:', error);
                await message.reply("❌ Une erreur est survenue lors de l'exécution de la commande.");
            }
            break;

        case 'ban':
            try {
                // Vérifier les permissions
                if (!hasModPermission(message.member)) {
                    await message.reply("❌ Vous n'avez pas la permission de bannir des utilisateurs.");
                    return;
                }

                // Vérifier les arguments
                if (args.length < 1) {
                    await message.reply("❌ Utilisation : !ban [@utilisateur] [raison]");
                    return;
                }

                // Extraire l'ID de l'utilisateur
                const targetId = args[0].replace(/[<@>]/g, '');
                const reason = args.slice(1).join(' ') || "Aucune raison spécifiée";

                try {
                    const targetMember = await message.channel.server.fetchMember(targetId);
                    if (!targetMember) {
                        await message.reply("❌ Impossible de trouver cet utilisateur.");
                        return;
                    }

                    // Vérifier si l'utilisateur peut être banni
                    if (targetMember.id === message.author.id) {
                        await message.reply("❌ Vous ne pouvez pas vous bannir vous-même.");
                        return;
                    }

                    // Vérifier si l'utilisateur a des permissions supérieures
                    if (hasModPermission(targetMember)) {
                        await message.reply("❌ Vous ne pouvez pas bannir un modérateur.");
                        return;
                    }

                    // Bannir l'utilisateur
                    await targetMember.ban({ reason: reason });

                    // Enregistrer le ban dans les logs
                    if (!data.moderation) data.moderation = {};
                    if (!data.moderation.bans) data.moderation.bans = {};
                    if (!data.moderation.bans[message.channel.server.id]) {
                        data.moderation.bans[message.channel.server.id] = {};
                    }

                    data.moderation.bans[message.channel.server.id][targetId] = [];
                    data.moderation.bans[message.channel.server.id][targetId].push({
                        timestamp: new Date().toISOString(),
                        reason: reason,
                        bannedBy: message.author.username
                    });
                    saveData();

                    // Envoyer un message de confirmation
                    await message.reply(`✅ **${targetMember.username}** a été banni.\nRaison: ${reason}`);

                    // Logger l'action
                    await logModAction(message.channel.server, message.author, targetMember.user, "Bannissement", reason);
                } catch (error) {
                    console.error('Erreur lors du ban:', error);
                    await message.reply("❌ Une erreur est survenue lors du bannissement.");
                }
            } catch (error) {
                console.error('Erreur lors de la commande ban:', error);
                await message.reply("❌ Une erreur est survenue lors de l'exécution de la commande.");
            }
            break;

        case 'unban':
            // Vérifier les permissions
            try {
                const member = await message.channel.server.fetchMember(message.author.id);
                if (!member) {
                    await message.reply("❌ Impossible de vérifier vos permissions.");
                    return;
                }
                
                try {
                    if (!hasModPermission(member)) {
                        await message.reply("❌ Vous n'avez pas la permission de débannir des utilisateurs.");
                        return;
                    }
                } catch (permError) {
                    console.error('Permission check error:', permError);
                    await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                    return;
                }
            } catch (error) {
                console.error('Error checking permissions:', error);
                await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
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
            try {
                // Vérifier les permissions
                if (!hasModPermission(message.member)) {
                    await message.reply("❌ Vous n'avez pas la permission de rendre muet des utilisateurs.");
                    return;
                }

                // Vérifier les arguments
                if (args.length < 2) {
                    await message.reply("❌ Utilisation : !mute [@utilisateur] [durée] [raison]\nExemple : !mute @user 1h Spam");
                    return;
                }

                // Extraire l'ID de l'utilisateur
                const targetId = args[0].replace(/[<@>]/g, '');
                const durationStr = args[1];
                const reason = args.slice(2).join(' ') || "Aucune raison spécifiée";

                try {
                    const targetMember = await message.channel.server.fetchMember(targetId);
                    if (!targetMember) {
                        await message.reply("❌ Impossible de trouver cet utilisateur.");
                        return;
                    }

                    // Vérifier si l'utilisateur peut être rendu muet
                    if (targetMember.id === message.author.id) {
                        await message.reply("❌ Vous ne pouvez pas vous rendre muet vous-même.");
                        return;
                    }

                    // Vérifier si l'utilisateur a des permissions supérieures
                    if (hasModPermission(targetMember)) {
                        await message.reply("❌ Vous ne pouvez pas rendre muet un modérateur.");
                        return;
                    }

                    const serverId = message.channel.server._id;
                    const config = data.serverConfigs[serverId];

                    // Vérifier si le rôle muet est configuré
                    if (!config.muteRole) {
                        await message.reply("❌ Le rôle muet n'est pas configuré.");
                        return;
                    }

                    // Convertir la durée en millisecondes
                    let duration;
                    if (durationStr.endsWith('s')) {
                        duration = parseInt(durationStr) * 1000;
                    } else if (durationStr.endsWith('m')) {
                        duration = parseInt(durationStr) * 60 * 1000;
                    } else if (durationStr.endsWith('h')) {
                        duration = parseInt(durationStr) * 60 * 60 * 1000;
                    } else if (durationStr.endsWith('d')) {
                        duration = parseInt(durationStr) * 24 * 60 * 60 * 1000;
                    } else {
                        await message.reply("❌ Format de durée invalide. Utilisez s (secondes), m (minutes), h (heures) ou d (jours)");
                        return;
                    }

                    if (isNaN(duration) || duration <= 0) {
                        await message.reply("❌ Durée invalide.");
                        return;
                    }

                    // Ajouter le rôle muet
                    await targetMember.addRole(config.muteRole);

                    // Enregistrer le mute
                    if (!data.moderation.mutes) data.moderation.mutes = {};
                    if (!data.moderation.mutes[serverId]) {
                        data.moderation.mutes[serverId] = {};
                    }

                    const muteEndTime = Date.now() + duration;
                    data.moderation.mutes[serverId][targetId] = {
                        userId: targetId,
                        username: targetMember.user.username,
                        reason: reason,
                        mutedBy: message.author.id,
                        mutedAt: Date.now(),
                        duration: duration,
                        endTime: muteEndTime
                    };
                    saveData();

                    // Planifier le unmute
                    setTimeout(async () => {
                        try {
                            const member = await message.channel.server.fetchMember(targetId);
                            if (member) {
                                await member.removeRole(config.muteRole);
                            }
                            delete data.moderation.mutes[serverId][targetId];
                            saveData();

                            // Log le unmute automatique
                            if (config.logChannel) {
                                const logChannel = await message.channel.server.channels.get(config.logChannel);
                                if (logChannel) {
                                    await logChannel.sendMessage({
                                        content: `🔊 **Unmute Automatique**\nUtilisateur: ${targetMember.user.username}\nID: ${targetId}\nDurée du mute: ${durationStr}`
                                    });
                                }
                            }
                        } catch (error) {
                            console.error('Erreur lors du unmute automatique:', error);
                        }
                    }, duration);

                    // Envoyer un message de confirmation
                    await message.reply(`✅ **${targetMember.user.username}** a été rendu muet pendant ${durationStr}.\nRaison: ${reason}`);

                    // Logger l'action
                    await logModAction(message.channel.server, message.author, targetMember.user, "Mute", reason);

                } catch (error) {
                    console.error('Erreur lors du mute:', error);
                    await message.reply("❌ Une erreur est survenue lors du mute.");
                }
            } catch (error) {
                console.error('Erreur lors de la commande mute:', error);
                await message.reply("❌ Une erreur est survenue lors de l'exécution de la commande.");
            }
            break;

        case 'unmute':
            try {
                // Vérifier les permissions
                if (!hasModPermission(message.member)) {
                    await message.reply("❌ Vous n'avez pas la permission de retirer le mute des utilisateurs.");
                    return;
                }

                // Vérifier les arguments
                if (args.length < 1) {
                    await message.reply("❌ Utilisation : !unmute [@utilisateur]");
                    return;
                }

                // Extraire l'ID de l'utilisateur
                const targetId = args[0].replace(/[<@>]/g, '');
                const serverId = message.channel.server._id;

                try {
                    const targetMember = await message.channel.server.fetchMember(targetId);
                    if (!targetMember) {
                        await message.reply("❌ Impossible de trouver cet utilisateur.");
                        return;
                    }

                    const config = data.serverConfigs[serverId];

                    // Vérifier si le rôle muet est configuré
                    if (!config.muteRole) {
                        await message.reply("❌ Le rôle muet n'est pas configuré.");
                        return;
                    }

                    // Vérifier si l'utilisateur est muet
                    if (!data.moderation.mutes[serverId]?.[targetId]) {
                        await message.reply("❌ Cet utilisateur n'est pas muet.");
                        return;
                    }

                    // Retirer le rôle muet
                    await targetMember.removeRole(config.muteRole);

                    // Mettre à jour les données
                    const muteInfo = data.moderation.mutes[serverId][targetId];
                    delete data.moderation.mutes[serverId][targetId];
                    saveData();

                    // Envoyer un message de confirmation
                    await message.reply(`✅ Le mute de **${targetMember.user.username}** a été retiré.`);

                    // Logger l'action
                    await logModAction(message.channel.server, message.author, targetMember.user, "Unmute", "Mute retiré");

                } catch (error) {
                    console.error('Erreur lors du unmute:', error);
                    await message.reply("❌ Une erreur est survenue lors du unmute.");
                }
            } catch (error) {
                console.error('Erreur lors de la commande unmute:', error);
                await message.reply("❌ Une erreur est survenue lors de l'exécution de la commande.");
            }
            break;

        case 'modlogs':
            // Vérifier les permissions
            try {
                const member = await message.channel.server.fetchMember(message.author.id);
                if (!member) {
                    await message.reply("❌ Impossible de vérifier vos permissions.");
                    return;
                }
                
                try {
                    if (!hasModPermission(member)) {
                        await message.reply("❌ Vous n'avez pas la permission d'utiliser cette commande.");
                        return;
                    }
                } catch (permError) {
                    console.error('Permission check error:', permError);
                    await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                    return;
                }
            } catch (error) {
                console.error('Error checking permissions:', error);
                await message.reply("❌ Une erreur s'est produite lors de la vérification des permissions.");
                return;
            }

            const logsServerId = message.channel.server._id;
            const targetUser = message.mentionedUsers?.[0];

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

        case 'lockdown':
            if (!hasModPermission(message.member)) {
                await message.reply("❌ Vous n'avez pas la permission d'utiliser cette commande.");
                return;
            }

            const lockdownAction = args[0]?.toLowerCase();
            if (!lockdownAction || (lockdownAction !== 'on' && lockdownAction !== 'off')) {
                await message.reply("❌ Utilisation: !lockdown <on/off> [raison]");
                return;
            }

            const lockdownReason = args.slice(1).join(' ') || 'Aucune raison spécifiée';
            const isEnabling = lockdownAction === 'on';

            if (isEnabling) {
                await message.reply("⚠️ **ATTENTION** : Vous êtes sur le point d'activer le mode lockdown. Tous les membres ne pourront plus envoyer de messages.\nTapez `!lockdown confirm` pour confirmer.");
                pendingLockdowns.set(message.author.id, {
                    server: message.channel.server,
                    reason: lockdownReason,
                    timestamp: Date.now()
                });
                
                // Supprimer la demande après 30 secondes
                setTimeout(() => {
                    pendingLockdowns.delete(message.author.id);
                }, 30000);
            } else {
                const success = await toggleLockdown(message.channel.server, false);
                if (success) {
                    await message.reply("🔓 **Le mode lockdown a été désactivé**\nLes membres peuvent à nouveau envoyer des messages.");
                    
                    // Log de l'action
                    await logModAction(message.channel.server, message.author, null, "Désactivation du lockdown", lockdownReason);
                } else {
                    await message.reply("❌ Une erreur est survenue lors de la désactivation du lockdown.");
                }
            }
            break;

        case 'lockdown confirm':
            if (!hasModPermission(message.member)) {
                await message.reply("❌ Vous n'avez pas la permission d'utiliser cette commande.");
                return;
            }

            const pendingLockdown = pendingLockdowns.get(message.author.id);
            if (!pendingLockdown || Date.now() - pendingLockdown.timestamp > 30000) {
                await message.reply("❌ Aucune demande de lockdown en attente ou délai expiré.");
                pendingLockdowns.delete(message.author.id);
                return;
            }

            const lockdownSuccess = await toggleLockdown(pendingLockdown.server, true);
            if (lockdownSuccess) {
                await message.reply({
                    content: "🔒 **MODE LOCKDOWN ACTIVÉ**\n" +
                            "- Les membres ne peuvent plus envoyer de messages\n" +
                            "- Raison: " + pendingLockdown.reason + "\n" +
                            "- Pour désactiver: `!lockdown off`",
                    embeds: [{
                        title: "🚨 Mode Lockdown",
                        description: "Le serveur est maintenant en mode lockdown",
                        color: "#ff0000",
                        fields: [
                            {
                                name: "Raison",
                                value: pendingLockdown.reason
                            },
                            {
                                name: "Activé par",
                                value: message.author.username
                            },
                            {
                                name: "Désactivation",
                                value: "Utilisez `!lockdown off` pour désactiver"
                            }
                        ]
                    }]
                });
                
                // Log de l'action
                await logModAction(message.channel.server, message.author, null, "Activation du lockdown", pendingLockdown.reason);
            } else {
                await message.reply("❌ Une erreur est survenue lors de l'activation du lockdown.");
            }
            pendingLockdowns.delete(message.author.id);
            break;

        case 'clear':
            try {
                // Vérifier les permissions
                if (!hasModPermission(message.member)) {
                    await message.reply("❌ Vous n'avez pas la permission de supprimer des messages.");
                    return;
                }

                // Vérifier les arguments
                const amount = parseInt(args[0]);
                if (!amount || isNaN(amount) || amount < 1 || amount > 100) {
                    await message.reply("❌ Veuillez spécifier un nombre de messages à supprimer (entre 1 et 100).\nExemple: !clear 10");
                    return;
                }

                try {
                    // Récupérer les messages à supprimer
                    const messages = await message.channel.fetchMessages({
                        limit: amount + 1 // +1 pour inclure la commande elle-même
                    });

                    // Supprimer les messages
                    let deletedCount = 0;
                    for (const msg of messages) {
                        try {
                            await msg.delete();
                            deletedCount++;
                            // Petite pause pour éviter le rate limit
                            await new Promise(resolve => setTimeout(resolve, 500));
                        } catch (error) {
                            console.error('Erreur lors de la suppression d\'un message:', error);
                        }
                    }

                    // Envoyer un message de confirmation qui s'auto-détruit après 5 secondes
                    const confirmMessage = await message.channel.sendMessage(`✅ **${deletedCount - 1}** messages ont été supprimés.`);
                    setTimeout(async () => {
                        try {
                            await confirmMessage.delete();
                        } catch (error) {
                            console.error('Erreur lors de la suppression du message de confirmation:', error);
                        }
                    }, 5000);

                    // Logger l'action
                    await logModAction(
                        message.channel.server,
                        message.author,
                        null,
                        "Clear",
                        `${deletedCount - 1} messages supprimés dans #${message.channel.name}`
                    );

                } catch (error) {
                    console.error('Erreur lors de la récupération des messages:', error);
                    await message.reply("❌ Une erreur est survenue lors de la suppression des messages.");
                }
            } catch (error) {
                console.error('Erreur lors de la commande clear:', error);
                await message.reply("❌ Une erreur est survenue lors de l'exécution de la commande.");
            }
            break;

        default:
            await message.reply(`❌ Commande inconnue. Utilisez !help pour voir la liste des commandes disponibles.`);
            break;
    }
});

// Fonction pour obtenir la configuration d'automod
const getAutomodConfig = (serverId) => {
    if (!data.moderation) {
        data.moderation = { automod: {} };
    }
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

// Fonction pour obtenir la configuration anti-raid
const getAntiRaidConfig = (serverId) => {
    if (!data.moderation) {
        data.moderation = { antiraid: {} };
    }
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

// Structures pour l'anti-raid
const newMembers = new Map(); // Pour suivre les nouveaux membres
const userActions = new Map(); // Pour suivre les actions des utilisateurs
const serverLockdowns = new Map(); // Pour suivre l'état de lockdown des serveurs

// Fonction pour vérifier si un serveur est en raid
function isServerUnderRaid(serverId) {
    const config = getAntiRaidConfig(serverId);
    if (!config.enabled) return false;

    const now = Date.now();
    const joinWindow = now - (config.joinWindow * 1000);
    
    // Nettoyer les anciennes entrées
    for (const [userId, joinTime] of newMembers.entries()) {
        if (joinTime < joinWindow) {
            newMembers.delete(userId);
        }
    }

    return newMembers.size >= config.joinThreshold;
}

// Fonction pour activer le mode lockdown
async function toggleLockdown(server, enable = true) {
    try {
        console.log(`[DEBUG] ${enable ? 'Activation' : 'Désactivation'} du mode lockdown`);
        
        // Parcourir tous les canaux
        for (const channel of server.channels) {
            if (!channel) continue;
            
            try {
                // Trouver le rôle @everyone en parcourant la Map des rôles
                let everyoneRole = null;
                for (const [id, role] of server.roles) {
                    if (role.name === '@everyone') {
                        everyoneRole = role;
                        break;
                    }
                }

                if (everyoneRole) {
                    console.log(`[DEBUG] Rôle @everyone trouvé avec l'ID: ${everyoneRole.id}`);
                    await channel.setPermissions(everyoneRole.id, {
                        // Désactiver l'envoi de messages pendant le lockdown
                        SendMessage: !enable,
                        // Garder la permission de lecture
                        ViewChannel: true
                    });
                    console.log(`[DEBUG] Permissions modifiées pour le canal: ${channel.name}`);
                } else {
                    console.log("[DEBUG] Rôle @everyone non trouvé");
                }
            } catch (error) {
                console.error(`[DEBUG] Erreur lors de la modification des permissions pour le canal ${channel.name}:`, error);
            }
        }
        
        // Mettre à jour l'état du lockdown dans les données
        if (!data.serverSettings) data.serverSettings = {};
        if (!data.serverSettings[server.id]) data.serverSettings[server.id] = {};
        
        data.serverSettings[server.id].lockdown = enable;
        saveData();
        
        console.log(`[DEBUG] Mode lockdown ${enable ? 'activé' : 'désactivé'} avec succès`);
        return true;
    } catch (error) {
        console.error('[DEBUG] Erreur lors du toggle lockdown:', error);
        return false;
    }
}

// Fonction pour désactiver le mode lockdown
async function disableLockdown(server) {
    const serverId = server._id;
    if (!serverLockdowns.get(serverId)) return; // Pas en lockdown

    serverLockdowns.delete(serverId);

    // Mettre à jour data.json
    if (data.moderation.lockdowns) {
        delete data.moderation.lockdowns[serverId];
        saveData();
    }

    // Notifier dans le canal de logs
    const config = data.serverConfigs[serverId];
    if (config && config.logChannel) {
        try {
            const logChannel = await server.channels.get(config.logChannel);
            if (logChannel) {
                await logChannel.sendMessage({
                    content: `✅ **LOCKDOWN DÉSACTIVÉ**\nDate: ${new Date().toLocaleString('fr-FR')}`
                });
            }
        } catch (error) {
            console.error('Erreur lors de la notification de fin de lockdown:', error);
        }
    }
}

// Fonction pour vérifier les permissions
function hasPermission(member) {
    if (!member) {
        console.log("Debug - hasPermission: member est null");
        return false;
    }
    
    try {
        console.log("Debug - hasPermission: Vérification pour membre:", member.user.username);
        
        // Vérifier si l'utilisateur est le propriétaire du serveur
        if (member.server && member.server.owner === member.user._id) {
            console.log("Debug - hasPermission: Est propriétaire du serveur");
            return true;
        }
        
        // Vérifier les permissions du membre
        const roles = member.roles || [];
        console.log("Debug - hasPermission: Rôles du membre:", roles);
        
        for (const roleId of roles) {
            const role = member.server.roles.get(roleId);
            console.log("Debug - hasPermission: Vérification du rôle:", role ? role.name : 'rôle non trouvé');
            
            if (role) {
                console.log("Debug - hasPermission: Permissions du rôle:", role.permissions);
                // Vérifier si le rôle a des permissions d'administrateur
                if (role.permissions) {
                    if (role.permissions.a || role.permissions.administrator || role.permissions.Administrator) {
                        console.log("Debug - hasPermission: A la permission admin");
                        return true;
                    }
                    if (role.permissions.ms || role.permissions.manageServer || role.permissions.ManageServer) {
                        console.log("Debug - hasPermission: A la permission de gérer le serveur");
                        return true;
                    }
                }
            }
        }
        
        console.log("Debug - hasPermission: Aucune permission admin trouvée");
    } catch (error) {
        console.error("Erreur lors de la vérification des permissions:", error);
    }
    
    return false;
}

// Fonction pour vérifier les permissions de modération
function hasModPermission(member) {
    if (!member) {
        console.log("Debug - hasModPermission: member est null");
        return false;
    }
    
    try {
        console.log("Debug - hasModPermission: Vérification pour membre:", member.user.username);
        
        // Si l'utilisateur a les permissions d'admin, il a aussi les permissions de mod
        if (hasPermission(member)) {
            console.log("Debug - hasModPermission: A les permissions admin");
            return true;
        }
        
        // Vérifier les permissions de modération
        const roles = member.roles || [];
        console.log("Debug - hasModPermission: Rôles du membre:", roles);
        
        for (const roleId of roles) {
            const role = member.server.roles.get(roleId);
            console.log("Debug - hasModPermission: Vérification du rôle:", role ? role.name : 'rôle non trouvé');
            
            if (role) {
                console.log("Debug - hasModPermission: Permissions du rôle:", role.permissions);
                if (role.permissions) {
                    if (role.permissions.k || role.permissions.kickMembers || role.permissions.KickMembers) {
                        console.log("Debug - hasModPermission: A la permission de kick");
                        return true;
                    }
                    if (role.permissions.b || role.permissions.banMembers || role.permissions.BanMembers) {
                        console.log("Debug - hasModPermission: A la permission de ban");
                        return true;
                    }
                    if (role.permissions.mm || role.permissions.manageMessages || role.permissions.ManageMessages) {
                        console.log("Debug - hasModPermission: A la permission de gérer les messages");
                        return true;
                    }
                }
            }
        }
        
        console.log("Debug - hasModPermission: Aucune permission mod trouvée");
    } catch (error) {
        console.error("Erreur lors de la vérification des permissions de modération:", error);
    }
    
    return false;
}

// Fonction pour encoder un emoji pour l'API
const encodeEmoji = (emoji) => {
    return encodeURIComponent(emoji);
};

// Fonction pour décoder un emoji de l'API
const decodeEmoji = (encodedEmoji) => {
    return decodeURIComponent(encodedEmoji);
};

// Citations révolutionnaires
const citations = [
    "Ni dieu, ni maître ! - Auguste Blanqui",
    "L'anarchie est l'ordre sans le pouvoir. - Pierre-Joseph Proudhon",
    "Ceux qui font les révolutions à moitié ne font que se creuser un tombeau. - Louis Antoine de Saint-Just",
    "La liberté des autres étend la mienne à l'infini. - Mikhaïl Bakounine",
    "Le pouvoir corrompt, le pouvoir absolu corrompt absolument. - Lord Acton",
    "L'émancipation des travailleurs sera l'œuvre des travailleurs eux-mêmes. - Karl Marx",
    "La propriété, c'est le vol ! - Pierre-Joseph Proudhon",
    "Soyons réalistes, demandons l'impossible ! - Che Guevara"
];

// Ressources et lectures recommandées
const ressources = [
    "L'État et la Révolution - Lénine",
    "Le Capital - Karl Marx",
    "L'ABC du Communisme - Boukharine",
    "Qu'est-ce que la propriété ? - Proudhon",
    "L'Entraide, un facteur de l'évolution - Kropotkine",
    "De la Guerre - Clausewitz",
    "La Société du Spectacle - Guy Debord",
    "Le Droit à la Paresse - Paul Lafargue"
];

// Événements historiques
const evenements = {
    "Commune de Paris": "18 mars - 28 mai 1871 : Première tentative de gouvernement ouvrier",
    "Révolution Russe": "Octobre 1917 : Les bolcheviks prennent le pouvoir",
    "Mai 68": "Mai 1968 : Grève générale et révolte étudiante en France",
    "Révolution Espagnole": "1936-1939 : Expérience d'autogestion anarchiste",
    "Révolution Cubaine": "1959 : Victoire des révolutionnaires menés par Fidel Castro",
    "Zapatistes": "1994 : Soulèvement au Chiapas contre le néolibéralisme"
};

// Fonction pour l'analyse marxiste
function analyseMarxiste(sujet) {
    return `🔍 **Analyse marxiste de "${sujet}":**\n
1. Conditions matérielles:
   - Analyse des moyens de production
   - Relations de production existantes
   - Forces productives impliquées

2. Contradictions de classe:
   - Identification des classes en présence
   - Intérêts antagonistes
   - Rapports de force

3. Superstructure:
   - Aspects idéologiques
   - Institutions concernées
   - Formes de conscience sociale

4. Perspectives révolutionnaires:
   - Potentiel de transformation
   - Stratégies de lutte
   - Objectifs émancipateurs`;
}

// Debug logging
console.log('Environment check:');
console.log('BOT_TOKEN exists:', !!process.env.BOT_TOKEN);
console.log('BOT_TOKEN length:', process.env.BOT_TOKEN ? process.env.BOT_TOKEN.length : 0);
console.log('PREFIX:', process.env.PREFIX);

// Système de backup
async function createBackup(server, name) {
    try {
        const backup = {
            name: name,
            date: Date.now(),
            server: {
                name: server.name,
                channels: [],
                roles: []
            }
        };

        // Sauvegarder les canaux
        server.channels.forEach(channel => {
            if (channel) {
                backup.server.channels.push({
                    id: channel.id,
                    name: channel.name,
                    type: channel.type,
                    position: channel.position || 0
                });
            }
        });

        // Sauvegarder les rôles
        server.roles.forEach(role => {
            if (role) {
                backup.server.roles.push({
                    id: role.id,
                    name: role.name,
                    permissions: role.permissions,
                    color: role.color
                });
            }
        });

        // Sauvegarder dans data.json
        if (!data.backups) data.backups = {};
        if (!data.backups[server.id]) data.backups[server.id] = {};
        
        data.backups[server.id][name] = backup;
        saveData();

        return backup;
    } catch (error) {
        console.error("Erreur lors de la création de la backup:", error);
        throw error;
    }
}

async function loadBackup(server, name) {
    const backup = data.backups?.[server._id]?.[name];
    if (!backup) return null;

    try {
        // Restaurer le nom du serveur
        await server.edit({ name: backup.server.name });

        // Restaurer les rôles
        for (const roleData of backup.server.roles) {
            try {
                const existingRole = server.roles.find(r => r.name === roleData.name);
                if (!existingRole) {
                    await server.createRole({
                        name: roleData.name,
                        permissions: roleData.permissions,
                        color: roleData.color
                    });
                }
            } catch (error) {
                console.error(`Erreur lors de la restauration du rôle ${roleData.name}:`, error);
            }
        }

        // Restaurer les canaux
        for (const channelData of backup.server.channels) {
            try {
                const existingChannel = server.channels.find(c => c.name === channelData.name);
                if (!existingChannel) {
                    await server.createChannel({
                        name: channelData.name,
                        type: channelData.type,
                        position: channelData.position
                    });
                }
            } catch (error) {
                console.error(`Erreur lors de la restauration du canal ${channelData.name}:`, error);
            }
        }

        return true;
    } catch (error) {
        console.error('Erreur lors de la restauration de la backup:', error);
        return false;
    }
}

// Fonction pour obtenir les avertissements d'un utilisateur
function getUserWarnings(serverId, userId) {
    if (!data.moderation.warnings[serverId]) {
        data.moderation.warnings[serverId] = {};
    }
    return data.moderation.warnings[serverId][userId] || [];
}

// Fonction pour logger une action de modération
async function logModAction(server, moderator, target, action, reason) {
    if (!data.moderation.logs[server._id]) {
        data.moderation.logs[server._id] = [];
    }

    const log = {
        timestamp: new Date().toISOString(),
        moderator: moderator,
        target: target,
        action: action,
        reason: reason
    };

    data.moderation.logs[server._id].push(log);
    saveData();

    // Notifier dans le canal de logs
    const config = data.serverConfigs[server._id];
    if (config && config.logChannel) {
        try {
            const logChannel = await server.channels.get(config.logChannel);
            if (logChannel) {
                const logEmbed = {
                    title: "📝 **Action de Modération**",
                    color: "#ff0000",
                    fields: [
                        {
                            name: "Modérateur",
                            value: moderator.username,
                            inline: true
                        },
                        {
                            name: "Cible",
                            value: target.username,
                            inline: true
                        },
                        {
                            name: "Action",
                            value: action,
                            inline: true
                        },
                        {
                            name: "Raison",
                            value: reason,
                            inline: false
                        }
                    ]
                };
                await logChannel.sendMessage({ embeds: [logEmbed] });
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi du log de modération:', error);
        }
    }
}

// Structures pour les demandes de lockdown
const pendingLockdowns = new Map();
