# routers/film.py
# CRUD Film — tambah, edit, hapus, list, upload poster

import os
import uuid
import shutil
from typing import Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.dependencies import verify_token
from app.cloudinary_helper import upload_gambar, hapus_gambar

router = APIRouter(prefix="/api/film", tags=["Film"])

# Folder penyimpanan poster (buat otomatis kalau belum ada)
UPLOAD_DIR = "uploads/poster"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Ekstensi yang diizinkan
ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp"}


# ── Helper: hitung status otomatis ────────────────────────
def hitung_status(tanggal_mulai, tanggal_selesai) -> str:
    """
    Status dihitung otomatis berdasarkan tanggal:
    - belum tanggal_mulai  → 'segera'
    - dalam periode tayang → 'tayang'
    - sudah lewat          → 'selesai'
    """
    if not tanggal_mulai:
        return 'segera'

    hari_ini = date.today()

    if hari_ini < tanggal_mulai:
        return 'segera'
    elif tanggal_selesai and hari_ini > tanggal_selesai:
        return 'selesai'
    else:
        return 'tayang'


# ── Helper: simpan file poster ────────────────────────────
def simpan_poster(file: UploadFile) -> str:
    """Simpan file poster ke disk, return URL relatif"""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="Format file tidak didukung. Gunakan JPG/PNG.")

    # Nama file unik
    nama_file = f"{uuid.uuid4().hex}{ext}"
    path_file  = os.path.join(UPLOAD_DIR, nama_file)

    with open(path_file, "wb") as f:
        shutil.copyfileobj(file.file, f)

    return f"/uploads/poster/{nama_file}"


