# models.py
# Berisi Pydantic schema (validasi request & response), BUKAN tabel ORM
import re
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional

# ── REQUEST ──────────────────────────────────────────────
class LoginStafRequest(BaseModel):
    """Body yang dikirim saat karyawan/manajer login"""
    username: str
    password: str

# ── RESPONSE ─────────────────────────────────────────────
class LoginResponse(BaseModel):
    """Data yang dikembalikan setelah login sukses"""
    access_token: str
    token_type: str = "bearer"
    role: str
    nama: str
    user_id: int

class RegisterRequest(BaseModel):
    nama:      str
    email:     EmailStr
    password:  str
    password2: str

    # 💡 Perhatikan: @field_validator harus MENTOK MASUK ke dalam class RegisterRequest
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