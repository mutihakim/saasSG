<?php

namespace Database\Seeders\Support\Master;

use App\Enums\TransactionType;

class CategoryBlueprint
{
    public static function defaultCategories(): array
    {
        return [
            'finance' => [
                [
                    'name' => 'Transport & Maintenance',
                    'sub_type' => TransactionType::PENGELUARAN->value,
                    'icon' => 'ri-roadster-line',
                    'color' => '#F7B84B',
                    'children' => [
                        ['name' => 'Bahan Bakar Kendaraan', 'description' => 'Biaya pengisian bensin / bahan bakar mobilitas.', 'icon' => 'ri-gas-station-line'],
                        ['name' => 'Tol & Parkir', 'description' => 'Retribusi jalan tol dan biaya parkir kendaraan.', 'icon' => 'ri-parking-box-line'],
                        ['name' => 'Perawatan Kendaraan', 'description' => 'Servis rutin, ganti oli, cuci mobil/motor keluarga.', 'icon' => 'ri-car-washing-line'],
                    ],
                ],
                [
                    'name' => 'Tagihan Tetap',
                    'sub_type' => TransactionType::PENGELUARAN->value,
                    'icon' => 'ri-bill-line',
                    'color' => '#405189',
                    'children' => [
                        ['name' => 'Layanan Internet & TV', 'description' => 'Langganan provider internet rumah dan TV kabel.', 'icon' => 'ri-tv-2-line'],
                        ['name' => 'Tagihan Utilitas', 'description' => 'Tagihan listrik, air, dan iuran wajib lingkungan.', 'icon' => 'ri-flashlight-line'],
                        ['name' => 'Asuransi Proteksi', 'description' => 'Premi asuransi jiwa dan kesehatan.', 'icon' => 'ri-shield-check-line'],
                        ['name' => 'Pajak Tahunan', 'description' => 'Pembayaran pajak kendaraan atau bumi bangunan.', 'icon' => 'ri-government-line'],
                    ],
                ],
                [
                    'name' => 'Personal & Hobby',
                    'sub_type' => TransactionType::PENGELUARAN->value,
                    'icon' => 'ri-gamepad-line',
                    'color' => '#6559CC',
                    'children' => [
                        ['name' => 'Hobi & Koleksi', 'description' => 'Keperluan modifikasi, sci-fi, atau koleksi personal.', 'icon' => 'ri-trophy-line'],
                        ['name' => 'Konsumsi Relaksasi', 'description' => 'Jajan kopi kerja, cemilan personal, self-reward ringan.', 'icon' => 'ri-cup-line'],
                        ['name' => 'Penampilan Pribadi', 'description' => 'Grooming, potong rambut, pembelian baju personal harian.', 'icon' => 'ri-user-star-line'],
                    ],
                ],
                [
                    'name' => 'Professional Growth',
                    'sub_type' => TransactionType::PENGELUARAN->value,
                    'icon' => 'ri-briefcase-4-line',
                    'color' => '#0AB39C',
                    'children' => [
                        ['name' => 'Edukasi & Pelatihan', 'description' => 'Pembelian buku bacaan dan kelas/kursus leadership.', 'icon' => 'ri-graduation-cap-line'],
                        ['name' => 'Relasi Bisnis', 'description' => 'Networking bisnis, entertain klien, agenda profesional.', 'icon' => 'ri-team-line'],
                    ],
                ],
                [
                    'name' => 'Belanja Dapur & RT',
                    'sub_type' => TransactionType::PENGELUARAN->value,
                    'icon' => 'ri-shopping-basket-line',
                    'color' => '#299CDB',
                    'children' => [
                        ['name' => 'Bahan Makanan', 'description' => 'Belanja pasar, sayur, lauk pauk segar harian.', 'icon' => 'ri-restaurant-line'],
                        ['name' => 'Kebutuhan Pokok', 'description' => 'Belanja sembako dan stok makanan bulanan.', 'icon' => 'ri-shopping-cart-line'],
                        ['name' => 'Sanitasi & Kebersihan', 'description' => 'Isi ulang gas, galon, sabun, dan kebutuhan mandi/cuci.', 'icon' => 'ri-soap-line'],
                        ['name' => 'Perlengkapan Dapur', 'description' => 'Pembelian alat masak, piring, gelas, wadah plastik, dan perkakas dapur.', 'icon' => 'ri-goblet-line'],
                    ],
                ],
                [
                    'name' => 'Gaji ART & Staff',
                    'sub_type' => TransactionType::PENGELUARAN->value,
                    'icon' => 'ri-user-heart-line',
                    'color' => '#F06548',
                    'children' => [
                        ['name' => 'Upah Bantuan Domestik', 'description' => 'Pembayaran gaji bulanan ART atau pengasuh.', 'icon' => 'ri-hand-heart-line'],
                        ['name' => 'Tunjangan Hari Raya', 'description' => 'Tabungan alokasi THR untuk staf domestik.', 'icon' => 'ri-gift-2-line'],
                    ],
                ],
                [
                    'name' => 'Perawatan Diri',
                    'sub_type' => TransactionType::PENGELUARAN->value,
                    'icon' => 'ri-magic-line',
                    'color' => '#FF6C8A',
                    'children' => [
                        ['name' => 'Estetika & Kosmetik', 'description' => 'Belanja skincare, makeup, dan produk perawatan kulit.', 'icon' => 'ri-heart-2-line'],
                        ['name' => 'Perawatan Klinik & Salon', 'description' => 'Kunjungan ke salon, spa, atau klinik estetika.', 'icon' => 'ri-scissors-cut-line'],
                        ['name' => 'Fashion & Pakaian', 'description' => 'Pembelian baju harian, sepatu, tas (di luar seragam anak/balita).', 'icon' => 'ri-t-shirt-line'],
                    ],
                ],
                [
                    'name' => 'Peralatan & Gadget',
                    'sub_type' => TransactionType::PENGELUARAN->value,
                    'icon' => 'ri-device-line',
                    'color' => '#6F42C1',
                    'children' => [
                        ['name' => 'Elektronik & Gadget', 'description' => 'Beli HP, laptop, alat rumah tangga, atau gadget kerja/hobi.', 'icon' => 'ri-smartphone-line'],
                        ['name' => 'Furnitur & Perabotan', 'description' => 'Pembelian sofa, kasur, lemari, rak, dan perabotan non-elektronik rumah.', 'icon' => 'ri-home-office-line'],
                    ],
                ],
                [
                    'name' => 'Layanan Digital',
                    'sub_type' => TransactionType::PENGELUARAN->value,
                    'icon' => 'ri-cloud-line',
                    'color' => '#20C997',
                    'children' => [
                        ['name' => 'Subs. & Software', 'description' => 'Langganan Netflix, Spotify, software kerja, atau tools AI.', 'icon' => 'ri-apps-2-line'],
                    ],
                ],
                [
                    'name' => 'Makan Luar & Jajan',
                    'sub_type' => TransactionType::PENGELUARAN->value,
                    'icon' => 'ri-restaurant-2-line',
                    'color' => '#FD7E14',
                    'children' => [
                        ['name' => 'Konsumsi Restoran', 'description' => 'Weekend dining, layanan pesan antar makanan, cemilan keluarga.', 'icon' => 'ri-restaurant-line'],
                    ],
                ],
                [
                    'name' => 'Sosial & Kado',
                    'sub_type' => TransactionType::PENGELUARAN->value,
                    'icon' => 'ri-gift-line',
                    'color' => '#F7B84B',
                    'children' => [
                        ['name' => 'Sumbangan & Donasi', 'description' => 'Kado ulang tahun, arisan, sumbangan kerabat, infaq masjid.', 'icon' => 'ri-hand-coin-line'],
                    ],
                ],
                [
                    'name' => 'SPP & Sekolah Rutin',
                    'sub_type' => TransactionType::PENGELUARAN->value,
                    'icon' => 'ri-book-open-line',
                    'color' => '#405189',
                    'children' => [
                        ['name' => 'Biaya Pendidikan Utama', 'description' => 'Bayaran SPP bulanan sekolah.', 'icon' => 'ri-bank-card-line'],
                        ['name' => 'Pendidikan Tambahan', 'description' => 'Biaya bimbingan belajar, les, dan ekstrakurikuler.', 'icon' => 'ri-pencil-ruler-2-line'],
                        ['name' => 'Keperluan Sekolah', 'description' => 'Pembelian buku cetak, seragam, iuran field trip/kegiatan.', 'icon' => 'ri-file-list-3-line'],
                    ],
                ],
                [
                    'name' => 'Kebutuhan Balita',
                    'sub_type' => TransactionType::PENGELUARAN->value,
                    'icon' => 'ri-baby-line',
                    'color' => '#299CDB',
                    'children' => [
                        ['name' => 'Nutrisi Balita', 'description' => 'Pembelian susu formula atau susu UHT.', 'icon' => 'ri-cup-line'],
                        ['name' => 'Perlengkapan Balita', 'description' => 'Pembelian popok (diapers) dan kebutuhan sanitasi bayi.', 'icon' => 'ri-box-3-line'],
                        ['name' => 'Pakaian & Vitamin Balita', 'description' => 'Pakaian ganti bayi yang cepat tumbuh dan suplemen vitamin.', 'icon' => 'ri-shirt-line'],
                    ],
                ],
                [
                    'name' => 'Jajan & Mainan',
                    'sub_type' => TransactionType::PENGELUARAN->value,
                    'icon' => 'ri-bear-smile-line',
                    'color' => '#F7B84B',
                    'children' => [
                        ['name' => 'Uang Saku Harian', 'description' => 'Pemberian uang saku harian untuk sekolah/kegiatan.', 'icon' => 'ri-coins-line'],
                        ['name' => 'Hiburan Edukatif', 'description' => 'Pembelian mainan, buku anak, atau jajan sore bersama.', 'icon' => 'ri-book-3-line'],
                    ],
                ],
                [
                    'name' => 'Operasional Bisnis',
                    'sub_type' => TransactionType::PENGELUARAN->value,
                    'icon' => 'ri-store-2-line',
                    'color' => '#405189',
                    'children' => [
                        ['name' => 'Stok & Bahan Baku', 'description' => 'Pembelian suku cadang, inventaris, dan alat kerja produksi.', 'icon' => 'ri-tools-line'],
                        ['name' => 'Legalitas & Sewa Bisnis', 'description' => 'Biaya perizinan, PPh badan usaha, dan sewa/maintenance tempat.', 'icon' => 'ri-building-line'],
                    ],
                ],
                [
                    'name' => 'Marketing Bisnis',
                    'sub_type' => TransactionType::PENGELUARAN->value,
                    'icon' => 'ri-megaphone-line',
                    'color' => '#6559CC',
                    'children' => [
                        ['name' => 'Periklanan & Ads', 'description' => 'Biaya iklan di platform media sosial (FB/IG Ads).', 'icon' => 'ri-advertisement-line'],
                        ['name' => 'Produksi Konten', 'description' => 'Pembayaran jasa fotografer, editor video, atau pembuat konten.', 'icon' => 'ri-camera-line'],
                    ],
                ],
                [
                    'name' => 'Kesehatan & Medis',
                    'sub_type' => TransactionType::PENGELUARAN->value,
                    'icon' => 'ri-heart-pulse-line',
                    'color' => '#F06548',
                    'children' => [
                        ['name' => 'Perawatan Medis & Obat', 'description' => 'Konsultasi dokter, tebus resep obat, atau tindakan klinis insidental.', 'icon' => 'ri-stethoscope-line'],
                        ['name' => 'Vitamin & Suplemen', 'description' => 'Pembelian suplemen atau vitamin harian untuk orang dewasa.', 'icon' => 'ri-capsule-line'],
                    ],
                ],
                [
                    'name' => 'Perbaikan Rumah',
                    'sub_type' => TransactionType::PENGELUARAN->value,
                    'icon' => 'ri-home-gear-line',
                    'color' => '#F7B84B',
                    'children' => [
                        ['name' => 'Pemeliharaan Bangunan', 'description' => 'Renovasi kecil, perbaikan atap bocor, reparasi pompa air/listrik.', 'icon' => 'ri-hammer-line'],
                    ],
                ],
                [
                    'name' => 'Penerimaan Pendapatan',
                    'sub_type' => TransactionType::PEMASUKAN->value,
                    'icon' => 'ri-wallet-3-line',
                    'color' => '#0AB39C',
                    'children' => [
                        ['name' => 'Pendapatan Aktif', 'description' => 'Pemasukan gaji bulanan, honor, atau penerimaan omzet usaha.', 'icon' => 'ri-bank-line'],
                    ],
                ],
                [
                    'name' => 'Penerimaan Hadiah',
                    'sub_type' => TransactionType::PEMASUKAN->value,
                    'icon' => 'ri-gift-2-line',
                    'color' => '#FF6C8A',
                    'children' => [
                        ['name' => 'Hadiah & Angpao', 'description' => 'Uang masuk dari pemberian eksternal (kakek/nenek/kerabat).', 'icon' => 'ri-money-dollar-circle-line'],
                    ],
                ],
                [
                    'name' => 'Penerimaan Investasi',
                    'sub_type' => TransactionType::PEMASUKAN->value,
                    'icon' => 'ri-funds-line',
                    'color' => '#20C997',
                    'children' => [
                        ['name' => 'Return Investasi', 'description' => 'Pemasukan dari dividen, bagi hasil, bunga, atau capital gain.', 'icon' => 'ri-line-chart-line'],
                    ],
                ],
                [
                    'name' => 'Penerimaan Lainnya',
                    'sub_type' => TransactionType::PEMASUKAN->value,
                    'icon' => 'ri-inbox-unarchive-line',
                    'color' => '#6C757D',
                    'children' => [
                        ['name' => 'Penjualan Aset/Barang', 'description' => 'Hasil jual kendaraan modifikasi, barang bekas, atau barang rumah tangga.', 'icon' => 'ri-auction-line'],
                    ],
                ],
                [
                    'name' => 'Dana Pendidikan Masa Depan',
                    'sub_type' => TransactionType::TRANSFER->value,
                    'icon' => 'ri-rocket-line',
                    'color' => '#299CDB',
                    'children' => [
                        ['name' => 'Investasi Masa Depan', 'description' => 'Alokasi uang sisa/surplus yang dikunci untuk tujuan jangka panjang.', 'icon' => 'ri-calendar-check-line'],
                    ],
                ],
                [
                    'name' => 'Laba Ditahan',
                    'sub_type' => TransactionType::TRANSFER->value,
                    'icon' => 'ri-safe-2-line',
                    'color' => '#0AB39C',
                    'children' => [
                        ['name' => 'Saldo Ekspansi', 'description' => 'Pemindahan keuntungan usaha yang diparkir sebagai modal cadangan bisnis.', 'icon' => 'ri-archive-stack-line'],
                    ],
                ],
                [
                    'name' => 'Dana Siaga',
                    'sub_type' => TransactionType::TRANSFER->value,
                    'icon' => 'ri-alarm-warning-line',
                    'color' => '#F06548',
                    'children' => [
                        ['name' => 'Cadangan Keuangan', 'description' => 'Pemindahan dana untuk membentuk sabuk pengaman ekonomi (unemployment fund).', 'icon' => 'ri-briefcase-line'],
                    ],
                ],
                [
                    'name' => 'Transfer Internal',
                    'sub_type' => TransactionType::TRANSFER->value,
                    'icon' => 'ri-arrow-left-right-line',
                    'color' => '#6C757D',
                    'children' => [
                        ['name' => 'Mutasi Antar Akun', 'description' => 'Perpindahan/mutasi uang antar rekening/dompet sendiri dalam sistem.', 'icon' => 'ri-swap-line'],
                        ['name' => 'Pembayaran Kartu Kredit', 'description' => 'Mutasi dari akun Bank ke akun Kredit untuk pelunasan tagihan bulanan.', 'icon' => 'ri-bank-card-line'],
                    ],
                ],
            ],
        ];
    }
}
