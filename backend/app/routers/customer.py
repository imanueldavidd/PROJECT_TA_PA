# routers/customer.py
# Endpoint untuk Customer — film, jadwal, kursi, booking, profil, riwayat

import hmac, hashlib, json, os, uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import List, Optional
from jose import jwt, JWTError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import Field

from app.database import get_db

router = APIRouter(prefix="/api/customer", tags=["Customer"])
bearer_scheme = HTTPBearer()


# ── Verify token customer ─────────────────────────────────
def verify_customer_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
) -> dict:
    try:
        payload = jwt.decode(
            credentials.credentials,
            os.getenv("JWT_SECRET_KEY"),
            algorithms=[os.getenv("JWT_ALGORITHM", "HS256")]
        )
        if payload.get("type") != "customer":
            raise HTTPException(status_code=403, detail="Bukan token customer")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Token tidak valid atau kadaluarsa")


# ── Schema ────────────────────────────────────────────────
class SnapTokenRequest(BaseModel):
    jadwal_id: int
    kursi_ids: List[int]

class KonfirmasiBooking(BaseModel):
    jadwal_id: int
    kursi_ids: List[int]
    order_id:  str

class UpdateProfil(BaseModel):
    nama:       str
    no_telepon: str = ""

class RatingCreate(BaseModel):
    bintang: int = Field(..., ge=1, le=5)
    ulasan:  str = ""


# ── GET: Semua film (sedang tayang & segera) ──────────────
@router.get("/films")
def get_films(
    status_film: Optional[str] = None,
    db: Session = Depends(get_db)
):
    if status_film:
        hasil = db.execute(
            text("SELECT * FROM film WHERE status = :s ORDER BY dibuat_pada DESC"),
            {"s": status_film}
        ).fetchall()
    else:
        hasil = db.execute(
            text("SELECT * FROM film WHERE status IN ('tayang','segera') ORDER BY FIELD(status,'tayang','segera'), dibuat_pada DESC")
        ).fetchall()

    return [
        {
            "id":           r.id,
            "judul":        r.judul,
            "genre":        r.genre,
            "durasi_menit": r.durasi_menit,
            "rating":       r.rating,
            "sinopsis":     r.sinopsis,
            "poster_url":   r.poster_url,
            "status":       r.status,
        }
        for r in hasil
    ]


# ── GET: Detail film + jadwal 7 hari ke depan ────────────
@router.get("/films/{film_id}")
def get_film_detail(film_id: int, db: Session = Depends(get_db)):
    film = db.execute(text("SELECT * FROM film WHERE id = :id"), {"id": film_id}).fetchone()
    if not film:
        raise HTTPException(status_code=404, detail="Film tidak ditemukan")

    jadwal = db.execute(text("""
        SELECT
            jt.id, jt.tanggal, jt.jam_tayang, jt.harga_tiket,
            s.nama_studio, s.kapasitas,
            s.kapasitas - COALESCE(terpesan.jml, 0) AS kursi_tersedia
        FROM jadwal_tayang jt
        JOIN studio s ON s.id = jt.studio_id
        LEFT JOIN (
            SELECT p.jadwal_id, COUNT(dp.id) AS jml
            FROM pemesanan p
            JOIN detail_pemesanan dp ON dp.pemesanan_id = p.id
            WHERE p.status_bayar = 'lunas'
            GROUP BY p.jadwal_id
        ) terpesan ON terpesan.jadwal_id = jt.id
        WHERE jt.film_id = :fid
          AND jt.tanggal >= CURDATE()
          AND jt.tanggal <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        ORDER BY jt.tanggal, jt.jam_tayang
    """), {"fid": film_id}).fetchall()

    return {
        "id":           film.id,
        "judul":        film.judul,
        "genre":        film.genre,
        "durasi_menit": film.durasi_menit,
        "rating":       film.rating,
        "sinopsis":     film.sinopsis,
        "poster_url":   film.poster_url,
        "status":       film.status,
        "jadwal": [
            {
                "id":             j.id,
                "tanggal":        str(j.tanggal),
                "jam_tayang":     str(j.jam_tayang)[:5],
                "harga_tiket":    float(j.harga_tiket),
                "nama_studio":    j.nama_studio,
                "kapasitas":      j.kapasitas,
                "kursi_tersedia": max(j.kursi_tersedia or 0, 0),
            }
            for j in jadwal
        ]
    }


