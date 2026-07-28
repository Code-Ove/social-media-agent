import { NextRequest, NextResponse } from "next/server";
import { contentDb } from "@/lib/db";
import { answerTelegramCallback, editTelegramMessage, sendTelegramNotification } from "@/lib/telegram";
import { generateContent } from "@/ai/router";

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // 1. Handle Inline Button Clicks (Callback Queries)
    if (update.callback_query) {
      const callback = update.callback_query;
      const data = callback.data as string;
      const chatId = callback.message.chat.id;
      const messageId = callback.message.message_id;

      if (data.startsWith("approve:")) {
        const id = data.replace("approve:", "");
        await contentDb.updateStatus(id, "approved");
        await answerTelegramCallback(callback.id, "✅ Post Approved!");

        await editTelegramMessage(
          chatId,
          messageId,
          `✅ <b>POST APPROVED!</b>\n\n` +
          `🆔 <code>${id}</code>\n` +
          ` status has been updated to <b>APPROVED</b> and scheduled for live posting.`
        );
      } else if (data.startsWith("reject:")) {
        const id = data.replace("reject:", "");
        await contentDb.updateStatus(id, "rejected");
        await answerTelegramCallback(callback.id, "❌ Post Rejected");

        await editTelegramMessage(
          chatId,
          messageId,
          `❌ <b>POST REJECTED</b>\n\n` +
          `🆔 <code>${id}</code>\n` +
          `This draft has been discarded.`
        );
      } else if (data.startsWith("rewrite:")) {
        const id = data.replace("rewrite:", "");
        await answerTelegramCallback(callback.id, "✏️ Send your instructions!");

        await sendTelegramNotification(
          `✏️ <b>AI Rewrite Requested for Post <code>${id}</code></b>\n\n` +
          `Reply to this message with your instructions (or type <code>/rewrite ${id} make it shorter and punchier</code>)!`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // 2. Handle Text Replies & Commands
    if (update.message && update.message.text) {
      const text = update.message.text as string;
      const replyToMsg = update.message.reply_to_message;

      // Extract Post ID either from /rewrite <id> <instructions> OR from reply to message containing 🆔 <code>id</code>
      let postId = "";
      let instructions = "";

      if (text.startsWith("/rewrite ")) {
        const parts = text.split(" ");
        postId = parts[1];
        instructions = parts.slice(2).join(" ");
      } else if (replyToMsg && replyToMsg.text) {
        const match = replyToMsg.text.match(/🆔\s*<code>([^<]+)<\/code>/) || replyToMsg.text.match(/Post\s*<code>([^<]+)<\/code>/);
        if (match) {
          postId = match[1];
          instructions = text;
        }
      }

      if (postId && instructions) {
        const existing = await contentDb.getById(postId) as { id: string; topic: string; platform: string; text_content: string } | undefined;

        if (!existing) {
          await sendTelegramNotification(`⚠️ Post ID <code>${postId}</code> not found.`);
          return NextResponse.json({ ok: true });
        }

        await sendTelegramNotification(`⏳ <b>Rewriting post <code>${postId}</code> using AI...</b>\n\n<i>Instruction:</i> "${instructions}"`);

        const prompt = `You are a social media post editor.

Original Post (${existing.platform}):
${existing.text_content}

User Edit Request:
${instructions}

Rewrite the post adhering strictly to the user's instructions while keeping it appropriate for ${existing.platform}.
Return ONLY the final rewritten post text.`;

        const newText = await generateContent(prompt, "text");

        // Update database with rewritten text
        await contentDb.update(postId, { text_content: newText });

        // Send back new preview with buttons!
        await sendTelegramNotification(
          `✨ <b>POST REWRITTEN BY AI!</b>\n\n` +
          `🆔 <code>${postId}</code>\n` +
          `<b>Platform:</b> ${existing.platform.toUpperCase()}\n\n` +
          `📄 <b>Updated Post:</b>\n${newText}`,
          {
            inline_keyboard: [
              [
                { text: "✅ Approve", callback_data: `approve:${postId}` },
                { text: "✏️ AI Rewrite", callback_data: `rewrite:${postId}` },
                { text: "❌ Reject", callback_data: `reject:${postId}` },
              ],
            ],
          }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Telegram webhook error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
