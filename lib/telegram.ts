// ============================================================
// Interactive Telegram System — Notifications + Approval & AI Rewrite Buttons
// ============================================================

export async function sendTelegramNotification(
  message: string,
  replyMarkup?: Record<string, unknown>
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) return false;

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch (error) {
    console.error("Telegram notification error:", error);
    return false;
  }
}

// ── Send interactive post preview with Approve/Edit/Reject buttons ──
export async function sendPostForReviewTelegram(content: {
  id: string;
  platform: string;
  topic: string;
  text_content: string;
  image_url?: string;
}): Promise<boolean> {
  const platformEmoji: Record<string, string> = {
    linkedin: "💼",
    instagram: "📸",
    twitter: "🐦",
    facebook: "📘",
  };

  const emoji = platformEmoji[content.platform] || "📌";
  const truncatedText =
    content.text_content.length > 500
      ? content.text_content.slice(0, 500) + "...\n<i>(truncated)</i>"
      : content.text_content;

  const message =
    `📝 <b>New Draft Ready for Review!</b>\n\n` +
    `${emoji} <b>Platform:</b> ${content.platform.toUpperCase()}\n` +
    `💡 <b>Topic:</b> ${content.topic}\n` +
    `🆔 <code>${content.id}</code>\n\n` +
    `📄 <b>Post Draft:</b>\n${truncatedText}\n\n` +
    `👇 <b>Tap a button below to take action:</b>`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: "✅ Approve", callback_data: `approve:${content.id}` },
        { text: "✏️ AI Rewrite", callback_data: `rewrite:${content.id}` },
        { text: "❌ Reject", callback_data: `reject:${content.id}` },
      ],
    ],
  };

  return sendTelegramNotification(message, inlineKeyboard);
}

// ── Answer callback query (stops loading spinner on button) ──
export async function answerTelegramCallback(
  callbackQueryId: string,
  text: string
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return false;

  try {
    const url = `https://api.telegram.org/bot${botToken}/answerCallbackQuery`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: true,
      }),
    });
    return true;
  } catch {
    return false;
  }
}

// ── Edit existing Telegram message ──────────────────────────────
export async function editTelegramMessage(
  chatId: string | number,
  messageId: number,
  text: string,
  replyMarkup?: Record<string, unknown>
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return false;

  try {
    const url = `https://api.telegram.org/bot${botToken}/editMessageText`;
    const body: Record<string, unknown> = {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
    };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}
