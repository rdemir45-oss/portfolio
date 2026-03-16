"""
stochrsi_scan.py
────────────────────────────────────────────────────────────────────────────────
Pine Script kaynak:
  smoothK = 3, smoothD = 3, lengthRSI = 14, lengthStoch = 14, src = close

İki sinyal:
  stoch_rsi_os      → K < 20  (aşırı satım bölgesi)
  stoch_rsi_crossup → önceki barda K < D, şimdiki barda K >= D  (alım kesişimi)

Bağımlılıklar:
  pip install pandas ta-lib-python   (veya pip install pandas ta)

ta kütüphanesi kullanımı (ta-lib gerekmez):
  pip install ta
────────────────────────────────────────────────────────────────────────────────
"""

import pandas as pd


def _rsi(series: pd.Series, length: int) -> pd.Series:
    """Wilder's RSI — Pine Script ta.rsi() ile birebir."""
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(alpha=1 / length, min_periods=length, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1 / length, min_periods=length, adjust=False).mean()
    rs = avg_gain / avg_loss.replace(0, float("inf"))
    return 100 - (100 / (1 + rs))


def _stoch(series: pd.Series, length: int) -> pd.Series:
    """
    Pine Script ta.stoch(rsi, rsi, rsi, length):
      stoch = 100 * (value - lowest(low, length)) / (highest(high, length) - lowest(low, length))
    RSI üzerinde uygulandığı için high = low = close = rsi değeri.
    """
    lowest = series.rolling(length).min()
    highest = series.rolling(length).max()
    denom = (highest - lowest).replace(0, float("nan"))
    return 100 * (series - lowest) / denom


def compute_stochrsi(
    close: pd.Series,
    length_rsi: int = 14,
    length_stoch: int = 14,
    smooth_k: int = 3,
    smooth_d: int = 3,
) -> tuple[pd.Series, pd.Series]:
    """
    Pine Script adımlarını birebir taklit eder:
      rsi1 = ta.rsi(close, lengthRSI)
      k    = ta.sma(ta.stoch(rsi1, rsi1, rsi1, lengthStoch), smoothK)
      d    = ta.sma(k, smoothD)

    Returns:
        k (pd.Series): hızlı çizgi
        d (pd.Series): yavaş çizgi
    """
    rsi1 = _rsi(close, length_rsi)
    raw_k = _stoch(rsi1, length_stoch)
    k = raw_k.rolling(smooth_k).mean()
    d = k.rolling(smooth_d).mean()
    return k, d


# ── Tarama fonksiyonları ──────────────────────────────────────────────────────

def scan_stoch_rsi_os(close: pd.Series, threshold: float = 20.0) -> bool:
    """
    stoch_rsi_os — K değeri aşırı satım bölgesinde (< threshold).
    En güncel (son) bara göre kontrol eder.
    """
    k, _ = compute_stochrsi(close)
    last_k = k.iloc[-1]
    if pd.isna(last_k):
        return False
    return float(last_k) < threshold


def scan_stoch_rsi_crossup(close: pd.Series) -> bool:
    """
    stoch_rsi_crossup — K, D'yi aşağıdan yukarıya kesti.
    Son iki barın kesişimini kontrol eder:
      bar[-2]: K < D
      bar[-1]: K >= D
    """
    k, d = compute_stochrsi(close)
    if len(k) < 2:
        return False
    k_prev, k_last = k.iloc[-2], k.iloc[-1]
    d_prev, d_last = d.iloc[-2], d.iloc[-1]
    if any(pd.isna(v) for v in [k_prev, k_last, d_prev, d_last]):
        return False
    return float(k_prev) < float(d_prev) and float(k_last) >= float(d_last)


# ── Scan API entegrasyonu (örnek) ─────────────────────────────────────────────
# Mevcut scan runner'ınıza bu iki fonksiyonu ekleyin:
#
# signals = {}
#
# if scan_stoch_rsi_os(df["close"]):
#     signals["stoch_rsi_os"] = True
#
# if scan_stoch_rsi_crossup(df["close"]):
#     signals["stoch_rsi_crossup"] = True
#
# Ardından bu signals dict'ini mevcut kategori çıktısına ekleyin.
# API yanıt formatı (diğer kategorilerle aynı):
#
# {
#   "key": "stoch_rsi_os",
#   "label": "StochRSI Aşırı Satım (K<20)",
#   "emoji": "📊",
#   "count": 5,
#   "stocks": [
#     {"ticker": "AKBNK", "price": 45.2, "changePct": 1.5},
#     ...
#   ]
# }
