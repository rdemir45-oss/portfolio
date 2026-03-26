export interface ActiveSession {
  sid: string;
  page: string;
  username?: string;
  lastSeen: number;
}

// Railway tek instance'ta çalışır — global Map yeterlidir.
const sessions = new Map<string, ActiveSession>();

export function upsertSession(sid: string, page: string, username?: string) {
  sessions.set(sid, { sid, page, username, lastSeen: Date.now() });
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
