# routers/banner.py
# CRUD Banner untuk halaman landing page customer
# Dikelola oleh Karyawan/Manajer, ditampilkan ke Customer

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.dependencies import verify_token
from app.cloudinary_helper import upload_gambar, hapus_gambar

router = APIRouter(prefix="/api/banner", tags=["Banner"])


# ── GET: Semua banner aktif (untuk landing page customer) ──
# Endpoint ini PUBLIC — tidak perlu token
@router.get("/publik", summary="Daftar banner aktif untuk landing page")
def get_banner_publik(db: Session = Depends(get_db)):
    hasil = db.execute(text("""
        SELECT id, judul, gambar_url, urutan
        FROM banner
        WHERE is_aktif = 1
        ORDER BY urutan ASC, id ASC
    """)).fetchall()
    return [
        {"id": r.id, "judul": r.judul, "gambar_url": r.gambar_url, "urutan": r.urutan}
        for r in hasil
    ]


# ── GET: Semua banner (untuk halaman kelola — perlu login) ──
@router.get("/", summary="Daftar semua banner (admin)")
def get_banner_semua(
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    hasil = db.execute(text("""
        SELECT id, judul, gambar_url, urutan, is_aktif, dibuat_pada
        FROM banner
        ORDER BY urutan ASC, id ASC
    """)).fetchall()
    return [
        {
            "id":         r.id,
            "judul":      r.judul,
            "gambar_url": r.gambar_url,
            "urutan":     r.urutan,
            "is_aktif":   bool(r.is_aktif),
            "dibuat_pada": str(r.dibuat_pada),
        }
        for r in hasil
    ]


# ── POST: Tambah banner baru ──────────────────────────────
@router.post("/", status_code=201)
async def tambah_banner(
    judul:    str        = Form(""),
    urutan:   int        = Form(0),
    is_aktif: int        = Form(1),
    gambar:   UploadFile = File(...),
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    if not gambar.filename:
        raise HTTPException(status_code=400, detail="File gambar wajib diupload!")

    gambar_url = await upload_gambar(gambar, folder="bioskop/banner")

    db.execute(text("""
        INSERT INTO banner (judul, gambar_url, urutan, is_aktif)
        VALUES (:judul, :gambar_url, :urutan, :is_aktif)
    """), {"judul": judul, "gambar_url": gambar_url, "urutan": urutan, "is_aktif": is_aktif})
    db.commit()
    return {"message": "Banner berhasil ditambahkan"}


# ── PUT: Update banner (ganti gambar opsional) ───────────
@router.put("/{banner_id}", summary="Update banner")
async def update_banner(
    banner_id: int,
    judul:     str        = Form(""),
    urutan:    int        = Form(0),
    is_aktif:  int        = Form(1),
    gambar:    Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    banner = db.execute(
        text("SELECT * FROM banner WHERE id = :id"), {"id": banner_id}
    ).fetchone()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner tidak ditemukan")

    gambar_url = banner.gambar_url

    if gambar and gambar.filename:
        hapus_gambar(banner.gambar_url)
        gambar_url = await upload_gambar(
            gambar,
            folder="bioskop/banner"
        )

    db.execute(text("""
        UPDATE banner
        SET judul = :judul, gambar_url = :gambar_url,
            urutan = :urutan, is_aktif = :is_aktif
        WHERE id = :id
    """), {"judul": judul, "gambar_url": gambar_url, "urutan": urutan,
           "is_aktif": is_aktif, "id": banner_id})
    db.commit()

    return {"message": "Banner berhasil diperbarui"}


# ── PATCH: Toggle aktif/nonaktif ─────────────────────────
@router.patch("/{banner_id}/toggle", summary="Aktifkan/nonaktifkan banner")
def toggle_banner(
    banner_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    banner = db.execute(
        text("SELECT id, is_aktif FROM banner WHERE id = :id"), {"id": banner_id}
    ).fetchone()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner tidak ditemukan")

    db.execute(
        text("UPDATE banner SET is_aktif = :aktif WHERE id = :id"),
        {"aktif": 0 if banner.is_aktif else 1, "id": banner_id}
    )
    db.commit()

    return {"message": "Status banner diperbarui"}


# ── DELETE: Hapus banner ──────────────────────────────────
@router.delete("/{banner_id}")
def hapus_banner(
    banner_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    banner = db.execute(
        text("SELECT * FROM banner WHERE id = :id"), {"id": banner_id}
    ).fetchone()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner tidak ditemukan")

    hapus_gambar(banner.gambar_url)
    db.execute(text("DELETE FROM banner WHERE id = :id"), {"id": banner_id})
    db.commit()
    return {"message": "Banner berhasil dihapus"}