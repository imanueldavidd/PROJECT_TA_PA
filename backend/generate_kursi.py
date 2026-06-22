from app.database import SessionLocal
from sqlalchemy import text

def generate_kursi_baru():
    db = SessionLocal()
    try:
        print("Menghapus data kursi lama...")
        # Hapus kursi yang lama agar tidak dobel
        db.execute(text("DELETE FROM kursi"))
        
        print("Mulai membuat data kursi baru (55 kursi/studio)...")
        
        # 5 Baris: A sampai E
        baris_kursi = ['A', 'B', 'C', 'D', 'E']
        
        # 4 Studio
        for studio_id in range(1, 5):
            for baris in baris_kursi:
                # 11 Kursi per baris (1 sampai 11)
                for nomor in range(1, 12):
                    kode_kursi = f"{baris}{nomor}"
                    db.execute(
                        text("INSERT INTO kursi (studio_id, kode_kursi) VALUES (:studio_id, :kode_kursi)"),
                        {"studio_id": studio_id, "kode_kursi": kode_kursi}
                    )
        
        # Simpan perubahan
        db.commit()
        print("✅ Berhasil! 220 kursi (55 per studio) dengan format baru telah disimpan.")
        
    except Exception as e:
        print(f"❌ Terjadi kesalahan: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    generate_kursi_baru()