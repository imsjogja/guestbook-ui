# guestflow.id — Panduan Logo & Warna

Dokumentasi ringkas identitas visual **guestflow.id**, platform SaaS untuk manajemen undangan digital. Berisi kode warna, filosofi logo, aturan pemakaian, dan daftar file.

---

## 1. Filosofi Logo

Logo guestflow.id dibangun dari konsep **"Flow"** — perjalanan tamu yang mengalir rapi dari undangan sampai konfirmasi kehadiran.

**Elemen utama:** tiga titik yang mengalir naik di sepanjang garis lengkung yang halus.

Maknanya:

- **Tiga titik = tamu (guest).** Merepresentasikan orang-orang yang diundang dan dikelola di dalam platform.
- **Garis mengalir = flow.** Alur proses yang mulus: kirim undangan → dibuka → RSVP. Tidak ada langkah yang tersendat.
- **Titik membesar ke atas (kecil → besar).** Menyiratkan *momentum* dan *pertumbuhan* — makin banyak tamu yang mengalir masuk, dan acara yang makin ramai. Arah naik memberi kesan positif dan optimis.
- **Wadah rounded square.** Bentuk kotak dengan sudut membulat membuat mark serba guna: pas jadi app icon, favicon, maupun avatar media sosial.

Prinsip desain yang dipegang: **sederhana, mudah dikenali di ukuran kecil, dan tetap tajam di ukuran besar** (karena berbasis vektor).

---

## 2. Palet Warna

Warna dasar teal dipilih karena berkesan **bersih, tenang, dan terpercaya** — cocok untuk produk yang menyimpan data acara dan tamu. Gradasi ke turquoise cerah menambah sentuhan **segar dan hidup**.

| Peran | Nama | HEX | Catatan |
|---|---|---|---|
| Gradasi utama (gelap) | Deep Teal | `#12786E` | Warna dasar brand |
| Gradasi utama (terang) | Bright Turquoise | `#34D8C4` | Ujung terang gradasi |
| Teks wordmark | Pine Dark | `#14332F` | Untuk kata "guest" & body text |
| Aksen lembut | Soft Teal | `#AFD5CE` | Untuk sufiks ".id" |
| Ikon dalam | White | `#FFFFFF` | Garis & titik di dalam mark |
| Background gelap | Deep Pine | `#0C2925` | Untuk logo di atas latar gelap |

**Arah gradasi:** diagonal, dari kiri-atas (`#12786E`) ke kanan-bawah (`#34D8C4`).

### Kode siap pakai

```css
:root {
  --gf-teal-dark: #12786E;
  --gf-teal-light: #34D8C4;
  --gf-text: #14332F;
  --gf-accent: #AFD5CE;
  --gf-dark-bg: #0C2925;
}

/* Gradasi brand */
background: linear-gradient(135deg, #12786E 0%, #34D8C4 100%);
```

---

## 3. Tipografi

- **Wordmark:** sans-serif geometris, tebal (weight 700), dengan sedikit *letter-spacing* negatif agar rapat dan modern. Referensi font: **Poppins** (atau Segoe UI / system-ui sebagai fallback).
- **Struktur nama:** `guest` (Pine Dark) + `flow` (gradasi teal) + `.id` (Soft Teal, ukuran lebih kecil). Pemisahan warna di tengah kata memberi titik fokus tanpa perlu simbol tambahan.

---

## 4. Varian & File

| File | Kegunaan |
|---|---|
| `guestflow-logo-utama.svg` | Logo utama horizontal (ikon + wordmark). Untuk header web, dokumen, invoice. |
| `guestflow-ikon.svg` | Ikon saja (rounded square). Untuk app icon & avatar. |
| `guestflow-brand-sheet.svg` | Rangkuman semua varian + palet warna. |
| `favicon/favicon.svg` | Favicon vektor (versi mark yang dipertebal agar jelas di ukuran mini). |
| `favicon/favicon.ico` | Favicon multi-ukuran (16/32/48/64) untuk browser lama. |
| `favicon/favicon-16.png` … `favicon-512.png` | PNG per ukuran (16, 32, 48, 64, 192, 512). |
| `favicon/favicon-180-apple-touch.png` | Ikon layar utama iOS (Apple touch icon). |

---

## 5. Cara Pasang Favicon

Letakkan file favicon di root situs, lalu tambahkan di dalam `<head>`:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180-apple-touch.png">
```

Untuk PWA (opsional), tambahkan `favicon-192.png` dan `favicon-512.png` ke `manifest.json`.

---

## 6. Aturan Pemakaian

**Lakukan:**

- Beri ruang kosong di sekeliling logo minimal setinggi titik terbesar pada mark.
- Pakai versi background gelap (`#0C2925` atau warna gelap lain) saat logo berada di atas latar terang tidak memungkinkan.
- Jaga proporsi ikon dan wordmark seperti pada file utama.

**Hindari:**

- Menggepengkan atau meregangkan logo (selalu skala proporsional).
- Mengganti warna gradasi di luar palet resmi.
- Menaruh logo di atas background yang warnanya mirip teal sehingga kontras hilang.
- Menambahkan efek bayangan, outline, atau gradasi tambahan pada wordmark.

---

*Semua aset berbasis vektor (SVG) sehingga bisa di-export ke ukuran berapa pun tanpa kehilangan ketajaman.*
