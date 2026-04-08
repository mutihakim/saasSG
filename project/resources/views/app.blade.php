<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
        @php
            $tenantName = data_get($page ?? [], 'props.currentTenant.presentable_name')
                ?? data_get($page ?? [], 'props.currentTenant.display_name')
                ?? data_get($page ?? [], 'props.currentTenant.name');
            $faviconHref = data_get($page ?? [], 'props.currentTenant.branding.faviconUrl')
                ?? asset('favicon.ico');
        @endphp

        <title inertia>{{ $tenantName ? $tenantName.' | '.config('app.name', 'Laravel') : config('app.name', 'Laravel') }}</title>
        <link rel="icon" href="{{ $faviconHref }}" data-app-favicon="true">
        <link rel="manifest" href="{{ url('/manifest.webmanifest') }}">
        <link rel="apple-touch-icon" href="{{ asset('icons/pwa-192.png') }}">
        <meta name="theme-color" content="#0dcaf0">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="{{ $tenantName ?: config('app.name', 'Laravel') }}">

        <!-- Fonts -->
        <link href="{{ asset('resources/fonts/figtree/figtree.css') }}" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
