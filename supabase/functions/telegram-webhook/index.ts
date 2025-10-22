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
  six_hours: 1.8,
  twelve_hours: 1.7,
  twenty_four_hours: 1.5,
  forty_eight_hours: 1.3,
  three_days: 1.2,
  seven_days: 1.0,
  fourteen_days: 0.9
};

// Urgency display
const URGENCY_DISPLAY = {
  six_hours: '⚡ 6h (+80%)',
  twelve_hours: '🔥 12h (+70%)',
  twenty_four_hours: '⏰ 24h (+50%)',
  forty_eight_hours: '📅 48h (+30%)',
  three_days: '📆 3 jours (+20%)',
  seven_days: '📋 7 jours (Standard)',
  fourteen_days: '🎯 14 jours (-10%)'
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
      [{ text: '📝 Nouvelle commande', callback_data: 'new_order' }],
      [{ text: '📋 Mes commandes', callback_data: 'my_orders' }],
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

async function handleNewOrder(userId: string, chatId: string, state: any, messageId?: number) {
  const stack = state?.navigation_stack || [];
  stack.push('home');
  await setState(userId, 'choose_instruction_method', stack, {});
  
  const keyboard = {
    inline_keyboard: [
      [{ text: '📝 Écrire la consigne', callback_data: 'type_instruction' }],
      [{ text: '📎 Uploader un fichier', callback_data: 'upload_instruction' }],
      [{ text: '🏠 Accueil', callback_data: 'home' }]
    ]
  };

  await sendTelegramMessage(
    chatId,
    `<b>📝 Nouvelle Commande</b>

<b>Étape 1/5: Consigne du devoir</b>

Comment souhaitez-vous fournir votre consigne ?

📝 <b>Écrire</b> : Tapez votre consigne
📎 <b>Upload</b> : Envoyez une photo ou PDF de votre consigne

<i>💡 L'upload est souvent plus rapide !</i>`,
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
      [{ text: '🏠 Accueil', callback_data: 'home' }]
    ]
  };

  await sendTelegramMessage(
    chatId,
    `<b>📝 Nouvelle Commande</b>

<b>Étape 2/5: Niveau académique</b>

Consigne reçue ✅

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
    inline_keyboard: [[{ text: '🏠 Accueil', callback_data: 'home' }]]
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
      [{ text: '⚡ 6h (+80%)', callback_data: 'urgency_six_hours' }],
      [{ text: '🔥 12h (+70%)', callback_data: 'urgency_twelve_hours' }],
      [{ text: '⏰ 24h (+50%)', callback_data: 'urgency_twenty_four_hours' }],
      [{ text: '📅 48h (+30%)', callback_data: 'urgency_forty_eight_hours' }],
      [{ text: '📆 3 jours (+20%)', callback_data: 'urgency_three_days' }],
      [{ text: '📋 7 jours (Standard)', callback_data: 'urgency_seven_days' }],
      [{ text: '🎯 14 jours (-10%)', callback_data: 'urgency_fourteen_days' }],
      [{ text: '🏠 Accueil', callback_data: 'home' }]
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
  
  const instructionInfo = draft.instruction_file_url 
    ? '📎 <i>Fichier uploadé</i>' 
    : draft.subject;
  
  const keyboard = {
    inline_keyboard: [
      [{ text: '✅ Confirmer et payer', callback_data: 'confirm_payment' }],
      [{ text: '🏠 Accueil', callback_data: 'home' }]
    ]
  };
  
  await sendTelegramMessage(
    chatId,
    `<b>📝 Récapitulatif de votre commande</b>

<b>Consigne:</b> ${instructionInfo}
<b>Niveau:</b> ${LEVEL_DISPLAY[draft.level as keyof typeof LEVEL_DISPLAY]}
<b>Longueur:</b> ${draft.pages} page(s)
<b>Délai:</b> ${URGENCY_DISPLAY[urgency as keyof typeof URGENCY_DISPLAY]}

<b>💰 Prix total: ${pricing.final}€</b>

<b>Tout est correct ?</b>`,
    keyboard,
    messageId
  );
}

async function handleConfirmPayment(userId: string, chatId: string, state: any, messageId?: number) {
  const draft = state.order_draft;
  const orderNumber = generateOrderNumber();
  const sessionToken = generateSessionToken();

  // Create order in database
  const { data: orderData } = await supabase.from('orders').insert({
    order_number: orderNumber,
    telegram_user_id: userId,
    subject: draft.subject || '(Fichier uploadé)',
    academic_level: draft.level,
    length_pages: draft.pages,
    urgency: draft.urgency,
    base_price: draft.pricing.base,
    urgency_multiplier: draft.pricing.multiplier,
    final_price: draft.pricing.final,
    session_token: sessionToken,
    instruction_file_url: draft.instruction_file_url || null,
    status: 'pending'
  }).select().single();

  await setState(userId, 'awaiting_payment_proof', [], { order_number: orderNumber });

  const keyboard = {
    inline_keyboard: [
      [{ text: '📷 Envoyer la preuve de paiement', callback_data: 'upload_proof' }],
      [{ text: '💬 Support', callback_data: 'support' }],
      [{ text: '🏠 Accueil', callback_data: 'home' }]
    ]
  };

  await sendTelegramMessage(
    chatId,
    `<b>✅ Commande créée!</b>

<b>N° commande:</b> <code>${orderNumber}</code>

<b>💳 Paiement Crypto:</b>

<b>Bitcoin (BTC):</b>
<code>bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</code>

<b>Ethereum (ETH):</b>
<code>0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb</code>

<b>USDT (TRC20):</b>
<code>TGDqJAoJTfb9erFzkGqq5fwJTQYbHmB5tM</code>

<b>Montant:</b> ${draft.pricing.final}€

📷 <b>Envoyez votre preuve de paiement</b> pour qu'on commence immédiatement! 🚀`,
    keyboard,
    messageId
  );
}