# ── GET: Denah kursi ─────────────────────────────────────
@router.get("/kursi/{jadwal_id}")
def get_kursi(jadwal_id: int, db: Session = Depends(get_db)):
    jadwal = db.execute(
        text("SELECT studio_id FROM jadwal_tayang WHERE id = :id"), {"id": jadwal_id}
    ).fetchone()
    if not jadwal:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")

    hasil = db.execute(text("""
        SELECT k.id, k.kode_kursi,
            CASE WHEN dp.id IS NOT NULL THEN 'penuh' ELSE 'tersedia' END AS status
        FROM kursi k
        LEFT JOIN detail_pemesanan dp ON dp.kursi_id = k.id
        LEFT JOIN pemesanan p ON p.id = dp.pemesanan_id
            AND p.jadwal_id = :jid AND p.status_bayar = 'lunas'
        WHERE k.studio_id = :sid
        ORDER BY k.kode_kursi
    """), {"jid": jadwal_id, "sid": jadwal.studio_id}).fetchall()

    return [{"id": r.id, "kode_kursi": r.kode_kursi, "status": r.status} for r in hasil]


# ── GET: Profil customer ──────────────────────────────────
@router.get("/profil")
def get_profil(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_customer_token)
):
    p = db.execute(
        text("SELECT id, nama, email, no_telepon, dibuat_pada FROM pelanggan WHERE id = :id"),
        {"id": int(current_user["sub"])}
    ).fetchone()
    if not p:
        raise HTTPException(status_code=404, detail="Profil tidak ditemukan")

    return {
        "id":          p.id,
        "nama":        p.nama,
        "email":       p.email,
        "no_telepon":  p.no_telepon,
        "dibuat_pada": str(p.dibuat_pada),
    }


# ── PUT: Update profil ────────────────────────────────────
@router.put("/profil")
def update_profil(
    body: UpdateProfil,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_customer_token)
):
    if len(body.nama.strip()) < 2:
        raise HTTPException(status_code=400, detail="Nama minimal 2 karakter!")
    
    db.execute(text("""
        UPDATE pelanggan SET nama = :nama, no_telepon = :telp WHERE id = :id
    """), {"nama": body.nama, "telp": body.no_telepon, "id": int(current_user["sub"])})
    db.commit()
    return {"message": "Profil berhasil diperbarui"}


# ── GET: Riwayat pemesanan ────────────────────────────────
@router.get("/riwayat")
def get_riwayat(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_customer_token)
):
    hasil = db.execute(text("""
        SELECT
            p.id, p.kode_booking, p.total_harga, p.status_bayar, p.dibuat_pada,
            f.judul, f.poster_url, s.nama_studio,
            jt.tanggal, jt.jam_tayang,
            COUNT(dp.id) AS jumlah_tiket
        FROM pemesanan p
        JOIN jadwal_tayang jt ON jt.id = p.jadwal_id
        JOIN film f           ON f.id  = jt.film_id
        JOIN studio s         ON s.id  = jt.studio_id
        LEFT JOIN detail_pemesanan dp ON dp.pemesanan_id = p.id
        WHERE p.pelanggan_id = :pid
        GROUP BY p.id, p.kode_booking, p.total_harga, p.status_bayar,
                 p.dibuat_pada, f.judul, f.poster_url, s.nama_studio,
                 jt.tanggal, jt.jam_tayang
        ORDER BY p.dibuat_pada DESC
    """), {"pid": int(current_user["sub"])}).fetchall()

    return [
        {
            "id":           r.id,
            "kode_booking": r.kode_booking,
            "total_harga":  float(r.total_harga),
            "status_bayar": r.status_bayar,
            "dibuat_pada":  str(r.dibuat_pada),
            "judul_film":   r.judul,
            "poster_url":   r.poster_url,
            "nama_studio":  r.nama_studio,
            "tanggal":      str(r.tanggal),
            "jam_tayang":   str(r.jam_tayang)[:5],
            "jumlah_tiket": r.jumlah_tiket,
        }
        for r in hasil
    ]


