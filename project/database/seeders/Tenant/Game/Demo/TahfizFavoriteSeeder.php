<?php

namespace Database\Seeders\Tenant\Game\Demo;

use App\Models\Games\TenantGameTahfizFavorite;
use App\Models\Tenant\Tenant;
use Illuminate\Database\Seeder;

class TahfizFavoriteSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            'Doa & Permohonan Kehidupan' => [
                ['surah' => 1, 'ayah' => '6-7', 'note' => 'Doa mohon petunjuk ke jalan yang lurus (Shiratal Mustaqim).'],
                ['surah' => 2, 'ayah' => '201', 'note' => 'Doa Sapu Jagat (Memohon kebaikan dunia dan akhirat).'],
                ['surah' => 2, 'ayah' => '286', 'note' => 'Doa memohon ampunan, rahmat, dan keringanan beban.'],
                ['surah' => 3, 'ayah' => '8', 'note' => 'Doa keteguhan hati agar tidak condong pada kesesatan.'],
                ['surah' => 3, 'ayah' => '38', 'note' => 'Doa Nabi Zakariya memohon keturunan yang baik.'],
                ['surah' => 3, 'ayah' => '193-194', 'note' => 'Doa memohon wafat dalam keadaan baik (Husnul Khatimah).'],
                ['surah' => 7, 'ayah' => '23', 'note' => 'Doa Taubat Nabi Adam (Pengakuan kezaliman diri).'],
                ['surah' => 9, 'ayah' => '129', 'note' => 'Doa tolak bala & kepasrahan (Cukuplah Allah bagiku).'],
                ['surah' => 10, 'ayah' => '85-86', 'note' => 'Doa keselamatan dari fitnah orang-orang zalim.'],
                ['surah' => 14, 'ayah' => '40-41', 'note' => 'Doa agar diri dan keturunan istiqamah mendirikan shalat.'],
                ['surah' => 18, 'ayah' => '10', 'note' => 'Doa Ashabul Kahfi memohon rahmat dan petunjuk lurus.'],
                ['surah' => 20, 'ayah' => '25-28', 'note' => 'Doa Nabi Musa memohon kelapangan dada dan kelancaran lisan.'],
                ['surah' => 20, 'ayah' => '114', 'note' => "Doa singkat memohon tambahan ilmu pengetahuan (Rabbi zidni 'ilma)."],
                ['surah' => 21, 'ayah' => '83', 'note' => 'Doa kesembuhan Nabi Ayyub saat ditimpa penyakit berat.'],
                ['surah' => 21, 'ayah' => '87', 'note' => 'Doa Nabi Yunus dalam perut ikan paus (Zikir pelebur kesulitan).'],
                ['surah' => 23, 'ayah' => '29', 'note' => 'Doa memohon ditempatkan di tempat yang diberkahi.'],
                ['surah' => 23, 'ayah' => '97-98', 'note' => 'Doa berlindung dari bisikan dan kedatangan setan.'],
                ['surah' => 25, 'ayah' => '74', 'note' => "Doa memohon pasangan dan keturunan sebagai penyejuk hati (Qurrata A'yun)."],
                ['surah' => 27, 'ayah' => '19', 'note' => 'Doa Nabi Sulaiman memohon ilham untuk pandai mensyukuri nikmat.'],
                ['surah' => 46, 'ayah' => '15', 'note' => 'Doa syukur usia 40 tahun dan mohon kesalehan keturunan.'],
            ],
            'Perlindungan & Penjagaan (Ruqyah)' => [
                ['surah' => 2, 'ayah' => '255', 'note' => 'Ayat Kursi (Ayat paling agung, pelindung dari gangguan gaib).'],
                ['surah' => 2, 'ayah' => '285-286', 'note' => 'Dua Ayat Terakhir Al-Baqarah (Pelindung di malam hari & kecukupan).'],
                ['surah' => 10, 'ayah' => '57', 'note' => "Ayat Syifa' (Al-Quran sebagai penyembuh penyakit hati)."],
                ['surah' => 10, 'ayah' => '81-82', 'note' => 'Ayat pembatal sihir (Kisah Nabi Musa melawan penyihir Fir\'aun).'],
                ['surah' => 12, 'ayah' => '64', 'note' => 'Ayat penjagaan (Hafazhah) - Allah adalah sebaik-baik penjaga.'],
                ['surah' => 17, 'ayah' => '82', 'note' => 'Al-Quran diturunkan sebagai obat (Syifa) dan rahmat.'],
                ['surah' => 23, 'ayah' => '115-118', 'note' => 'Ayat perlindungan agar dijauhkan dari kesia-siaan.'],
                ['surah' => 112, 'ayah' => '1-4', 'note' => 'Menegaskan ketauhidan, perlindungan dasar.'],
                ['surah' => 113, 'ayah' => '1-5', 'note' => 'Berlindung dari kejahatan makhluk, malam gelap, sihir, dan pendengki.'],
                ['surah' => 114, 'ayah' => '1-6', 'note' => 'Berlindung dari bisikan setan (jin dan manusia).'],
            ],
            'Ketenangan Hati & Penyemangat (Motivasi)' => [
                ['surah' => 2, 'ayah' => '152', 'note' => 'Ingatlah kepada-Ku, niscaya Aku ingat kepadamu.'],
                ['surah' => 2, 'ayah' => '153', 'note' => 'Jadikan sabar dan shalat sebagai penolong (Allah bersama orang sabar).'],
                ['surah' => 2, 'ayah' => '216', 'note' => 'Boleh jadi kamu membenci sesuatu padahal ia amat baik bagimu.'],
                ['surah' => 2, 'ayah' => '286', 'note' => 'Allah tidak membebani seseorang melainkan sesuai kesanggupannya.'],
                ['surah' => 3, 'ayah' => '139', 'note' => 'Janganlah kamu lemah dan bersedih hati, kamu derajatnya paling tinggi.'],
                ['surah' => 3, 'ayah' => '173', 'note' => "Cukuplah Allah menjadi penolong kami (Hasbunallah wa ni'mal wakil)."],
                ['surah' => 9, 'ayah' => '40', 'note' => 'La Tahzan, Innallaha Ma\'ana (Jangan bersedih, Allah bersama kita).'],
                ['surah' => 13, 'ayah' => '28', 'note' => 'Hanya dengan mengingat Allah hati menjadi tenteram.'],
                ['surah' => 30, 'ayah' => '60', 'note' => 'Bersabarlah, sungguh janji Allah itu benar.'],
                ['surah' => 39, 'ayah' => '53', 'note' => 'Jangan berputus asa dari rahmat Allah yang Maha Pengampun.'],
                ['surah' => 61, 'ayah' => '13', 'note' => 'Pertolongan dari Allah dan kemenangan yang dekat.'],
                ['surah' => 94, 'ayah' => '5-6', 'note' => 'Sesungguhnya sesudah kesulitan itu ada kemudahan (diulang 2x).'],
            ],
            'Rezeki, Syukur, & Tawakal' => [
                ['surah' => 11, 'ayah' => '6', 'note' => 'Tidak ada binatang melata di bumi melainkan Allah yang menjamin rezekinya.'],
                ['surah' => 14, 'ayah' => '7', 'note' => 'Janji Allah: Jika kamu bersyukur, pasti akan Kutambah (nikmat-Ku).'],
                ['surah' => 62, 'ayah' => '10', 'note' => 'Perintah bertebaran di bumi mencari karunia Allah setelah ibadah.'],
                ['surah' => 62, 'ayah' => '11', 'note' => 'Allah adalah sebaik-baik pemberi rezeki.'],
                ['surah' => 65, 'ayah' => '2-3', 'note' => 'Ayat Seribu Dinar (Jalan keluar, rezeki tak terduga, & tawakal).'],
                ['surah' => 71, 'ayah' => '10-12', 'note' => 'Istighfar sebagai kunci pembuka rezeki, harta, dan keturunan.'],
                ['surah' => 56, 'ayah' => '73-74', 'note' => 'Bertasbihlah dengan menyebut nama Tuhanmu (Sering dibaca untuk kelancaran rezeki).'],
                ['surah' => 93, 'ayah' => '3-5', 'note' => 'Tuhanmu tidak meninggalkanmu, dan kelak Dia akan memberimu karunia.'],
            ],
            'Akhlak, Adab, & Sosial' => [
                ['surah' => 4, 'ayah' => '36', 'note' => 'Perintah berbuat baik kepada orang tua, kerabat, tetangga, dan musafir.'],
                ['surah' => 17, 'ayah' => '23-24', 'note' => 'Berbakti kepada orang tua (Birrul Walidain) dan larangan berkata "Ah".'],
                ['surah' => 25, 'ayah' => '63', 'note' => 'Ciri hamba yang baik: berjalan rendah hati & membalas caci maki dengan salam.'],
                ['surah' => 31, 'ayah' => '18', 'note' => 'Larangan memalingkan muka karena sombong & angkuh di bumi.'],
                ['surah' => 33, 'ayah' => '70-71', 'note' => 'Perintah bertakwa dan berkata dengan perkataan yang benar (Qaulan Sadida).'],
                ['surah' => 41, 'ayah' => '34', 'note' => 'Tolaklah kejahatan dengan cara yang lebih baik (Musuh menjadi teman setia).'],
                ['surah' => 49, 'ayah' => '10', 'note' => 'Sesungguhnya orang-orang mukmin itu bersaudara.'],
                ['surah' => 49, 'ayah' => '11', 'note' => 'Larangan mengolok-olok dan memanggil dengan gelaran buruk.'],
                ['surah' => 49, 'ayah' => '12', 'note' => 'Larangan berburuk sangka, mencari-cari kesalahan (tajassus), dan ghibah.'],
                ['surah' => 49, 'ayah' => '13', 'note' => 'Tujuan diciptakan berbangsa-bangsa adalah untuk saling mengenal (Lita\'arafu).'],
            ],
            'Keesaan & Kebesaran Allah (Tauhid)' => [
                ['surah' => 2, 'ayah' => '186', 'note' => 'Allah Maha Dekat dan mengabulkan doa hamba yang memohon kepada-Nya.'],
                ['surah' => 3, 'ayah' => '190-191', 'note' => 'Penciptaan langit dan bumi adalah tanda bagi Ulul Albab (orang berakal).'],
                ['surah' => 6, 'ayah' => '59', 'note' => 'Di sisi Allah kunci-kunci kegaiban, tidak ada daun gugur yang tak diketahui-Nya.'],
                ['surah' => 6, 'ayah' => '162', 'note' => '"Sesungguhnya shalatku, ibadahku, hidupku & matiku hanya untuk Allah."'],
                ['surah' => 24, 'ayah' => '35', 'note' => 'Ayat Cahaya (Allah adalah cahaya langit dan bumi).'],
                ['surah' => 42, 'ayah' => '11', 'note' => 'Tidak ada sesuatu pun yang serupa dengan Dia (Allah).'],
                ['surah' => 50, 'ayah' => '16', 'note' => 'Allah lebih dekat kepada manusia daripada urat lehernya sendiri.'],
                ['surah' => 55, 'ayah' => '13', 'note' => '"Maka nikmat Tuhan kamu yang manakah yang kamu dustakan?" (Diulang 31 kali).'],
                ['surah' => 67, 'ayah' => '1-4', 'note' => 'Kerajaan alam semesta di tangan Allah & kesempurnaan ciptaan-Nya tanpa cacat.'],
                ['surah' => 112, 'ayah' => '2', 'note' => 'Allah As-Shamad (Allah tempat meminta segala sesuatu).'],
            ],
            'Keluarga & Pernikahan' => [
                ['surah' => 2, 'ayah' => '187', 'note' => 'Kiasan suami istri: "Mereka adalah pakaian bagimu, dan kamu pakaian bagi mereka."'],
                ['surah' => 4, 'ayah' => '19', 'note' => 'Perintah bergaul dengan istri secara patut (Ma\'ruf).'],
                ['surah' => 8, 'ayah' => '28', 'note' => 'Peringatan bahwa harta dan anak-anak hanyalah cobaan (fitnah).'],
                ['surah' => 30, 'ayah' => '21', 'note' => 'Tujuan pernikahan: Meraih Sakinah (ketenangan), Mawaddah (cinta), wa Rahmah (kasih sayang).'],
                ['surah' => 66, 'ayah' => '6', 'note' => 'Jagalah dirimu dan keluargamu dari api neraka.'],
            ],
            'Kematian & Hari Kiamat' => [
                ['surah' => 3, 'ayah' => '185', 'note' => 'Tiap-tiap yang berjiwa akan merasakan mati.'],
                ['surah' => 4, 'ayah' => '78', 'note' => 'Kematian akan mengejar dimanapun berada, walau di benteng yang tinggi nan kokoh.'],
                ['surah' => 23, 'ayah' => '99-100', 'note' => 'Penyesalan saat ajal tiba dan permintaan kembali ke dunia untuk beramal shaleh.'],
                ['surah' => 78, 'ayah' => '40', 'note' => 'Penyesalan orang kafir di hari kiamat (Ingin menjadi tanah saja).'],
                ['surah' => 89, 'ayah' => '27-30', 'note' => 'Panggilan indah untuk jiwa yang tenang (Muthmainnah) masuk surga.'],
                ['surah' => 99, 'ayah' => '7-8', 'note' => 'Balasan sekecil biji zarah (atom) atas kebaikan dan keburukan pasti terlihat.'],
                ['surah' => 101, 'ayah' => '6-9', 'note' => 'Nasib timbangan amal yang berat (surga) dan yang ringan (neraka Hawiyah).'],
            ],
            'Ibadah Pokok' => [
                ['surah' => 2, 'ayah' => '43', 'note' => 'Perintah mendirikan shalat, menunaikan zakat, dan ruku\' bersama orang-orang yang ruku\' .'],
                ['surah' => 2, 'ayah' => '183', 'note' => 'Kewajiban berpuasa Ramadhan agar menjadi orang yang bertakwa.'],
                ['surah' => 3, 'ayah' => '97', 'note' => 'Kewajiban melaksanakan Haji bagi yang mampu perjalanannya.'],
                ['surah' => 17, 'ayah' => '79', 'note' => 'Perintah Shalat Tahajjud untuk mengangkat derajat ke tempat yang terpuji.'],
                ['surah' => 29, 'ayah' => '45', 'note' => 'Bacalah Al-Quran dan dirikan shalat, sesungguhnya shalat mencegah keji dan mungkar.'],
                ['surah' => 51, 'ayah' => '18', 'note' => 'Sifat ahli surga: Beristighfar (memohon ampun) di waktu sahur (akhir malam).'],
                ['surah' => 97, 'ayah' => '1-5', 'note' => 'Kemuliaan malam Lailatul Qadar yang lebih baik dari seribu bulan.'],
            ],
            'Kisah & Keajaiban (Ibrah)' => [
                ['surah' => 12, 'ayah' => '86', 'note' => 'Ketabahan Nabi Ya\'qub: "Hanya kepada Allah aku mengadukan kesusahan dan kesedihanku."'],
                ['surah' => 19, 'ayah' => '30-33', 'note' => 'Mukjizat Nabi Isa berbicara saat masih bayi dalam buaian.'],
                ['surah' => 21, 'ayah' => '69', 'note' => 'Perintah Allah agar api menjadi dingin dan menyelamatkan Nabi Ibrahim.'],
                ['surah' => 27, 'ayah' => '18', 'note' => 'Kisah semut yang mengingatkan kawanannya agar tidak terinjak pasukan Sulaiman.'],
                ['surah' => 28, 'ayah' => '24', 'note' => 'Doa Nabi Musa saat kelelahan & butuh kebaikan di kota Madyan.'],
                ['surah' => 31, 'ayah' => '13', 'note' => 'Wasiat utama Luqman kepada anaknya: Jangan menyekutukan Allah (Syirik).'],
            ],
            'Kemutlakan Kuasa Allah' => [
                ['surah' => 36, 'ayah' => '82', 'note' => 'Ayat Ketetapan Mutlak: "Kun Fayakun" (Jadilah, maka terjadilah ia).'],
                ['surah' => 6, 'ayah' => '17', 'note' => 'Jika Allah menimpakan kemudharatan, tidak ada yang bisa menghilangkannya selain Dia.'],
                ['surah' => 67, 'ayah' => '15', 'note' => 'Dialah yang menjadikan bumi mudah digunakan, maka berjalanlah dan makanlah rezeki-Nya.'],
                ['surah' => 55, 'ayah' => '26-27', 'note' => 'Semua yang ada di bumi akan binasa, yang kekal hanya Wajah Tuhanmu.'],
                ['surah' => 96, 'ayah' => '1-5', 'note' => 'Wahyu Pertama: Perintah membaca (Iqra) atas nama Tuhan yang menciptakan.'],
            ],
        ];

        $tenants = Tenant::all();

        foreach ($tenants as $tenant) {
            foreach ($data as $category => $items) {
                foreach ($items as $item) {
                    $ayahRange = explode('-', $item['ayah']);
                    $start = (int)$ayahRange[0];
                    $end = isset($ayahRange[1]) ? (int)$ayahRange[1] : $start;

                    TenantGameTahfizFavorite::updateOrCreate(
                        [
                            'tenant_id' => $tenant->id,
                            'surah_id' => $item['surah'],
                            'ayah_start' => $start,
                            'ayah_end' => $end,
                        ],
                        [
                            'category' => $category,
                            'note' => $item['note'],
                        ]
                    );
                }
            }
        }
    }
}
