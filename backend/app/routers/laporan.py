# routers/laporan.py
# Laporan Film Terlaris — Statistik Penjualan & Occupancy (Karyawan & Manajer Berfilter)

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.dependencies import verify_token

router = APIRouter(prefix="/api/laporan", tags=["Laporan"])


# ==============================================================================
#  SECTION 1: ENDPOINT UNTUK KARYAWAN (ALL-TIME / TANPA FILTER)
# ==============================================================================

# ── GET: Film terlaris (untuk carousel kartu atas) ───────
@router.get("/film-terlaris", summary="Top film terlaris untuk kartu carousel (Karyawan)")
def get_film_terlaris(
    limit: int = 4,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    """
    Ambil film dengan tiket terjual terbanyak (lunas),
    sekaligus hitung occupancy rate = tiket terjual / total kapasitas kursi
    yang tersedia untuk jadwal-jadwal film tersebut.
    """
    hasil = db.execute(text("""
        SELECT
            f.id,
            f.judul,
            f.genre,
            f.poster_url,
            COUNT(dp.id) AS tiket_terjual,
            COALESCE(kap.total_kapasitas, 0) AS total_kapasitas
        FROM film f
        LEFT JOIN jadwal_tayang jt   ON jt.film_id = f.id
        LEFT JOIN pemesanan p        ON p.jadwal_id = jt.id AND p.status_bayar = 'lunas'
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

    hasil_format = []
    for r in hasil:
        occupancy = round((r.tiket_terjual / r.total_kapasitas) * 100) if r.total_kapasitas > 0 else 0
        hasil_format.append({
            "id":             r.id,
            "judul":          r.judul,
            "genre":          r.genre,
            "poster_url":     r.poster_url,
            "tiket_terjual":  r.tiket_terjual,
            "occupancy":      occupancy,
        })

    return hasil_format


# ── GET: Data chart film terlaris (bar chart) ─────────────
@router.get("/chart-terlaris", summary="Data untuk bar chart film terlaris (Karyawan)")
def get_chart_terlaris(
    limit: int = 7,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
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


# ── GET: Tabel film terlaris (dengan pagination) ──────────
@router.get("/tabel-terlaris", summary="Tabel ranking film terlaris paginated (Karyawan)")
def get_tabel_terlaris(
    page: int = Query(1, ge=1),
    per_page: int = Query(5, ge=1, le=50),
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    offset = (page - 1) * per_page
    total_film = db.execute(text("SELECT COUNT(*) AS total FROM film")).fetchone().total

    hasil = db.execute(text("""
        SELECT
            f.id,
            f.judul,
            COUNT(dp.id) AS tiket_terjual,
            COALESCE(SUM(jt.harga_tiket), 0) AS total_pendapatan
        FROM film f
        LEFT JOIN jadwal_tayang jt     ON jt.film_id = f.id
        LEFT JOIN pemesanan p          ON p.jadwal_id = jt.id AND p.status_bayar = 'lunas'
        LEFT JOIN detail_pemesanan dp  ON dp.pemesanan_id = p.id
        GROUP BY f.id, f.judul
        ORDER BY tiket_terjual DESC
        LIMIT :limit OFFSET :offset
    """), {"limit": per_page, "offset": offset}).fetchall()

    data = []
    for idx, r in enumerate(hasil, start=offset + 1):
        data.append({
            "peringkat":        idx,
            "judul":            r.judul,
            "tiket_terjual":    r.tiket_terjual,
            "total_pendapatan": float(r.total_pendapatan),
        })

    return {
        "data":        data,
        "page":        page,
        "per_page":    per_page,
        "total_film":  total_film,
        "total_pages": max(1, (total_film + per_page - 1) // per_page),
    }


# ==============================================================================
#  SECTION 2: ENDPOINT UNTUK MANAJER (DENGAN FILTER BULAN & TAHUN)
# ==============================================================================

# ── GET: Film terlaris dengan filter bulan/tahun (untuk Manajer Kartu Atas) ──
@router.get("/film-terlaris-periode", summary="Top film terlaris berdasarkan filter bulan & tahun (Manajer)")
def get_film_terlaris_periode(
    bulan: int = Query(..., ge=1, le=12),
    tahun: int = Query(...),
    limit: int = 4,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
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
            AND MONTH(jt.tanggal) = :bulan
            AND YEAR(jt.tanggal)  = :tahun
        LEFT JOIN pemesanan p ON p.jadwal_id = jt.id AND p.status_bayar = 'lunas'
        LEFT JOIN detail_pemesanan dp ON dp.pemesanan_id = p.id
        LEFT JOIN (
            SELECT jt2.film_id, SUM(s.kapasitas) AS total_kapasitas
            FROM jadwal_tayang jt2
            JOIN studio s ON s.id = jt2.studio_id
            WHERE MONTH(jt2.tanggal) = :bulan AND YEAR(jt2.tanggal) = :tahun
            GROUP BY jt2.film_id
        ) kap ON kap.film_id = f.id
        GROUP BY f.id, f.judul, f.genre, f.poster_url, kap.total_kapasitas
        ORDER BY tiket_terjual DESC
        LIMIT :limit
    """), {"bulan": bulan, "tahun": tahun, "limit": limit}).fetchall()

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


# ── GET: Chart film terlaris dengan filter periode (Manajer Chart) ────────
@router.get("/chart-terlaris-periode", summary="Bar chart film terlaris berdasarkan bulan & tahun (Manajer)")
def get_chart_terlaris_periode(
    bulan: int = Query(..., ge=1, le=12),
    tahun: int = Query(...),
    limit: int = 7,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    hasil = db.execute(text("""
        SELECT f.judul, COUNT(dp.id) AS tiket_terjual
        FROM film f
        LEFT JOIN jadwal_tayang jt ON jt.film_id = f.id
            AND MONTH(jt.tanggal) = :bulan
            AND YEAR(jt.tanggal)  = :tahun
        LEFT JOIN pemesanan p ON p.jadwal_id = jt.id AND p.status_bayar = 'lunas'
        LEFT JOIN detail_pemesanan dp ON dp.pemesanan_id = p.id
        GROUP BY f.id, f.judul
        ORDER BY tiket_terjual ASC
        LIMIT :limit
    """), {"bulan": bulan, "tahun": tahun, "limit": limit}).fetchall()

    return [{"judul": r.judul, "tiket_terjual": r.tiket_terjual} for r in hasil]


# ── GET: Tabel ranking dengan filter periode + pagination (VERSI FIX PAGINATION NYALA) ─
@router.get("/tabel-terlaris-periode", summary="Tabel ranking film terlaris dengan filter periode (Manajer)")
def get_tabel_terlaris_periode(
    bulan: int = Query(..., ge=1, le=12),
    tahun: int = Query(...),
    page: int = Query(1, ge=1),
    per_page: int = Query(5, ge=1, le=50),
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    offset = (page - 1) * per_page
    
    # FIX 1: Menggunakan total seluruh film global agar tombol page di frontend tidak hilang/bernilai 0
    total_film = db.execute(text("SELECT COUNT(*) AS total FROM film")).fetchone().total

    # FIX 2: Mengubah JOIN menjadi LEFT JOIN agar master film tetap keluar di tabel walau bulan tersebut belum ada transaksi
    hasil = db.execute(text("""
        SELECT
            f.id,
            f.judul,
            COUNT(dp.id) AS tiket_terjual,
            COALESCE(SUM(jt.harga_tiket), 0) AS total_pendapatan
        FROM film f
        LEFT JOIN jadwal_tayang jt ON jt.film_id = f.id
            AND MONTH(jt.tanggal) = :bulan AND YEAR(jt.tanggal) = :tahun
        LEFT JOIN pemesanan p ON p.jadwal_id = jt.id AND p.status_bayar = 'lunas'
        LEFT JOIN detail_pemesanan dp ON dp.pemesanan_id = p.id
        GROUP BY f.id, f.judul
        ORDER BY tiket_terjual DESC
        LIMIT :limit OFFSET :offset
    """), {"limit": per_page, "offset": offset, "bulan": bulan, "tahun": tahun}).fetchall()

    data = []
    for idx, r in enumerate(hasil, start=offset + 1):
        data.append({
            "peringkat":        idx,
            "judul":            r.judul,
            "tiket_terjual":    r.tiket_terjual,
            "total_pendapatan": float(r.total_pendapatan),
        })

    return {
        "data":        data,
        "page":        page,
        "per_page":    per_page,
        "total_film":  total_film,
        "total_pages": max(1, (total_film + per_page - 1) // per_page),
    }