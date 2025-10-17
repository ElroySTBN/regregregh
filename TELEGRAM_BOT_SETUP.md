# MasterEDU Telegram Bot - Setup Guide

## 🚀 Configuration du Bot Telegram

### Étape 1: Créer le Bot Telegram

1. Ouvrez Telegram et cherchez **@BotFather**
2. Envoyez `/newbot`
3. Donnez un nom à votre bot (ex: "MasterEDU")
4. Donnez un username (doit finir par "bot", ex: "MasterEDUBot")
5. BotFather vous donnera un **token** - gardez-le précieusement!

### Étape 2: Configurer le Webhook

Une fois votre application déployée, vous devez configurer le webhook Telegram pour pointer vers votre fonction edge.

**URL du webhook:**
```
https://ifkvioldevgeplyrlicd.supabase.co/functions/v1/telegram-webhook
```

**Commande cURL pour configurer le webhook:**
```bash
curl -X POST "https://api.telegram.org/bot<VOTRE_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://ifkvioldevgeplyrlicd.supabase.co/functions/v1/telegram-webhook"}'
```

Remplacez `<VOTRE_TOKEN>` par le token que BotFather vous a donné.

### Étape 3: Vérifier le Webhook

Pour vérifier que le webhook est bien configuré:
```bash
curl "https://api.telegram.org/bot<VOTRE_TOKEN>/getWebhookInfo"
```

## 📱 Fonctionnalités du Bot

### Commandes Principales

- `/start` - Démarre le bot et affiche le menu principal

### Menu Principal

1. **📝 Nouvelle Commande** - Lance le processus de commande en 5 étapes:
   - Étape 1: Description du sujet
   - Étape 2: Sélection du niveau académique (Collège à Doctorat)
   - Étape 3: Nombre de pages
   - Étape 4: Choix de l'urgence (3h à 7 jours)
   - Étape 5: Récapitulatif et paiement

2. **📦 Mes Commandes** - Affiche l'historique des commandes

3. **💬 Support** - Système de messagerie anonyme avec l'admin

### Navigation

- 🔙 **Précédent** - Retour à l'étape précédente (avec stack intelligente)
- 🏠 **Accueil** - Retour au menu principal

## 💰 Tarification

### Prix de Base (par page)
- 🏫 Collège: 12€
- 🎓 Lycée: 16€
- 🏛️ Université: 22€
- 👨‍🎓 Master: 28€
- 🔬 Doctorat: 38€

### Multiplicateurs d'Urgence
- 🚨 ULTRA EXPRESS (3h): ×3.0
- ⚡ EXPRESS (6h): ×2.5
- 🔥 URGENT (12h): ×2.0
- ⏰ RAPIDE (24h): ×1.5
- 📅 STANDARD (48h): ×1.2
- 📆 ÉCONOMIQUE (7j): ×1.0

## 🛡️ Interface Admin

Accédez à l'interface admin à: `https://votre-domaine.com/admin`

### Fonctionnalités Admin

1. **Messages** - Gérez les conversations avec les clients
   - Vue par conversation
   - Réponses en temps réel
   - Historique complet

2. **Commandes** - Gérez toutes les commandes
   - Changement de statut (pending, paid, in_progress, review, completed, cancelled)
   - Vue détaillée de chaque commande
   - Filtrage et recherche

## 🔐 Adresses Crypto pour Paiements

Le bot affiche automatiquement ces adresses (à remplacer par les vôtres):

- **Bitcoin (BTC)**: `bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh`
- **Ethereum (ETH)**: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
- **Litecoin (LTC)**: `ltc1qw508d6qejxtdg4y5r3zarvary0c5xw7k`
- **USDT (TRC20)**: `TGDqJAoJTfb9erFzkGqq5fwJTQYbHmB5tM`

⚠️ **Important**: Modifiez ces adresses dans `supabase/functions/telegram-webhook/index.ts` avec vos vraies adresses crypto!

## 🎨 Design System

Le bot et l'interface admin utilisent un design premium avec:

- **Couleurs**: Bleu académique profond (#2563eb), Or premium, Vert émeraude
- **Typographie**: Inter (Google Fonts)
- **Animations**: Transitions fluides
- **Thème**: Mode sombre optimisé

## 📊 Base de Données

### Tables

1. **orders** - Toutes les commandes
2. **support_messages** - Messages du support
3. **telegram_users** - Utilisateurs Telegram
4. **conversation_state** - État de la conversation (pour navigation)

### Statuts de Commande

- `pending` - En attente de paiement
- `paid` - Payé, en attente de traitement
- `in_progress` - Travail en cours
- `review` - En révision
- `completed` - Terminé
- `cancelled` - Annulé

## 🔧 Développement Local

Pour tester localement:

1. Le bot webhook est déployé automatiquement
2. Utilisez ngrok pour exposer votre serveur local:
   ```bash
   ngrok http 54321
   ```
3. Configurez le webhook avec l'URL ngrok

## 📝 Notes Importantes

- Le bot génère des numéros de commande uniques (format: ME-XXXXXXXX)
- Chaque commande a un token de session sécurisé
- Les messages support sont horodatés et threadés par jour
- La navigation utilise une pile (stack) pour un retour intelligent

## 🚀 Prochaines Étapes

1. Configurez votre token Telegram bot dans les secrets Supabase
2. Déployez l'application
3. Configurez le webhook
4. Testez en envoyant `/start` à votre bot
5. Accédez à `/admin` pour gérer les messages et commandes

---

**Support**: Pour toute question, consultez la documentation ou contactez support@masteredu.com
