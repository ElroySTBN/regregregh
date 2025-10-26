import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './constants.ts';

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

export async function getState(userId: string) {
  const { data } = await supabase
    .from('conversation_state')
    .select('*')
    .eq('telegram_user_id', userId)
    .single();
  
  return data || null;
}

export async function setState(
  userId: string, 
  step: string, 
  stack: any[] = [], 
  draft: any = {}
) {
  await supabase.from('conversation_state').upsert({
    telegram_user_id: userId,
    current_step: step,
    navigation_stack: stack,
    order_draft: draft
  });
}

export { supabase };
