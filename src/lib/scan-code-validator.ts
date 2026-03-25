/**
 * Kullanıcının yazdığı Python tarama kodunu güvenlik açısından doğrular.
 * AST parse kullanmıyoruz (Node.js ortamı), bunun yerine whitelist/blacklist
 * yaklaşımıyla tehlikeli kalıpları reddediyoruz.
 *
 * Güvenlik katmanları:
 * 1. Unicode normalizasyonu (NFKC) — görünmez/homoglyph karakter bypass engeli
 * 2. Inline yorum stripping — yorumlar sonraki kontrolleri etkilemesin diye temizlenir
 * 3. Blacklist pattern kontrolü (tehlikeli fonksiyonlar, modüller, döngüler)
 * 4. Whitelist fonksiyon kontrolü — yalnızca izin verilenler
 * 5. signal = ... zorunluluğu
 */

// ── Yasaklı kalıplar ──────────────────────────────────────────────────────────
const FORBIDDEN: { pattern: RegExp; reason: string }[] = [
  // Modül erişimi
  { pattern: /\bimport\b/i,                reason: "import kullanılamaz" },
  { pattern: /__import__/,                 reason: "__import__ kullanılamaz" },
  // Kod çalıştırma
  { pattern: /\bexec\s*\(/,               reason: "exec() kullanılamaz" },
  { pattern: /\beval\s*\(/,               reason: "eval() kullanılamaz" },
  { pattern: /\bcompile\s*\(/,            reason: "compile() kullanılamaz" },
  // Dosya/ağ erişimi
  { pattern: /\bopen\s*\(/,               reason: "open() kullanılamaz" },
  { pattern: /\bsocket\b/,               reason: "socket kullanılamaz" },
  { pattern: /\brequests\b/,             reason: "requests kullanılamaz" },
  { pattern: /\burllib\b/,               reason: "urllib kullanılamaz" },
  { pattern: /\bhttp\b/,                 reason: "http kullanılamaz" },
  // Tehlikeli built-in'ler
  { pattern: /\bbuiltins\b/,             reason: "builtins kullanılamaz" },
  { pattern: /\bglobals\s*\(/,           reason: "globals() kullanılamaz" },
  { pattern: /\blocals\s*\(/,            reason: "locals() kullanılamaz" },
  { pattern: /\bvars\s*\(/,              reason: "vars() kullanılamaz" },
  { pattern: /\bgetattr\s*\(/,           reason: "getattr() kullanılamaz" },
  { pattern: /\bsetattr\s*\(/,           reason: "setattr() kullanılamaz" },
  { pattern: /\bdelattr\s*\(/,           reason: "delattr() kullanılamaz" },
  { pattern: /\bhasattr\s*\(/,           reason: "hasattr() kullanılamaz" },
  { pattern: /\bprint\s*\(/,             reason: "print() kullanılamaz" },
  { pattern: /\binput\s*\(/,             reason: "input() kullanılamaz" },
  { pattern: /\b__[a-zA-Z0-9_]+__/,      reason: "Dunder (__xx__) ifadeler kullanılamaz" },
  // Sistem modülleri
  { pattern: /\bos\b/,                   reason: "os modülü kullanılamaz" },
  { pattern: /\bsys\b/,                  reason: "sys modülü kullanılamaz" },
  { pattern: /\bsubprocess\b/,           reason: "subprocess kullanılamaz" },
  { pattern: /\bshutil\b/,               reason: "shutil kullanılamaz" },
  { pattern: /\bpathlib\b/,              reason: "pathlib kullanılamaz" },
  { pattern: /\bctypes\b/,               reason: "ctypes kullanılamaz" },
  { pattern: /\bpickle\b/,               reason: "pickle kullanılamaz" },
  // Döngü/kontrol akışı
  { pattern: /\bwhile\b/,                reason: "while döngüsü kullanılamaz" },
  { pattern: /\bfor\s+\w+\s+in\b/,       reason: "for döngüsü kullanılamaz" },
  // String concat ile bypass: "ex" + "ec", "im"+"port" vb.
  { pattern: /["']\s*\+\s*["']/,         reason: "String birleştirme ile fonksiyon kaçışı kullanılamaz" },
  // Hex/octal/unicode escape ile gizleme
  { pattern: /\\x[0-9a-fA-F]{2}/,        reason: "Hex escape karakteri kullanılamaz" },
  { pattern: /\\u[0-9a-fA-F]{4}/,        reason: "Unicode escape kullanılamaz" },
  { pattern: /\\[0-7]{1,3}/,             reason: "Octal escape kullanılamaz" },
  // lambda ile exec çağrısı
  { pattern: /\blambda\b/,               reason: "lambda kullanılamaz" },
  // yield ile jeneratör
  { pattern: /\byield\b/,               reason: "yield kullanılamaz" },
  // class tanımı
  { pattern: /\bclass\b/,               reason: "class tanımı kullanılamaz" },
  // def tanımı
  { pattern: /\bdef\s+[a-zA-Z_]/,        reason: "Fonksiyon tanımı kullanılamaz" },
  // raise ile exception
  { pattern: /\braise\b/,               reason: "raise kullanılamaz" },
  // assert
  { pattern: /\bassert\b/,              reason: "assert kullanılamaz" },
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

  // 1. Unicode normalizasyonu — homoglyph/invisible char bypass önlenir
  //    Örnek: "ᵢmport" → "import" (NFKC normalizasyonu)
  const normalized = code.normalize("NFKC").trim();

  if (normalized.length > 3000) {
    return { valid: false, error: "Kod maksimum 3000 karakter olabilir." };
  }

  // 2. Satır bazında yorum stripping (inline yorumlar dahil)
  //    "x = rsi(14)  # import os" gibi yorumlar temizlenir
  const strippedLines = normalized
    .split("\n")
    .map((line) => {
      // String içindeki #'ı korumak zor olduğundan tüm inline yorumları kaldır
      const hashIdx = line.indexOf("#");
      return hashIdx >= 0 ? line.slice(0, hashIdx) : line;
    })
    .filter((l) => l.trim());

  if (strippedLines.length > 50) {
    return { valid: false, error: "Kod maksimum 50 aktif satır (yorum hariç) olabilir." };
  }

  const codeToCheck = strippedLines.join("\n");

  // 3. Blacklist kontrolü (normalize + yorum soyulmuş kod üzerinde)
  for (const { pattern, reason } of FORBIDDEN) {
    if (pattern.test(codeToCheck)) {
      return { valid: false, error: `Güvenlik kısıtlaması: ${reason}.` };
    }
  }

  // 4. signal = ... ataması zorunlu
  if (!/\bsignal\s*=/.test(codeToCheck)) {
    return { valid: false, error: 'Kod "signal = ..." şeklinde bir sonuç ataması içermelidir.' };
  }

  // 5. Fonksiyon whitelist kontrolü (sadece izin verilenler)
  const funcCalls = codeToCheck.matchAll(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g);
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
