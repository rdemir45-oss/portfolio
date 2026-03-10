import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";

async function sendMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function POST(req: NextRequest) {
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
