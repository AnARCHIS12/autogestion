# 🤖 Bot Discord Multifonction

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-18+-green.svg?style=for-the-badge&logo=node.js)
![License](https://img.shields.io/badge/license-MIT-orange.svg?style=for-the-badge)
[![Status](https://img.shields.io/badge/status-active-success.svg?style=for-the-badge)]()

</div>

---

<p align="center">
Un bot Discord puissant et modulaire avec des fonctionnalités avancées de modération, automodération, anti-raid, et plus encore !
</p>

## ✨ Fonctionnalités Principales

<div align="center">

[![Modération](https://img.shields.io/badge/🛡️_Modération-Avancée-red.svg?style=for-the-badge)]()
[![AutoMod](https://img.shields.io/badge/🤖_AutoMod-Intelligent-blue.svg?style=for-the-badge)]()
[![Anti-Raid](https://img.shields.io/badge/⚔️_Anti--Raid-Puissant-purple.svg?style=for-the-badge)]()
[![Logs](https://img.shields.io/badge/📝_Logs-Détaillés-green.svg?style=for-the-badge)]()
[![Backup](https://img.shields.io/badge/💾_Backup-Complète-orange.svg?style=for-the-badge)]()

</div>

## 📥 Installation

```bash
# Cloner le repository
git clone [URL_DU_REPO]

# Installer les dépendances
npm install

# Configurer le fichier .env
cp .env.example .env

# Lancer le bot
npm start
```

## 🛠️ Configuration

1. Créez un fichier `.env` avec les variables suivantes :
   ```env
   TOKEN=votre_token_ici
   PREFIX=!
   ```

2. Configurez les permissions requises pour le bot :
   - Gérer les messages
   - Gérer les rôles
   - Bannir des membres
   - Voir les logs

## 🤖 Commandes

### 📚 Éducation Politique

| Commande | Description |
|----------|-------------|
| `!citation` | Citation révolutionnaire aléatoire |
| `!ressources` | Liste de lectures recommandées |
| `!histoire` | Événements historiques importants |
| `!analyse [sujet]` | Analyse marxiste d'un sujet |

### ✊ Action Militante

| Commande | Description |
|----------|-------------|
| `!action` | Guide d'action militante |
| `!solidarite` | Suggestions d'actions de solidarité |
| `!manif` | Prochaines manifestations |
| `!tract` | Générateur de tracts |

### 🛡️ Modération

| Commande | Description | Permission |
|----------|-------------|------------|
| `!warn @user [raison]` | Avertir un utilisateur | ModerateMembers |
| `!warnings [@user]` | Voir les avertissements | ModerateMembers |
| `!clearwarnings @user` | Effacer les avertissements | ModerateMembers |
| `!kick @user [raison]` | Expulser un utilisateur | KickMembers |
| `!ban @user [raison]` | Bannir un utilisateur | BanMembers |
| `!unban <userId>` | Débannir un utilisateur | BanMembers |
| `!mute @user [durée] [raison]` | Réduire au silence | ModerateMembers |
| `!unmute @user` | Rendre la parole | ModerateMembers |
| `!clear [nombre]` | Supprimer des messages | ManageMessages |
| `!modlogs [@user]` | Historique de modération | ViewAuditLog |

### ⚙️ Configuration

| Commande | Description | Permission |
|----------|-------------|------------|
| `!setwelcome [message]` | Message de bienvenue | ManageServer |
| `!viewwelcome` | Voir message actuel | Aucune |
| `!resetwelcome` | Réinitialiser message | ManageServer |
| `!setwelcomechannel #canal` | Canal de bienvenue | ManageServer |
| `!viewwelcomechannel` | Voir canal actuel | Aucune |
| `!resetwelcomechannel` | Réinitialiser canal | ManageServer |

### 📝 Questionnaire

| Commande | Description | Permission |
|----------|-------------|------------|
| `!setquestionnaire` | Définir canal questionnaire | ManageServer |
| `!removequestionnaire` | Désactiver questionnaire | ManageServer |
| `!addquestion <catégorie> <question>` | Ajouter question | ManageServer |
| `!removequestion <catégorie> <numéro>` | Supprimer question | ManageServer |
| `!viewquestions` | Voir toutes les questions | Aucune |
| `!resetquestions` | Questions par défaut | ManageServer |

### 🤖 AutoModération

| Commande | Description | Permission |
|----------|-------------|------------|
| `!automod` | Voir configuration | ManageServer |
| `!automod enable/disable` | Activer/Désactiver | ManageServer |
| `!automod spam <nombre>` | Seuil de spam | ManageServer |
| `!automod caps <pourcentage>` | Limite majuscules | ManageServer |
| `!automod invites <on/off>` | Filtre invitations | ManageServer |
| `!automod links <on/off>` | Filtre liens | ManageServer |
| `!automod addword <mot>` | Ajouter mot banni | ManageServer |
| `!automod removeword <mot>` | Retirer mot banni | ManageServer |

### ⚔️ Anti-Raid

| Commande | Description | Permission |
|----------|-------------|------------|
| `!antiraid` | Voir configuration | ManageServer |
| `!antiraid enable/disable` | Activer/Désactiver | ManageServer |
| `!antiraid lockdown <on/off>` | Mode lockdown | ManageServer |
| `!antiraid joins <seuil> <secondes>` | Seuil nouveaux membres | ManageServer |
| `!antiraid actions <seuil> <secondes>` | Seuil actions | ManageServer |
| `!antiraid punishment <ban/kick/mute>` | Punition raiders | ManageServer |

### 💾 Backup

| Commande | Description | Permission |
|----------|-------------|------------|
| `!backup create` | Créer backup | ManageServer |
| `!backup list` | Liste des backups | ManageServer |
| `!backup info <nom>` | Détails backup | ManageServer |
| `!backup restore <nom>` | Restaurer backup | ManageServer |
| `!backup delete <nom>` | Supprimer backup | ManageServer |
| `!backup auto <on/off>` | Backup automatique | ManageServer |

### 📊 Statistiques

| Commande | Description |
|----------|-------------|
| `!stats` | Stats du serveur |
| `!memberinfo @user` | Info utilisateur |
| `!serverinfo` | Info serveur |
| `!roleinfo @role` | Info rôle |
| `!channelinfo #canal` | Info canal |

### 🛠️ Utilitaires

| Commande | Description |
|----------|-------------|
| `!help [commande]` | Aide détaillée |
| `!ping` | Latence du bot |
| `!invite` | Lien d'invitation |
| `!support` | Serveur support |
| `!github` | Code source |

## 📊 Statistiques

<div align="center">

![Servers](https://img.shields.io/badge/dynamic/json?style=for-the-badge&label=Serveurs&query=$.servers&url=https://api.example.com/stats&color=blue)
![Users](https://img.shields.io/badge/dynamic/json?style=for-the-badge&label=Utilisateurs&query=$.users&url=https://api.example.com/stats&color=green)
![Commands](https://img.shields.io/badge/dynamic/json?style=for-the-badge&label=Commandes&query=$.commands&url=https://api.example.com/stats&color=orange)

</div>

## 📝 License

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

<div align="center">

[![Discord](https://img.shields.io/badge/Discord-Rejoindre-7289DA.svg?style=for-the-badge&logo=discord)](https://discord.gg/votre-serveur)
[![GitHub](https://img.shields.io/badge/GitHub-Contribuer-181717.svg?style=for-the-badge&logo=github)](https://github.com/votre-repo)

</div>
# autogestion
