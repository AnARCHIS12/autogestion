---
layout: default
title: Commandes
---

# Liste des Commandes

## Éducation Politique

- `!citation` - Affiche une citation révolutionnaire aléatoire
- `!ressource` - Affiche des ressources sur différentes luttes
- `!lecture` - Suggestions de lectures révolutionnaires

## Modération

### Gestion des Avertissements
- `!warn <@utilisateur> [raison]` - Avertir un utilisateur
- `!warnings [@utilisateur]` - Voir les avertissements d'un utilisateur
- `!clearwarnings <@utilisateur>` - Effacer les avertissements d'un utilisateur

### Sanctions
- `!mute <@utilisateur> <durée> [raison]` - Rendre muet un utilisateur
- `!unmute <@utilisateur>` - Rendre la parole à un utilisateur
- `!kick <@utilisateur> [raison]` - Expulser un utilisateur
- `!ban <@utilisateur> [raison]` - Bannir un utilisateur

### Logs
- `!modlogs [@utilisateur]` - Voir l'historique des actions de modération

## Configuration

### Automodération
- `!automod enable/disable` - Active/désactive l'automodération
- `!automod spam <nombre>` - Configure le seuil de détection du spam
- `!automod caps <pourcentage>` - Configure le seuil de majuscules autorisé
- `!automod invites on/off` - Active/désactive le filtre d'invitations
- `!automod links on/off` - Active/désactive le filtre de liens
- `!automod addword <mot>` - Ajoute un mot à la liste des mots bannis
- `!automod removeword <mot>` - Retire un mot de la liste des mots bannis

### Protection Anti-Raid
- `!antiraid enable/disable` - Active/désactive la protection anti-raid
- `!antiraid lockdown on/off` - Active/désactive le mode lockdown
- `!antiraid joins <seuil> <secondes>` - Configure le seuil de nouveaux membres
- `!antiraid actions <seuil> <secondes>` - Configure le seuil d'actions par utilisateur

### Message de Bienvenue
- `!setwelcome <message>` - Définit le message de bienvenue
- `!testwelcome` - Teste le message de bienvenue
- `!resetwelcome` - Réinitialise le message de bienvenue

### Rôles-Réactions
- `!createroles <titre>` - Crée un nouveau menu de rôles-réactions
- `!addrole <messageId> <emoji> <@role> [description]` - Ajoute un rôle au menu
- `!removerole <messageId> <emoji>` - Retire un rôle du menu

### Questionnaire d'Accueil
- `!setquestionnaire` - Configure le canal pour le questionnaire d'accueil
- `!removequestionnaire` - Désactive le questionnaire d'accueil
- `!addquestion <catégorie> <question>` - Ajoute une question au questionnaire
- `!removequestion <catégorie> <numéro>` - Retire une question du questionnaire
- `!viewquestions` - Affiche toutes les questions configurées
