import { supabase } from './state.ts';

export async function getOrCreateUser(update: any): Promise<string | null> {
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
