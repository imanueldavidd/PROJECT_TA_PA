# routers/customer_auth.py
# Register, Login, dan Get Profil Customer

import os
import random
import string
import re
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from passlib.context import CryptContext
from jose import jwt
from pydantic import BaseModel, EmailStr, field_validator # 💡 import field_validator
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

from app.database import get_db
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api/customer/auth", tags=["Customer Auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── Konfigurasi Email ────────────────────────────────────
conf = ConnectionConfig(
    MAIL_USERNAME   = os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD   = os.getenv("MAIL_PASSWORD"),
    MAIL_FROM       = os.getenv("MAIL_FROM"),
    MAIL_PORT       = int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER     = os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_FROM_NAME  = os.getenv("MAIL_FROM_NAME", "Bioskop 7"),
    MAIL_STARTTLS   = True,
    MAIL_SSL_TLS    = False,
    USE_CREDENTIALS = True,
)


# ── Schema ────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    nama:      str
    email:     EmailStr
    password:  str
    password2: str

    @field_validator('nama')
    @classmethod
    def nama_valid(cls, v):
        v = v.strip()
        if len(v) < 2:
            raise ValueError('Nama minimal 2 karakter')
        if len(v) > 100:
            raise ValueError('Nama maksimal 100 karakter')
        # Cegah HTML/script injection
        if re.search(r'[<>"\']', v):
            raise ValueError('Nama mengandung karakter tidak valid')
        return v

    @field_validator('password')
    @classmethod
    def password_kuat(cls, v):
        if len(v) < 6:
            raise ValueError('Password minimal 6 karakter')
        if len(v) > 100:
            raise ValueError('Password terlalu panjang')
        return v

class VerifikasiOTPRequest(BaseModel):
    email: EmailStr
    otp:   str

class LoginRequest(BaseModel):
    username: str   # bisa nama pengguna atau email
    password: str

class LupaPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email:         EmailStr
    otp:           str
    password_baru: str

# ── Helper: generate OTP 6 digit ─────────────────────────
def generate_otp() -> str:
    return ''.join(random.choices(string.digits, k=6))


# ── Helper token ──────────────────────────────────────────
def buat_token(data: dict) -> str:
    payload = data.copy()
    payload.update({
        "exp":  datetime.now(timezone.utc) + timedelta(minutes=int(os.getenv("JWT_EXPIRE_MINUTES", 480))),
        "type": "customer"
    })
    return jwt.encode(payload, os.getenv("JWT_SECRET_KEY"), algorithm=os.getenv("JWT_ALGORITHM", "HS256"))

# ── Helper: kirim email OTP ───────────────────────────────
async def kirim_email_otp(email: str, nama: str, otp: str):
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: #1e3a5f; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎬 BIOSKOP 7</h1>
        </div>
        <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1f2937; margin-top: 0;">Halo, {nama}!</h2>
            <p style="color: #4b5563;">
                Terima kasih sudah mendaftar di Bioskop 7.
                Gunakan kode OTP berikut untuk verifikasi akunmu:
            </p>
            <div style="background: white; border: 2px dashed #3b82f6;
                        border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px;">KODE VERIFIKASI</p>
                <h1 style="color: #1e3a5f; font-size: 48px; letter-spacing: 12px;
                            margin: 0; font-family: monospace;">{otp}</h1>
                <p style="color: #9ca3af; font-size: 12px; margin: 12px 0 0;">
                    Kode berlaku selama <strong>10 menit</strong>
                </p>
            </div>
            <p style="color: #9ca3af; font-size: 12px;">
                Jika kamu tidak mendaftar di Bioskop 7, abaikan email ini.
            </p>
        </div>
    </div>
    """
    message = MessageSchema(
        subject="Kode OTP Verifikasi Akun Bioskop 7",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )
    fm = FastMail(conf)
    await fm.send_message(message)

async def kirim_email_reset(email: str, nama: str, otp: str):
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: #1e3a5f; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎬 BIOSKOP 7</h1>
        </div>
        <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1f2937; margin-top: 0;">Reset Password</h2>
            <p style="color: #4b5563;">
                Halo {nama}, kami menerima permintaan untuk mereset password akunmu.
                Gunakan kode berikut untuk melanjutkan:
            </p>
            <div style="background: white; border: 2px dashed #ef4444;
                        border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px;">KODE RESET PASSWORD</p>
                <h1 style="color: #1e3a5f; font-size: 48px; letter-spacing: 12px;
                            margin: 0; font-family: monospace;">{otp}</h1>
                <p style="color: #9ca3af; font-size: 12px; margin: 12px 0 0;">
                    Kode berlaku selama <strong>10 menit</strong>
                </p>
            </div>
            <p style="color: #9ca3af; font-size: 12px;">
                Jika kamu tidak meminta reset password, abaikan email ini —
                akunmu tetap aman.
            </p>
        </div>
    </div>
    """
    message = MessageSchema(
        subject="Kode Reset Password Bioskop 7",
        recipients=[email],
        body=html,
        subtype=MessageType.html
    )
    fm = FastMail(conf)
    await fm.send_message(message)

