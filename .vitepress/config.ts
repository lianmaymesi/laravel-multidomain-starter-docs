import { defineConfig } from 'vitepress';

export default defineConfig({
    title: 'Laravel Multidomain Starter',
    description: 'A Laravel starter kit for multi-subdomain apps',
    base: '/laravel-multidomain-starter-docs/',

    themeConfig: {
        nav: [
            { text: 'Guide', link: '/guide/getting-started' },
            { text: 'Portals', link: '/portals/landing' },
            { text: 'Reference', link: '/reference/config' },
        ],

        sidebar: [
            {
                text: 'Guide',
                items: [
                    { text: 'Getting Started', link: '/guide/getting-started' },
                    { text: 'Single vs Multi Domain', link: '/guide/single-vs-multi-domain' },
                    { text: 'Cross-Subdomain SSO', link: '/guide/sso-sessions' },
                    { text: 'make:subdomain Command', link: '/guide/make-subdomain-command' },
                    { text: 'Theming', link: '/guide/theming' },
                ],
            },
            {
                text: 'Portals (example apps)',
                items: [
                    { text: 'Landing', link: '/portals/landing' },
                    { text: 'Auth', link: '/portals/auth' },
                    { text: 'Account', link: '/portals/account' },
                    { text: 'App', link: '/portals/app' },
                    { text: 'Backoffice', link: '/portals/backoffice' },
                ],
            },
            {
                text: 'Reference',
                items: [
                    { text: 'Config', link: '/reference/config' },
                    { text: 'Env Vars', link: '/reference/env-vars' },
                    { text: 'Flux UI: Free vs Pro', link: '/reference/flux-ui' },
                ],
            },
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/lianmaymesi/laravel-multidomain-starter' },
        ],
    },
});
