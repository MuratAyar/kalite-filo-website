# Form components

The quote assembly uses native form controls and posts to the separately
deployed PHP 8.5 endpoint at `/forms/teklif.php`. The small Client Component
handles the corporate/individual presentation state, inline validation,
background submission, and accessible success confirmation. It never treats a
failed or unavailable endpoint as a successful submission.

The endpoint source lives outside `public/` under `server/forms/` so a generic
static preview server can never expose PHP source. No mail credential is stored
in the repository or static export.
