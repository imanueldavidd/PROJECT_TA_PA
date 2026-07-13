# main.py
# Entry point aplikasi FastAPI

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
# Baris di bawah ini diperbaiki agar meng-import auth DAN dashboard sekaligus
from app.routers import auth, dashboard, jadwal, tiket, film, laporan, dashboard_manajer, staff, customer_auth, customer, banner
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
import os

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title="API Pemesanan Tiket Bioskop",
    description="Backend sistem pemesanan tiket bioskop",
    version="1.0.0",
    redirect_slashes=False
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS Pengaturan Gerbang Akses Frontend ──────────────────
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"  # default untuk development
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# Serve folder uploads sebagai file statis
# Poster bisa diakses via: http://localhost:8000/uploads/poster/namafile.jpg
os.makedirs("uploads/poster", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── Daftarkan semua router ────────────────────────────────
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(jadwal.router)
app.include_router(tiket.router)
app.include_router(film.router)
app.include_router(laporan.router)
app.include_router(dashboard_manajer.router)
app.include_router(staff.router)
app.include_router(customer_auth.router)
app.include_router(customer.router)
app.include_router(banner.router)

# ── Health check ─────────────────────────────────────────
@app.get("/", tags=["Root"])
def root():
    return {"message": "API Bioskop berjalan ✅"}