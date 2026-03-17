import sys, json
import pandas as pd
import numpy as np
from lib.indicators import series_to_points

# ─── 1. Meta bilgiler ───────────────────────────────────────────────────
INFO = {
    "name": "SuperTrend Aşağı Kesim",
    "code": "supertrend_bear_cross",
    "description": (
        "Son barda SuperTrend yönü yukarıdan aşağıya dönen "
        "(1 → -1) sembolleri tarar."
    ),
    "parameters": {
        "period":     {"type": "int",   "default": 10, "description": "ATR periyodu",   "name": "ATR Periyot",  "name_en": "ATR Period"},
        "multiplier": {"type": "float", "default": 3.0, "description": "ATR çarpanı",  "name": "ATR Çarpanı",  "name_en": "ATR Multiplier"},
    },
}

# ─── 2. Varsayılan parametreler ─────────────────────────────────────────
def default_params() -> dict:
    return {k: v.get("default") for k, v in INFO.get("parameters", {}).items()}

# ─── 3. SuperTrend hesaplama ────────────────────────────────────────────
def supertrend(df: pd.DataFrame, period: int = 10, multiplier: float = 3.0):
    """
    Döndürür:
      st_val   – her barda aktif SuperTrend çizgisi değeri
      st_dir   – yön: +1 (yukarı trend) / -1 (aşağı trend)
    """
    hl2 = (df["high"] + df["low"]) / 2.0

    # Wilder ATR (EWM ile)
    high_low   = df["high"] - df["low"]
    high_close = (df["high"] - df["close"].shift(1)).abs()
    low_close  = (df["low"]  - df["close"].shift(1)).abs()
    tr  = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    atr = tr.ewm(alpha=1 / period, min_periods=period, adjust=False).mean()

    upper_band = hl2 + multiplier * atr
    lower_band = hl2 - multiplier * atr

    n      = len(df)
    st_val = np.zeros(n)
    st_dir = np.zeros(n, dtype=int)

    # İlk bar için başlangıç yönü: uptrend varsay
    st_dir[0] = 1
    st_val[0] = lower_band.iat[0]

    for i in range(1, n):
        prev_upper = upper_band.iat[i - 1]
        prev_lower = lower_band.iat[i - 1]
        close      = df["close"].iat[i]
        prev_close = df["close"].iat[i - 1]

        # Bant sıkıştırma (bir önceki banda göre genişleme engellenir)
        upper_band.iat[i] = (
            min(upper_band.iat[i], prev_upper)
            if prev_close <= prev_upper else upper_band.iat[i]
        )
        lower_band.iat[i] = (
            max(lower_band.iat[i], prev_lower)
            if prev_close >= prev_lower else lower_band.iat[i]
        )

        # ── Yön kararı (DÜZELTİLDİ) ─────────────────────────────────────
        # Uptrend'de aktif çizgi lower_band (destek).
        #   Kapanış lower_band'i kırarsa → downtrend'e geç.
        # Downtrend'de aktif çizgi upper_band (direnç).
        #   Kapanış upper_band'i yukarı kırarsa → uptrend'e geç.
        if st_dir[i - 1] == 1:                            # önceki: uptrend
            st_dir[i] = -1 if close <= lower_band.iat[i] else 1
        else:                                              # önceki: downtrend
            st_dir[i] = 1  if close >= upper_band.iat[i] else -1

        st_val[i] = lower_band.iat[i] if st_dir[i] == 1 else upper_band.iat[i]

    return pd.Series(st_val, index=df.index), pd.Series(st_dir, dtype=int, index=df.index)

# ─── 4. Ana tarama mantığı ──────────────────────────────────────────────
def main():
    data       = json.load(sys.stdin)
    params     = data.get("params") or {}
    period     = int(  params.get("period",     default_params()["period"]))
    multiplier = float(params.get("multiplier", default_params()["multiplier"]))

    results = []

    for sym in data.get("symbols", []):
        bars = data.get("bars", {}).get(sym, [])
        min_bars = period * 3          # ATR stabilizasyonu için yeterli bar
        if not bars or len(bars) < min_bars:
            continue

        df = pd.DataFrame(bars)
        df["datetime"] = pd.to_datetime(df["datetime"])
        df = df.sort_values("datetime").reset_index(drop=True)

        df["st_val"], df["st_dir"] = supertrend(df, period, multiplier)

        last = df.iloc[-1]
        prev = df.iloc[-2]

        # ── Koşul: önceki bar uptrend (1), son bar downtrend (-1) ────────
        passed = (int(prev["st_dir"]) == 1) and (int(last["st_dir"]) == -1)

        results.append({
            "symbol":     sym,
            "passed":     passed,
            "value":      float(last["st_val"]),
            "prev_value": float(prev["st_val"]),
            "lines": [
                series_to_points(df["datetime"], df["close"]),
                series_to_points(df["datetime"], df["st_val"]),
            ],
        })

    json.dump({"results": results}, sys.stdout)

# ─── 5. CLI desteği ─────────────────────────────────────────────────────
if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--defaults":
        json.dump(default_params(), sys.stdout); sys.exit(0)
    if len(sys.argv) > 1 and sys.argv[1] == "--info":
        json.dump(INFO, sys.stdout); sys.exit(0)
    main()
