# PHP endpoint boundary

This directory is reserved for separately approved PHP 8.5 form endpoints. It is intentionally empty during the foundation phase.

PHP files here are not part of the Next.js application and must never be copied into `public/`, because the Next.js development server would expose their source instead of executing it. A later deployment assembly step may copy reviewed handlers into the final hosting artifact while keeping secrets and server-only configuration outside the document root.

No form endpoint, recipient, mail transport, consent workflow, retention policy, spam control, or error contract is approved yet. Do not add a handler until those inputs and the staging test plan are approved.
