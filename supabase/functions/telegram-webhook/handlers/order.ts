import { sendTelegramMessage, getTelegramFile } from '../telegram.ts';
import { setState } from '../state.ts';
import { supabase } from '../state.ts';
import { 
  LEVEL_DISPLAY, 
  URGENCY_DISPLAY, 
  PRICES,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
} from '../constants.ts';
import { calculatePrice, generateOrderNumber, generateSessionToken } from '../utils.ts';

export async function handleNewOrder(
  userId: string, 
  chatId: string, 
  state: any, 
  messageId?: number
) {
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

export async function handleSubjectInput(
  userId: string, 
  chatId: string, 
  state: any, 
  subject: string
) {
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

export async function handleLevelSelect(
  userId: string, 
  chatId: string, 
  state: any, 
  level: string, 
  messageId?: number
) {
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

export async function handleLengthInput(
  userId: string, 
  chatId: string, 
  state: any, 
  length: string
) {
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

export async function handleUrgencySelect(
  userId: string, 
  chatId: string, 
  state: any, 
  urgency: string, 
  messageId?: number
) {
  const draft = state.order_draft;
  const pricing = calculatePrice(draft.level, draft.pages, urgency);
  
  const stack = state.navigation_stack || [];
  stack.push('select_urgency');
  const completeDraft = { ...draft, urgency, pricing };
  
  await setState(userId, 'enter_referral_code', stack, completeDraft);
  
  const keyboard = {
    inline_keyboard: [
      [{ text: '➡️ Continuer sans code', callback_data: 'skip_referral' }],
      [{ text: '🏠 Accueil', callback_data: 'home' }]
    ]
  };
  
  await sendTelegramMessage(
    chatId,
    `<b>📝 Code de parrainage (optionnel)</b>

Si vous avez un code de parrainage, envoyez-le maintenant pour bénéficier d'une réduction de 10% !

Sinon, cliquez sur "Continuer sans code" 👇`,
    keyboard,
    messageId
  );
}

export async function showOrderSummary(
  userId: string, 
  chatId: string, 
  draft: any, 
  messageId?: number
) {
  const instructionInfo = draft.instruction_file_url 
    ? '📎 <i>Fichier uploadé</i>' 
    : draft.subject;

  // Get user's wallet balance
  const { data: referralData } = await supabase
    .from('referral_codes')
    .select('available_balance')
    .eq('telegram_user_id', userId)
    .single();

  const walletBalance = referralData?.available_balance || 0;
  
  let priceBreakdown = `<b>💰 Prix:</b> ${draft.pricing.final}€`;
  
  if (draft.referral_discount) {
    priceBreakdown = `<b>💰 Prix initial:</b> ${(draft.pricing.final + draft.referral_discount).toFixed(2)}€
<b>🎁 Réduction parrainage (-10%):</b> -${draft.referral_discount}€
<b>💳 Prix final:</b> ${draft.pricing.final}€`;
  }

  if (walletBalance > 0) {
    const willUse = Math.min(walletBalance, draft.pricing.final);
    priceBreakdown += `

<b>💼 Bons d'achat disponibles:</b> ${walletBalance}€
<b>✨ Sera utilisé automatiquement:</b> ${willUse}€
<b>🎯 Reste à payer:</b> ${(draft.pricing.final - willUse).toFixed(2)}€`;
  }

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
<b>Délai:</b> ${URGENCY_DISPLAY[draft.urgency as keyof typeof URGENCY_DISPLAY]}

${priceBreakdown}

<b>Tout est correct ?</b>`,
    keyboard,
    messageId
  );
}

export async function handleConfirmPayment(
  userId: string, 
  chatId: string, 
  state: any, 
  messageId?: number
) {
  const draft = state.order_draft;
  const orderNumber = generateOrderNumber();
  const sessionToken = generateSessionToken();

  // Get user's wallet balance
  const { data: referralData } = await supabase
    .from('referral_codes')
    .select('available_balance')
    .eq('telegram_user_id', userId)
    .single();

  const walletBalance = referralData?.available_balance || 0;
  const walletAmountUsed = Math.min(walletBalance, draft.pricing.final);
  const finalPrice = draft.pricing.final - walletAmountUsed;

  // Create order in database
  await supabase.from('orders').insert({
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
    status: 'pending',
    used_referral_code: draft.referral_code || null,
    wallet_amount_used: walletAmountUsed
  });

  // Deduct wallet balance if used
  if (walletAmountUsed > 0) {
    await supabase
      .from('referral_codes')
      .update({ available_balance: walletBalance - walletAmountUsed })
      .eq('telegram_user_id', userId);
  }

  await setState(userId, 'awaiting_payment_proof', [], { order_number: orderNumber });

  const keyboard = {
    inline_keyboard: [
      [{ text: '📷 Envoyer la preuve de paiement', callback_data: 'upload_proof' }],
      [{ text: '💬 Support', callback_data: 'support' }],
      [{ text: '🏠 Accueil', callback_data: 'home' }]
    ]
  };

  let paymentMessage = `<b>✅ Commande créée!</b>

<b>N° commande:</b> <code>${orderNumber}</code>

<b>💰 Prix total:</b> ${draft.pricing.final}€`;

  if (walletAmountUsed > 0) {
    paymentMessage += `
<b>🎁 Bons d'achat utilisés:</b> -${walletAmountUsed}€
<b>💳 Montant à payer:</b> ${finalPrice}€`;
  } else {
    paymentMessage += `
<b>💳 Montant à payer:</b> ${finalPrice}€`;
  }

  if (finalPrice > 0) {
    paymentMessage += `

<b>💳 Paiement Crypto:</b>

<b>Bitcoin (BTC):</b>
<code>bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</code>

<b>Ethereum (ETH):</b>
<code>0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb</code>

<b>USDT (TRC20):</b>
<code>TGDqJAoJTfb9erFzkGqq5fwJTQYbHmB5tM</code>

📷 <b>Envoyez votre preuve de paiement</b> pour qu'on commence immédiatement! 🚀`;
  } else {
    paymentMessage += `

✅ <b>Commande entièrement payée avec vos bons d'achat!</b>

📸 Envoyez quand même une capture d'écran de cette conversation comme confirmation.`;
  }

  await sendTelegramMessage(
    chatId,
    paymentMessage,
    keyboard,
    messageId
  );
}

export async function handleInstructionFile(
  userId: string, 
  chatId: string, 
  state: any, 
  fileId: string
) {
  const fileUrl = await getTelegramFile(fileId);
  
  if (!fileUrl) {
    await sendTelegramMessage(chatId, '❌ Erreur lors de la récupération du fichier.');
    return;
  }
  
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

export async function handlePaymentProof(
  userId: string, 
  chatId: string, 
  state: any, 
  fileId: string
) {
  const fileUrl = await getTelegramFile(fileId);
  
  if (!fileUrl) {
    await sendTelegramMessage(chatId, '❌ Erreur lors de la récupération du fichier.');
    return;
  }
  
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
        [{ text: '💬 Support', callback_data: 'support' }],
        [{ text: '🏠 Accueil', callback_data: 'home' }]
      ]
    }
  );
}