# ── GET: Daftar semua film ────────────────────────────────
@router.get("/")
def get_film_list(
    q: Optional[str] = None,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    query  = """
        SELECT *,
            CASE
                WHEN tanggal_mulai IS NULL THEN 'segera'
                WHEN CURDATE() < tanggal_mulai THEN 'segera'
                WHEN tanggal_selesai IS NOT NULL
                     AND CURDATE() > tanggal_selesai THEN 'selesai'
                ELSE 'tayang'
            END AS status_otomatis
        FROM film
    """
    params = {}

    if q:
        query += " WHERE judul LIKE :q OR genre LIKE :q"
        params["q"] = f"%{q}%"

    query += " ORDER BY dibuat_pada DESC"

    hasil = db.execute(text(query), params).fetchall()

    return [
        {
            "id":                    r.id,
            "judul":                 r.judul,
            "genre":                 r.genre,
            "durasi_menit":          r.durasi_menit,
            "rating":                r.rating,
            "sinopsis":              r.sinopsis,
            "poster_url":            r.poster_url,
            "trailer_url":           r.trailer_url,
            "tanggal_mulai":  str(r.tanggal_mulai) if r.tanggal_mulai else None,
            "tanggal_selesai": str(r.tanggal_selesai) if r.tanggal_selesai else None,
            "status":                r.status_otomatis,
            "kode_id":               f"MV-{1000 + r.id}",
        }
        for r in hasil
    ]


# ── POST: Tambah film baru ────────────────────────────────
@router.post("/", status_code=status.HTTP_201_CREATED)
async def tambah_film(
    judul:                   str            = Form(...),
    sinopsis:                str            = Form(""),
    durasi_menit:            int            = Form(120),
    rating:                  str            = Form("SU"),
    genre:                   str            = Form(""),
    bahasa:                  str            = Form("Indonesia"),
    aktor:                   str            = Form(""),
    trailer_url:             str            = Form(""),
    tanggal_mulai:    Optional[str]  = Form(None),
    tanggal_selesai:  Optional[str]  = Form(None),
    poster: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    # Validasi tanggal
    if tanggal_mulai and tanggal_selesai:
        if tanggal_selesai < tanggal_mulai:
            raise HTTPException(
                status_code=400,
                detail="Tanggal selesai tidak boleh sebelum tanggal mulai!"
            )

    poster_url = None
    if poster and poster.filename:
        poster_url = await upload_gambar(poster, folder="bioskop/poster")

    db.execute(text("""
        INSERT INTO film
            (judul, genre, durasi_menit, rating, sinopsis,
             poster_url, trailer_url, status,
             tanggal_mulai, tanggal_selesai)
        VALUES
            (:judul, :genre, :durasi, :rating, :sinopsis,
             :poster_url, :trailer_url, 'segera',
             :tgl_mulai, :tgl_selesai)
    """), {
        "judul":       judul,
        "genre":       genre,
        "durasi":      durasi_menit,
        "rating":      rating,
        "sinopsis":    sinopsis,
        "poster_url":  poster_url,
        "trailer_url": trailer_url or None,
        "tgl_mulai":   tanggal_mulai   or None,
        "tgl_selesai": tanggal_selesai or None,
    })
    db.commit()
    return {"message": "Film berhasil ditambahkan"}


# ── PUT: Update film ──────────────────────────────────────
@router.put("/{film_id}")
async def update_film(
    film_id:                 int,
    judul:                   str            = Form(...),
    sinopsis:                str            = Form(""),
    durasi_menit:            int            = Form(120),
    rating:                  str            = Form("SU"),
    genre:                   str            = Form(""),
    bahasa:                  str            = Form("Indonesia"),
    aktor:                   str            = Form(""),
    trailer_url:             str            = Form(""),
    tanggal_mulai:    Optional[str]  = Form(None),
    tanggal_selesai:  Optional[str]  = Form(None),
    poster: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    film = db.execute(
        text("SELECT * FROM film WHERE id = :id"), {"id": film_id}
    ).fetchone()
    if not film:
        raise HTTPException(status_code=404, detail="Film tidak ditemukan")

    if tanggal_mulai and tanggal_selesai:
        if tanggal_selesai < tanggal_mulai:
            raise HTTPException(
                status_code=400,
                detail="Tanggal selesai tidak boleh sebelum tanggal mulai!"
            )

    poster_url = film.poster_url
    if poster and poster.filename:
        hapus_gambar(film.poster_url)
        poster_url = await upload_gambar(poster, folder="bioskop/poster")

    db.execute(text("""
        UPDATE film SET
            judul                  = :judul,
            genre                  = :genre,
            durasi_menit           = :durasi,
            rating                 = :rating,
            sinopsis               = :sinopsis,
            poster_url             = :poster_url,
            trailer_url            = :trailer_url,
            tanggal_mulai   = :tgl_mulai,
            tanggal_selesai = :tgl_selesai
        WHERE id = :id
    """), {
        "id":          film_id,
        "judul":       judul,
        "genre":       genre,
        "durasi":      durasi_menit,
        "rating":      rating,
        "sinopsis":    sinopsis,
        "poster_url":  poster_url,
        "trailer_url": trailer_url or None,
        "tgl_mulai":   tanggal_mulai   or None,
        "tgl_selesai": tanggal_selesai or None,
    })
    db.commit()
    return {"message": "Film berhasil diperbarui"}


# ── DELETE: Hapus film ────────────────────────────────────
@router.delete("/{film_id}")
def hapus_film(
    film_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    film = db.execute(
        text("SELECT * FROM film WHERE id = :id"), {"id": film_id}
    ).fetchone()
    if not film:
        raise HTTPException(status_code=404, detail="Film tidak ditemukan")

    punya_jadwal = db.execute(
        text("SELECT id FROM jadwal_tayang WHERE film_id = :id LIMIT 1"),
        {"id": film_id}
    ).fetchone()
    if punya_jadwal:
        raise HTTPException(
            status_code=400,
            detail="Film tidak bisa dihapus karena masih punya jadwal tayang!"
        )

    hapus_gambar(film.poster_url)
    db.execute(text("DELETE FROM film WHERE id = :id"), {"id": film_id})
    db.commit()
    return {"message": "Film berhasil dihapus"}