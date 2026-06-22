# routers/staff.py
# Kelola Akun Staff oleh Manajer — CRUD + reset password

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, Field
from typing import Optional
from passlib.context import CryptContext

from app.database import get_db
from app.dependencies import verify_token

router = APIRouter(prefix="/api/staff", tags=["Staff"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Helper: pastikan hanya manajer yang bisa akses ────────
def cek_role_manajer(current_user: dict):
    if current_user.get("role") != "manajer":
        raise HTTPException(status_code=403, detail="Akses ditolak — hanya untuk manajer")


# ── Schema ────────────────────────────────────────────────
class StaffCreate(BaseModel):
    nama:     str = Field(..., min_length=2)
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    role:     str  # 'karyawan' atau 'manajer'

class StaffUpdateRole(BaseModel):
    role: str

class StaffUpdateStatus(BaseModel):
    is_aktif: bool

class ResetPassword(BaseModel):
    password_baru: str = Field(..., min_length=6)


# ── GET: Daftar staff (dengan search + pagination) ───────
@router.get("/", summary="Daftar staff dengan search & pagination")
def get_staff_list(
    q: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(4, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    cek_role_manajer(current_user)

    offset = (page - 1) * per_page
    where_clause = ""
    params = {}

    if q:
        # Cari berdasarkan nama ATAU kode ID (STF-xxxx dari id)
        where_clause = "WHERE (nama LIKE :q OR username LIKE :q OR CONCAT('STF-', LPAD(id, 4, '0')) LIKE :q)"
        params["q"] = f"%{q}%"

    total = db.execute(
        text(f"SELECT COUNT(*) AS total FROM pengguna_staf {where_clause}"), params
    ).fetchone().total

    params.update({"limit": per_page, "offset": offset})
    hasil = db.execute(text(f"""
        SELECT id, nama, username, role, is_aktif
        FROM pengguna_staf
        {where_clause}
        ORDER BY id DESC
        LIMIT :limit OFFSET :offset
    """), params).fetchall()

    data = [
        {
            "id":       r.id,
            "nama":     r.nama,
            "username": r.username,
            "kode_id":  f"STF-{r.id:04d}",
            "role":     r.role,
            "is_aktif": bool(r.is_aktif),
        }
        for r in hasil
    ]

    return {
        "data":        data,
        "page":        page,
        "per_page":    per_page,
        "total":       total,
        "total_pages": max(1, (total + per_page - 1) // per_page),
    }


# ── POST: Tambah staff baru ───────────────────────────────
@router.post("/", status_code=status.HTTP_201_CREATED, summary="Tambah staff baru")
def tambah_staff(
    body: StaffCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    cek_role_manajer(current_user)

    if body.role not in ("karyawan", "manajer"):
        raise HTTPException(status_code=400, detail="Role harus 'karyawan' atau 'manajer'")

    # Cek username sudah dipakai atau belum
    sudah_ada = db.execute(
        text("SELECT id FROM pengguna_staf WHERE username = :u"), {"u": body.username}
    ).fetchone()
    if sudah_ada:
        raise HTTPException(status_code=400, detail="Username sudah digunakan!")

    hash_password = pwd_context.hash(body.password)

    db.execute(text("""
        INSERT INTO pengguna_staf (nama, username, password, role, is_aktif)
        VALUES (:nama, :username, :password, :role, 1)
    """), {
        "nama":     body.nama,
        "username": body.username,
        "password": hash_password,
        "role":     body.role,
    })
    db.commit()

    return {"message": "Staff berhasil ditambahkan"}


# ── PATCH: Update role staff ──────────────────────────────
@router.patch("/{staff_id}/role", summary="Ubah role staff")
def update_role(
    staff_id: int,
    body: StaffUpdateRole,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    cek_role_manajer(current_user)

    if body.role not in ("karyawan", "manajer"):
        raise HTTPException(status_code=400, detail="Role tidak valid")

    # Cegah manajer menurunkan role dirinya sendiri (agar tidak terkunci)
    if str(staff_id) == current_user.get("sub") and body.role != "manajer":
        raise HTTPException(status_code=400, detail="Tidak bisa mengubah role akun sendiri!")

    ada = db.execute(text("SELECT id FROM pengguna_staf WHERE id = :id"), {"id": staff_id}).fetchone()
    if not ada:
        raise HTTPException(status_code=404, detail="Staff tidak ditemukan")

    db.execute(
        text("UPDATE pengguna_staf SET role = :role WHERE id = :id"),
        {"role": body.role, "id": staff_id}
    )
    db.commit()

    return {"message": "Role berhasil diperbarui"}


# ── PATCH: Update status aktif/nonaktif ──────────────────
@router.patch("/{staff_id}/status", summary="Aktifkan/nonaktifkan staff")
def update_status(
    staff_id: int,
    body: StaffUpdateStatus,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    cek_role_manajer(current_user)

    # Cegah manajer menonaktifkan akun sendiri
    if str(staff_id) == current_user.get("sub") and not body.is_aktif:
        raise HTTPException(status_code=400, detail="Tidak bisa menonaktifkan akun sendiri!")

    ada = db.execute(text("SELECT id FROM pengguna_staf WHERE id = :id"), {"id": staff_id}).fetchone()
    if not ada:
        raise HTTPException(status_code=404, detail="Staff tidak ditemukan")

    db.execute(
        text("UPDATE pengguna_staf SET is_aktif = :aktif WHERE id = :id"),
        {"aktif": body.is_aktif, "id": staff_id}
    )
    db.commit()

    return {"message": "Status berhasil diperbarui"}


# ── POST: Reset password staff ────────────────────────────
@router.post("/{staff_id}/reset-password", summary="Reset password staff")
def reset_password(
    staff_id: int,
    body: ResetPassword,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    cek_role_manajer(current_user)

    ada = db.execute(text("SELECT id FROM pengguna_staf WHERE id = :id"), {"id": staff_id}).fetchone()
    if not ada:
        raise HTTPException(status_code=404, detail="Staff tidak ditemukan")

    hash_baru = pwd_context.hash(body.password_baru)

    db.execute(
        text("UPDATE pengguna_staf SET password = :pw WHERE id = :id"),
        {"pw": hash_baru, "id": staff_id}
    )
    db.commit()

    return {"message": "Password berhasil direset"}


# ── DELETE: Hapus staff ───────────────────────────────────
@router.delete("/{staff_id}", summary="Hapus staff")
def hapus_staff(
    staff_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    cek_role_manajer(current_user)

    if str(staff_id) == current_user.get("sub"):
        raise HTTPException(status_code=400, detail="Tidak bisa menghapus akun sendiri!")

    ada = db.execute(text("SELECT id FROM pengguna_staf WHERE id = :id"), {"id": staff_id}).fetchone()
    if not ada:
        raise HTTPException(status_code=404, detail="Staff tidak ditemukan")

    db.execute(text("DELETE FROM pengguna_staf WHERE id = :id"), {"id": staff_id})
    db.commit()

    return {"message": "Staff berhasil dihapus"}