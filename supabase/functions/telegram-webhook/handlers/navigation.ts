import { sendTelegramMessage } from '../telegram.ts';
import { setState } from '../state.ts';

export async function handleStart(userId: string, chatId: string, messageId?: number) {
  await setState(userId, 'home', []);
  
  const keyboard = {
    inline_keyboard: [
      [{ text: '📝 Nouvelle commande', callback_data: 'new_order' }],
      [{ text: '🎁 Parrainage', callback_data: 'referral' }],
      [{ text: '💰 Tarification', callback_data: 'pricing' }],
      [{ text: '💬 Support', callback_data: 'support' }]
    ]
  };

  await sendTelegramMessage(
    chatId,
    `📚 <b>FlashGrade - Services Académiques</b>

Plateforme de rédaction académique professionnelle.

<b>Services disponibles :</b>
• Rédaction de travaux académiques
• Recherche et analyse
• Révisions et corrections

<b>Garanties :</b>
• Travail original (SANS IA) et personnalisé
• Respect des délais convenus
• Support technique inclus

Sélectionnez l'action souhaitée :`,
    keyboard,
    messageId
  );
}

export async function handlePricing(chatId: string, messageId?: number) {
  const keyboard = {
    inline_keyboard: [
      [{ text: '📝 Nouvelle commande', callback_data: 'new_order' }],
      [{ text: '🏠 Menu', callback_data: 'home' }]
    ]
  };

  await sendTelegramMessage(
    chatId,
    `<b>💰 Tarification</b>

<b>Prix par page (300 mots) :</b>
🏫 Collège : 12€
🎓 Lycée : 16€
🏛️ Université : 22€
👨‍🎓 Master : 28€
🔬 Doctorat : 38€

<b>Multiplicateurs selon le délai :</b>
🎯 14 jours : -10%
📋 7 jours : Prix standard
📆 3 jours : +20%
📅 48h : +30%
⏰ 24h : +50%
🔥 12h : +70%
⚡ 6h : +80%

<i>Prix final = (Prix par page × Nombre de pages) × Multiplicateur de délai</i>`,
    keyboard,
    messageId
  );
}
