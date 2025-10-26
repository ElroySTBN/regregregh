import { sendTelegramMessage } from '../telegram.ts';
import { setState } from '../state.ts';
import { supabase } from '../state.ts';

export async function handleReferral(userId: string, chatId: string, messageId?: number) {
  // Get or create referral code for user
  let { data: referralData } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('telegram_user_id', userId)
    .single();

  if (!referralData) {
    // Generate new referral code
    const { data: codeResult } = await supabase.rpc('generate_referral_code');
    
    const { data: newReferral } = await supabase
      .from('referral_codes')
      .insert({
        telegram_user_id: userId,
        code: codeResult,
        available_balance: 0
      })
      .select()
      .single();
    
    referralData = newReferral;
  }

  // Get referral stats
  const { data: referrals } = await supabase
    .from('referral_usage')
    .select('*')
    .eq('referrer_telegram_user_id', userId);

  const referralCount = referrals?.length || 0;
  const totalEarnings = referralData?.total_earnings || 0;
  const availableBalance = referralData?.available_balance || 0;

  const keyboard = {
    inline_keyboard: [
      [{ text: '📤 Partager mon code', url: `https://t.me/share/url?url=Utilise mon code FlashGrade: ${referralData?.code} pour obtenir 10% de réduction sur ta première commande!&text=Code promo FlashGrade` }],
      [{ text: '🏠 Accueil', callback_data: 'home' }]
    ]
  };

  await sendTelegramMessage(
    chatId,
    `<b>🎁 Programme de Parrainage</b>

<b>Ton code personnel:</b> <code>${referralData?.code}</code>

<b>💰 Ta cagnotte:</b> ${availableBalance}€ en bons d'achat

<b>Comment ça marche ?</b>
• Partage ton code avec des amis
• Ils obtiennent <b>10% de réduction</b> sur leur 1ère commande
• Tu reçois <b>10€ de bons d'achat</b> pour chaque 100€ dépensés par tes filleuls
• Utilise tes bons d'achat pour payer tes prochaines commandes
• <b>Cumulable à l'infini !</b> 🚀

<b>Tes statistiques:</b>
👥 Personnes parrainées: ${referralCount}
💵 Total des bons gagnés: ${totalEarnings}€

<i>💡 Clique sur "Partager" pour envoyer ton code facilement!</i>`,
    keyboard,
    messageId
  );
}

export async function handleReferralCode(
  userId: string, 
  chatId: string, 
  state: any, 
  code: string
) {
  const draft = state.order_draft;
  
  // Validate referral code
  const { data: referralData } = await supabase
    .from('referral_codes')
    .select('telegram_user_id')
    .eq('code', code.toUpperCase())
    .single();

  if (!referralData) {
    await sendTelegramMessage(
      chatId,
      `❌ Code invalide. Réessayez ou cliquez sur "Continuer sans code".`,
      {
        inline_keyboard: [
          [{ text: '➡️ Continuer sans code', callback_data: 'skip_referral' }],
          [{ text: '🏠 Accueil', callback_data: 'home' }]
        ]
      }
    );
    return;
  }

  if (referralData.telegram_user_id === userId) {
    await sendTelegramMessage(
      chatId,
      `❌ Vous ne pouvez pas utiliser votre propre code !`,
      {
        inline_keyboard: [
          [{ text: '➡️ Continuer sans code', callback_data: 'skip_referral' }],
          [{ text: '🏠 Accueil', callback_data: 'home' }]
        ]
      }
    );
    return;
  }

  // Apply 10% discount
  const discount = Math.round(draft.pricing.final * 0.1 * 100) / 100;
  const discountedPrice = draft.pricing.final - discount;
  
  const updatedDraft = {
    ...draft,
    referral_code: code.toUpperCase(),
    referral_discount: discount,
    pricing: {
      ...draft.pricing,
      final: discountedPrice
    }
  };

  const stack = state.navigation_stack || [];
  await setState(userId, 'confirm_order', stack, updatedDraft);

  // Import and call showOrderSummary from order handlers
  const { showOrderSummary } = await import('./order.ts');
  await showOrderSummary(userId, chatId, updatedDraft);
}
