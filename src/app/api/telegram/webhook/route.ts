import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TELEGRAM_BOT_TOKEN    = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";

async function sendMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function POST(req: NextRequest) {
  // Telegram webhook secret token doğrulaması
  // https://core.telegram.org/bots/api#setwebhook — X-Telegram-Bot-Api-Secret-Token header
  if (TELEGRAM_WEBHOOK_SECRET) {
    const incomingSecret = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
    if (incomingSecret !== TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ ok: true }); // 200 döndür ama işlem yapma (Telegram'ı yanıltma)
    }
  }

  try {
    const body = await req.json();
    const message = body?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId: number = message.chat?.id;
    const text: string = message.text ?? "";

    if (text.startsWith("/mychatid") || text.startsWith("/chatid") || text.startsWith("/id")) {
      await sendMessage(chatId, `Chat ID'niz: ${chatId}`);
    } else if (text.startsWith("/start")) {
      await sendMessage(chatId, `Merhaba! Bu bot pineSistem tarama bildirimlerini size iletir.\n\nChat ID'nizi öğrenmek için /mychatid yazın.`);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
