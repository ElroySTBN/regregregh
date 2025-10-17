import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

console.log('Bot token configured:', TELEGRAM_BOT_TOKEN ? 'YES' : 'NO');
console.log('Supabase URL:', SUPABASE_URL ? 'YES' : 'NO');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

// Price per page for each level
const PRICES = {
  college: 12,
  highschool: 16,
  university: 22,
  master: 28,
  phd: 38
};

// Urgency multipliers
const URGENCY_MULTIPLIERS = {
  ultra_express: 3.0,
  express: 2.5,
  urgent: 2.0,
  rapid: 1.5,
  standard: 1.2,
  economic: 1.0
};

// Urgency display
const URGENCY_DISPLAY = {
  ultra_express: '🚨 ULTRA EXPRESS 3h',
  express: '⚡ EXPRESS 6h',
  urgent: '🔥 URGENT 12h',
  rapid: '⏰ RAPIDE 24h',
  standard: '📅 STANDARD 48h',
  economic: '📆 ÉCONOMIQUE 7 jours'
};

const LEVEL_DISPLAY = {
  college: '🏫 Collège',
  highschool: '🎓 Lycée',
  university: '🏛️ Université',
  master: '👨‍🎓 Master',
  phd: '🔬 Doctorat'
};

async function sendTelegramMessage(chatId: string, text: string, keyboard?: any, messageId?: number) {
  const isEdit = messageId !== undefined;
  const url = isEdit 
    ? `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`
    : `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const body: any = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML'
  };
  
  if (isEdit) {
    body.message_id = messageId;
  }
  
  if (keyboard) {
    body.reply_markup = keyboard;
  }

  console.log(isEdit ? 'Editing message' : 'Sending message', 'to chat:', chatId);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  const result = await response.json();
  console.log('Telegram API response:', result);
  
  if (!result.ok) {
    console.error('Failed to send/edit message:', result);
    throw new Error(`Telegram API error: ${result.description || 'Unknown error'}`);
  }
  
  return result;
}

async function getOrCreateUser(update: any) {
  const user = update.message?.from || update.callback_query?.from;
  if (!user) return null;

  const { data } = await supabase
    .from('telegram_users')
    .select('*')
    .eq('telegram_user_id', user.id.toString())
    .single();

  if (!data) {
    await supabase.from('telegram_users').insert({
      telegram_user_id: user.id.toString(),
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name
    });
  } else {
    await supabase
      .from('telegram_users')
      .update({ last_interaction_at: new Date().toISOString() })
      .eq('telegram_user_id', user.id.toString());
  }

  return user.id.toString();
}

async function getState(userId: string) {
  const { data } = await supabase
    .from('conversation_state')
    .select('*')
    .eq('telegram_user_id', userId)
    .single();
  
  return data || null;
}

async function setState(userId: string, step: string, stack: any[] = [], draft: any = {}) {
  await supabase.from('conversation_state').upsert({
    telegram_user_id: userId,
    current_step: step,
    navigation_stack: stack,
    order_draft: draft
  });
}

function generateOrderNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'ME-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateSessionToken(): string {
  return crypto.randomUUID();
}

function calculatePrice(level: string, pages: number, urgency: string): { base: number, multiplier: number, final: number } {
  const base = PRICES[level as keyof typeof PRICES] * pages;
  const multiplier = URGENCY_MULTIPLIERS[urgency as keyof typeof URGENCY_MULTIPLIERS];
  const final = Math.round(base * multiplier);
  return { base, multiplier, final };
}

async function handleStart(userId: string, chatId: string, messageId?: number) {
  await setState(userId, 'home', []);
  
  const keyboard = {
    inline_keyboard: [
      [{ text: '📝 Nouvelle Commande', callback_data: 'new_order' }],
      [{ text: '📦 Mes Commandes', callback_data: 'my_orders' }],
      [{ text: '💬 Support', callback_data: 'support' }]
    ]
  };

  await sendTelegramMessage(
    chatId,
    `<b>✨ Bienvenue chez MasterEDU ✨</b>

🎓 <b>2,847 étudiants qui ont réussi</b>

<b>Nos Garanties Premium:</b>
✅ Remboursement si note &lt; 10/20
✅ Révisions illimitées
✅ Rédacteurs experts certifiés
✅ Livraison 100% ponctuelle

<b>Comment puis-je vous aider ?</b>`,
    keyboard,
    messageId
  );
}

async function handleNewOrder(userId: string, chatId: string, state: any, messageId?: number) {
  const stack = state?.navigation_stack || [];
  stack.push('home');
  await setState(userId, 'enter_subject', stack, {});
  
  const keyboard = {
    inline_keyboard: [[{ text: '🔙 Précédent', callback_data: 'back' }, { text: '🏠 Accueil', callback_data: 'home' }]]
  };

  await sendTelegramMessage(
    chatId,
    `<b>📝 Nouvelle Commande</b>

<b>Étape 1/5: Sujet du devoir</b>

Veuillez décrire le sujet de votre devoir de manière détaillée.`,
    keyboard,
    messageId
  );
}

async function handleSubjectInput(userId: string, chatId: string, state: any, subject: string) {
  const stack = state.navigation_stack || [];
  stack.push('enter_subject');
  const draft = { ...state.order_draft, subject };
  
  await setState(userId, 'select_level', stack, draft);
  
  const keyboard = {
    inline_keyboard: [
      [{ text: '🏫 Collège (12€/page)', callback_data: 'level_college' }],
      [{ text: '🎓 Lycée (16€/page)', callback_data: 'level_highschool' }],
      [{ text: '🏛️ Université (22€/page)', callback_data: 'level_university' }],
      [{ text: '👨‍🎓 Master (28€/page)', callback_data: 'level_master' }],
      [{ text: '🔬 Doctorat (38€/page)', callback_data: 'level_phd' }],
      [{ text: '🔙 Précédent', callback_data: 'back' }, { text: '🏠 Accueil', callback_data: 'home' }]
    ]
  };

  await sendTelegramMessage(
    chatId,
    `<b>📝 Nouvelle Commande</b>

<b>Étape 2/5: Niveau académique</b>

Sujet: <i>${subject}</i>

Sélectionnez votre niveau académique:`,
    keyboard
  );
}

async function handleLevelSelect(userId: string, chatId: string, state: any, level: string, messageId?: number) {
  const stack = state.navigation_stack || [];
  stack.push('select_level');
  const draft = { ...state.order_draft, level };
  
  await setState(userId, 'enter_length', stack, draft);
  
  const keyboard = {
    inline_keyboard: [[{ text: '🔙 Précédent', callback_data: 'back' }, { text: '🏠 Accueil', callback_data: 'home' }]]
  };

  await sendTelegramMessage(
    chatId,
    `<b>📝 Nouvelle Commande</b>

<b>Étape 3/5: Longueur</b>

Niveau: ${LEVEL_DISPLAY[level as keyof typeof LEVEL_DISPLAY]} - ${PRICES[level as keyof typeof PRICES]}€/page

Indiquez le nombre de pages (1 page = ~300 mots):`,
    keyboard,
    messageId
  );
}

async function handleLengthInput(userId: string, chatId: string, state: any, length: string) {
  const pages = parseInt(length);
  if (isNaN(pages) || pages < 1) {
    await sendTelegramMessage(chatId, '❌ Veuillez entrer un nombre de pages valide (minimum 1).');
    return;
  }

  const stack = state.navigation_stack || [];
  stack.push('enter_length');
  const draft = { ...state.order_draft, pages };
  
  await setState(userId, 'select_urgency', stack, draft);
  
  const keyboard = {
    inline_keyboard: [
      [{ text: '🚨 ULTRA EXPRESS 3h (×3.0)', callback_data: 'urgency_ultra_express' }],
      [{ text: '⚡ EXPRESS 6h (×2.5)', callback_data: 'urgency_express' }],
      [{ text: '🔥 URGENT 12h (×2.0)', callback_data: 'urgency_urgent' }],
      [{ text: '⏰ RAPIDE 24h (×1.5)', callback_data: 'urgency_rapid' }],
      [{ text: '📅 STANDARD 48h (×1.2)', callback_data: 'urgency_standard' }],
      [{ text: '📆 ÉCONOMIQUE 7j (×1.0)', callback_data: 'urgency_economic' }],
      [{ text: '🔙 Précédent', callback_data: 'back' }, { text: '🏠 Accueil', callback_data: 'home' }]
    ]
  };

  await sendTelegramMessage(
    chatId,
    `<b>📝 Nouvelle Commande</b>

<b>Étape 4/5: Urgence</b>

${pages} page(s) - ${LEVEL_DISPLAY[draft.level as keyof typeof LEVEL_DISPLAY]}

Sélectionnez le délai souhaité:`,
    keyboard
  );
}

async function handleUrgencySelect(userId: string, chatId: string, state: any, urgency: string, messageId?: number) {
  const draft = state.order_draft;
  const pricing = calculatePrice(draft.level, draft.pages, urgency);
  
  const stack = state.navigation_stack || [];
  stack.push('select_urgency');
  const completeDraft = { ...draft, urgency, pricing };
  
  await setState(userId, 'confirm_order', stack, completeDraft);
  
  const keyboard = {
    inline_keyboard: [
      [{ text: '✅ Confirmer', callback_data: 'confirm_payment' }],
      [{ text: '🔙 Précédent', callback_data: 'back' }, { text: '🏠 Accueil', callback_data: 'home' }]
    ]
  };
  
  await sendTelegramMessage(
    chatId,
    `<b>📝 Récapitulatif de votre commande</b>

<b>Sujet:</b> ${draft.subject}
<b>Niveau:</b> ${LEVEL_DISPLAY[draft.level as keyof typeof LEVEL_DISPLAY]}
<b>Longueur:</b> ${draft.pages} page(s)
<b>Délai:</b> ${URGENCY_DISPLAY[urgency as keyof typeof URGENCY_DISPLAY]}

<b>💰 Prix total: ${pricing.final}€</b>

<b>Confirmez-vous votre commande ?</b>`,
    keyboard,
    messageId
  );
}

async function handleConfirmPayment(userId: string, chatId: string, state: any, messageId?: number) {
  const draft = state.order_draft;
  const orderNumber = generateOrderNumber();
  const sessionToken = generateSessionToken();

  // Create order in database
  await supabase.from('orders').insert({
    order_number: orderNumber,
    telegram_user_id: userId,
    subject: draft.subject,
    academic_level: draft.level,
    length_pages: draft.pages,
    urgency: draft.urgency,
    base_price: draft.pricing.base,
    urgency_multiplier: draft.pricing.multiplier,
    final_price: draft.pricing.final,
    session_token: sessionToken,
    status: 'pending'
  });

  await setState(userId, 'home', []);

  const keyboard = {
    inline_keyboard: [
      [{ text: '🏠 Accueil', callback_data: 'home' }],
      [{ text: '💬 Contacter le support', callback_data: 'support' }]
    ]
  };

  await sendTelegramMessage(
    chatId,
    `<b>✅ Commande créée avec succès!</b>

<b>Numéro de commande:</b> <code>${orderNumber}</code>

<b>💳 Paiement par Crypto:</b>

<b>Bitcoin (BTC):</b>
<code>bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</code>

<b>Ethereum (ETH):</b>
<code>0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb</code>

<b>Litecoin (LTC):</b>
<code>ltc1qw508d6qejxtdg4y5r3zarvary0c5xw7k</code>

<b>USDT (TRC20):</b>
<code>TGDqJAoJTfb9erFzkGqq5fwJTQYbHmB5tM</code>

<b>Montant:</b> ${draft.pricing.final}€

Une fois le paiement effectué, envoyez-nous la preuve de transaction via le support. Votre travail sera commencé immédiatement après vérification! 🚀`,
    keyboard,
    messageId
  );
}

async function handleMyOrders(userId: string, chatId: string) {
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('telegram_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!orders || orders.length === 0) {
    const keyboard = {
      inline_keyboard: [
        [{ text: '📝 Nouvelle Commande', callback_data: 'new_order' }],
        [{ text: '🏠 Accueil', callback_data: 'home' }]
      ]
    };
    
    await sendTelegramMessage(
      chatId,
      `<b>📦 Mes Commandes</b>

Vous n'avez pas encore de commandes.`,
      keyboard
    );
    return;
  }

  const orderButtons = orders.map(order => [
    { text: `${order.order_number} - ${order.status}`, callback_data: `order_${order.order_number}` }
  ]);

  const keyboard = {
    inline_keyboard: [
      ...orderButtons,
      [{ text: '🏠 Accueil', callback_data: 'home' }]
    ]
  };

  await sendTelegramMessage(
    chatId,
    `<b>📦 Mes Commandes</b>

Vous avez ${orders.length} commande(s). Cliquez pour voir les détails:`,
    keyboard
  );
}

