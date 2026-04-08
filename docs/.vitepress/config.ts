import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Cabinet Project Docs',
  description: 'Developer-facing documentation for the Cabinet SaaS boilerplate project.',
  base: '/',
  lastUpdated: true,
  cleanUrls: false,
  themeConfig: {
    search: {
      provider: 'local',
    },
    nav: [
      { text: 'Overview', link: '/overview' },
      { text: 'API', link: '/api-reference' },
      { text: 'Testing', link: '/testing-quality' },
    ],
    sidebar: [
      {
        text: 'Core',
        items: [
          { text: 'Overview', link: '/overview' },
          { text: 'Quickstart', link: '/quickstart' },
          { text: 'Architecture', link: '/architecture' },
        ],
      },
      {
        text: 'Guides & Features',
        items: [
          { text: 'Finance', link: '/03-features/finance' },
          { text: 'Wallet', link: '/03-features/wallet' },
          { text: 'RBAC', link: '/guide/rbac' },
          { text: 'i18n', link: '/guide/i18n' },
          { text: 'PWA Module Template', link: '/guide/pwa-module-template' },
          { text: 'Subscription', link: '/guide/subscription' },
          { text: 'WhatsApp Integration', link: '/guide/whatsapp' },
          { text: 'Tenant Settings', link: '/03-features/tenant-settings' },
        ],
      },
      {
        text: 'Progress',
        items: [
          { text: 'Progress Dashboard', link: '/08-progress/index' },
          { text: 'Finance Progress', link: '/08-progress/modules/finance' },
          { text: 'Wallet Progress', link: '/08-progress/modules/wallet' },
          { text: 'RBAC Progress', link: '/08-progress/modules/rbac' },
          { text: 'i18n Progress', link: '/08-progress/modules/i18n' },
          { text: 'Subscription Progress', link: '/08-progress/modules/subscription' },
          { text: 'Changelog 2026-03', link: '/08-progress/changelog/2026-03' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'API Reference', link: '/api-reference' },
          { text: 'UI Walkthrough', link: '/ui-walkthrough' },
          { text: 'Velzon Navbar Reference', link: '/reference/velzon-navbar-reference' },
          { text: 'Velzon Dashboards & Apps', link: '/reference/velzon-dashboards-apps' },
          { text: 'Velzon Auth, Pages & Landing', link: '/reference/velzon-auth-pages-landing' },
          { text: 'Velzon Base UI', link: '/reference/velzon-base-ui' },
          { text: 'Velzon More Reference', link: '/reference/velzon-more-reference' },
          { text: 'Testing & Quality', link: '/testing-quality' },
          { text: 'Extension Guide', link: '/extension-guide' },
          { text: 'PWA Module Template', link: '/guide/pwa-module-template' },
          { text: 'Installation Guide', link: '/installation-guide' },
        ],
      },
    ],
  },
});
