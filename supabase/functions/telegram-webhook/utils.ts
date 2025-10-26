import { PRICES, URGENCY_MULTIPLIERS } from './constants.ts';

export function generateOrderNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'ME-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateSessionToken(): string {
  return crypto.randomUUID();
}

export function calculatePrice(
  level: string, 
  pages: number, 
  urgency: string
): { base: number; multiplier: number; final: number } {
  const base = PRICES[level as keyof typeof PRICES] * pages;
  const multiplier = URGENCY_MULTIPLIERS[urgency as keyof typeof URGENCY_MULTIPLIERS];
  const final = Math.round(base * multiplier);
  return { base, multiplier, final };
}
