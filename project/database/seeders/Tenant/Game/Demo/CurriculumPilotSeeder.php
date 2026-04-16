<?php

namespace Database\Seeders\Tenant\Game\Demo;

use App\Models\Games\GameCurriculumQuestion;
use App\Models\Games\GameCurriculumUnit;
use App\Models\Games\TenantCurriculumEntitlement;
use App\Models\Tenant\Tenant;
use Illuminate\Database\Seeder;

class CurriculumPilotSeeder extends Seeder
{
    public function run(): void
    {
        $units = [
            [
                'educational_phase' => 'sd',
                'grade' => 4,
                'subject' => 'Matematika',
                'semester' => 1,
                'chapter' => 'Pecahan Dasar',
                'questions' => [
                    [
                        'question_key' => 'frac-01',
                        'question_text' => 'Pecahan yang setara dengan 1/2 adalah...',
                        'options' => ['2/4', '3/4', '2/3', '1/3'],
                        'correct_answer' => '2/4',
                    ],
                    [
                        'question_key' => 'frac-02',
                        'question_text' => 'Jika sebuah pizza dibagi menjadi 8 bagian sama besar dan dimakan 3 bagian, bagian yang dimakan adalah...',
                        'options' => ['3/8', '5/8', '3/5', '8/3'],
                        'correct_answer' => '3/8',
                    ],
                    [
                        'question_key' => 'frac-03',
                        'question_text' => 'Manakah pecahan yang paling besar?',
                        'options' => ['3/4', '2/4', '1/2', '1/4'],
                        'correct_answer' => '3/4',
                    ],
                    [
                        'question_key' => 'frac-04',
                        'question_text' => 'Urutan pecahan dari yang terkecil ke terbesar adalah...',
                        'options' => ['1/4, 1/2, 3/4, 1', '1/2, 1/4, 3/4, 1', '3/4, 1/2, 1/4, 1', '1, 3/4, 1/2, 1/4'],
                        'correct_answer' => '1/4, 1/2, 3/4, 1',
                    ],
                    [
                        'question_key' => 'frac-05',
                        'question_text' => 'Pecahan 4/4 bernilai sama dengan...',
                        'options' => ['1', '1/4', '4', '0'],
                        'correct_answer' => '1',
                    ],
                    [
                        'question_key' => 'frac-06',
                        'question_text' => 'Ibu memotong kue menjadi 6 bagian sama besar. Jika tersisa 2 bagian, maka bagian yang sudah dimakan adalah...',
                        'options' => ['4/6', '2/6', '2/4', '6/4'],
                        'correct_answer' => '4/6',
                    ],
                ],
            ],
            [
                'educational_phase' => 'sd',
                'grade' => 4,
                'subject' => 'Matematika',
                'semester' => 1,
                'chapter' => 'Bangun Datar Dasar',
                'questions' => [
                    [
                        'question_key' => 'shape-01',
                        'question_text' => 'Bangun datar yang memiliki 4 sisi sama panjang dan 4 sudut siku-siku adalah...',
                        'options' => ['Persegi', 'Persegi panjang', 'Segitiga sama sisi', 'Jajar genjang'],
                        'correct_answer' => 'Persegi',
                    ],
                    [
                        'question_key' => 'shape-02',
                        'question_text' => 'Bangun datar yang memiliki tepat 3 sisi disebut...',
                        'options' => ['Segitiga', 'Trapesium', 'Lingkaran', 'Persegi'],
                        'correct_answer' => 'Segitiga',
                    ],
                    [
                        'question_key' => 'shape-03',
                        'question_text' => 'Jika panjang sebuah persegi panjang 8 cm dan lebarnya 3 cm, kelilingnya adalah...',
                        'options' => ['22 cm', '24 cm', '11 cm', '16 cm'],
                        'correct_answer' => '22 cm',
                    ],
                    [
                        'question_key' => 'shape-04',
                        'question_text' => 'Bangun datar yang tidak memiliki sudut adalah...',
                        'options' => ['Lingkaran', 'Persegi', 'Belah ketupat', 'Trapesium'],
                        'correct_answer' => 'Lingkaran',
                    ],
                    [
                        'question_key' => 'shape-05',
                        'question_text' => 'Jumlah sisi pada segi enam adalah...',
                        'options' => ['6', '5', '7', '8'],
                        'correct_answer' => '6',
                    ],
                    [
                        'question_key' => 'shape-06',
                        'question_text' => 'Persegi panjang memiliki pasangan sisi yang...',
                        'options' => ['Berhadapan sama panjang', 'Semua berbeda panjang', 'Semua sama panjang', 'Tidak ada yang sejajar'],
                        'correct_answer' => 'Berhadapan sama panjang',
                    ],
                ],
            ],
        ];

        foreach ($units as $unitSeed) {
            $unit = GameCurriculumUnit::query()->firstOrCreate(
                [
                    'tenant_id' => null,
                    'educational_phase' => $unitSeed['educational_phase'],
                    'grade' => $unitSeed['grade'],
                    'subject' => $unitSeed['subject'],
                    'semester' => $unitSeed['semester'],
                    'chapter' => $unitSeed['chapter'],
                ],
                [
                    'curriculum_type' => 'kurikulum_merdeka',
                    'difficulty_level' => 'pilot',
                    'metadata' => ['source' => 'curriculum-pilot-seeder'],
                    'row_version' => 1,
                ]
            );

            foreach ($unitSeed['questions'] as $index => $questionSeed) {
                GameCurriculumQuestion::query()->firstOrCreate(
                    [
                        'tenant_id' => null,
                        'curriculum_unit_id' => $unit->id,
                        'question_key' => $questionSeed['question_key'],
                    ],
                    [
                        'question_text' => $questionSeed['question_text'],
                        'options' => $questionSeed['options'],
                        'correct_answer' => $questionSeed['correct_answer'],
                        'question_type' => 'multiple_choice',
                        'points' => 10,
                        'difficulty_order' => $index + 1,
                        'metadata' => ['source' => 'curriculum-pilot-seeder'],
                        'row_version' => 1,
                    ]
                );
            }
        }

        Tenant::query()->get()->each(function (Tenant $tenant): void {
            TenantCurriculumEntitlement::query()->firstOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'user_id' => null,
                    'educational_phase' => 'sd',
                    'grade' => 4,
                    'subject' => 'Matematika',
                ],
                [
                    'is_active' => true,
                    'metadata' => ['source' => 'curriculum-pilot-seeder'],
                ]
            );
        });
    }
}
