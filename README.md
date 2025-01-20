# 🤖 Bot Revolt Militant

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-18+-green.svg?style=for-the-badge&logo=node.js)
![License](https://img.shields.io/badge/license-MIT-orange.svg?style=for-the-badge)
[![Status](https://img.shields.io/badge/status-active-success.svg?style=for-the-badge)]()

</div>

---

<p align="center">
Un bot Revolt puissant et modulaire avec des fonctionnalités avancées de modération, automodération, anti-raid, et plus encore !
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

### 🛡️ Modération

| Commande | Description | Permission |
|----------|-------------|------------|
| `!warn @user` | Avertir un utilisateur | ModerateMembers |
| `!kick @user` | Expulser un utilisateur | KickMembers |
| `!ban @user` | Bannir un utilisateur | BanMembers |
| `!mute @user` | Réduire au silence | ModerateMembers |
| `!clear` | Supprimer des messages | ManageMessages |

### 🤖 AutoModération

| Paramètre | Description | Valeur par défaut |
|-----------|-------------|-------------------|
| Spam | Détection de spam | 5 msgs/10s |
| Caps | Limite de majuscules | 70% |
| Liens | Filtrage des liens | Désactivé |
| Invitations | Filtrage des invites | Désactivé |

### ⚔️ Anti-Raid

| Fonction | Description |
|----------|-------------|
| Détection | Surveillance des joins massifs |
| Lockdown | Verrouillage automatique |
| Punition | Ban/Kick/Mute configurable |
| Alertes | Notifications en temps réel |

### 📝 Système de Logs

| Événement | Description | Badge |
|-----------|-------------|--------|
| Messages | Modifications & suppressions | 🗑️ |
| Membres | Joins & départs | 👋 |
| Modération | Actions des modérateurs | 🔨 |
| Serveur | Modifications du serveur | ⚙️ |

### 💾 Système de Backup

| Commande | Description | Badge |
|----------|-------------|--------|
| `!backup create` | Créer une backup | 💾 |
| `!backup list` | Lister les backups | 📋 |
| `!backup restore` | Restaurer une backup | ⏮️ |
| `!backup delete` | Supprimer une backup | 🗑️ |

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

[![Revolt](https://img.shields.io/badge/Revolt-Rejoindre-7289DA.svg?style=for-the-badge&logo=revolt)](https://revolt.chat/votre-serveur)
[![GitHub](https://img.shields.io/badge/GitHub-Contribuer-181717.svg?style=for-the-badge&logo=github)](https://github.com/votre-repo)

</div>
# autogestion
