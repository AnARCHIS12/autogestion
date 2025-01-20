---
layout: default
title: Installation
---

# Installation

## Prérequis

- Node.js 18 ou supérieur
- npm ou yarn
- Un compte Revolt

## Guide d'installation rapide

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/AnARCHIS12/autogestion.git
   cd autogestion
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer le bot**
   - Copiez le fichier `.env.example` en `.env`
   ```bash
   cp .env.example .env
   ```
   - Modifiez le fichier `.env` avec vos informations :
     - `TOKEN` : Le token de votre bot Revolt
     - `PREFIX` : Le préfixe pour les commandes (par défaut : '!')

4. **Lancer le bot**
   ```bash
   npm start
   ```

## Configuration avancée

### Variables d'environnement

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `TOKEN` | Token du bot Revolt | (requis) |
| `PREFIX` | Préfixe des commandes | ! |
| `ADMIN_ROLE` | ID du rôle administrateur | (optionnel) |
| `LOG_CHANNEL` | ID du canal de logs | (optionnel) |

### Configuration des permissions

Le bot nécessite les permissions suivantes :
- Lire les messages
- Envoyer des messages
- Gérer les messages
- Gérer les rôles
- Expulser des membres
- Bannir des membres
