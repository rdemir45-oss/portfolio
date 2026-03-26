export interface ActiveSession {
  sid: string;
  page: string;
  prevPage?: string;
  username?: string;
  lastSeen: number;
}

// Railway tek instance'ta çalışır — global Map yeterlidir.
const sessions = new Map<string, ActiveSession>();

/**
 * Oturumu günceller.
 * @returns pageChanged — sayfa değiştiyse true (pageview saymalıyız)
 */
export function upsertSession(sid: string, page: string, username?: string): boolean {
  const existing = sessions.get(sid);
  const pageChanged = !existing || existing.page !== page;
  sessions.set(sid, { sid, page, prevPage: existing?.page, username, lastSeen: Date.now() });
  return pageChanged;
}

export function getActiveSessions(windowMs = 5 * 60 * 1000): ActiveSession[] {
  const cutoff = Date.now() - windowMs;
  const result: ActiveSession[] = [];
  for (const [sid, s] of sessions) {
    if (s.lastSeen < cutoff) {
      sessions.delete(sid);
    } else {
      result.push(s);
    }
  }
  return result.sort((a, b) => b.lastSeen - a.lastSeen);
}
