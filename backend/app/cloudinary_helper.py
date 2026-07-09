# cloudinary_helper.py
# Helper untuk upload gambar ke Cloudinary

import os
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile, HTTPException
from dotenv import load_dotenv

load_dotenv()

# Konfigurasi Cloudinary
cloudinary.config(
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key    = os.getenv("CLOUDINARY_API_KEY"),
    api_secret = os.getenv("CLOUDINARY_API_SECRET"),
    secure     = True
)

ALLOWED_EXT = {"jpg", "jpeg", "png", "webp"}

async def upload_gambar(file: UploadFile, folder: str = "bioskop") -> str:
    """
    Upload file ke Cloudinary, return URL gambar.
    folder: subfolder di Cloudinary (misal: 'bioskop/poster', 'bioskop/banner')
    """
    # Cek ekstensi
    ext = file.filename.split(".")[-1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="Format file tidak didukung. Gunakan JPG/PNG/WebP.")

    # Baca file
    contents = await file.read()

    try:
        # Upload ke Cloudinary
        result = cloudinary.uploader.upload(
            contents,
            folder=folder,
            resource_type="image",
            # Transformasi otomatis: kompres dan resize kalau terlalu besar
            transformation=[
                {"quality": "auto", "fetch_format": "auto"}
            ]
        )
        return result["secure_url"]  # URL https dari Cloudinary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal upload gambar: {str(e)}")


def hapus_gambar(url: str):
    """Hapus gambar dari Cloudinary berdasarkan URL"""
    if not url or "cloudinary.com" not in url:
        return  # Skip kalau bukan URL Cloudinary

    try:
        # Ekstrak public_id dari URL
        # URL format: https://res.cloudinary.com/cloud_name/image/upload/v123/folder/filename.jpg
        parts    = url.split("/upload/")
        if len(parts) < 2:
            return
        public_id = parts[1].split(".")[0]  # hapus ekstensi
        if public_id.startswith("v"):
            public_id = "/".join(public_id.split("/")[1:])  # hapus version
        cloudinary.uploader.destroy(public_id)
    except Exception:
        pass  # Silent fail — tidak perlu block operasi utama