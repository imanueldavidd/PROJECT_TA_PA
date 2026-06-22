-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jun 19, 2026 at 09:45 AM
-- Server version: 8.0.46
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bioskop_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `detail_pemesanan`
--

CREATE TABLE `detail_pemesanan` (
  `id` int NOT NULL,
  `pemesanan_id` int NOT NULL,
  `kursi_id` int NOT NULL,
  `qr_token` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_validated` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `detail_pemesanan`
--

INSERT INTO `detail_pemesanan` (`id`, `pemesanan_id`, `kursi_id`, `qr_token`, `is_validated`) VALUES
(1, 1, 10, '{\"pemesanan_id\":1,\"kursi_id\":10,\"jadwal_id\":1,\"kode_booking\":\"OFS-F26EBCBF\",\"ts\":1781520176}.b448caa4a54fe46702cc3597cfb05e7e483722604293704b40bf71209c520a41', 0),
(2, 1, 9, '{\"pemesanan_id\":1,\"kursi_id\":9,\"jadwal_id\":1,\"kode_booking\":\"OFS-F26EBCBF\",\"ts\":1781520176}.ffa371bfb805565667b73d242dc4788e7a6ad5adfad4121fd09eda38e6923eec', 0),
(3, 2, 76, '{\"pemesanan_id\":2,\"kursi_id\":76,\"jadwal_id\":3,\"kode_booking\":\"OFS-6B3FB435\",\"ts\":1781520432}.a915de312b6628cf92c629599ff5f952397249d2bf0a664f45c7e60ee06fc491', 0),
(4, 2, 75, '{\"pemesanan_id\":2,\"kursi_id\":75,\"jadwal_id\":3,\"kode_booking\":\"OFS-6B3FB435\",\"ts\":1781520432}.18027b93ec92f0041081063101dd8eaed60495ddff0b09705793705facf86b16', 0),
(5, 3, 21, '{\"pemesanan_id\":3,\"kursi_id\":21,\"jadwal_id\":5,\"kode_booking\":\"OFS-6AABA464\",\"ts\":1781796668}.9c60e7f2b59e83aeb297633b901adde4090d5af4e1e239ab0323643db0ff6688', 0),
(6, 3, 11, '{\"pemesanan_id\":3,\"kursi_id\":11,\"jadwal_id\":5,\"kode_booking\":\"OFS-6AABA464\",\"ts\":1781796668}.57c7a48e8ab68288200fcdee3e015e72e47c378c2ccbb9fd44636ac1245d4965', 0);

-- --------------------------------------------------------

--
-- Table structure for table `film`
--

CREATE TABLE `film` (
  `id` int NOT NULL,
  `judul` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `genre` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `durasi_menit` int DEFAULT NULL,
  `rating` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sinopsis` text COLLATE utf8mb4_unicode_ci,
  `poster_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('tayang','segera') COLLATE utf8mb4_unicode_ci DEFAULT 'segera',
  `dibuat_pada` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `film`
--

INSERT INTO `film` (`id`, `judul`, `genre`, `durasi_menit`, `rating`, `sinopsis`, `poster_url`, `status`, `dibuat_pada`) VALUES
(1, 'Sekawan Limo', 'Horror Komedi', 118, 'R', '', '/uploads/poster/58de34a6a6ab4343bebe2f58a6016a69.jpg', 'tayang', '2026-06-14 18:56:13'),
(2, 'Badut Gendong', 'Horror', 95, 'R', '', '/uploads/poster/7c82383c9ca343658b48c75c995db04c.jpeg', 'tayang', '2026-06-14 18:56:13'),
(3, 'interstellar', 'sci fi', 120, '17+', 'astronot', '/uploads/poster/7f405be8598548f0a0822ac5014573b0.jpg', 'segera', '2026-06-17 12:44:30');

-- --------------------------------------------------------

--
-- Table structure for table `jadwal_tayang`
--

CREATE TABLE `jadwal_tayang` (
  `id` int NOT NULL,
  `film_id` int NOT NULL,
  `studio_id` int NOT NULL,
  `tanggal` date NOT NULL,
  `jam_tayang` time NOT NULL,
  `harga_tiket` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `jadwal_tayang`
--

INSERT INTO `jadwal_tayang` (`id`, `film_id`, `studio_id`, `tanggal`, `jam_tayang`, `harga_tiket`) VALUES
(1, 1, 1, '2026-06-15', '13:00:00', 50000.00),
(2, 1, 3, '2026-06-15', '16:00:00', 50000.00),
(3, 2, 2, '2026-06-15', '14:00:00', 50000.00),
(4, 2, 4, '2026-06-15', '17:00:00', 50000.00),
(5, 2, 1, '2026-06-18', '11:00:00', 50000.00),
(6, 2, 1, '2026-06-19', '11:00:00', 50000.00);

-- --------------------------------------------------------

--
-- Table structure for table `kursi`
--

CREATE TABLE `kursi` (
  `id` int NOT NULL,
  `studio_id` int NOT NULL,
  `kode_kursi` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `kursi`
--

INSERT INTO `kursi` (`id`, `studio_id`, `kode_kursi`) VALUES
(1, 1, 'A1'),
(2, 1, 'A2'),
(3, 1, 'A3'),
(4, 1, 'A4'),
(5, 1, 'A5'),
(6, 1, 'A6'),
(7, 1, 'A7'),
(8, 1, 'A8'),
(9, 1, 'A9'),
(10, 1, 'A10'),
(11, 1, 'A11'),
(12, 1, 'B1'),
(13, 1, 'B2'),
(14, 1, 'B3'),
(15, 1, 'B4'),
(16, 1, 'B5'),
(17, 1, 'B6'),
(18, 1, 'B7'),
(19, 1, 'B8'),
(20, 1, 'B9'),
(21, 1, 'B10'),
(22, 1, 'B11'),
(23, 1, 'C1'),
(24, 1, 'C2'),
(25, 1, 'C3'),
(26, 1, 'C4'),
(27, 1, 'C5'),
(28, 1, 'C6'),
(29, 1, 'C7'),
(30, 1, 'C8'),
(31, 1, 'C9'),
(32, 1, 'C10'),
(33, 1, 'C11'),
(34, 1, 'D1'),
(35, 1, 'D2'),
(36, 1, 'D3'),
(37, 1, 'D4'),
(38, 1, 'D5'),
(39, 1, 'D6'),
(40, 1, 'D7'),
(41, 1, 'D8'),
(42, 1, 'D9'),
(43, 1, 'D10'),
(44, 1, 'D11'),
(45, 1, 'E1'),
(46, 1, 'E2'),
(47, 1, 'E3'),
(48, 1, 'E4'),
(49, 1, 'E5'),
(50, 1, 'E6'),
(51, 1, 'E7'),
(52, 1, 'E8'),
(53, 1, 'E9'),
(54, 1, 'E10'),
(55, 1, 'E11'),
(56, 2, 'A1'),
(57, 2, 'A2'),
(58, 2, 'A3'),
(59, 2, 'A4'),
(60, 2, 'A5'),
(61, 2, 'A6'),
(62, 2, 'A7'),
(63, 2, 'A8'),
(64, 2, 'A9'),
(65, 2, 'A10'),
(66, 2, 'A11'),
(67, 2, 'B1'),
(68, 2, 'B2'),
(69, 2, 'B3'),
(70, 2, 'B4'),
(71, 2, 'B5'),
(72, 2, 'B6'),
(73, 2, 'B7'),
(74, 2, 'B8'),
(75, 2, 'B9'),
(76, 2, 'B10'),
(77, 2, 'B11'),
(78, 2, 'C1'),
(79, 2, 'C2'),
(80, 2, 'C3'),
(81, 2, 'C4'),
(82, 2, 'C5'),
(83, 2, 'C6'),
(84, 2, 'C7'),
(85, 2, 'C8'),
(86, 2, 'C9'),
(87, 2, 'C10'),
(88, 2, 'C11'),
(89, 2, 'D1'),
(90, 2, 'D2'),
(91, 2, 'D3'),
(92, 2, 'D4'),
(93, 2, 'D5'),
(94, 2, 'D6'),
(95, 2, 'D7'),
(96, 2, 'D8'),
(97, 2, 'D9'),
(98, 2, 'D10'),
(99, 2, 'D11'),
(100, 2, 'E1'),
(101, 2, 'E2'),
(102, 2, 'E3'),
(103, 2, 'E4'),
(104, 2, 'E5'),
(105, 2, 'E6'),
(106, 2, 'E7'),
(107, 2, 'E8'),
(108, 2, 'E9'),
(109, 2, 'E10'),
(110, 2, 'E11'),
(111, 3, 'A1'),
(112, 3, 'A2'),
(113, 3, 'A3'),
(114, 3, 'A4'),
(115, 3, 'A5'),
(116, 3, 'A6'),
(117, 3, 'A7'),
(118, 3, 'A8'),
(119, 3, 'A9'),
(120, 3, 'A10'),
(121, 3, 'A11'),
(122, 3, 'B1'),
(123, 3, 'B2'),
(124, 3, 'B3'),
(125, 3, 'B4'),
(126, 3, 'B5'),
(127, 3, 'B6'),
(128, 3, 'B7'),
(129, 3, 'B8'),
(130, 3, 'B9'),
(131, 3, 'B10'),
(132, 3, 'B11'),
(133, 3, 'C1'),
(134, 3, 'C2'),
(135, 3, 'C3'),
(136, 3, 'C4'),
(137, 3, 'C5'),
(138, 3, 'C6'),
(139, 3, 'C7'),
(140, 3, 'C8'),
(141, 3, 'C9'),
(142, 3, 'C10'),
(143, 3, 'C11'),
(144, 3, 'D1'),
(145, 3, 'D2'),
(146, 3, 'D3'),
(147, 3, 'D4'),
(148, 3, 'D5'),
(149, 3, 'D6'),
(150, 3, 'D7'),
(151, 3, 'D8'),
(152, 3, 'D9'),
(153, 3, 'D10'),
(154, 3, 'D11'),
(155, 3, 'E1'),
(156, 3, 'E2'),
(157, 3, 'E3'),
(158, 3, 'E4'),
(159, 3, 'E5'),
(160, 3, 'E6'),
(161, 3, 'E7'),
(162, 3, 'E8'),
(163, 3, 'E9'),
(164, 3, 'E10'),
(165, 3, 'E11'),
(166, 4, 'A1'),
(167, 4, 'A2'),
(168, 4, 'A3'),
(169, 4, 'A4'),
(170, 4, 'A5'),
(171, 4, 'A6'),
(172, 4, 'A7'),
(173, 4, 'A8'),
(174, 4, 'A9'),
(175, 4, 'A10'),
(176, 4, 'A11'),
(177, 4, 'B1'),
(178, 4, 'B2'),
(179, 4, 'B3'),
(180, 4, 'B4'),
(181, 4, 'B5'),
(182, 4, 'B6'),
(183, 4, 'B7'),
(184, 4, 'B8'),
(185, 4, 'B9'),
(186, 4, 'B10'),
(187, 4, 'B11'),
(188, 4, 'C1'),
(189, 4, 'C2'),
(190, 4, 'C3'),
(191, 4, 'C4'),
(192, 4, 'C5'),
(193, 4, 'C6'),
(194, 4, 'C7'),
(195, 4, 'C8'),
(196, 4, 'C9'),
(197, 4, 'C10'),
(198, 4, 'C11'),
(199, 4, 'D1'),
(200, 4, 'D2'),
(201, 4, 'D3'),
(202, 4, 'D4'),
(203, 4, 'D5'),
(204, 4, 'D6'),
(205, 4, 'D7'),
(206, 4, 'D8'),
(207, 4, 'D9'),
(208, 4, 'D10'),
(209, 4, 'D11'),
(210, 4, 'E1'),
(211, 4, 'E2'),
(212, 4, 'E3'),
(213, 4, 'E4'),
(214, 4, 'E5'),
(215, 4, 'E6'),
(216, 4, 'E7'),
(217, 4, 'E8'),
(218, 4, 'E9'),
(219, 4, 'E10'),
(220, 4, 'E11');

-- --------------------------------------------------------

--
-- Table structure for table `pelanggan`
--

CREATE TABLE `pelanggan` (
  `id` int NOT NULL,
  `nama` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_telepon` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_aktif` tinyint(1) DEFAULT '1',
  `dibuat_pada` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pembayaran`
--

CREATE TABLE `pembayaran` (
  `id` int NOT NULL,
  `pemesanan_id` int NOT NULL,
  `midtrans_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','settlement','expire','cancel') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `dibayar_pada` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pembayaran`
--

INSERT INTO `pembayaran` (`id`, `pemesanan_id`, `midtrans_id`, `metode`, `status`, `dibayar_pada`) VALUES
(1, 1, NULL, 'cash', 'settlement', '2026-06-15 10:42:56'),
(2, 2, NULL, 'cash', 'settlement', '2026-06-15 10:47:12'),
(3, 3, NULL, 'qris', 'settlement', '2026-06-18 15:31:08');

-- --------------------------------------------------------

--
-- Table structure for table `pemesanan`
--

CREATE TABLE `pemesanan` (
  `id` int NOT NULL,
  `pelanggan_id` int DEFAULT NULL,
  `jadwal_id` int NOT NULL,
  `kode_booking` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_harga` decimal(10,2) NOT NULL,
  `status_bayar` enum('pending','lunas','gagal') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `dibuat_pada` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pemesanan`
--

INSERT INTO `pemesanan` (`id`, `pelanggan_id`, `jadwal_id`, `kode_booking`, `total_harga`, `status_bayar`, `dibuat_pada`) VALUES
(1, NULL, 1, 'OFS-F26EBCBF', 100000.00, 'lunas', '2026-06-15 10:42:56'),
(2, NULL, 3, 'OFS-6B3FB435', 100000.00, 'lunas', '2026-06-15 10:47:12'),
(3, NULL, 5, 'OFS-6AABA464', 100000.00, 'lunas', '2026-06-18 15:31:08');

-- --------------------------------------------------------

--
-- Table structure for table `pengguna_staf`
--

CREATE TABLE `pengguna_staf` (
  `id` int NOT NULL,
  `nama` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('karyawan','manajer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_aktif` tinyint(1) DEFAULT '1',
  `dibuat_pada` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pengguna_staf`
--

INSERT INTO `pengguna_staf` (`id`, `nama`, `username`, `password`, `role`, `is_aktif`, `dibuat_pada`) VALUES
(1, 'Budi Santoso', 'budi.karyawan', '$2b$12$DwQiRRgsT5Edc.GlQmbz0u.INTo/FL2t04ZMj3u7oAtWUbHJFyUmq', 'karyawan', 1, '2026-06-13 15:53:55'),
(2, 'Sari Manajer', 'sari.manajer', '$2b$12$eop6rraPWi5TpNCu4xkgquFe2Qre6eLOCbrecKn9QbLFB8PQZo4fi', 'manajer', 1, '2026-06-13 15:53:55');

-- --------------------------------------------------------

--
-- Table structure for table `studio`
--

CREATE TABLE `studio` (
  `id` int NOT NULL,
  `nama_studio` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kapasitas` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `studio`
--

INSERT INTO `studio` (`id`, `nama_studio`, `kapasitas`) VALUES
(1, 'Studio 01', 55),
(2, 'Studio 02', 55),
(3, 'Studio 03', 55),
(4, 'Studio 04', 55);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `detail_pemesanan`
--
ALTER TABLE `detail_pemesanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pemesanan_id` (`pemesanan_id`),
  ADD KEY `kursi_id` (`kursi_id`);

--
-- Indexes for table `film`
--
ALTER TABLE `film`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `jadwal_tayang`
--
ALTER TABLE `jadwal_tayang`
  ADD PRIMARY KEY (`id`),
  ADD KEY `film_id` (`film_id`),
  ADD KEY `studio_id` (`studio_id`);

--
-- Indexes for table `kursi`
--
ALTER TABLE `kursi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `studio_id` (`studio_id`);

--
-- Indexes for table `pelanggan`
--
ALTER TABLE `pelanggan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `pembayaran`
--
ALTER TABLE `pembayaran`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pemesanan_id` (`pemesanan_id`);

--
-- Indexes for table `pemesanan`
--
ALTER TABLE `pemesanan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode_booking` (`kode_booking`),
  ADD KEY `pelanggan_id` (`pelanggan_id`),
  ADD KEY `jadwal_id` (`jadwal_id`);

--
-- Indexes for table `pengguna_staf`
--
ALTER TABLE `pengguna_staf`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `studio`
--
ALTER TABLE `studio`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `detail_pemesanan`
--
ALTER TABLE `detail_pemesanan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `film`
--
ALTER TABLE `film`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `jadwal_tayang`
--
ALTER TABLE `jadwal_tayang`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `kursi`
--
ALTER TABLE `kursi`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=221;

--
-- AUTO_INCREMENT for table `pelanggan`
--
ALTER TABLE `pelanggan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pembayaran`
--
ALTER TABLE `pembayaran`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `pemesanan`
--
ALTER TABLE `pemesanan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `pengguna_staf`
--
ALTER TABLE `pengguna_staf`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `studio`
--
ALTER TABLE `studio`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `detail_pemesanan`
--
ALTER TABLE `detail_pemesanan`
  ADD CONSTRAINT `detail_pemesanan_ibfk_1` FOREIGN KEY (`pemesanan_id`) REFERENCES `pemesanan` (`id`),
  ADD CONSTRAINT `detail_pemesanan_ibfk_2` FOREIGN KEY (`kursi_id`) REFERENCES `kursi` (`id`);

--
-- Constraints for table `jadwal_tayang`
--
ALTER TABLE `jadwal_tayang`
  ADD CONSTRAINT `jadwal_tayang_ibfk_1` FOREIGN KEY (`film_id`) REFERENCES `film` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `jadwal_tayang_ibfk_2` FOREIGN KEY (`studio_id`) REFERENCES `studio` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `kursi`
--
ALTER TABLE `kursi`
  ADD CONSTRAINT `kursi_ibfk_1` FOREIGN KEY (`studio_id`) REFERENCES `studio` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pembayaran`
--
ALTER TABLE `pembayaran`
  ADD CONSTRAINT `pembayaran_ibfk_1` FOREIGN KEY (`pemesanan_id`) REFERENCES `pemesanan` (`id`);

--
-- Constraints for table `pemesanan`
--
ALTER TABLE `pemesanan`
  ADD CONSTRAINT `pemesanan_ibfk_1` FOREIGN KEY (`pelanggan_id`) REFERENCES `pelanggan` (`id`),
  ADD CONSTRAINT `pemesanan_ibfk_2` FOREIGN KEY (`jadwal_id`) REFERENCES `jadwal_tayang` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
