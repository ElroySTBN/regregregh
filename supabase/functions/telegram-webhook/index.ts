import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './constants.ts';
import { getOrCreateUser } from './user.ts';
import { getState, setState } from './state.ts';
import { answerCallbackQuery, sendTelegramMessage } from './telegram.ts';
import { handleStart, handlePricing } from './handlers/navigation.ts';
import { handleSupport, handleSupportMessage } from './handlers/support.ts';
import { handleReferral, handleReferralCode } from './handlers/referral.ts';
import {
  handleNewOrder,
  handleSubjectInput,
  handleLevelSelect,
  handleLengthInput,
  handleUrgencySelect,
  handleConfirmPayment,
  showOrderSummary,
  handleInstructionFile,
  handlePaymentProof
} from './handlers/order.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const update = await req.json();
    console.log('Received update:', JSON.stringify(update));

    const userId = await getOrCreateUser(update);
    if (!userId) {
      return new Response(JSON.stringify({ ok: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const chatId = update.message?.chat?.id?.toString() || 
                   update.callback_query?.message?.chat?.id?.toString();
    
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
        
        await sendTelegramMessage(
          chatId,
          `<b>📝 Nouvelle Commande</b>

<b>Étape 1/5: Consigne</b>

Décrivez votre consigne de manière détaillée:`,
          { inline_keyboard: [[{ text: '🏠 Accueil', callback_data: 'home' }]] },
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
          { inline_keyboard: [[{ text: '🏠 Accueil', callback_data: 'home' }]] },
          messageId
        );
      } else if (data === 'referral') {
        await handleReferral(userId, chatId, messageId);
      } else if (data === 'pricing') {
        await handlePricing(chatId, messageId);
      } else if (data === 'support') {
        await handleSupport(userId, chatId, state, messageId);
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
          { inline_keyboard: [[{ text: '← Retour', callback_data: 'home' }]] },
          messageId
        );
      } else if (data === 'skip_referral') {
        await showOrderSummary(userId, chatId, state.order_draft, messageId);
      }

      await answerCallbackQuery(update.callback_query.id);
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
      } else if (state?.current_step === 'enter_referral_code') {
        await handleReferralCode(userId, chatId, state, text);
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
      let fileId: string;
      if (update.message?.photo) {
        const photo = update.message.photo[update.message.photo.length - 1];
        fileId = photo.file_id;
      } else if (update.message?.document) {
        fileId = update.message.document.file_id;
      } else {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      if (state?.current_step === 'awaiting_instruction_file') {
        await handleInstructionFile(userId, chatId, state, fileId);
      } else if (state?.current_step === 'awaiting_payment_proof' && state.order_draft?.order_number) {
        await handlePaymentProof(userId, chatId, state, fileId);
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
