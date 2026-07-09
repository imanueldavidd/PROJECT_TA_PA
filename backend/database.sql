-- database.sql
-- Jalankan di TiDB Cloud SQL Editor untuk setup database

CREATE DATABASE IF NOT EXISTS bioskop_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bioskop_db;

-- Tabel pengguna staff
CREATE TABLE pengguna_staf (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nama        VARCHAR(100)  NOT NULL,
    username    VARCHAR(50)   NOT NULL UNIQUE,
    password    VARCHAR(255)  NOT NULL,
    role        ENUM('karyawan', 'manajer') NOT NULL,
    is_aktif    TINYINT(1)    DEFAULT 1,
    dibuat_pada TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- Tabel pelanggan
CREATE TABLE pelanggan (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nama        VARCHAR(100)  NOT NULL,
    email       VARCHAR(100)  NOT NULL UNIQUE,
    password    VARCHAR(255)  NOT NULL,
    no_telepon  VARCHAR(20),
    is_aktif    TINYINT(1)    DEFAULT 1,
    dibuat_pada TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- Tabel OTP registrasi
CREATE TABLE otp_pending (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nama        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    otp_code    VARCHAR(6)   NOT NULL,
    expired_at  DATETIME     NOT NULL,
    dibuat_pada TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Tabel OTP reset password
CREATE TABLE otp_reset_password (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    email       VARCHAR(100) NOT NULL UNIQUE,
    otp_code    VARCHAR(6)   NOT NULL,
    expired_at  DATETIME     NOT NULL,
    dibuat_pada TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Tabel film
CREATE TABLE film (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    judul         VARCHAR(200) NOT NULL,
    genre         VARCHAR(100),
    durasi_menit  INT,
    rating        VARCHAR(10),
    sinopsis      TEXT,
    poster_url    VARCHAR(500),
    status        ENUM('tayang', 'segera') DEFAULT 'segera',
    dibuat_pada   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel banner landing page
CREATE TABLE banner (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    judul        VARCHAR(200),
    gambar_url   VARCHAR(500) NOT NULL,
    urutan       INT          DEFAULT 0,
    is_aktif     TINYINT(1)   DEFAULT 1,
    dibuat_pada  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Tabel studio
CREATE TABLE studio (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    nama_studio  VARCHAR(50)  NOT NULL,
    kapasitas    INT          NOT NULL
);

-- Tabel jadwal tayang
CREATE TABLE jadwal_tayang (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    film_id      INT            NOT NULL,
    studio_id    INT            NOT NULL,
    tanggal      DATE           NOT NULL,
    jam_tayang   TIME           NOT NULL,
    harga_tiket  DECIMAL(10,2)  NOT NULL,
    FOREIGN KEY (film_id)   REFERENCES film(id)   ON DELETE CASCADE,
    FOREIGN KEY (studio_id) REFERENCES studio(id) ON DELETE CASCADE
);

-- Tabel kursi
CREATE TABLE kursi (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    studio_id   INT         NOT NULL,
    kode_kursi  VARCHAR(10) NOT NULL,
    FOREIGN KEY (studio_id) REFERENCES studio(id) ON DELETE CASCADE
);

-- Tabel pemesanan
CREATE TABLE pemesanan (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    pelanggan_id    INT           NULL,
    jadwal_id       INT           NOT NULL,
    kode_booking    VARCHAR(50)   NOT NULL UNIQUE,
    total_harga     DECIMAL(10,2) NOT NULL,
    status_bayar    ENUM('pending','lunas','gagal') DEFAULT 'pending',
    dibuat_pada     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pelanggan_id) REFERENCES pelanggan(id),
    FOREIGN KEY (jadwal_id)    REFERENCES jadwal_tayang(id)
);

-- Tabel detail pemesanan (tiket per kursi)
CREATE TABLE detail_pemesanan (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    pemesanan_id  INT NOT NULL,
    kursi_id      INT NOT NULL,
    qr_token      VARCHAR(500),
    is_validated  TINYINT(1) DEFAULT 0,
    FOREIGN KEY (pemesanan_id) REFERENCES pemesanan(id),
    FOREIGN KEY (kursi_id)     REFERENCES kursi(id)
);

-- Tabel pembayaran
CREATE TABLE pembayaran (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    pemesanan_id  INT          NOT NULL,
    midtrans_id   VARCHAR(100),
    metode        VARCHAR(50),
    status        ENUM('pending','settlement','expire','cancel') DEFAULT 'pending',
    dibayar_pada  TIMESTAMP,
    FOREIGN KEY (pemesanan_id) REFERENCES pemesanan(id)
);

-- Tabel rating film
CREATE TABLE rating_film (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    film_id       INT     NOT NULL,
    pelanggan_id  INT     NOT NULL,
    bintang       TINYINT NOT NULL CHECK (bintang BETWEEN 1 AND 5),
    ulasan        TEXT,
    dibuat_pada   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    diupdate_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_rating (film_id, pelanggan_id),
    FOREIGN KEY (film_id)      REFERENCES film(id)      ON DELETE CASCADE,
    FOREIGN KEY (pelanggan_id) REFERENCES pelanggan(id) ON DELETE CASCADE
);

-- ── Data awal: 4 Studio ───────────────────────────────────
INSERT INTO studio (nama_studio, kapasitas) VALUES
('Studio 01', 55),
('Studio 02', 55),
('Studio 03', 55),
('Studio 04', 55);

-- ── Seed kursi (5 baris A-E × 11 kolom = 55 kursi/studio) ─
INSERT INTO kursi (studio_id, kode_kursi)
SELECT s.id, CONCAT(b.baris, k.kolom)
FROM studio s
CROSS JOIN (
    SELECT 'A' AS baris UNION ALL SELECT 'B'
    UNION ALL SELECT 'C' UNION ALL SELECT 'D'
    UNION ALL SELECT 'E'
) b
CROSS JOIN (
    SELECT 1 AS kolom UNION ALL SELECT 2 UNION ALL SELECT 3
    UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
    UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
    UNION ALL SELECT 10 UNION ALL SELECT 11
) k
ORDER BY s.id, b.baris, k.kolom;