async function handleMyOrders(userId: string, chatId: string, messageId?: number) {
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('telegram_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!orders || orders.length === 0) {
    const keyboard = {
      inline_keyboard: [
        [{ text: '📝 Nouvelle commande', callback_data: 'new_order' }],
        [{ text: '🏠 Accueil', callback_data: 'home' }]
      ]
    };
    
    await sendTelegramMessage(
      chatId,
      `<b>📋 Mes Commandes</b>

Aucune commande pour l'instant.`,
      keyboard,
      messageId
    );
    return;
  }

  const orderButtons = orders.map(order => [
    { text: `${order.order_number} - ${order.status}`, callback_data: `order_${order.order_number}` }
  ]);

  const keyboard = {
    inline_keyboard: [
      ...orderButtons,
      [{ text: '📝 Nouvelle commande', callback_data: 'new_order' }],
      [{ text: '🏠 Accueil', callback_data: 'home' }]
    ]
  };

  await sendTelegramMessage(
    chatId,
    `<b>📋 Mes Commandes</b>

Vous avez ${orders.length} commande(s):`,
    keyboard,
    messageId
  );
}

async function handlePricing(chatId: string, messageId?: number) {
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

async function handleSupport(userId: string, chatId: string, state: any, messageId?: number) {
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
      } else if (data === 'type_instruction') {
        const stack = state?.navigation_stack || [];
        stack.push('choose_instruction_method');
        await setState(userId, 'enter_subject', stack, {});
        
        const keyboard = {
          inline_keyboard: [[{ text: '🏠 Accueil', callback_data: 'home' }]]
        };
        
        await sendTelegramMessage(
          chatId,
          `<b>📝 Nouvelle Commande</b>

<b>Étape 1/5: Consigne</b>

Décrivez votre consigne de manière détaillée:`,
          keyboard,
          messageId
        );
      } else if (data === 'upload_instruction') {
        const stack = state?.navigation_stack || [];
        stack.push('choose_instruction_method');
        await setState(userId, 'awaiting_instruction_file', stack, {});
        
        await sendTelegramMessage(
          chatId,
          `<b>📎 Upload de la consigne</b>

Envoyez-moi votre consigne:
• 📸 Photo du document
• 📄 Fichier PDF
• 🖼️ Capture d'écran

<i>Un seul fichier suffit.</i>`,
          {
            inline_keyboard: [
              [{ text: '🏠 Accueil', callback_data: 'home' }]
            ]
          },
          messageId
        );
      } else if (data === 'my_orders') {
        await handleMyOrders(userId, chatId, messageId);
      } else if (data === 'pricing') {
        await handlePricing(chatId, messageId);
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
      } else if (data === 'upload_proof') {
        await sendTelegramMessage(
          chatId,
          `<b>📷 Envoi de la preuve de paiement</b>

Envoyez-moi une photo de votre preuve de paiement (capture d'écran de la transaction).

Vous pouvez :
• 📸 Prendre une photo
• 🖼️ Envoyer une image depuis votre galerie
• 📋 Faire une capture d'écran et l'envoyer

<i>Une seule image suffit.</i>`,
          {
            inline_keyboard: [
              [{ text: '← Retour', callback_data: 'home' }]
            ]
          },
          messageId
        );
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

    // Handle photo/document uploads
    if (update.message?.photo || update.message?.document) {
      const state = await getState(userId);
      
      // Get file info
      let fileId, fileName;
      if (update.message?.photo) {
        const photo = update.message.photo[update.message.photo.length - 1];
        fileId = photo.file_id;
        fileName = `photo_${Date.now()}.jpg`;
      } else if (update.message?.document) {
        fileId = update.message.document.file_id;
        fileName = update.message.document.file_name || `document_${Date.now()}`;
      }
      
      if (state?.current_step === 'awaiting_instruction_file') {
        // Upload instruction file
        const fileResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
        const fileData = await fileResponse.json();
        
        if (fileData.ok) {
          const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileData.result.file_path}`;
          
          // Upload to storage
          const uploadResponse = await fetch(`${SUPABASE_URL}/functions/v1/upload-order-instruction`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
              file_url: fileUrl,
              telegram_user_id: userId
            })
          });
          
          const uploadResult = await uploadResponse.json();
          
          if (uploadResult.success) {
            const stack = state.navigation_stack || [];
            stack.push('awaiting_instruction_file');
            const draft = { 
              ...state.order_draft, 
              instruction_file_url: uploadResult.file_path,
              subject: '(Fichier uploadé)' 
            };
            
            await setState(userId, 'select_level', stack, draft);
            
            const keyboard = {
              inline_keyboard: [
                [{ text: '🏫 Collège (12€/page)', callback_data: 'level_college' }],
                [{ text: '🎓 Lycée (16€/page)', callback_data: 'level_highschool' }],
                [{ text: '🏛️ Université (22€/page)', callback_data: 'level_university' }],
                [{ text: '👨‍🎓 Master (28€/page)', callback_data: 'level_master' }],
                [{ text: '🔬 Doctorat (38€/page)', callback_data: 'level_phd' }],
                [{ text: '🏠 Accueil', callback_data: 'home' }]
              ]
            };
            
            await sendTelegramMessage(
              chatId,
              `<b>📝 Nouvelle Commande</b>

<b>Étape 2/5: Niveau académique</b>

Fichier reçu ✅

Sélectionnez votre niveau académique:`,
              keyboard
            );
          }
        }
      } else if (state?.current_step === 'awaiting_payment_proof' && state.order_draft?.order_number) {
        // Upload payment proof
        const fileResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
        const fileData = await fileResponse.json();
        
        if (fileData.ok) {
          const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileData.result.file_path}`;
          
          await fetch(`${SUPABASE_URL}/functions/v1/upload-payment-proof`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
              order_number: state.order_draft.order_number,
              file_url: fileUrl,
              telegram_user_id: userId
            })
          });
          
          await setState(userId, 'home', []);
          
          await sendTelegramMessage(
            chatId,
            `✅ <b>Preuve de paiement reçue!</b>

Votre preuve a été envoyée avec succès. Notre équipe va la vérifier et vous recevrez une confirmation rapidement.

<b>Numéro de commande:</b> <code>${state.order_draft.order_number}</code>

Merci de votre confiance! 🙏`,
            {
              inline_keyboard: [
                [{ text: '📋 Mes commandes', callback_data: 'my_orders' }],
                [{ text: '💬 Support', callback_data: 'support' }],
                [{ text: '🏠 Accueil', callback_data: 'home' }]
              ]
            }
          );
        }
      } else {
        // File sent in other context
        await sendTelegramMessage(
          chatId,
          `📎 Fichier reçu! Pour créer une commande, utilisez le menu principal.`,
          {
            inline_keyboard: [
              [{ text: '📝 Nouvelle commande', callback_data: 'new_order' }],
              [{ text: '🏠 Accueil', callback_data: 'home' }]
            ]
          }
        );
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