# ── POST: Snap Token Midtrans ─────────────────────────────
@router.post("/snap-token")
def buat_snap_token(
    body: SnapTokenRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_customer_token)
):
    import midtransclient

    jadwal = db.execute(text("""
        SELECT jt.harga_tiket, jt.studio_id, f.judul, s.nama_studio
        FROM jadwal_tayang jt
        JOIN film f   ON f.id = jt.film_id
        JOIN studio s ON s.id = jt.studio_id
        WHERE jt.id = :id
    """), {"id": body.jadwal_id}).fetchone()

    if not jadwal:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")

    # Validasi kursi
    for kid in body.kursi_ids:
        sudah = db.execute(text("""
            SELECT dp.id FROM detail_pemesanan dp
            JOIN pemesanan p ON p.id = dp.pemesanan_id
            WHERE dp.kursi_id = :kid AND p.jadwal_id = :jid AND p.status_bayar = 'lunas'
        """), {"kid": kid, "jid": body.jadwal_id}).fetchone()
        if sudah:
            raise HTTPException(status_code=400, detail="Salah satu kursi sudah dipesan!")

    total    = float(jadwal.harga_tiket) * len(body.kursi_ids)
    order_id = f"CST-{uuid.uuid4().hex[:10].upper()}"

    kode_list = [
        db.execute(text("SELECT kode_kursi FROM kursi WHERE id = :id"), {"id": kid}).fetchone().kode_kursi
        for kid in body.kursi_ids
    ]

    pelanggan = db.execute(
        text("SELECT nama, email, no_telepon FROM pelanggan WHERE id = :id"),
        {"id": int(current_user["sub"])}
    ).fetchone()

    try:
        snap = midtransclient.Snap(
            is_production=os.getenv("MIDTRANS_IS_PRODUCTION", "False") == "True",
            server_key=os.getenv("MIDTRANS_SERVER_KEY"),
        )
        result = snap.create_transaction({
            "transaction_details": {"order_id": order_id, "gross_amount": int(total)},
            "item_details": [{
                "id":       f"TIKET-{body.jadwal_id}",
                "price":    int(jadwal.harga_tiket),
                "quantity": len(body.kursi_ids),
                "name":     f"{jadwal.judul} - {', '.join(kode_list)}",
            }],
            "customer_details": {
                "first_name": pelanggan.nama if pelanggan else "Customer",
                "email":      pelanggan.email if pelanggan else "",
                "phone":      pelanggan.no_telepon if pelanggan else "",
            },
        })
        return {"snap_token": result["token"], "order_id": order_id, "total": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal membuat token: {str(e)}")


# ── POST: Konfirmasi booking setelah bayar ────────────────
@router.post("/booking/konfirmasi", status_code=201)
def konfirmasi_booking(
    body: KonfirmasiBooking,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_customer_token)
):
    jadwal = db.execute(text("""
        SELECT jt.harga_tiket, jt.studio_id, jt.tanggal, jt.jam_tayang,
               f.judul, f.poster_url, s.nama_studio
        FROM jadwal_tayang jt
        JOIN film f   ON f.id = jt.film_id
        JOIN studio s ON s.id = jt.studio_id
        WHERE jt.id = :id
    """), {"id": body.jadwal_id}).fetchone()

    if not jadwal:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")

    total = float(jadwal.harga_tiket) * len(body.kursi_ids)

    result = db.execute(text("""
        INSERT INTO pemesanan (pelanggan_id, jadwal_id, kode_booking, total_harga, status_bayar)
        VALUES (:pid, :jid, :kb, :total, 'lunas')
    """), {"pid": int(current_user["sub"]), "jid": body.jadwal_id, "kb": body.order_id, "total": total})
    db.flush()
    pemesanan_id = result.lastrowid

    db.execute(text("""
        INSERT INTO pembayaran (pemesanan_id, midtrans_id, metode, status, dibayar_pada)
        VALUES (:pid, :mid, 'midtrans', 'settlement', NOW())
    """), {"pid": pemesanan_id, "mid": body.order_id})

    tiket_list = []
    for kid in body.kursi_ids:
        kode = db.execute(text("SELECT kode_kursi FROM kursi WHERE id = :id"), {"id": kid}).fetchone().kode_kursi
        payload   = json.dumps({"pemesanan_id": pemesanan_id, "kursi_id": kid, "jadwal_id": body.jadwal_id, "kode_booking": body.order_id, "ts": int(datetime.now(timezone.utc).timestamp())}, separators=(',', ':'))
        secret    = os.getenv("JWT_SECRET_KEY", "secret").encode()
        signature = hmac.new(secret, payload.encode(), hashlib.sha256).hexdigest()
        qr_data   = f"{payload}.{signature}"
        db.execute(text("INSERT INTO detail_pemesanan (pemesanan_id, kursi_id, qr_token) VALUES (:pid, :kid, :qr)"), {"pid": pemesanan_id, "kid": kid, "qr": qr_data})
        tiket_list.append({"kursi": kode, "qr_token": qr_data})

    db.commit()

    return {
        "kode_booking": body.order_id,
        "judul_film":   jadwal.judul,
        "poster_url":   jadwal.poster_url,
        "nama_studio":  jadwal.nama_studio,
        "jam_tayang":   str(jadwal.jam_tayang)[:5],
        "tanggal":      str(jadwal.tanggal),
        "total_harga":  total,
        "tiket":        tiket_list,
    }

