# 🎬 Bioskop 7 — Sistem Pemesanan Tiket Bioskop

Aplikasi web pemesanan tiket bioskop dengan fitur lengkap untuk
Customer, Karyawan, dan Manajer.

## 🛠️ Tech Stack

- **Backend**  : Python FastAPI + MySQL (TiDB Cloud)
- **Frontend** : React (Vite) + Tailwind CSS
- **Database** : TiDB Cloud (MySQL-compatible)
- **Storage**  : Cloudinary (gambar poster & banner)
- **Payment**  : Midtrans Snap
- **Auth**     : JWT + bcrypt

## 📋 Prasyarat

Pastikan sudah terinstall:
- Python 3.10+
- Node.js 18+
- Git

## 🚀 Cara Menjalankan (Development)

### 1. Clone Repository

git clone https://github.com/USERNAME/NAMA_REPO.git
cd NAMA_REPO/bioskop-app

### 2. Setup Backend

cd backend

# Buat virtual environment
python -m venv .venv

# Aktifkan venv
# Windows:
.\.venv\Scripts\Activate.ps1
# Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Buat file .env dari template
copy .env.example .env   # Windows
cp .env.example .env     # Mac/Linux

# Isi semua nilai di file .env
# (DB, JWT, Email, Midtrans, Cloudinary)

# Jalankan server
uvicorn app.main:app --reload

### 3. Setup Frontend

cd frontend

# Install dependencies
npm install

# Buat file .env dari template
copy .env.example .env   # Windows
cp .env.example .env     # Mac/Linux

# Isi nilai di file .env
# VITE_API_BASE_URL=http://localhost:8000
# VITE_MIDTRANS_CLIENT_KEY=...

# Jalankan development server
npm run dev

### 4. Setup Database

Jalankan SQL berikut di TiDB Cloud SQL Editor:
Lihat file: backend/database.sql

## 🌐 Akses Aplikasi

- Frontend  : http://localhost:5173
- Backend   : http://localhost:8000
- API Docs  : http://localhost:8000/docs

## 👤 Akun Default (Development)

Buat akun staff via SQL setelah setup database.
Lihat panduan di backend/database.sql

## 📁 Struktur Folder

bioskop-app/
├── backend/
│   ├── app/
│   │   ├── routers/      ← endpoint API
│   │   ├── main.py
│   │   ├── database.py
│   │   └── dependencies.py
│   ├── .env.example      ← template env (isi & rename jadi .env)
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── customer/
    │   │   ├── karyawan/
    │   │   └── manajer/
    │   ├── components/
    │   └── services/
    ├── .env.example      ← template env
    └── package.json