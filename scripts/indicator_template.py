#!/usr/bin/env python3
"""
indicator_template.py
=====================
Özel indikatör script'i şablonu.

Kullanım:
  1. Bu dosyayı kopyalayın, yeniden adlandırın (örn: my_ema_cross.py)
  2. INFO, default_params() ve main() bölümlerini doldurun.
  3. Admin paneli üzerinden yükleyin veya API ile kaydedin:

     curl -X POST https://<SCAN_API_URL>/api/indicators/register \
       -H "X-API-Key: <WEB_API_KEY>" \
       -H "Content-Type: application/json" \
       -d @- <<'EOF'
     {
       "code": "my_ema_cross",
       "name": "EMA Kesişim",
       "description": "Fiyatın EMA'yı yukarı kesmesi",
       "script": "<dosya içeriği buraya>"
     }
     EOF

Veri formatı:
  STDIN  → {"symbols": [...], "bars": {TICKER: [bar_dict, ...]}, "params": {...}}
  STDOUT → {"results": [{symbol, passed, key?, value, prev_value, lines}, ...]}

  bar_dict keys: datetime (str), open, high, low, close, volume (float)

Birden fazla sinyal (key) döndürmek:
  results içindeki her elemana "key" alanı ekleyin.
  Kayıt sırasında "keys" listesi belirtin:
    [{"id": "signal_a", "label": "Sinyal A"}, {"id": "signal_b", "label": "Sinyal B"}]
  "key" alanı yazılmazsa indikatörün ilk key'i kullanılır.
"""
import sys
import json
import pandas as pd

# Yardımcı fonksiyonlar: ema, sma, rsi, macd, bollinger, stoch_rsi, series_to_points
from lib.indicators import ema, series_to_points

# ─────────────────────────────────────────────────────────────────────────────
# 1. İndikatör meta bilgileri
# ─────────────────────────────────────────────────────────────────────────────
INFO = {
    "name": "Örnek EMA Kesişim",
    "code": "example_ema_cross",
    "description": "Kapanış fiyatının EMA(21) üzerinde olup olmadığını kontrol eder.",
    "parameters": {
        "period": {
            "type":        "int",
            "default":     21,
            "description": "EMA periyodu",
            "name":        "Periyot",
            "name_en":     "Period",
        },
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# 2. Varsayılan parametreler
# ─────────────────────────────────────────────────────────────────────────────
def default_params() -> dict:
    return {k: v.get("default") for k, v in INFO.get("parameters", {}).items()}


# ─────────────────────────────────────────────────────────────────────────────
# 3. Ana tarama mantığı
# ─────────────────────────────────────────────────────────────────────────────
def main():
    data   = json.load(sys.stdin)
    params = data.get("params") or {}
    defs   = default_params()

    period = int(params.get("period", defs.get("period", 21)))

    results = []
    bars_by_symbol = data.get("bars", {})

    for sym in data.get("symbols", []):
        bars = bars_by_symbol.get(sym, [])
        if not bars:
            continue

        # DataFrame oluştur
        df = pd.DataFrame(bars)
        df["datetime"] = pd.to_datetime(df["datetime"])
        df = df.sort_values("datetime").reset_index(drop=True)

        # En az period+1 bar gerekli
        if len(df) < period + 1:
            continue

        # İndikatör hesapla
        df["ema"] = ema(df["close"], period)

        last = df.iloc[-1]
        prev = df.iloc[-2]

        close_val  = float(last["close"])
        ema_val    = float(last["ema"])
        prev_close = float(prev["close"])
        prev_ema   = float(prev["ema"])

        # ── Koşul tanımı ─────────────────────────────────────────────────────
        # Örnek: son barda kapanış EMA'nın üzerinde
        passed = close_val > ema_val

        # Birden fazla sinyal için "key" alanını kullanın (opsiyonel):
        # results.append({..., "key": "signal_a"})
        # results.append({..., "key": "signal_b"})

        results.append({
            "symbol":     sym,
            "passed":     passed,
            "value":      close_val - ema_val,        # grafik alt paneli için ham değer
            "prev_value": prev_close - prev_ema,
            "lines": [
                series_to_points(df["datetime"], df["close"]),  # 0: fiyat (upper panel)
                series_to_points(df["datetime"], df["ema"]),    # 1: EMA  (upper panel)
            ],
        })

    json.dump({"results": results}, sys.stdout)


# ─────────────────────────────────────────────────────────────────────────────
# 4. CLI desteği (test + kayıt için)
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--defaults":
        json.dump(default_params(), sys.stdout)
        sys.exit(0)
    if len(sys.argv) > 1 and sys.argv[1] == "--info":
        json.dump(INFO, sys.stdout)
        sys.exit(0)
    main()