# ── POST: Register ────────────────────────────────────────
@router.post("/register", status_code=201)
async def register(
    body: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # Validasi panjang nama & password sudah ditangani otomatis oleh Pydantic (RegisterRequest)
    if body.password != body.password2:
        raise HTTPException(status_code=400, detail="Password tidak cocok!")
    if db.execute(text("SELECT id FROM pelanggan WHERE email = :e"), {"e": body.email}).fetchone():
        raise HTTPException(status_code=400, detail="Email sudah terdaftar!")

    # Cek nama sudah dipakai
    if db.execute(
        text("SELECT id FROM pelanggan WHERE nama = :n"), {"n": body.nama}
    ).fetchone():
        raise HTTPException(status_code=400, detail="Nama pengguna sudah digunakan!")

    # Generate OTP
    otp      = generate_otp()
    hash_pw  = pwd_context.hash(body.password)
    expired  = datetime.now(timezone.utc) + timedelta(minutes=10)

    # Simpan ke tabel otp_pending (hapus yang lama dulu kalau ada)
    db.execute(
        text("DELETE FROM otp_pending WHERE email = :e"), {"e": body.email}
    )
    db.execute(text("""
        INSERT INTO otp_pending (nama, email, password, otp_code, expired_at)
        VALUES (:nama, :email, :pw, :otp, :expired)
    """), {
        "nama":    body.nama,
        "email":   body.email,
        "pw":      hash_pw,
        "otp":     otp,
        "expired": expired,
    })
    db.commit()

    await kirim_email_otp(body.email, body.nama, otp)

    return {"message": "Kode OTP telah dikirim ke email kamu. Berlaku 10 menit."}

# ── POST: Verifikasi OTP → buat akun ─────────────────────
@router.post("/verifikasi-otp")
def verifikasi_otp(body: VerifikasiOTPRequest, db: Session = Depends(get_db)):
    # Ambil data pending
    pending = db.execute(text("""
        SELECT * FROM otp_pending
        WHERE email = :email AND otp_code = :otp
    """), {"email": body.email, "otp": body.otp}).fetchone()

    if not pending:
        raise HTTPException(status_code=400, detail="Kode OTP salah!")

    # Cek expired
    now = datetime.now(timezone.utc)
    expired_at = pending.expired_at
    if expired_at.tzinfo is None:
        from datetime import timezone as tz
        expired_at = expired_at.replace(tzinfo=tz.utc)

    if now > expired_at:
        db.execute(text("DELETE FROM otp_pending WHERE email = :e"), {"e": body.email})
        db.commit()
        raise HTTPException(status_code=400, detail="Kode OTP sudah kadaluarsa! Daftar ulang.")

    db.execute(text("""
        INSERT INTO pelanggan (nama, email, password, is_aktif)
        VALUES (:nama, :email, :pw, 1)
    """), {"nama": pending.nama, "email": pending.email, "pw": pending.password})

    # Hapus data pending
    db.execute(text("DELETE FROM otp_pending WHERE email = :e"), {"e": body.email})
    db.commit()

    return {"message": "Akun berhasil dibuat! Silakan login."}

# ── POST: Kirim ulang OTP ─────────────────────────────────
@router.post("/kirim-ulang-otp")
async def kirim_ulang_otp(
    body: VerifikasiOTPRequest,   # hanya pakai field email
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    pending = db.execute(
        text("SELECT * FROM otp_pending WHERE email = :e"), {"e": body.email}
    ).fetchone()

    if not pending:
        raise HTTPException(status_code=400, detail="Data registrasi tidak ditemukan. Daftar ulang.")

    # Generate OTP baru
    otp_baru = generate_otp()
    expired  = datetime.now(timezone.utc) + timedelta(minutes=10)

    db.execute(text("""
        UPDATE otp_pending SET otp_code = :otp, expired_at = :exp WHERE email = :e
    """), {"otp": otp_baru, "exp": expired, "e": body.email})
    db.commit()

    background_tasks.add_task(kirim_email_otp, body.email, pending.nama, otp_baru)

    return {"message": "Kode OTP baru telah dikirim!"}


# ── POST: Login ───────────────────────────────────────────
@router.post("/login")
@limiter.limit("5/15minutes")   # 1. Batasi maksimal 5x login per 15 menit per IP
def login(
    request: Request,            # 2. Wajib ada parameter request ini!
    body: LoginRequest, 
    db: Session = Depends(get_db)
):
    p = db.execute(text("""
        SELECT * FROM pelanggan
        WHERE (nama = :u OR email = :u) AND is_aktif = 1
    """),
        {"u": body.username}
    ).fetchone()

    if not p or not pwd_context.verify(body.password, p.password):
        raise HTTPException(status_code=401, detail="Email/Username atau password salah")

    token = buat_token({"sub": str(p.id), "email": p.email, "nama": p.nama, "role": "customer"})

    return {
        "access_token": token,
        "token_type":   "bearer",
        "nama":         p.nama,
        "email":        p.email,
        "user_id":      p.id,
    }


# ── GET: Profil customer ──────────────────────────────────
@router.get("/profil")
def get_profil(db: Session = Depends(get_db), current_user: dict = Depends(lambda: None)):
    pass

# ── POST: Minta OTP reset password ───────────────────────
@router.post("/lupa-password")
async def lupa_password(
    body: LupaPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = db.execute(
        text("SELECT id, nama FROM pelanggan WHERE email = :e AND is_aktif = 1"),
        {"e": body.email}
    ).fetchone()

    if not user:
        return {"message": "Jika email terdaftar, kode OTP telah dikirim."}

    otp     = generate_otp()
    expired = datetime.now(timezone.utc) + timedelta(minutes=10)

    db.execute(text("DELETE FROM otp_reset_password WHERE email = :e"), {"e": body.email})
    db.execute(text("""
        INSERT INTO otp_reset_password (email, otp_code, expired_at)
        VALUES (:email, :otp, :expired)
    """), {"email": body.email, "otp": otp, "expired": expired})
    db.commit()

    background_tasks.add_task(kirim_email_reset, body.email, user.nama, otp)

    return {"message": "Jika email terdaftar, kode OTP telah dikirim."}

# ── POST: Verifikasi OTP + set password baru ─────────────
@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    if len(body.password_baru) < 6:
        raise HTTPException(status_code=400, detail="Password minimal 6 karakter!")

    pending = db.execute(text("""
        SELECT * FROM otp_reset_password
        WHERE email = :email AND otp_code = :otp
    """), {"email": body.email, "otp": body.otp}).fetchone()

    if not pending:
        raise HTTPException(status_code=400, detail="Kode OTP salah!")

    now = datetime.now(timezone.utc)
    expired_at = pending.expired_at
    if expired_at.tzinfo is None:
        expired_at = expired_at.replace(tzinfo=timezone.utc)

    if now > expired_at:
        db.execute(text("DELETE FROM otp_reset_password WHERE email = :e"), {"e": body.email})
        db.commit()
        raise HTTPException(status_code=400, detail="Kode OTP sudah kadaluarsa! Minta ulang.")

    hash_baru = pwd_context.hash(body.password_baru)
    db.execute(
        text("UPDATE pelanggan SET password = :pw WHERE email = :e"),
        {"pw": hash_baru, "e": body.email}
    )
    db.execute(text("DELETE FROM otp_reset_password WHERE email = :e"), {"e": body.email})
    db.commit()

    return {"message": "Password berhasil direset! Silakan login dengan password baru."}

# ── POST: Kirim ulang OTP reset password ──────────────────
@router.post("/kirim-ulang-otp-reset")
async def kirim_ulang_otp_reset(
    body: LupaPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = db.execute(
        text("SELECT id, nama FROM pelanggan WHERE email = :e AND is_aktif = 1"),
        {"e": body.email}
    ).fetchone()

    pending = db.execute(
        text("SELECT * FROM otp_reset_password WHERE email = :e"), {"e": body.email}
    ).fetchone()

    if not user or not pending:
        raise HTTPException(status_code=400, detail="Permintaan reset tidak ditemukan. Mulai ulang.")

    otp_baru = generate_otp()
    expired  = datetime.now(timezone.utc) + timedelta(minutes=10)

    db.execute(text("""
        UPDATE otp_reset_password SET otp_code = :otp, expired_at = :exp WHERE email = :e
    """), {"otp": otp_baru, "exp": expired, "e": body.email})
    db.commit()

    background_tasks.add_task(kirim_email_reset, body.email, user.nama, otp_baru)

    return {"message": "Kode OTP baru telah dikirim!"}