# ── GET: Detail satu pesanan + tiket QR ──────────────────
@router.get("/riwayat/{pesanan_id}")
def get_detail_pesanan(
    pesanan_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_customer_token)
):
    # Pastikan pesanan milik customer yang login
    pesanan = db.execute(text("""
        SELECT
            p.id, p.kode_booking, p.total_harga, p.status_bayar, p.dibuat_pada,
            f.judul AS judul_film, f.poster_url,
            s.nama_studio, jt.tanggal, jt.jam_tayang
        FROM pemesanan p
        JOIN jadwal_tayang jt ON jt.id = p.jadwal_id
        JOIN film f           ON f.id  = jt.film_id
        JOIN studio s         ON s.id  = jt.studio_id
        WHERE p.id = :pid AND p.pelanggan_id = :uid
    """), {"pid": pesanan_id, "uid": int(current_user["sub"])}).fetchone()

    if not pesanan:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")

    # Ambil semua tiket + QR token
    tiket = db.execute(text("""
        SELECT dp.id, k.kode_kursi, dp.qr_token, dp.is_validated
        FROM detail_pemesanan dp
        JOIN kursi k ON k.id = dp.kursi_id
        WHERE dp.pemesanan_id = :pid
        ORDER BY k.kode_kursi
    """), {"pid": pesanan_id}).fetchall()

    return {
        "id":           pesanan.id,
        "kode_booking": pesanan.kode_booking,
        "total_harga":  float(pesanan.total_harga),
        "status_bayar": pesanan.status_bayar,
        "dibuat_pada":  str(pesanan.dibuat_pada),
        "judul_film":   pesanan.judul_film,
        "poster_url":   pesanan.poster_url,
        "nama_studio":  pesanan.nama_studio,
        "tanggal":      str(pesanan.tanggal),
        "jam_tayang":   str(pesanan.jam_tayang)[:5],
        "tiket_detail": [
            {
                "id":           t.id,
                "kode_kursi":   t.kode_kursi,
                "qr_token":     t.qr_token,
                "is_validated": bool(t.is_validated),
            }
            for t in tiket
        ]
    }

# ── GET: Cek apakah customer boleh rating film ini ────────
@router.get("/films/{film_id}/cek-rating")
def cek_boleh_rating(
    film_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_customer_token)
):
    pelanggan_id = int(current_user["sub"])

    # Cek sudah pernah nonton (punya tiket lunas + tanggal sudah lewat)
    sudah_nonton = db.execute(text("""
        SELECT COUNT(p.id) AS jumlah
        FROM pemesanan p
        JOIN jadwal_tayang jt ON jt.id = p.jadwal_id
        WHERE jt.film_id      = :film_id
          AND p.pelanggan_id  = :pid
          AND p.status_bayar  = 'lunas'
          AND jt.tanggal      < CURDATE()
    """), {"film_id": film_id, "pid": pelanggan_id}).fetchone()

    # Cek sudah pernah rating
    sudah_rating = db.execute(text("""
        SELECT id, bintang, ulasan FROM rating_film
        WHERE film_id = :film_id AND pelanggan_id = :pid
    """), {"film_id": film_id, "pid": pelanggan_id}).fetchone()

    return {
        "boleh_rating":  sudah_nonton.jumlah > 0,
        "sudah_rating":  sudah_rating is not None,
        "rating_saya": {
            "bintang": sudah_rating.bintang,
            "ulasan":  sudah_rating.ulasan,
        } if sudah_rating else None
    }


