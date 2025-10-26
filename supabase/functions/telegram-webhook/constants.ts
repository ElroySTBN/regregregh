// Price per page for each academic level
export const PRICES = {
  college: 12,
  highschool: 16,
  university: 22,
  master: 28,
  phd: 38
} as const;

// Urgency multipliers for pricing
export const URGENCY_MULTIPLIERS = {
  six_hours: 1.8,
  twelve_hours: 1.7,
  twenty_four_hours: 1.5,
  forty_eight_hours: 1.3,
  three_days: 1.2,
  seven_days: 1.0,
  fourteen_days: 0.9
} as const;

// Display strings for urgency options
export const URGENCY_DISPLAY = {
  six_hours: '⚡ 6h (+80%)',
  twelve_hours: '🔥 12h (+70%)',
  twenty_four_hours: '⏰ 24h (+50%)',
  forty_eight_hours: '📅 48h (+30%)',
  three_days: '📆 3 jours (+20%)',
  seven_days: '📋 7 jours (Standard)',
  fourteen_days: '🎯 14 jours (-10%)'
} as const;

// Display strings for academic levels
export const LEVEL_DISPLAY = {
  college: '🏫 Collège',
  highschool: '🎓 Lycée',
  university: '🏛️ Université',
  master: '👨‍🎓 Master',
  phd: '🔬 Doctorat'
} as const;

// Environment variables
export const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
export const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
export const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
