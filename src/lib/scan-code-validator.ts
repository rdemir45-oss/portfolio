/**
 * Kullanıcının yazdığı Python tarama kodunu güvenlik açısından doğrular.
 * AST parse kullanmıyoruz (Node.js ortamı), bunun yerine whitelist/blacklist
 * yaklaşımıyla tehlikeli kalıpları reddediyoruz.
 */

// ── Yasaklı kalıplar ──────────────────────────────────────────────────────────
const FORBIDDEN: { pattern: RegExp; reason: string }[] = [
  { pattern: /\bimport\b/,              reason: "import kullanılamaz" },
  { pattern: /__import__/,              reason: "__import__ kullanılamaz" },
  { pattern: /\bexec\b/,               reason: "exec kullanılamaz" },
  { pattern: /\beval\b/,               reason: "eval kullanılamaz" },
  { pattern: /\bopen\s*\(/,            reason: "open() kullanılamaz" },
  { pattern: /\b__[a-zA-Z_]+__/,       reason: "__ ile başlayan özel metodlar kullanılamaz" },
  { pattern: /\bos\s*\.\s*/,           reason: "os modülü kullanılamaz" },
  { pattern: /\bsys\s*\.\s*/,          reason: "sys modülü kullanılamaz" },
  { pattern: /\bsubprocess\b/,         reason: "subprocess kullanılamaz" },
  { pattern: /\bsocket\b/,             reason: "socket kullanılamaz" },
  { pattern: /\brequests\b/,           reason: "requests kullanılamaz" },
  { pattern: /\burllib\b/,             reason: "urllib kullanılamaz" },
  { pattern: /\bhttp\b/,               reason: "http kullanılamaz" },
  { pattern: /\bbuiltins\b/,           reason: "builtins kullanılamaz" },
  { pattern: /\bglobals\s*\(/,         reason: "globals() kullanılamaz" },
  { pattern: /\blocals\s*\(/,          reason: "locals() kullanılamaz" },
  { pattern: /\bvars\s*\(/,            reason: "vars() kullanılamaz" },
  { pattern: /\bgetattr\s*\(/,         reason: "getattr() kullanılamaz" },
  { pattern: /\bsetattr\s*\(/,         reason: "setattr() kullanılamaz" },
  { pattern: /\bcompile\s*\(/,         reason: "compile() kullanılamaz" },
  { pattern: /\bprint\s*\(/,           reason: "print() kullanılamaz" },
  { pattern: /\binput\s*\(/,           reason: "input() kullanılamaz" },
  { pattern: /\bwhile\s+True\b/,       reason: "Sonsuz döngü kullanılamaz" },
  { pattern: /\bfor\s+\w+\s+in\b/,     reason: "for döngüsü kullanılamaz" },
];

// Sadece bu fonksiyonlara izin var
const ALLOWED_FUNCTIONS = new Set([
  "rsi", "ema", "sma", "macd", "macd_signal", "macd_hist",
  "bb_upper", "bb_lower", "bb_mid", "bb_squeeze",
  "stoch", "atr", "volume_sma", "volume_spike",
  "highest", "lowest", "abs", "round", "min", "max",
  "bool", "int", "float",
]);

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateScanCode(code: string): ValidationResult {
  if (!code || typeof code !== "string") {
    return { valid: false, error: "Kod boş olamaz." };
  }

  const trimmed = code.trim();

  if (trimmed.length > 3000) {
    return { valid: false, error: "Kod maksimum 3000 karakter olabilir." };
  }

  const lines = trimmed.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#"));
  if (lines.length > 50) {
    return { valid: false, error: "Kod maksimum 50 aktif satır (yorum hariç) olabilir." };
  }

  // Yasaklı kalıpları kontrol et
  for (const { pattern, reason } of FORBIDDEN) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: `Güvenlik kısıtlaması: ${reason}.` };
    }
  }

  // signal = ... ataması zorunlu
  if (!/\bsignal\s*=/.test(trimmed)) {
    return { valid: false, error: 'Kod "signal = ..." şeklinde bir sonuç ataması içermelidir.' };
  }

  // Fonksiyon çağrılarını kontrol et (sadece izin verilenlere izin ver)
  const funcCalls = trimmed.matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g);
  for (const match of funcCalls) {
    const fnName = match[1];
    if (!ALLOWED_FUNCTIONS.has(fnName)) {
      return { valid: false, error: `"${fnName}()" fonksiyonu kullanılamaz. İzin verilen fonksiyonlar: ${[...ALLOWED_FUNCTIONS].join(", ")}` };
    }
  }

  return { valid: true };
}

// Kullanıcıya gösterilecek şablon
export const PYTHON_TEMPLATE = `# ─────────────────────────────────────────────────────────────────
# RdAlgo Özel Tarama Şablonu
# Her BIST hissesi için bu kod otomatik çalışır.
# "signal = True" olan hisseler sonuç listesine eklenir.
# ─────────────────────────────────────────────────────────────────
#
# 📊 Fiyat Verileri:
#   close       → Kapanış fiyatı
#   open_       → Açılış fiyatı
#   high        → En yüksek
#   low         → En düşük
#   volume      → Hacim (lot)
#   change_pct  → Günlük değişim (%)
#
# 📈 İndikatör Fonksiyonları:
#   rsi(period=14)              → RSI değeri (0-100)
#   ema(period=50)              → EMA değeri
#   sma(period=50)              → SMA değeri
#   macd()                      → MACD çizgisi
#   macd_signal()               → MACD sinyal çizgisi
#   macd_hist()                 → MACD histogramı
#   bb_upper(period=20, std=2)  → Bollinger üst bant
#   bb_lower(period=20, std=2)  → Bollinger alt bant
#   bb_squeeze()                → Bollinger sıkışması (True/False)
#   stoch(k=14, d=3)            → Stokastik %K
#   atr(period=14)              → ATR (volatilite)
#   volume_sma(period=20)       → Hacim ortalaması
#   volume_spike(mult=2)        → Hacim patlaması (True/False)
#   highest(period=20)          → Son N günün en yükseği
#   lowest(period=20)           → Son N günün en düşüğü
#
# ─────────────────────────────────────────────────────────────────
# Taramanızı aşağıya yazın:

rsi_val = rsi(14)
ema50   = ema(50)

# RSI aşırı satım bölgesinde VE fiyat EMA50 üzerinde
signal = rsi_val < 30 and close > ema50
`;
