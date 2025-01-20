---
layout: default
title: Liste des Commandes
permalink: /commandes/
---

# 📋 Liste des Commandes

<div class="command-section">
    <h2>📚 Éducation Politique</h2>
    {% include command-card.html 
        name="!citation"
        description="Affiche une citation révolutionnaire aléatoire"
        usage="!citation"
        category="Education"
    %}
    {% include command-card.html 
        name="!ressources"
        description="Liste de lectures recommandées"
        usage="!ressources [catégorie]"
        category="Education"
    %}
    {% include command-card.html 
        name="!histoire"
        description="Événements historiques importants"
        usage="!histoire [date/période]"
        category="Education"
    %}
    {% include command-card.html 
        name="!analyse"
        description="Analyse marxiste d'un sujet"
        usage="!analyse <sujet>"
        category="Education"
    %}
</div>

<div class="command-section">
    <h2>🛡️ Modération</h2>
    {% include command-card.html 
        name="!warn"
        description="Avertir un utilisateur"
        usage="!warn @user [raison]"
        permission="ModerateMembers"
        category="Moderation"
    %}
    {% include command-card.html 
        name="!ban"
        description="Bannir un utilisateur"
        usage="!ban @user [raison]"
        permission="BanMembers"
        category="Moderation"
    %}
    {% include command-card.html 
        name="!mute"
        description="Réduire au silence un utilisateur"
        usage="!mute @user [durée] [raison]"
        permission="ModerateMembers"
        category="Moderation"
    %}
</div>

<div class="command-section">
    <h2>⚙️ Configuration</h2>
    {% include command-card.html 
        name="!setwelcome"
        description="Définir le message de bienvenue"
        usage="!setwelcome [message]"
        permission="ManageServer"
        category="Config"
    %}
    {% include command-card.html 
        name="!setlogs"
        description="Configurer le canal de logs"
        usage="!setlogs #canal"
        permission="ManageServer"
        category="Config"
    %}
</div>

<div class="command-section">
    <h2>📊 Statistiques</h2>
    {% include command-card.html 
        name="!stats"
        description="Afficher les statistiques du serveur"
        usage="!stats"
        category="Stats"
    %}
    {% include command-card.html 
        name="!memberinfo"
        description="Informations sur un membre"
        usage="!memberinfo @user"
        category="Stats"
    %}
</div>

## Variables Disponibles

Dans les messages personnalisables, vous pouvez utiliser ces variables :

| Variable | Description |
|----------|-------------|
| `{username}` | Nom de l'utilisateur |
| `{servername}` | Nom du serveur |
| `{membercount}` | Nombre de membres |
| `{userid}` | ID de l'utilisateur |

## Permissions Requises

Certaines commandes nécessitent des permissions spécifiques :

| Permission | Description |
|------------|-------------|
| `ManageServer` | Gestion du serveur |
| `ModerateMembers` | Modération des membres |
| `BanMembers` | Bannissement des membres |
| `KickMembers` | Expulsion des membres |
| `ManageMessages` | Gestion des messages |