async function handleSupport(userId: string, chatId: string, state: any, messageId?: number) {
  const stack = state?.navigation_stack || [];
  stack.push(state?.current_step || 'home');
  await setState(userId, 'support', stack, state?.order_draft || {});
  
  const keyboard = {
    inline_keyboard: [[{ text: '🔙 Précédent', callback_data: 'back' }, { text: '🏠 Accueil', callback_data: 'home' }]]
  };

  await sendTelegramMessage(
    chatId,
    `<b>💬 Support Client</b>

Envoyez-nous votre message et notre équipe vous répondra dans les plus brefs délais.

<i>Tous les messages sont privés et sécurisés.</i>`,
    keyboard,
    messageId
  );
}

async function handleSupportMessage(userId: string, chatId: string, message: string, username?: string) {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update = await req.json();
    console.log('Received update:', JSON.stringify(update));

    const userId = await getOrCreateUser(update);
    if (!userId) {
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const chatId = update.message?.chat?.id?.toString() || update.callback_query?.message?.chat?.id?.toString();
    
    // Handle callback queries
    if (update.callback_query) {
      const data = update.callback_query.data;
      const state = await getState(userId);
      const messageId = update.callback_query.message.message_id;

      if (data === 'home') {
        await handleStart(userId, chatId, messageId);
      } else if (data === 'new_order') {
        await handleNewOrder(userId, chatId, state, messageId);
      } else if (data === 'my_orders') {
        await handleMyOrders(userId, chatId);
      } else if (data === 'support') {
        await handleSupport(userId, chatId, state, messageId);
      } else if (data === 'back') {
        const stack = state?.navigation_stack || [];
        const previousStep = stack.pop() || 'home';
        await setState(userId, previousStep, stack, state?.order_draft || {});
        
        if (previousStep === 'home') {
          await handleStart(userId, chatId, messageId);
        } else if (previousStep === 'enter_subject') {
          await handleNewOrder(userId, chatId, state, messageId);
        } else if (previousStep === 'select_level') {
          await handleSubjectInput(userId, chatId, state, state.order_draft.subject);
        } else if (previousStep === 'enter_length') {
          await handleLevelSelect(userId, chatId, state, state.order_draft.level, messageId);
        } else if (previousStep === 'select_urgency') {
          await handleLengthInput(userId, chatId, state, state.order_draft.pages.toString());
        }
      } else if (data.startsWith('level_')) {
        const level = data.replace('level_', '');
        await handleLevelSelect(userId, chatId, state, level, messageId);
      } else if (data.startsWith('urgency_')) {
        const urgency = data.replace('urgency_', '');
        await handleUrgencySelect(userId, chatId, state, urgency, messageId);
      } else if (data === 'confirm_payment') {
        await handleConfirmPayment(userId, chatId, state, messageId);
      }

      // Answer callback query
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: update.callback_query.id })
      });
    }
    
    // Handle text messages
    if (update.message?.text) {
      const text = update.message.text;
      const state = await getState(userId);

      console.log('Processing text message:', text, 'Current state:', state?.current_step);

      if (text === '/start') {
        console.log('Handling /start command');
        await handleStart(userId, chatId);
      } else if (state?.current_step === 'enter_subject') {
        await handleSubjectInput(userId, chatId, state, text);
      } else if (state?.current_step === 'enter_length') {
        await handleLengthInput(userId, chatId, state, text);
      } else if (state?.current_step === 'support') {
        await handleSupportMessage(userId, chatId, text, update.message.from?.username);
      } else {
        console.log('No matching state, defaulting to start');
        await handleStart(userId, chatId);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
