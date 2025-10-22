import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id } = await req.json();

    if (!order_id) {
      throw new Error('order_id is required');
    }

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Update order status to paid
    await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', order_id);

    // If order used a referral code, credit the referrer
    if (order.used_referral_code) {
      const { data: referralCode } = await supabase
        .from('referral_codes')
        .select('telegram_user_id, available_balance, total_earnings')
        .eq('code', order.used_referral_code)
        .single();

      if (referralCode) {
        // Calculate commission: 10€ per 100€ spent (10%)
        const commission = Math.floor(order.final_price / 100) * 10;
        
        if (commission > 0) {
          const currentBalance = referralCode.available_balance || 0;
          const currentEarnings = referralCode.total_earnings || 0;
          
          // Update referrer's balance and earnings
          await supabase
            .from('referral_codes')
            .update({
              available_balance: currentBalance + commission,
              total_earnings: currentEarnings + commission
            })
            .eq('code', order.used_referral_code);

          // Record the referral usage
          await supabase
            .from('referral_usage')
            .insert({
              order_id: order.id,
              referrer_telegram_user_id: referralCode.telegram_user_id,
              referred_telegram_user_id: order.telegram_user_id,
              discount_amount: order.final_price * 0.1, // 10% discount given
              commission_amount: commission,
              commission_paid: true
            });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Order marked as paid and referral credited' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
