# routers/dashboard_manajer.py
# Endpoint data untuk Dashboard Manajer:
# - Ringkasan pendapatan hari ini
# - Carousel film terlaris minggu ini
# - Chart film terlaris

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.dependencies import verify_token

router = APIRouter(prefix="/api/dashboard-manajer", tags=["Dashboard Manajer"])


# ── Helper: pastikan hanya manajer yang bisa akses ────────
def cek_role_manajer(current_user: dict):
    if current_user.get("role") != "manajer":
        raise HTTPException(status_code=403, detail="Akses ditolak — hanya untuk manajer")


# ── GET: Ringkasan pendapatan hari ini ───────────────────
@router.get("/ringkasan-hari-ini", summary="Total omzet & tiket terjual hari ini")
def get_ringkasan_hari_ini(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    cek_role_manajer(current_user)

    hasil = db.execute(text("""
        SELECT
            COUNT(DISTINCT p.id)        AS jumlah_transaksi,
            COUNT(dp.id)                AS jumlah_tiket,
            COALESCE(SUM(p.total_harga), 0) AS total_omzet
        FROM pemesanan p
        LEFT JOIN detail_pemesanan dp ON dp.pemesanan_id = p.id
        WHERE p.status_bayar = 'lunas'
          AND DATE(p.dibuat_pada) = CURDATE()
    """)).fetchone()

    return {
        "jumlah_transaksi": hasil.jumlah_transaksi or 0,
        "jumlah_tiket":     hasil.jumlah_tiket or 0,
        "total_omzet":      float(hasil.total_omzet or 0),
    }


# ── GET: Film terlaris minggu ini (carousel) ─────────────
@router.get("/film-terlaris-minggu", summary="Top film terlaris 7 hari terakhir")
def get_film_terlaris_minggu(
    limit: int = 4,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    cek_role_manajer(current_user)

    hasil = db.execute(text("""
        SELECT
            f.id,
            f.judul,
            f.genre,
            f.poster_url,
            COUNT(dp.id) AS tiket_terjual,
            COALESCE(kap.total_kapasitas, 0) AS total_kapasitas
        FROM film f
        LEFT JOIN jadwal_tayang jt ON jt.film_id = f.id
        LEFT JOIN pemesanan p ON p.jadwal_id = jt.id
            AND p.status_bayar = 'lunas'
            AND p.dibuat_pada >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        LEFT JOIN detail_pemesanan dp ON dp.pemesanan_id = p.id
        LEFT JOIN (
            SELECT jt2.film_id, SUM(s.kapasitas) AS total_kapasitas
            FROM jadwal_tayang jt2
            JOIN studio s ON s.id = jt2.studio_id
            GROUP BY jt2.film_id
        ) kap ON kap.film_id = f.id
        GROUP BY f.id, f.judul, f.genre, f.poster_url, kap.total_kapasitas
        ORDER BY tiket_terjual DESC
        LIMIT :limit
    """), {"limit": limit}).fetchall()

    data = []
    for r in hasil:
        occupancy = round((r.tiket_terjual / r.total_kapasitas) * 100) if r.total_kapasitas > 0 else 0
        data.append({
            "id":            r.id,
            "judul":         r.judul,
            "genre":         r.genre,
            "poster_url":    r.poster_url,
            "tiket_terjual": r.tiket_terjual,
            "occupancy":     occupancy,
        })
    return data


# ── GET: Data chart film terlaris (sama seperti karyawan) ─
@router.get("/chart-terlaris", summary="Data bar chart film terlaris (semua waktu)")
def get_chart_terlaris(
    limit: int = 7,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    cek_role_manajer(current_user)

    hasil = db.execute(text("""
        SELECT f.judul, COUNT(dp.id) AS tiket_terjual
        FROM film f
        LEFT JOIN jadwal_tayang jt    ON jt.film_id = f.id
        LEFT JOIN pemesanan p         ON p.jadwal_id = jt.id AND p.status_bayar = 'lunas'
        LEFT JOIN detail_pemesanan dp ON dp.pemesanan_id = p.id
        GROUP BY f.id, f.judul
        ORDER BY tiket_terjual ASC
        LIMIT :limit
    """), {"limit": limit}).fetchall()

    return [{"judul": r.judul, "tiket_terjual": r.tiket_terjual} for r in hasil]