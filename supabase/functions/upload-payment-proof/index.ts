import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_number, file_url, telegram_user_id } = await req.json();
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Download the file from Telegram
    const fileResponse = await fetch(file_url);
    const fileBlob = await fileResponse.blob();
    const fileBuffer = await fileBlob.arrayBuffer();
    
    // Generate unique filename
    const fileName = `${order_number}_${Date.now()}.jpg`;
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(`${telegram_user_id}/${fileName}`, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Upload error: ${uploadError.message}`);
    }

    // Update order with proof URL
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        payment_proof_url: `${telegram_user_id}/${fileName}`,
        status: 'paid'
      })
      .eq('order_number', order_number);

    if (updateError) {
      throw new Error(`Update error: ${updateError.message}`);
    }

    // Send confirmation message
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegram_user_id,
        text: `<b>✅ Preuve de paiement reçue!</b>\n\nVotre preuve de paiement pour la commande <code>${order_number}</code> a été enregistrée avec succès.\n\nNotre équipe va vérifier votre paiement et démarrer votre travail dans les plus brefs délais. 🚀`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🏠 Accueil', callback_data: 'home' }],
            [{ text: '💬 Contacter le support', callback_data: 'support' }]
          ]
        }
      })
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
