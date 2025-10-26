import { TELEGRAM_BOT_TOKEN } from './constants.ts';

export async function sendTelegramMessage(
  chatId: string, 
  text: string, 
  keyboard?: any, 
  messageId?: number
) {
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

export async function answerCallbackQuery(callbackQueryId: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId })
  });
}

export async function getTelegramFile(fileId: string) {
  const fileResponse = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
  );
  const fileData = await fileResponse.json();
  
  if (fileData.ok) {
    return `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileData.result.file_path}`;
  }
  
  return null;
}
