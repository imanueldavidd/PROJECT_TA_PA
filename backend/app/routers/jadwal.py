# routers/jadwal.py — versi update dengan periode tayang & fix bentrok

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from datetime import date, timedelta

from app.database import get_db
from app.dependencies import verify_token

router = APIRouter(prefix="/api/jadwal", tags=["Jadwal"])


# ── Schema ────────────────────────────────────────────────
class JadwalCreate(BaseModel):
    film_id:         int
    studio_id:       int
    tanggal_mulai:   date
    tanggal_selesai: date
    jam_tayang:      str        # format "HH:MM"
    harga_tiket:     float

class JadwalUpdate(BaseModel):
    tanggal_mulai:   Optional[date]  = None
    tanggal_selesai: Optional[date]  = None
    jam_tayang:      Optional[str]   = None
    harga_tiket:     Optional[float] = None


# ── GET: Jadwal berdasarkan tanggal ──────────────────────
@router.get("/")
def get_jadwal(
    tanggal: date,
    film_id:   Optional[int] = None,
    studio_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    """
    Ambil jadwal yang aktif pada tanggal tertentu.
    Sebuah jadwal aktif kalau:
    tanggal_mulai <= tanggal_query <= tanggal_selesai
    """
    query = """
        SELECT
            jt.id,
            jt.film_id,
            f.judul           AS judul_film,
            f.durasi_menit,
            jt.studio_id,
            s.nama_studio,
            jt.tanggal_mulai,
            jt.tanggal_selesai,
            jt.jam_tayang,
            jt.harga_tiket,
            ADDTIME(jt.jam_tayang,
                SEC_TO_TIME(f.durasi_menit * 60)
            ) AS jam_selesai
        FROM jadwal_tayang jt
        JOIN film   f ON f.id = jt.film_id
        JOIN studio s ON s.id = jt.studio_id
        WHERE jt.tanggal = :tanggal
    """
    params = {"tanggal": tanggal}

    if film_id:
        query += " AND jt.film_id = :film_id"
        params["film_id"] = film_id
    if studio_id:
        query += " AND jt.studio_id = :studio_id"
        params["studio_id"] = studio_id

    query += " ORDER BY s.nama_studio, jt.jam_tayang"

    hasil = db.execute(text(query), params).fetchall()

    return [
        {
            "id":              row.id,
            "film_id":         row.film_id,
            "judul_film":      row.judul_film,
            "durasi_menit":    row.durasi_menit,
            "studio_id":       row.studio_id,
            "nama_studio":     row.nama_studio,
            "tanggal_mulai":   str(row.tanggal_mulai),
            "tanggal_selesai": str(row.tanggal_selesai),
            "jam_tayang":      str(row.jam_tayang),
            "jam_selesai":     str(row.jam_selesai) if row.jam_selesai else None,
            "harga_tiket":     float(row.harga_tiket),
        }
        for row in hasil
    ]


# ── GET: Film list untuk dropdown ────────────────────────
@router.get("/film-list")
def get_film_list(
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    hasil = db.execute(text(
        "SELECT id, judul, durasi_menit FROM film ORDER BY judul"
    )).fetchall()
    return [{"id": r.id, "judul": r.judul, "durasi_menit": r.durasi_menit} for r in hasil]


# ── GET: Studio list untuk dropdown ──────────────────────
@router.get("/studio-list")
def get_studio_list(
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    hasil = db.execute(text(
        "SELECT id, nama_studio, kapasitas FROM studio ORDER BY nama_studio"
    )).fetchall()
    return [{"id": r.id, "nama_studio": r.nama_studio, "kapasitas": r.kapasitas} for r in hasil]

def hitung_status_film(tanggal_mulai, tanggal_selesai) -> str:
    if not tanggal_mulai:
        return 'segera'
    hari_ini = date.today()
    if hari_ini < tanggal_mulai:
        return 'segera'
    elif tanggal_selesai and hari_ini > tanggal_selesai:
        return 'selesai'
    else:
        return 'tayang'
    
# ── Fungsi validasi bentrok jadwal ───────────────────────
def cek_bentrok_jadwal(
    db: Session,
    studio_id:       int,
    jam_tayang:      str,
    durasi_menit:    int,
    tanggal_mulai:   date,
    tanggal_selesai: date,
    exclude_id:      int = None   # untuk update, exclude jadwal yang sedang diedit
) -> Optional[str]:
    """
    Validasi apakah jadwal baru bentrok dengan jadwal yang sudah ada.

    Dua jadwal bentrok kalau:
    1. Aktif di periode yang sama (tanggal overlap)
    2. Jam tayangnya overlap di studio yang sama

    Jam overlap kalau: jam_mulai_A < jam_selesai_B AND jam_selesai_A > jam_mulai_B
    """
    exclude_clause = "AND jt.id != :exclude_id" if exclude_id else ""

    # Hitung jam selesai jadwal baru
    jam_selesai = db.execute(text(
        "SELECT ADDTIME(:jam, SEC_TO_TIME(:durasi * 60)) AS selesai"
    ), {"jam": jam_tayang[:5] + ":00", "durasi": durasi_menit}).fetchone().selesai

    bentrok = db.execute(text(f"""
        SELECT jt.id, f.judul, jt.jam_tayang,
               ADDTIME(jt.jam_tayang, SEC_TO_TIME(f.durasi_menit * 60)) AS jam_selesai_existing
        FROM jadwal_tayang jt
        JOIN film f ON f.id = jt.film_id
        WHERE jt.studio_id = :studio_id
          {exclude_clause}
          -- Cek overlap periode tayang
          AND jt.tanggal = :tanggal
          -- Cek overlap jam tayang
          AND :jam_tayang < ADDTIME(jt.jam_tayang, SEC_TO_TIME(f.durasi_menit * 60))
          AND :jam_selesai > jt.jam_tayang
        LIMIT 1
    """), {
        "studio_id":       studio_id,
        "tanggal_mulai":   tanggal_mulai,
        "tanggal_selesai": tanggal_selesai,
        "jam_tayang":      jam_tayang[:5] + ":00",
        "jam_selesai":     str(jam_selesai),
        "exclude_id":      exclude_id,
    }).fetchone()

    if bentrok:
        return (
            f"Jadwal bentrok dengan film '{bentrok.judul}' "
            f"({str(bentrok.jam_tayang)[:5]} - {str(bentrok.jam_selesai_existing)[:5]}) "
            f"di studio yang sama!"
        )
    return None


# ── POST: Tambah jadwal baru ──────────────────────────────
@router.post("/", status_code=status.HTTP_201_CREATED)
def tambah_jadwal(
    body: JadwalCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    # Validasi tanggal
    if body.tanggal_selesai < body.tanggal_mulai:
        raise HTTPException(
            status_code=400,
            detail="Tanggal selesai tidak boleh sebelum tanggal mulai!"
        )

    # Ambil durasi film
    film = db.execute(text("""
    SELECT
        judul,
        durasi_menit,
        tanggal_mulai,
        tanggal_selesai
    FROM film
    WHERE id=:id
    """), {
        "id": body.film_id
    }).fetchone()
    if not film:
        raise HTTPException(status_code=404, detail="Film tidak ditemukan")
    
    # ✅ Validasi status film — tolak kalau masih "segera"
    status_film = hitung_status_film(film.tanggal_mulai, film.tanggal_selesai)
    if status_film == 'segera':
        raise HTTPException(
            status_code=400,
            detail=f"Film '{film.judul}' masih berstatus 'Segera' (belum masuk periode tayang), "
                   f"tidak bisa dijadwalkan dulu!"
        )
    if status_film == 'selesai':
        raise HTTPException(
            status_code=400,
            detail=f"Film '{film.judul}' sudah selesai tayang, tidak bisa dijadwalkan lagi!"
        )

    # (opsional tapi disarankan) — jadwal harus dalam rentang periode tayang film
    if film.tanggal_mulai and body.tanggal_mulai < film.tanggal_mulai:
        raise HTTPException(
            status_code=400,
            detail=f"Tanggal jadwal tidak boleh sebelum periode tayang film dimulai ({film.tanggal_mulai})."
        )
    if film.tanggal_selesai and body.tanggal_selesai > film.tanggal_selesai:
        raise HTTPException(
            status_code=400,
            detail=f"Tanggal jadwal tidak boleh melebihi periode tayang film ({film.tanggal_selesai})."
        )

    # Validasi bentrok jadwal
    pesan_bentrok = cek_bentrok_jadwal(
        db           = db,
        studio_id    = body.studio_id,
        jam_tayang   = body.jam_tayang,
        durasi_menit = film.durasi_menit,
        tanggal_mulai   = body.tanggal_mulai,
        tanggal_selesai = body.tanggal_selesai,
    )
    if pesan_bentrok:
        raise HTTPException(status_code=400, detail=pesan_bentrok)

    tgl = body.tanggal_mulai

    while tgl <= body.tanggal_selesai:

        db.execute(text("""
            INSERT INTO jadwal_tayang
            (
                film_id,
                studio_id,
                tanggal,
                tanggal_mulai,
                tanggal_selesai,
                jam_tayang,
                harga_tiket
            )
            VALUES
            (
                :film_id,
                :studio_id,
                :tanggal,
                :tanggal_mulai,
                :tanggal_selesai,
                :jam_tayang,
                :harga_tiket
            )
        """),{
            "film_id": body.film_id,
            "studio_id": body.studio_id,
            "tanggal": tgl,
            "tanggal_mulai": body.tanggal_mulai,
            "tanggal_selesai": body.tanggal_selesai,
            "jam_tayang": body.jam_tayang[:5] + ":00",
            "harga_tiket": body.harga_tiket
        })

        tgl += timedelta(days=1)

        db.commit()

    return {"message": f"Jadwal film '{film.judul}' berhasil ditambahkan"}


@router.put("/{jadwal_id}")
def update_jadwal(
    jadwal_id: int,
    body: JadwalUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    jadwal = db.execute(text("""
        SELECT jt.*, f.durasi_menit FROM jadwal_tayang jt
        JOIN film f ON f.id = jt.film_id
        WHERE jt.id = :id
    """), {"id": jadwal_id}).fetchone()

    if not jadwal:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")

    # --- PERUBAHAN DI SINI ---
    # Jangan ambil tanggal_mulai/selesai dari body untuk update baris ini.
    # Kita hanya mengizinkan perubahan jam dan harga pada tanggal tersebut.
    
    jam_baru   = (body.jam_tayang[:5] + ":00") if body.jam_tayang else str(jadwal.jam_tayang)
    harga_baru = body.harga_tiket if body.harga_tiket is not None else jadwal.harga_tiket

    # Validasi bentrok (tetap gunakan tanggal yang ada di baris tersebut)
    pesan_bentrok = cek_bentrok_jadwal(
        db              = db,
        studio_id       = jadwal.studio_id,
        jam_tayang      = jam_baru[:5],
        durasi_menit    = jadwal.durasi_menit,
        tanggal_mulai   = jadwal.tanggal, # Menggunakan tanggal baris ini
        tanggal_selesai = jadwal.tanggal, # Menggunakan tanggal baris ini
        exclude_id      = jadwal_id,
    )
    if pesan_bentrok:
        raise HTTPException(status_code=400, detail=pesan_bentrok)

    db.execute(text("""
        UPDATE jadwal_tayang
        SET jam_tayang  = :jam,
            harga_tiket = :harga
        WHERE id = :id
    """), {
        "jam":    jam_baru,
        "harga":  harga_baru,
        "id":     jadwal_id,
    })
    db.commit()

    return {"message": "Jadwal pada tanggal ini berhasil diperbarui"}


# ── DELETE: Hapus jadwal ──────────────────────────────────
@router.delete("/{jadwal_id}")
def hapus_jadwal(
    jadwal_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token)
):
    ada = db.execute(
        text("SELECT id FROM jadwal_tayang WHERE id = :id"), {"id": jadwal_id}
    ).fetchone()
    if not ada:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")

    punya_booking = db.execute(
        text("SELECT id FROM pemesanan WHERE jadwal_id = :id LIMIT 1"),
        {"id": jadwal_id}
    ).fetchone()
    if punya_booking:
        raise HTTPException(
            status_code=400,
            detail="Jadwal tidak bisa dihapus karena sudah ada pemesanan!"
        )

    db.execute(text("DELETE FROM jadwal_tayang WHERE id = :id"), {"id": jadwal_id})
    db.commit()
    return {"message": "Jadwal berhasil dihapus"}