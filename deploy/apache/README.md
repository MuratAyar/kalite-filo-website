# Apache/cPanel deployment boundary

Production and staging are separate cPanel document roots. Each receives a prebuilt static artifact; neither host builds or runs Next.js.

No `.htaccess` is committed during the foundation phase. cPanel already forces HTTPS for both verified origins, and Apache behavior still needs staging verification before project-owned rules are introduced. A later deployment task must explicitly review nested-route loading, `404.html` handling with a real 404 status, caching, compression, security headers, canonical-host behavior, and rollback.

Do not overwrite hosting-managed HTTPS rules without a reviewed merge plan.
