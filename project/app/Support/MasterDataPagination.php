<?php

namespace App\Support;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class MasterDataPagination
{
    public const DEFAULT_PER_PAGE = 50;
    public const MAX_PER_PAGE = 100;
    public const SAFE_ALL_BATCH = 200;

    /**
     * @return array{
     *   page:int,
     *   per_page:int,
     *   requested_per_page:int|string|null,
     *   mode:string,
     *   capped:bool
     * }
     */
    public static function resolve(Request $request, int $default = self::DEFAULT_PER_PAGE, int $max = self::MAX_PER_PAGE, int $safeAllBatch = self::SAFE_ALL_BATCH): array
    {
        $page = max(1, (int) $request->integer('page', 1));
        $requestedPerPage = $request->input('per_page');

        if ($requestedPerPage === 'all') {
            return [
                'page' => $page,
                'per_page' => $safeAllBatch,
                'requested_per_page' => 'all',
                'mode' => 'all',
                'capped' => true,
            ];
        }

        $perPage = max(1, min((int) ($requestedPerPage ?: $default), $max));

        return [
            'page' => $page,
            'per_page' => $perPage,
            'requested_per_page' => $requestedPerPage,
            'mode' => 'paged',
            'capped' => false,
        ];
    }

    /**
     * @param array{requested_per_page:int|string|null,mode:string,capped:bool} $resolved
     * @return array<string,mixed>
     */
    public static function meta(LengthAwarePaginator $paginator, array $resolved): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'last_page' => $paginator->lastPage(),
            'has_more' => $paginator->hasMorePages(),
            'mode' => $resolved['mode'],
            'capped' => (bool) $resolved['capped'],
            'requested_per_page' => $resolved['requested_per_page'],
        ];
    }

    /**
     * @return string[]
     */
    public static function stringList(Request $request, string $key): array
    {
        $value = $request->input($key);

        if (is_array($value)) {
            return array_values(array_filter(array_map(
                static fn ($item) => is_scalar($item) ? trim((string) $item) : '',
                $value
            ), static fn (string $item) => $item !== ''));
        }

        if (! is_string($value) || trim($value) === '') {
            return [];
        }

        return array_values(array_filter(array_map(
            static fn (string $item) => trim($item),
            explode(',', $value)
        ), static fn (string $item) => $item !== ''));
    }

    /**
     * @return string[]
     */
    public static function searchTerms(string $value): array
    {
        $normalized = trim(mb_strtolower($value));

        if ($normalized === '') {
            return [];
        }

        $terms = preg_split('/\s+/u', $normalized) ?: [];

        return array_values(array_unique(array_filter(
            array_map(static fn ($item) => trim((string) $item), $terms),
            static fn (string $item) => $item !== ''
        )));
    }

    /**
     * Apply tokenized case-insensitive contains search. Each term must match.
     */
    public static function applyTokenizedContains($query, string $column, array $terms): void
    {
        if ($terms === []) {
            return;
        }

        $query->where(function ($nestedQuery) use ($column, $terms) {
            foreach ($terms as $term) {
                $nestedQuery->whereRaw("LOWER(COALESCE({$column}, '')) LIKE ?", ["%{$term}%"]);
            }
        });
    }

    /**
     * @return array{min:float|int|null,max:float|int|null}
     */
    public static function parseNumberExpression(?string $value): array
    {
        $normalized = trim((string) $value);

        if ($normalized === '') {
            return ['min' => null, 'max' => null];
        }

        if (preg_match('/^\s*(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)\s*$/', $normalized, $matches) === 1) {
            $left = (float) $matches[1];
            $right = (float) $matches[2];

            return [
                'min' => min($left, $right),
                'max' => max($left, $right),
            ];
        }

        if (preg_match('/^\s*>=\s*(-?\d+(?:\.\d+)?)\s*$/', $normalized, $matches) === 1) {
            return ['min' => (float) $matches[1], 'max' => null];
        }

        if (preg_match('/^\s*>\s*(-?\d+(?:\.\d+)?)\s*$/', $normalized, $matches) === 1) {
            return ['min' => (float) $matches[1], 'max' => null];
        }

        if (preg_match('/^\s*<=\s*(-?\d+(?:\.\d+)?)\s*$/', $normalized, $matches) === 1) {
            return ['min' => null, 'max' => (float) $matches[1]];
        }

        if (preg_match('/^\s*<\s*(-?\d+(?:\.\d+)?)\s*$/', $normalized, $matches) === 1) {
            return ['min' => null, 'max' => (float) $matches[1]];
        }

        if (is_numeric($normalized)) {
            $number = (float) $normalized;

            return ['min' => $number, 'max' => $number];
        }

        return ['min' => null, 'max' => null];
    }
}
