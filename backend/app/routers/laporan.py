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

# ── GET: Film terlaris all-time (untuk Laporan Karyawan) ──
@router.get("/film-terlaris")
def get_film_terlaris(
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
            COUNT(dp.id)                     AS tiket_terjual,
            COALESCE(kap.total_kapasitas, 0) AS total_kapasitas
        FROM film f
        -- INNER JOIN: hanya film yang punya jadwal
        JOIN jadwal_tayang jt ON jt.film_id = f.id
        LEFT JOIN pemesanan p ON p.jadwal_id = jt.id AND p.status_bayar = 'lunas'
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
        occupancy = round((r.tiket_terjual / r.total_kapasitas) * 100) \
                    if r.total_kapasitas > 0 else 0
        data.append({
            "id":            r.id,
            "judul":         r.judul,
            "genre":         r.genre,
            "poster_url":    r.poster_url,
            "tiket_terjual": r.tiket_terjual,
            "occupancy":     occupancy,
        })
    return data


# ── GET: Chart all-time (untuk Laporan Karyawan) ──────────
@router.get("/chart-terlaris")
def get_chart_terlaris(
    limit: int = 7,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    hasil = db.execute(text("""
        SELECT f.judul, COUNT(dp.id) AS tiket_terjual
        FROM film f
        JOIN jadwal_tayang jt ON jt.film_id = f.id
        LEFT JOIN pemesanan p ON p.jadwal_id = jt.id AND p.status_bayar = 'lunas'
        LEFT JOIN detail_pemesanan dp ON dp.pemesanan_id = p.id
        GROUP BY f.id, f.judul
        ORDER BY tiket_terjual ASC
        LIMIT :limit
    """), {"limit": limit}).fetchall()

    return [{"judul": r.judul, "tiket_terjual": r.tiket_terjual} for r in hasil]


# ── GET: Tabel all-time (untuk Laporan Karyawan) ──────────
@router.get("/tabel-terlaris")
def get_tabel_terlaris(
    page: int = Query(1, ge=1),
    per_page: int = Query(5, ge=1, le=50),
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    offset = (page - 1) * per_page

    # Hanya hitung film yang punya jadwal
    total_film = db.execute(text("""
        SELECT COUNT(DISTINCT f.id) AS total
        FROM film f
        JOIN jadwal_tayang jt ON jt.film_id = f.id
    """)).fetchone().total

    hasil = db.execute(text("""
        SELECT
            f.id,
            f.judul,
            COUNT(dp.id)                                          AS tiket_terjual,
            COALESCE(SUM(
                CASE WHEN p.status_bayar = 'lunas'
                THEN jt.harga_tiket ELSE 0 END
            ), 0)                                                  AS total_pendapatan
        FROM film f
        JOIN jadwal_tayang jt ON jt.film_id = f.id
        LEFT JOIN pemesanan p ON p.jadwal_id = jt.id AND p.status_bayar = 'lunas'
        LEFT JOIN detail_pemesanan dp ON dp.pemesanan_id = p.id
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

# ── GET: Film terlaris dengan filter bulan/tahun ──────────
@router.get("/film-terlaris-periode")
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
            COUNT(dp.id)                        AS tiket_terjual,
            COALESCE(kap.total_kapasitas, 0)    AS total_kapasitas
        FROM film f
        -- INNER JOIN: hanya film yang punya jadwal di bulan/tahun ini
        JOIN jadwal_tayang jt ON jt.film_id = f.id
            AND MONTH(jt.tanggal) = :bulan
            AND YEAR(jt.tanggal)  = :tahun
        -- Hitung tiket terjual di periode ini
        LEFT JOIN pemesanan p ON p.jadwal_id = jt.id
            AND p.status_bayar = 'lunas'
        LEFT JOIN detail_pemesanan dp ON dp.pemesanan_id = p.id
        -- Hitung total kapasitas di periode ini
        LEFT JOIN (
            SELECT jt2.film_id, SUM(s.kapasitas) AS total_kapasitas
            FROM jadwal_tayang jt2
            JOIN studio s ON s.id = jt2.studio_id
            WHERE MONTH(jt2.tanggal) = :bulan
              AND YEAR(jt2.tanggal)  = :tahun
            GROUP BY jt2.film_id
        ) kap ON kap.film_id = f.id
        GROUP BY f.id, f.judul, f.genre, f.poster_url, kap.total_kapasitas
        ORDER BY tiket_terjual DESC
        LIMIT :limit
    """), {"bulan": bulan, "tahun": tahun, "limit": limit}).fetchall()

    data = []
    for r in hasil:
        occupancy = round((r.tiket_terjual / r.total_kapasitas) * 100) \
                    if r.total_kapasitas > 0 else 0
        data.append({
            "id":            r.id,
            "judul":         r.judul,
            "genre":         r.genre,
            "poster_url":    r.poster_url,
            "tiket_terjual": r.tiket_terjual,
            "occupancy":     occupancy,
        })
    return data


# ── GET: Chart film terlaris dengan filter periode ────────
@router.get("/chart-terlaris-periode")
def get_chart_terlaris_periode(
    bulan: int = Query(..., ge=1, le=12),
    tahun: int = Query(...),
    limit: int = 7,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    hasil = db.execute(text("""
        SELECT
            f.judul,
            COUNT(dp.id) AS tiket_terjual
        FROM film f
        -- INNER JOIN: hanya film yang tayang di periode ini
        JOIN jadwal_tayang jt ON jt.film_id = f.id
            AND MONTH(jt.tanggal) = :bulan
            AND YEAR(jt.tanggal)  = :tahun
        LEFT JOIN pemesanan p ON p.jadwal_id = jt.id
            AND p.status_bayar = 'lunas'
        LEFT JOIN detail_pemesanan dp ON dp.pemesanan_id = p.id
        GROUP BY f.id, f.judul
        ORDER BY tiket_terjual ASC
        LIMIT :limit
    """), {"bulan": bulan, "tahun": tahun, "limit": limit}).fetchall()

    return [{"judul": r.judul, "tiket_terjual": r.tiket_terjual} for r in hasil]


# ── GET: Tabel ranking dengan filter periode + pagination ──
@router.get("/tabel-terlaris-periode")
def get_tabel_terlaris_periode(
    bulan: int = Query(..., ge=1, le=12),
    tahun: int = Query(...),
    page: int = Query(1, ge=1),
    per_page: int = Query(5, ge=1, le=50),
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    offset = (page - 1) * per_page

    # Total film yang PUNYA JADWAL di periode ini — bukan semua film
    total_film = db.execute(text("""
        SELECT COUNT(DISTINCT f.id) AS total
        FROM film f
        JOIN jadwal_tayang jt ON jt.film_id = f.id
            AND MONTH(jt.tanggal) = :bulan
            AND YEAR(jt.tanggal)  = :tahun
    """), {"bulan": bulan, "tahun": tahun}).fetchone().total

    hasil = db.execute(text("""
        SELECT
            f.id,
            f.judul,
            COUNT(dp.id)             AS tiket_terjual,
            -- Total pendapatan = harga tiket × jumlah tiket terjual
            COALESCE(
                SUM(CASE WHEN p.status_bayar = 'lunas' THEN jt.harga_tiket ELSE 0 END),
                0
            )                        AS total_pendapatan
        FROM film f
        -- INNER JOIN: hanya film yang tayang di periode ini
        JOIN jadwal_tayang jt ON jt.film_id = f.id
            AND MONTH(jt.tanggal) = :bulan
            AND YEAR(jt.tanggal)  = :tahun
        LEFT JOIN pemesanan p ON p.jadwal_id = jt.id
            AND p.status_bayar = 'lunas'
        LEFT JOIN detail_pemesanan dp ON dp.pemesanan_id = p.id
        GROUP BY f.id, f.judul
        ORDER BY tiket_terjual DESC
        LIMIT :limit OFFSET :offset
    """), {"bulan": bulan, "tahun": tahun, "limit": per_page, "offset": offset}).fetchall()

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