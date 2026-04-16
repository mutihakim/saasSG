<?php

namespace App\Services\Games\Curriculum;

use App\Models\Games\GameCurriculumUnit;
use App\Models\Tenant\Tenant;
use Illuminate\Http\UploadedFile;

class CurriculumImportService
{
    public function __construct(private readonly CurriculumQuestionService $questionService)
    {
    }

    public function importFromCsv(Tenant $tenant, GameCurriculumUnit $unit, UploadedFile $file): array
    {
        $handle = fopen($file->getRealPath(), 'rb');

        if (! is_resource($handle)) {
            throw new \RuntimeException('Unable to read curriculum CSV.');
        }

        $header = fgetcsv($handle);
        if (! is_array($header)) {
            fclose($handle);
            throw new \InvalidArgumentException('Curriculum CSV header is missing.');
        }

        $header = array_map(static fn ($value) => trim((string) $value), $header);
        $created = 0;
        $rowNumber = 1;
        $errors = [];

        while (($row = fgetcsv($handle)) !== false) {
            $rowNumber++;
            if ($row === [null] || $row === []) {
                continue;
            }

            $payload = array_combine($header, array_pad($row, count($header), null));

            try {
                $options = [
                    $payload['option_a'] ?? null,
                    $payload['option_b'] ?? null,
                    $payload['option_c'] ?? null,
                    $payload['option_d'] ?? null,
                ];

                $this->questionService->createQuestion($tenant, $unit, [
                    'question_key' => $payload['question_key'] ?? null,
                    'question_text' => (string) ($payload['question_text'] ?? ''),
                    'options' => $options,
                    'correct_answer' => (string) ($payload['correct_answer'] ?? ''),
                    'points' => (int) ($payload['points'] ?? 10),
                    'difficulty_order' => (int) ($payload['difficulty_order'] ?? 0),
                    'metadata' => ['source' => 'csv-import'],
                ]);
                $created++;
            } catch (\Throwable $throwable) {
                $errors[] = [
                    'row' => $rowNumber,
                    'message' => $throwable->getMessage(),
                ];
            }
        }

        fclose($handle);

        return [
            'created' => $created,
            'errors' => $errors,
        ];
    }
}