# ── GET: Semua rating untuk 1 film ───────────────────────
@router.get("/films/{film_id}/rating")
def get_rating_film(
    film_id: int,
    db: Session = Depends(get_db)
):
    # Statistik rating
    stats = db.execute(text("""
        SELECT
            COUNT(*)            AS total,
            ROUND(AVG(bintang), 1) AS rata_rata,
            SUM(bintang = 5)    AS bintang_5,
            SUM(bintang = 4)    AS bintang_4,
            SUM(bintang = 3)    AS bintang_3,
            SUM(bintang = 2)    AS bintang_2,
            SUM(bintang = 1)    AS bintang_1
        FROM rating_film
        WHERE film_id = :film_id
    """), {"film_id": film_id}).fetchone()

    # List ulasan terbaru
    ulasan = db.execute(text("""
        SELECT
            r.bintang, r.ulasan, r.dibuat_pada,
            p.nama AS nama_pengguna
        FROM rating_film r
        JOIN pelanggan p ON p.id = r.pelanggan_id
        WHERE r.film_id = :film_id
          AND r.ulasan  != ''
        ORDER BY r.dibuat_pada DESC
        LIMIT 10
    """), {"film_id": film_id}).fetchall()

    return {
        "statistik": {
            "total":      stats.total or 0,
            "rata_rata":  float(stats.rata_rata or 0),
            "bintang_5":  stats.bintang_5 or 0,
            "bintang_4":  stats.bintang_4 or 0,
            "bintang_3":  stats.bintang_3 or 0,
            "bintang_2":  stats.bintang_2 or 0,
            "bintang_1":  stats.bintang_1 or 0,
        },
        "ulasan": [
            {
                "nama_pengguna": u.nama_pengguna,
                "bintang":       u.bintang,
                "ulasan":        u.ulasan,
                "dibuat_pada":   str(u.dibuat_pada),
            }
            for u in ulasan
        ]
    }


# ── POST: Beri rating ─────────────────────────────────────
@router.post("/films/{film_id}/rating", status_code=201)
def beri_rating(
    film_id: int,
    body: RatingCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_customer_token)
):
    pelanggan_id = int(current_user["sub"])

    # Validasi: harus sudah nonton
    sudah_nonton = db.execute(text("""
        SELECT COUNT(p.id) AS jumlah
        FROM pemesanan p
        JOIN jadwal_tayang jt ON jt.id = p.jadwal_id
        WHERE jt.film_id     = :film_id
          AND p.pelanggan_id = :pid
          AND p.status_bayar = 'lunas'
          AND jt.tanggal     < CURDATE()
    """), {"film_id": film_id, "pid": pelanggan_id}).fetchone()

    if sudah_nonton.jumlah == 0:
        raise HTTPException(
            status_code=403,
            detail="Kamu hanya bisa memberi rating setelah menonton film ini!"
        )

    # Insert atau update (kalau sudah pernah rating)
    db.execute(text("""
        INSERT INTO rating_film (film_id, pelanggan_id, bintang, ulasan)
        VALUES (:film_id, :pid, :bintang, :ulasan)
        ON DUPLICATE KEY UPDATE
            bintang       = VALUES(bintang),
            ulasan        = VALUES(ulasan),
            diupdate_pada = NOW()
    """), {
        "film_id":  film_id,
        "pid":      pelanggan_id,
        "bintang":  body.bintang,
        "ulasan":   body.ulasan,
    })
    db.commit()

    return {"message": "Rating berhasil disimpan!"}


# ── DELETE: Hapus rating ──────────────────────────────────
@router.delete("/films/{film_id}/rating")
def hapus_rating(
    film_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_customer_token)
):
    pelanggan_id = int(current_user["sub"])

    ada = db.execute(text("""
        SELECT id FROM rating_film
        WHERE film_id = :fid AND pelanggan_id = :pid
    """), {"fid": film_id, "pid": pelanggan_id}).fetchone()

    if not ada:
        raise HTTPException(status_code=404, detail="Rating tidak ditemukan")

    db.execute(text("""
        DELETE FROM rating_film
        WHERE film_id = :fid AND pelanggan_id = :pid
    """), {"fid": film_id, "pid": pelanggan_id})
    db.commit()

    return {"message": "Rating berhasil dihapus"}