# GuestFlow UI

Frontend admin dashboard untuk [GuestFlow](https://github.com/imsjogja/guestbook) — platform manajemen tamu undangan, RSVP, QR check-in, seating arrangement, dan komunikasi multi-channel (WhatsApp/Email).

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 3.4 + shadcn/ui
- React Router (SPA)
- Zustand (state management)
- Axios (HTTP client)
- Recharts (charts)
- Framer Motion (animations)
- Lucide React (icons)

## Pages (16 Halaman)

| Halaman | Route | Keterangan |
|---------|-------|------------|
| Masuk | `/login` | Login dengan email/password |
| Daftar | `/register` | Registrasi akun baru |
| Dasbor | `/` | Statistik, charts, activity feed |
| Acara | `/acara` | Manajemen acara (CRUD) |
| Tamu | `/tamu` | Daftar tamu dengan search/filter |
| Detail Tamu | `/tamu/:id` | Profil tamu lengkap (4 tabs) |
| Kelompok Keluarga | `/kelompok-keluarga` | Manajemen keluarga |
| Undangan | `/undangan` | Tracking undangan & QR |
| RSVP | `/rsvp` | Manajemen respons RSVP |
| Check-in | `/check-in` | QR scanner & manual check-in |
| Tempat Duduk | `/tempat-duduk` | Layout meja & guest assignment |
| Template | `/komunikasi/template` | Template pesan |
| Kampanye | `/komunikasi/kampanye` | Campaign komunikasi |
| Riwayat Pesan | `/komunikasi/pesan` | Log pengiriman pesan |
| Tim | `/tim` | Manajemen tim & role |
| Pengaturan | `/pengaturan` | Profile & tenant settings |

## Setup Development

```bash
# Clone repo
git clone https://github.com/imsjogja/guestbook-ui.git
cd guestbook-ui

# Install dependencies
npm install

# Jalankan dev server
npm run dev
# Akses di http://localhost:3000

# Build production
npm run build
# Output di folder dist/
```

## Integrasi dengan Backend Go

UI ini memerlukan backend GuestFlow yang berjalan secara terpisah.

### 1. Jalankan Backend Go

```bash
# Di repo guestbook (Go)
cd /path/to/guestbook
cp .env.example .env
docker compose up -d
```

Backend akan berjalan di `http://localhost:8080`.

### 2. Konfigurasi Environment

Buat file `.env` di root UI project:

```env
# API Backend URL
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

### 3. CORS Setup (Backend)

Pastikan backend Go mengizinkan request dari origin frontend:

```go
// Di cmd/server/main.go atau middleware CORS
e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
    AllowOrigins: []string{
        "http://localhost:3000",     // Dev UI
        "http://localhost:5173",     // Vite default
        "https://your-domain.com",   // Production UI
    },
    AllowHeaders: []string{
        echo.HeaderOrigin,
        echo.HeaderContentType,
        echo.HeaderAccept,
        echo.HeaderAuthorization,
        "X-Tenant-ID",
    },
    AllowCredentials: true,
}))
```

### 4. Update API Base URL

File `src/lib/api.ts` menggunakan `/api/v1` sebagai baseURL. Untuk development dengan backend terpisah, ubah menjadi:

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  // ...
});
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Atau connect repo ke [vercel.com](https://vercel.com) untuk auto-deploy.

### GitHub Actions ke Server GuestFlow

Workflow `.github/workflows/deploy-production.yml` berjalan pada push ke `main`.
Workflow menjalankan test dan build UI, kemudian pull commit terbaru serta rebuild
container di `/home/ubuntu/apps/guestflow/ui`.

Tambahkan secrets berikut pada repository ini melalui
`Settings > Secrets and variables > Actions`:

- `DEPLOY_HOST`: `168.110.204.168`
- `DEPLOY_PORT`: `22`
- `DEPLOY_USER`: `ubuntu`
- `DEPLOY_SSH_KEY`: isi private key SSH deployment
- `DEPLOY_KNOWN_HOSTS`: output `ssh-keyscan -H 168.110.204.168`

Gunakan secrets yang sama pada repository backend `imsjogja/guestbook`.

### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### Serve via Go Backend (Nginx)

Build UI dan copy ke folder static Go:

```bash
npm run build
cp -r dist/* /path/to/guestbook/web/static/admin/
```

Lalu di Go server, serve sebagai static SPA:

```go
// Serve React SPA
e.Static("/admin", "web/static/admin")
e.File("/admin/*", "web/static/admin/index.html")
```

## Struktur Project

```
guestbook-ui/
├── src/
│   ├── pages/           # 16 halaman
│   ├── components/      # Layout, Sidebar, Topbar
│   ├── hooks/           # 13 custom hooks (API integration)
│   ├── services/        # 11 API service modules
│   ├── store/           # Zustand stores (auth, tenant)
│   ├── types/           # TypeScript types
│   ├── lib/             # Utils, API client
│   ├── App.tsx          # Router setup
│   └── main.tsx         # Entry point
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Bahasa

Semua UI menggunakan **Bahasa Indonesia**:
- Tamu (Guests)
- Acara (Events)
- Undangan (Invitations)
- Dasbor (Dashboard)
- Check-in (Check-in)
- Tempat Duduk (Seating)
- Kelompok Keluarga (Households)
- Pengaturan (Settings)

## Lisensi

Private — untuk penggunaan GuestFlow platform.
