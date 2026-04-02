<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantHomeController extends Controller
{
    public function index(Request $request): mixed
    {
        $tenant = tenant();
        $user = $request->user();

        // Authenticated users → render Hub directly at /
        if ($user) {
            $member = $tenant->members()
                ->where('user_id', $user->id)
                ->with('user')
                ->first();

            return Inertia::render('Tenant/Frontend/Member/Hub', [
                'tenantName' => $tenant->presentableName(),
                'tenantSlug' => $tenant->slug,
                'member' => $member,
                'demo' => $this->getDemoData(),
            ]);
        }

        // Guest → Public landing page (Velzon NFT-landing shell)
        $demo = $this->getDemoData();
        return Inertia::render('Tenant/Frontend/Landing', [
            'tenant' => [
                'name'         => $tenant->name ?? $tenant->slug,
                'display_name' => $tenant->display_name ?? null,
                'slug'         => $tenant->slug,
            ],
            'members_count' => $tenant->members()->count(),
            'demo'          => $demo,
        ]);
    }

    public function getDemoData(): array
    {
        $tenant = tenant();
        $slug = $tenant->slug ?? '';
        $isFamily = str_contains($slug, 'keluarga') || str_contains($slug, 'wijaya') || str_contains($slug, 'cemara');
        $isEdu = str_contains($slug, 'tk-') || str_contains($slug, 'sd-') || str_contains($slug, 'kb-') || str_contains($slug, 'pelangi') || str_contains($slug, 'ikhlas') || str_contains($slug, 'al-');
        $tenantLabel = $isFamily ? 'Keluarga' : ($isEdu ? 'Lembaga' : 'Komunitas');

        return [
            'type' => $isFamily ? 'family' : ($isEdu ? 'education' : 'charity'),
            'tenantName' => $tenant->name ?? $tenant->slug,
            'tenantLabel' => $tenantLabel,

            // A. Planning & Calendar
            'calendar' => [

                ['id' => 1, 'title' => $isFamily ? 'Liburan Bali' : 'Akreditasi Sekolah', 'start' => now()->addDays(2)->format('Y-m-d'), 'end' => now()->addDays(5)->format('Y-m-d'), 'className' => 'bg-primary-subtle text-primary'],
                ['id' => 2, 'title' => $isFamily ? 'Imunisasi Adik' : 'Rapat Guru', 'start' => now()->addDays(1)->format('Y-m-d'), 'className' => 'bg-danger-subtle text-danger'],
                ['id' => 3, 'title' => $isFamily ? 'Bayar Listrik PLN' : 'Penerimaan Murid Baru', 'start' => now()->format('Y-m-d'), 'className' => 'bg-success-subtle text-success'],
                ['id' => 4, 'title' => $isFamily ? 'Arisan Keluarga Besar' : 'Seminar Parenting', 'start' => now()->addDays(7)->format('Y-m-d'), 'className' => 'bg-warning-subtle text-warning'],
                ['id' => 5, 'title' => $isFamily ? 'Ulang Tahun Kakak ke-9' : 'Wisuda Murid TK B', 'start' => now()->addDays(12)->format('Y-m-d'), 'className' => 'bg-info-subtle text-info'],
            ],
            'routines' => [
                'morning' => [
                    ['id' => 1, 'task' => 'Merapikan Tempat Tidur', 'time' => '06:00', 'points' => 10, 'done' => true, 'assignee' => 'Kakak'],
                    ['id' => 2, 'task' => 'Sarapan Bersama', 'time' => '06:30', 'points' => 5, 'done' => true, 'assignee' => 'Semua'],
                    ['id' => 3, 'task' => 'Mandi & Sikat Gigi', 'time' => '06:45', 'points' => 10, 'done' => true, 'assignee' => 'Kakak'],
                    ['id' => 4, 'task' => 'Persiapan Tas Sekolah', 'time' => '07:00', 'points' => 5, 'done' => false, 'assignee' => 'Kakak'],
                    ['id' => 5, 'task' => 'Vitamin Adik (0.5ml)', 'time' => '07:15', 'points' => 5, 'done' => false, 'assignee' => 'Ibu'],
                ],
                'night' => [
                    ['id' => 6, 'task' => 'Mengerjakan PR', 'time' => '17:00', 'points' => 20, 'done' => false, 'assignee' => 'Kakak'],
                    ['id' => 7, 'task' => 'Mandi Sore', 'time' => '17:30', 'points' => 5, 'done' => false, 'assignee' => 'Kakak'],
                    ['id' => 8, 'task' => 'Belajar 15 menit', 'time' => '19:00', 'points' => 15, 'done' => false, 'assignee' => 'Kakak'],
                    ['id' => 9, 'task' => 'Sikat Gigi & Cuci Kaki', 'time' => '20:00', 'points' => 10, 'done' => false, 'assignee' => 'Kakak'],
                    ['id' => 10, 'task' => 'Waktu Tidur', 'time' => '20:30', 'points' => 5, 'done' => false, 'assignee' => 'Kakak'],
                ]
            ],
            'menus' => [
                ['day' => 'Senin', 'breakfast' => 'Roti Telur + Susu', 'lunch' => 'Ayam Goreng Kalasan', 'dinner' => 'Sayur Asem + Tempe'],
                ['day' => 'Selasa', 'breakfast' => 'Bubur Ayam', 'lunch' => 'Nasi Goreng Spesial', 'dinner' => 'Sop Buntut'],
                ['day' => 'Rabu', 'breakfast' => 'Pancake + Madu', 'lunch' => 'Rendang Padang', 'dinner' => 'Sup Jagung'],
                ['day' => 'Kamis', 'breakfast' => 'Nasi Uduk', 'lunch' => 'Ikan Bakar Bumbu', 'dinner' => 'Capcay Kuah'],
                ['day' => 'Jumat', 'breakfast' => 'Sandwich Telur', 'lunch' => 'Sate Ayam Madura', 'dinner' => 'Lodeh Terong'],
                ['day' => 'Sabtu', 'breakfast' => 'Nasi Kuning', 'lunch' => 'Bebas Pilih Anak', 'dinner' => 'Bakar-Bakaran Keluar'],
                ['day' => 'Minggu', 'breakfast' => 'Dimsum Keluarga', 'lunch' => 'Makan Keluar Bersama', 'dinner' => 'Leftovers'],
            ],

            // B. Finance
            'finance' => [
                'balance' => 12500000,
                'income' => 25000000,
                'expense' => 12500000,
                'savings' => 5000000,
                'savings_goal' => 35000000,
                'savings_label' => $isFamily ? 'Tabungan Liburan Jepang' : 'Dana Renovasi Gedung',
                'kids_wallet' => [
                    ['name' => 'Kakak', 'balance' => 150000, 'points' => 1250, 'allowance' => 50000, 'avatar' => 'avatar-3'],
                    ['name' => 'Adik', 'balance' => 85000, 'points' => 980, 'allowance' => 30000, 'avatar' => 'avatar-4'],
                ],
                'history' => [
                    ['month' => 'Jan', 'income' => 22000000, 'expense' => 18000000],
                    ['month' => 'Feb', 'income' => 24000000, 'expense' => 19000000],
                    ['month' => 'Mar', 'income' => 25000000, 'expense' => 12500000],
                    ['month' => 'Apr', 'income' => 25000000, 'expense' => 14000000],
                    ['month' => 'Mei', 'income' => 26000000, 'expense' => 15000000],
                    ['month' => 'Jun', 'income' => 28000000, 'expense' => 16000000],
                ],
                'categories' => [
                    ['label' => 'Makan & Belanja', 'amount' => 4500000, 'pct' => 36, 'color' => 'primary'],
                    ['label' => 'Pendidikan', 'amount' => 2000000, 'pct' => 16, 'color' => 'success'],
                    ['label' => 'Utilitas', 'amount' => 1500000, 'pct' => 12, 'color' => 'warning'],
                    ['label' => 'Hiburan', 'amount' => 1000000, 'pct' => 8, 'color' => 'danger'],
                    ['label' => 'Tabungan', 'amount' => 3500000, 'pct' => 28, 'color' => 'info'],
                ],
                'recent_transactions' => [
                    ['desc' => 'Belanja Alfamart', 'date' => 'Hari ini, 10:30', 'amount' => -245000, 'cat' => 'Belanja'],
                    ['desc' => 'Transfer Masuk Gaji', 'date' => 'Kemarin, 09:00', 'amount' => 25000000, 'cat' => 'Pemasukan'],
                    ['desc' => 'SPP Kakak Bulan April', 'date' => '30 Mar', 'amount' => -850000, 'cat' => 'Pendidikan'],
                    ['desc' => 'Tagihan Listrik', 'date' => '28 Mar', 'amount' => -387000, 'cat' => 'Utilitas'],
                ],
                'alerts' => [
                    ['msg' => 'Anggaran Hiburan hampir habis! (92%)', 'type' => 'danger'],
                    ['msg' => 'Tagihan Internet jatuh tempo 5 April', 'type' => 'warning'],
                ],
            ],

            // C. Projects & Kanban
            'projects' => [
                ['id' => 1, 'name' => $isFamily ? 'Renovasi Kamar Anak' : 'Lab Komputer Baru', 'status' => 'In Progress', 'progress' => 65, 'members' => 3, 'due' => '30 Apr 2026', 'priority' => 'High', 'color' => 'danger', 'tasks_done' => 7, 'tasks_total' => 12],
                ['id' => 2, 'name' => $isFamily ? 'Kebun Hidroponik Belakang' : 'Pameran Seni Sekolah', 'status' => 'Planning', 'progress' => 15, 'members' => 2, 'due' => '15 Jun 2026', 'priority' => 'Medium', 'color' => 'warning', 'tasks_done' => 2, 'tasks_total' => 10],
                ['id' => 3, 'name' => $isFamily ? 'Liburan Akhir Tahun Jepang' : 'Workshop Guru Muda', 'status' => 'Planning', 'progress' => 30, 'members' => 4, 'due' => '15 Des 2026', 'priority' => 'Medium', 'color' => 'info', 'tasks_done' => 3, 'tasks_total' => 15],
            ],
            'kanban' => [
                'todo' => [
                    ['id' => 1, 'title' => 'Beli Cat Tembok Kamar', 'priority' => 'Medium', 'assignee' => 'Ayah'],
                    ['id' => 2, 'title' => 'Riset Hotel di Tokyo', 'priority' => 'Low', 'assignee' => 'Ibu'],
                ],
                'inprogress' => [
                    ['id' => 3, 'title' => 'Pasang Rak Buku IKEA', 'priority' => 'High', 'assignee' => 'Ayah'],
                    ['id' => 4, 'title' => 'Beli Bibit Kangkung & Bayam', 'priority' => 'Medium', 'assignee' => 'Ibu'],
                ],
                'done' => [
                    ['id' => 5, 'title' => 'Ukur Dimensi Kamar', 'priority' => 'High', 'assignee' => 'Ayah'],
                    ['id' => 6, 'title' => 'Cek Paspor Berlaku', 'priority' => 'High', 'assignee' => 'Ibu'],
                ],
            ],
            'shopping_list' => [
                ['id' => 1, 'item' => 'Susu UHT Full Cream 1L', 'qty' => '4 Box', 'cat' => 'Minuman', 'bought' => false],
                ['id' => 2, 'item' => 'Daging Ayam Segar', 'qty' => '1 Kg', 'cat' => 'Daging', 'bought' => true],
                ['id' => 3, 'item' => 'Sayur Bayam Organik', 'qty' => '2 Ikat', 'cat' => 'Sayur', 'bought' => false],
                ['id' => 4, 'item' => 'Popok Pampers M', 'qty' => '1 Pack', 'cat' => 'Bayi', 'bought' => false],
                ['id' => 5, 'item' => 'Deterjen Attack 1Kg', 'qty' => '2 Bungkus', 'cat' => 'Rumah Tangga', 'bought' => true],
            ],

            // D. Rewards & Gamification
            'rewards' => [
                ['id' => 1, 'title' => 'Main PS Tambah 1 Jam', 'cost' => 300, 'icon' => 'ri-gamepad-line', 'color' => 'primary', 'category' => 'Hiburan'],
                ['id' => 2, 'title' => 'Pilih Menu Makan Malam', 'cost' => 500, 'icon' => 'ri-restaurant-2-line', 'color' => 'success', 'category' => 'Makanan'],
                ['id' => 3, 'title' => 'Tiket Bioskop (1 Orang)', 'cost' => 1200, 'icon' => 'ri-movie-line', 'color' => 'info', 'category' => 'Hiburan'],
                ['id' => 4, 'title' => 'Beli Buku Komik Pilihan', 'cost' => 800, 'icon' => 'ri-book-open-line', 'color' => 'warning', 'category' => 'Edukasi'],
                ['id' => 5, 'title' => 'Jalan-jalan ke Timezone', 'cost' => 2000, 'icon' => 'ri-map-pin-line', 'color' => 'danger', 'category' => 'Liburan'],
                ['id' => 6, 'title' => 'Hari Bebas PR (1 Hari)', 'cost' => 1500, 'icon' => 'ri-star-line', 'color' => 'warning', 'category' => 'Spesial'],
            ],
            'leaderboard' => [
                ['name' => 'Kakak', 'points' => 1250, 'rank' => 1, 'badge' => 'gold', 'weekly_gain' => 120, 'avatar' => 'K'],
                ['name' => 'Adik', 'points' => 980, 'rank' => 2, 'badge' => 'silver', 'weekly_gain' => 90, 'avatar' => 'A'],
                ['name' => 'Ibu', 'points' => 850, 'rank' => 3, 'badge' => 'bronze', 'weekly_gain' => 60, 'avatar' => 'I'],
                ['name' => 'Ayah', 'points' => 620, 'rank' => 4, 'badge' => '', 'weekly_gain' => 40, 'avatar' => 'Y'],
            ],
            'team' => [
                ['name' => 'Ayah', 'role' => 'Owner', 'designation' => 'Kepala Keluarga', 'status' => 'online', 'points' => 620, 'tasks' => 3, 'avatar' => 'Y'],
                ['name' => 'Ibu', 'role' => 'Admin', 'designation' => 'Manajer Rumah Tangga', 'status' => 'online', 'points' => 850, 'tasks' => 5, 'avatar' => 'I'],
                ['name' => 'Kakak', 'role' => 'Member', 'designation' => 'Pelajar SD (9 Th)', 'status' => 'offline', 'points' => 1250, 'tasks' => 8, 'avatar' => 'K'],
                ['name' => 'Adik', 'role' => 'Member', 'designation' => 'Balita (2 Th)', 'status' => 'online', 'points' => 980, 'tasks' => 4, 'avatar' => 'A'],
            ],

            // E. WhatsApp Integration
            'wa_logs' => [
                ['sender' => 'Ibu', 'text' => 'Catat pengeluaran belanja 245.000', 'time' => '10:30', 'status' => 'Tercatat di Keuangan', 'type' => 'input', 'avatar' => 'I'],
                ['sender' => 'System', 'text' => 'Besok: Imunisasi Adik pk 09:00 di Puskesmas', 'time' => '07:00', 'status' => 'Terkirim', 'type' => 'output', 'avatar' => 'S'],
                ['sender' => 'Ayah', 'text' => 'Kakak sudah merapikan tempat tidur', 'time' => '06:15', 'status' => '+10 Poin untuk Kakak!', 'type' => 'verify', 'avatar' => 'Y'],
                ['sender' => 'Kakak', 'text' => 'Selesai belajar mandarin 30 menit', 'time' => '19:30', 'status' => '+20 Poin untuk Kakak!', 'type' => 'verify', 'avatar' => 'K'],
                ['sender' => 'System', 'text' => 'Alert: Anggaran Hiburan tersisa 8%', 'time' => '11:00', 'status' => 'Terkirim ke Ayah & Ibu', 'type' => 'alert', 'avatar' => 'S'],
                ['sender' => 'Ibu', 'text' => 'Tambah daftar belanja: Susu UHT 4 box', 'time' => '08:00', 'status' => 'Ditambahkan ke Daftar Belanja', 'type' => 'input', 'avatar' => 'I'],
            ],
            'wa_commands' => [
                ['cmd' => 'catat [nama] [nominal]', 'desc' => 'Catat pengeluaran ke keuangan'],
                ['cmd' => 'selesai [nama tugas]', 'desc' => 'Verifikasi tugas & tambah poin'],
                ['cmd' => 'belanja [item]', 'desc' => 'Tambahkan ke daftar belanja'],
                ['cmd' => 'jadwal hari ini', 'desc' => 'Lihat agenda & rutinitas hari ini'],
                ['cmd' => 'poin [nama]', 'desc' => 'Cek saldo poin anggota'],
            ],

            // F. Gallery
            'gallery' => [
                ['id' => 1, 'title' => 'Liburan Pantai Pangandaran', 'img_url' => 'https://picsum.photos/seed/fam1/600/400', 'author' => 'Ibu', 'date' => 'Maret 2026', 'likes' => 12, 'cat' => 'Wisata'],
                ['id' => 2, 'title' => 'Panen Kebun Hidroponik', 'img_url' => 'https://picsum.photos/seed/fam2/600/800', 'author' => 'Ayah', 'date' => 'Feb 2026', 'likes' => 8, 'cat' => 'Rumah'],
                ['id' => 3, 'title' => 'Ultah Kakak ke-8', 'img_url' => 'https://picsum.photos/seed/fam3/600/500', 'author' => 'Ibu', 'date' => 'Jan 2026', 'likes' => 23, 'cat' => 'Keluarga'],
                ['id' => 4, 'title' => 'Masak Bersama Sore Minggu', 'img_url' => 'https://picsum.photos/seed/fam4/600/700', 'author' => 'Ibu', 'date' => 'Mar 2026', 'likes' => 15, 'cat' => 'Kuliner'],
                ['id' => 5, 'title' => 'Adik Pertama Kali Jalan', 'img_url' => 'https://picsum.photos/seed/fam5/600/600', 'author' => 'Ayah', 'date' => 'Feb 2026', 'likes' => 31, 'cat' => 'Tumbuh Kembang'],
                ['id' => 6, 'title' => 'Wisuda TK Adik', 'img_url' => 'https://picsum.photos/seed/fam6/600/450', 'author' => 'Nenek', 'date' => 'Des 2025', 'likes' => 45, 'cat' => 'Pendidikan'],
            ],

            // G. Blog & Dokumentasi
            'blogs' => [
                ['id' => 1, 'title' => 'Panduan Wisata Pangandaran Bersama Anak Balita', 'excerpt' => 'Tips lengkap menikmati pantai Pangandaran dengan membawa si kecil usia 2 tahun. Dari pilihan hotel hingga aktivitas aman.', 'cover' => 'https://picsum.photos/seed/blog1/800/400', 'author' => 'Ibu', 'date' => '25 Mar 2026', 'cat' => 'Wisata', 'read_time' => '5 menit', 'likes' => 18],
                ['id' => 2, 'title' => 'Resep MPASI Favorit Adik: Nasi Tim Wortel Tempe', 'excerpt' => 'Menu bergizi tinggi yang selalu dihabiskan Adik. Mudah dibuat dan kaya nutrisi untuk tumbuh kembang optimal.', 'cover' => 'https://picsum.photos/seed/blog2/800/400', 'author' => 'Ibu', 'date' => '18 Mar 2026', 'cat' => 'Kuliner', 'read_time' => '3 menit', 'likes' => 25],
                ['id' => 3, 'title' => 'Review: Sate Madura Bu Tini Bintaro yang Legendaris', 'excerpt' => 'Kita keluarga sudah 3 kali ke sini dan tidak pernah kecewa. Satenya juicy, lontongnya lembut, harganya bersahabat.', 'cover' => 'https://picsum.photos/seed/blog3/800/400', 'author' => 'Ayah', 'date' => '10 Mar 2026', 'cat' => 'Kuliner', 'read_time' => '4 menit', 'likes' => 11],
                ['id' => 4, 'title' => 'Catatan Perkembangan Kakak di Usia 9 Tahun', 'excerpt' => 'Memasuki usia 9 tahun, Kakak semakin mandiri dan menunjukkan minat besar pada Matematika.', 'cover' => 'https://picsum.photos/seed/blog4/800/400', 'author' => 'Ibu', 'date' => '5 Mar 2026', 'cat' => 'Parenting', 'read_time' => '6 menit', 'likes' => 34],
                ['id' => 5, 'title' => 'IKEA Hacks: Bikin Rak Buku Anak Yang Kece', 'excerpt' => 'Transformasi rak buku IKEA biasa jadi pojok baca impian yang menarik dan membuat anak betah membaca.', 'cover' => 'https://picsum.photos/seed/blog5/800/400', 'author' => 'Ayah', 'date' => '28 Feb 2026', 'cat' => 'Rumah', 'read_time' => '7 menit', 'likes' => 22],
                ['id' => 6, 'title' => 'Itinerary Bali 5 Hari yang Kami Rencanakan Bersama', 'excerpt' => 'Rencana detail liburan keluarga ke Bali: dari Tanah Lot, Ubud, sampai Seminyak yang family-friendly.', 'cover' => 'https://picsum.photos/seed/blog6/800/400', 'author' => 'Ibu', 'date' => '20 Feb 2026', 'cat' => 'Wisata', 'read_time' => '8 menit', 'likes' => 41],
            ],

            // H. Wishlist
            'wishlists' => [
                ['id' => 1, 'type' => 'travel', 'title' => 'Jepang (Tokyo + Osaka + Kyoto)', 'notes' => 'Target liburan besar 2027. Budget sekitar 35 juta.', 'priority' => 'High', 'saved' => 15000000, 'target' => 35000000, 'img' => 'https://picsum.photos/seed/japan/400/250', 'tags' => ['Wisata', 'Cherry Blossom']],
                ['id' => 2, 'type' => 'travel', 'title' => 'Labuan Bajo Family Trip', 'notes' => 'Lihat Komodo langsung! Bareng kakak-adik.', 'priority' => 'Medium', 'saved' => 3000000, 'target' => 12000000, 'img' => 'https://picsum.photos/seed/labuan/400/250', 'tags' => ['Wisata', 'Alam']],
                ['id' => 3, 'type' => 'kuliner', 'title' => 'Dinner di Namaaz Dining Jakarta', 'notes' => 'Restoran molecular gastronomy ter-fancy di Indonesia.', 'priority' => 'Low', 'saved' => 0, 'target' => 2000000, 'img' => 'https://picsum.photos/seed/namaaz/400/250', 'tags' => ['Kuliner', 'Fine Dining']],
                ['id' => 4, 'type' => 'kuliner', 'title' => 'Coba Semua Kuliner Soto Nusantara', 'notes' => 'Soto Betawi, Soto Lamongan, Coto Makassar, Soto Banjar.', 'priority' => 'Medium', 'saved' => 0, 'target' => 0, 'img' => 'https://picsum.photos/seed/soto/400/250', 'tags' => ['Kuliner', 'Nusantara']],
                ['id' => 5, 'type' => 'barang', 'title' => 'iPad + Apple Pencil untuk Kakak Belajar', 'notes' => 'Untuk aplikasi belajar Matematika dan Coding for Kids.', 'priority' => 'High', 'saved' => 2500000, 'target' => 8000000, 'img' => 'https://picsum.photos/seed/ipad/400/250', 'tags' => ['Edukasi', 'Gadget']],
                ['id' => 6, 'type' => 'barang', 'title' => 'Mesin Kopi Espresso Premium', 'notes' => 'Ayah ingin ngopi bareng tanpa harus ke kafe terus.', 'priority' => 'Low', 'saved' => 500000, 'target' => 5000000, 'img' => 'https://picsum.photos/seed/coffee/400/250', 'tags' => ['Gaya Hidup', 'Dapur']],
            ],

            // I. Growth Tracker Anak
            'growth_tracker' => [
                'children' => [
                    [
                        'name' => 'Kakak',
                        'dob' => '2017-04-15',
                        'age' => '9 Tahun',
                        'current' => ['height' => 128, 'weight' => 26],
                        'milestones' => [
                            ['date' => 'Mar 2026', 'title' => 'Bisa Berenang 25 Meter Tanpa Pelampung', 'cat' => 'Motorik'],
                            ['date' => 'Feb 2026', 'title' => 'Juara 2 Lomba Matematika Tingkat Kecamatan', 'cat' => 'Akademik'],
                            ['date' => 'Jan 2026', 'title' => 'Mulai Les Coding Python untuk Anak', 'cat' => 'Skill'],
                        ],
                        'growth_history' => [
                            ['month' => 'Sep 25', 'height' => 123, 'weight' => 24],
                            ['month' => 'Des 25', 'height' => 125, 'weight' => 25],
                            ['month' => 'Mar 26', 'height' => 128, 'weight' => 26],
                        ],
                        'immunizations' => [
                            ['vaccine' => 'Influenza', 'due' => 'Apr 2026', 'done' => false],
                            ['vaccine' => 'Tifoid', 'due' => 'Jun 2026', 'done' => false],
                        ],
                    ],
                    [
                        'name' => 'Adik',
                        'dob' => '2024-01-20',
                        'age' => '2 Tahun',
                        'current' => ['height' => 88, 'weight' => 13, 'head_circ' => 48],
                        'milestones' => [
                            ['date' => 'Mar 2026', 'title' => 'Bisa Berjalan Sendiri (10+ Langkah)', 'cat' => 'Motorik'],
                            ['date' => 'Feb 2026', 'title' => 'Sudah Hafal 5 Angka & Warna Dasar', 'cat' => 'Kognitif'],
                            ['date' => 'Jan 2026', 'title' => 'Pertama Kali Bilang "Ayah" & "Ibu"', 'cat' => 'Bahasa'],
                        ],
                        'growth_history' => [
                            ['month' => 'Sep 25', 'height' => 80, 'weight' => 11],
                            ['month' => 'Des 25', 'height' => 84, 'weight' => 12],
                            ['month' => 'Mar 26', 'height' => 88, 'weight' => 13],
                        ],
                        'immunizations' => [
                            ['vaccine' => 'Campak MMR', 'due' => 'Apr 2026', 'done' => false],
                            ['vaccine' => 'DPT Booster', 'due' => 'Mei 2026', 'done' => false],
                            ['vaccine' => 'Varisela', 'due' => 'Jun 2026', 'done' => false],
                        ],
                    ],
                ],
            ],

            // J. File Manager
            'files' => [
                ['id' => 1, 'name' => 'KTP Ayah & Ibu.pdf', 'size' => '2.1 MB', 'type' => 'pdf', 'uploaded' => '1 Mar 2026', 'cat' => 'Identitas'],
                ['id' => 2, 'name' => 'Sertifikat Tanah.pdf', 'size' => '5.4 MB', 'type' => 'pdf', 'uploaded' => '15 Jan 2026', 'cat' => 'Properti'],
                ['id' => 3, 'name' => 'Rapor Kakak Semester 1.pdf', 'size' => '1.2 MB', 'type' => 'pdf', 'uploaded' => '20 Des 2025', 'cat' => 'Pendidikan'],
                ['id' => 4, 'name' => 'Buku KIA Adik.jpg', 'size' => '3.8 MB', 'type' => 'image', 'uploaded' => '5 Mar 2026', 'cat' => 'Kesehatan'],
                ['id' => 5, 'name' => 'BPKB Mobil.pdf', 'size' => '4.1 MB', 'type' => 'pdf', 'uploaded' => '10 Feb 2026', 'cat' => 'Kendaraan'],
                ['id' => 6, 'name' => 'Polis Asuransi Kesehatan.pdf', 'size' => '2.7 MB', 'type' => 'pdf', 'uploaded' => '1 Jan 2026', 'cat' => 'Asuransi'],
            ],
        ];
    }
}

