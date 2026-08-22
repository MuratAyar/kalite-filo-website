# PHP endpoint boundary

Approved PHP 8.5 form endpoints remain outside the Next.js `public/` tree.
The implemented quote endpoint lives under `server/forms/`; this directory is
reserved for any separately approved future PHP boundaries.

PHP does not render the Next.js site. Reviewed release assembly may copy an
endpoint and its runtime dependencies into the target cPanel document root,
while secrets and private runtime configuration must remain outside every web
root. See `server/forms/README.md` for the authenticated SMTP quote boundary.
