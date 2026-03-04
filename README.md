# Recep Demir — Portfolio

Kişisel portfolyo web sitesi. Next.js 14, TypeScript, Tailwind CSS ve Framer Motion ile yapıldı. Railway üzerinde deploy edildi.

## Başlangıç

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) adresini açın.

## Railway'e Deploy

1. [railway.app](https://railway.app) üzerinde yeni proje oluşturun
2. GitHub reposunu bağlayın
3. Railway, `Dockerfile` ile otomatik build & deploy yapar

## Proje Yapısı

```
src/
  app/
    layout.tsx      # Root layout
    page.tsx        # Ana sayfa
    globals.css     # Global stiller
  components/
    Navbar.tsx      # Navigasyon
    Hero.tsx        # Hero bölümü
    About.tsx       # Hakkımda
    Projects.tsx    # Projeler
    Skills.tsx      # Yetenekler
    Contact.tsx     # İletişim formu
    Footer.tsx      # Alt bilgi
Dockerfile          # Docker build
railway.json        # Railway yapılandırması
```

## Tech Stack

- **Next.js 14** — App Router
- **TypeScript** — Tip güvenliği
- **Tailwind CSS** — Stil
- **Framer Motion** — Animasyonlar
- **Railway** — Hosting
