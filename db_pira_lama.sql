-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 13 Jun 2023 pada 05.31
-- Versi server: 10.4.28-MariaDB
-- Versi PHP: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_pira`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `forms`
--

CREATE TABLE `forms` (
  `form_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` varchar(255) NOT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `submissions`
--

CREATE TABLE `submissions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `form_id` int(11) NOT NULL,
  `uploaded_file` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `noHp` varchar(15) NOT NULL,
  `password` varchar(255) NOT NULL,
  `active` int(2) NOT NULL,
  `avatar` varchar(255) NOT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`user_id`, `username`, `email`, `noHp`, `password`, `active`, `avatar`, `created_at`, `updated_at`) VALUES
(1, 'tes', '', '', '$2b$10$itHqwQNgRypcrvSln0ilN.NRMRFv10JThY14GymHjhIJiGfRkStjO', 0, '', '2023-06-13 03:30:26.206448', '2023-06-13 03:30:26.206448');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `forms`
--
ALTER TABLE `forms`
  ADD PRIMARY KEY (`form_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indeks untuk tabel `submissions`
--
ALTER TABLE `submissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `form_id` (`form_id`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `forms`
--
ALTER TABLE `forms`
  MODIFY `form_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `submissions`
--
ALTER TABLE `submissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `forms`
--
ALTER TABLE `forms`
  ADD CONSTRAINT `forms_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Ketidakleluasaan untuk tabel `submissions`
--
ALTER TABLE `submissions`
  ADD CONSTRAINT `submissions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `submissions_ibfk_2` FOREIGN KEY (`form_id`) REFERENCES `forms` (`form_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
