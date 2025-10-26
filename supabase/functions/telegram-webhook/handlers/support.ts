import { sendTelegramMessage } from '../telegram.ts';
import { setState } from '../state.ts';
import { supabase } from '../state.ts';

export async function handleSupport(
  userId: string, 
  chatId: string, 
  state: any, 
  messageId?: number
) {
  const stack = state?.navigation_stack || [];
  stack.push(state?.current_step || 'home');
  await setState(userId, 'support', stack, state?.order_draft || {});
  
  const keyboard = {
    inline_keyboard: [
      [{ text: '🏠 Accueil', callback_data: 'home' }]
    ]
  };

  await sendTelegramMessage(
    chatId,
    `<b>💬 Support Client</b>

Envoyez-nous votre message et notre équipe vous répondra rapidement.

<i>Tous les messages sont privés et sécurisés.</i>`,
    keyboard,
    messageId
  );
}

export async function handleSupportMessage(
  userId: string, 
  chatId: string, 
  message: string, 
  username?: string
) {
  await supabase.from('support_messages').insert({
    telegram_user_id: userId,
    telegram_username: username,
    message_text: message,
    is_from_admin: false
  });

  await sendTelegramMessage(
    chatId,
    `✅ <b>Message envoyé!</b>

Notre équipe vous répondra rapidement.`
  );
}
