# 📘 Panduan Arsitektur & Dokumentasi Teknis AhsaiPOS
**Versi:** 1.0.0  
**Domain Publik:** [https://pos.ahsailabs.my.id](https://pos.ahsailabs.my.id)  
**Dokumentasi Swagger API:** [https://pos.ahsailabs.my.id/docs](https://pos.ahsailabs.my.id/docs)  
**Server Target:** VPS AhsaiLabs (`vps-saya`)  

---

## 1. Ringkasan Eksekutif & Latar Belakang Bisnis
**AhsaiPOS** adalah platform Point of Sale (POS) & Mini ERP Multi-Tenant yang dirancang untuk mendukung variasi lini bisnis ritel fisik & jasa, khususnya:
1. **Ritel Apparel / Riding Gear** (Toko Jaket, Sepatu, Sarung Tangan): Memerlukan matrix varian ukuran (S, M, L, XL, 40-44) dan warna.
2. **Elektronik, Komputer & CCTV**: Memerlukan pelacakan nomor seri (*Serial Number / SN Tracking*), status garansi, dan nota perbaikan/servis.
3. **Rumah Makan / Kuliner (F&B)**: Memerlukan manajemen meja (*Dine-in / Takeaway*), open bill, dan pencetakan tiket dapur (*Kitchen Order Ticket*).

Aplikasi ini dapat digunakan untuk internal multi-cabang sekaligus siap dikomersialkan sebagai **SaaS Publik** atau dijual terpisah sebagai paket **Enterprise On-Premise**.

---

## 2. Arsitektur Multi-Tenant & Mode Deployment

### A. Model Database: *Single Database with Row-Level Tenant Isolation*
* Menggunakan **PostgreSQL 16** lokal di VPS (`ahsaipos_db`).
* Setiap owner dan toko berbagi skema database yang sama untuk efisiensi RAM/CPU server dan kemudahan migrasi.
* Semua query diproteksi secara otomatis melalui relasi `owner_id` dan `store_id`.

### B. Mode Deployment (`DEPLOYMENT_MODE`)
Dikonfigurasi melalui file environment `.env`:
* **`DEPLOYMENT_MODE=saas` (Default Cloud)**:
  - Registrasi publik (`/api/v1/auth/register`) aktif.
  - Setiap owner dapat membuat banyak toko (`stores`) sesuai kebutuhan.
* **`DEPLOYMENT_MODE=on_premise` (Edisi Khusus Perusahaan Klien)**:
  - Registrasi publik dinonaktifkan (hanya ada 1 akun master/owner perusahaan tersebut).
  - Jumlah cabang dibatasi oleh `MAX_STORES_ALLOWED` (atau License Key bertanda tangan kriptografi).
  - Mencegah klien membajak software on-premise menjadi layanan SaaS komersial tandingan.

---

## 3. Struktur Direktori Proyek

```
/opt/data/home/ahsaipos/
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── auth.py          # Register, Login JWT, On-premise protection
│   │   │   ├── stores.py        # CRUD Toko/Cabang (retail, electronics, fnb)
│   │   │   ├── products.py      # Produk, Varian (Apparel), Serial Numbers (CCTV)
│   │   │   └── pos.py           # Kasir checkout, potong stok instan, invoice
│   │   ├── core/
│   │   │   ├── config.py        # Pengaturan aplikasi & environment
│   │   │   ├── database.py      # SQLAlchemy Session & Engine
│   │   │   └── security.py      # JWT Bearer Token & Passlib bcrypt
│   │   ├── models/
│   │   │   └── entities.py      # Skema tabel PostgreSQL
│   │   ├── schemas/
│   │   │   └── dto.py           # Pydantic request/response validator
│   │   └── main.py              # Entrypoint FastAPI
│   ├── .env                     # Kredensial DB PostgreSQL & Secret Key
│   ├── requirements.txt         # Dependensi Python
│   └── .venv/                   # Virtual Environment Python
│
├── frontend/
│   ├── dist/                    # Production Build SPA (HTML, CSS, JS)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx         # Login & Register
│   │   │   ├── StoreSelectPage.jsx  # Pilihan cabang toko & tambah toko
│   │   │   └── PosPage.jsx          # Layar Kasir interaktif + cetak struk
│   │   ├── services/
│   │   │   └── api.js               # Client API fetch wrapper
│   │   ├── App.jsx
│   │   └── index.css                # Tailwind CSS + @media print thermal struk 58mm
│   ├── package.json
│   └── vite.config.js
│
└── docs/
    └── ARCHITECTURE.md          # Dokumen ini
```

---

## 4. Rincian Konfigurasi Infrastruktur di VPS

### A. Database PostgreSQL
* **Host**: `127.0.0.1:5432`
* **Nama Database**: `ahsaipos_db`
* **User**: `ahsai`
* **Tabel Terdaftar**:
  1. `owners` — Akun pemilik bisnis
  2. `stores` — Data cabang/toko (tipe: `retail`, `electronics`, `fnb`)
  3. `users` — Akun kasir/staf toko
  4. `categories` — Kategori barang/menu
  5. `products` — Master produk
  6. `product_variants` — Varian ukuran & warna (Ritel Apparel)
  7. `product_serials` — Pelacakan serial number & garansi (Komputer/CCTV)
  8. `restaurant_tables` — Nomor meja (Rumah Makan / F&B)
  9. `orders` — Riwayat transaksi penjualan
  10. `order_items` — Rincian item nota transaksi

### B. Service Backend (Systemd)
* Unit file: `/etc/systemd/system/ahsaipos-backend.service`
* Port lokal: `http://127.0.0.1:8001`
* Command:
  ```bash
  sudo systemctl status ahsaipos-backend
  sudo systemctl restart ahsaipos-backend
  ```

### C. Nginx Reverse Proxy
* Config file: `/etc/nginx/sites-available/ahsaipos` (symlinked ke `sites-enabled`)
* Routing:
  - `pos.ahsailabs.my.id/` -> Melayani SPA statis `/opt/data/home/ahsaipos/frontend/dist`
  - `pos.ahsailabs.my.id/api/` -> Proxy ke FastAPI `http://127.0.0.1:8001/api/`
  - `pos.ahsailabs.my.id/docs` -> Proxy ke Swagger Docs `http://127.0.0.1:8001/docs`

### D. Cloudflare Tunnel
* Hostname: `pos.ahsailabs.my.id`
* Tunnel ID: `88055061-0a1c-402f-8136-bfe7f3f658b0`
* CNAME Target: `88055061-0a1c-402f-8136-bfe7f3f658b0.cfargotunnel.com`
* Internal Target: `http://localhost:8888` (Nginx)

---

## 5. Panduan Pengembangan Selanjutnya (Next Steps / Roadmap ERP)

Bagi pengembang atau agen AI berikutnya yang melanjutkan pengembangan, modul yang dapat ditambahkan:

1. **Modul Pembelian & Supplier (Purchase Order / PO)**:
   - Membuat tabel `suppliers` dan `purchase_orders`.
   - Penerimaan barang masuk (*Goods Received*) otomatis menambah stok dan mencatat utang dagang.
2. **Modul Resep / BOM (*Bill of Materials*) untuk F&B**:
   - Menghubungkan 1 menu masakan dengan bahan mentah (beras, minyak, bumbu) sehingga saat makanan terjual, stok bahan baku berkurang otomatis.
3. **Modul WhatsApp Gateway**:
   - Mengintegrasikan endpoint kirim pesan WA di `/opt/data/scripts/` agar nota kasir bisa dikirim langsung ke nomor WhatsApp pembeli.
4. **Modul Laporan Laba/Rugi & Export**:
   - Filter rentang tanggal untuk ekspor laporan omzet & laba kotor ke format Excel / PDF.
