# Staging deployment without external SSH

TURKTİCARET has confirmed that the Web Eko shared-hosting package does not
provide external SSH. cPanel's browser Terminal remains available. The initial
Phase 7 deployment transport is therefore a controlled manual handoff:

1. the trusted workstation materializes the frozen request, validates it,
   builds the static export and produces a hash-bound ZIP;
2. the operator uploads the ZIP and `deploy-release.sh` through cPanel File
   Manager to an account-private directory;
3. the operator runs one explicit cPanel Terminal command;
4. the workstation verifies the deployed release identity and HTTPS contracts;
5. the bounded result is submitted through the existing authenticated Admin
   Publishing Center.

No Node.js build runs on cPanel. No cPanel password, API token, SSH key or FTP
credential is stored in the repository or browser bundle.

## Why this transport

cPanel officially supports API-token-authenticated UAPI calls over HTTPS 2083
and Fileman uploads, but the available Fileman UAPI does not by itself provide
the complete atomic release/rollback transaction needed here. A cPanel API token
also carries broad account authority. FTPS can transfer files but does not
provide an atomic release switch. Both may be reconsidered after staging proof;
neither is required for this first safe workflow.

Official capability references used for this decision:

- cPanel API token authentication:
  <https://api.docs.cpanel.net/cpanel/tokens>
- UAPI Fileman upload operation:
  <https://api.docs.cpanel.net/specifications/cpanel.openapi/manage-files/fileman-upload_files>
- cPanel FTP account/client behavior:
  <https://docs.cpanel.net/cpanel/files/ftp-accounts/>

The browser Terminal is already verified on the account. The project-owned
executor performs an atomic same-filesystem directory swap and retains the old
document root outside the web root for explicit rollback.

## Local release inputs

Run `scripts/run-staging-publish.mjs --apply` as documented by the implementation
record. Its final outputs are:

- `kalite-filo-staging.zip`;
- `result-release-ready.json`.

The ZIP contains `kalite-filo-release.json`, a non-secret marker bound to the
publish request, frozen snapshot and review manifest. Its identity is verified
again after deployment.

## One-time cPanel preparation

In cPanel Terminal:

```bash
mkdir -p "$HOME/private/kalite-filo-deploy/staging/uploads"
chmod 700 "$HOME/private/kalite-filo-deploy/staging"
chmod 700 "$HOME/private/kalite-filo-deploy/staging/uploads"
command -v bash sha256sum unzip realpath php find mv awk date mkdir chmod
```

Every named command must print a path. Upload with cPanel File Manager:

- `deploy/staging/deploy-release.sh` to
  `/home/kal67efilocomtr/private/kalite-filo-deploy/staging/deploy-release.sh`;
- the generated ZIP to
  `/home/kal67efilocomtr/private/kalite-filo-deploy/staging/uploads/`.

Then run `chmod 700` on the uploaded script.

## Deploy

Read `requestId`, `snapshotHash`, `manifestHash` and `artifactHash` from the
generated `result-release-ready.json`. In cPanel Terminal execute:

```bash
bash "$HOME/private/kalite-filo-deploy/staging/deploy-release.sh" deploy \
  "$HOME/private/kalite-filo-deploy/staging/uploads/kalite-filo-staging.zip" \
  ARTIFACT_SHA256 REQUEST_ID SNAPSHOT_SHA256 MANIFEST_SHA256
```

The executor rejects a wrong hash, unsafe archive path, symlink, missing release
file, mismatched marker, non-canonical document root or reused release ID. It
moves the previous document root to:

```text
/home/kal67efilocomtr/private/kalite-filo-deploy/staging/rollbacks/<rollback-id>
```

and moves the complete new release into the canonical staging document root.
An interrupted swap restores the old directory automatically. Nothing is
deleted.

## HTTPS verification

Back on the workstation:

```powershell
node scripts/finalize-manual-staging-publish.mjs `
  --release-result C:\secure-runner\result-release-ready.json `
  --artifact C:\secure-runner\kalite-filo-staging.zip `
  --result C:\secure-runner\result-staging.json
```

This first checks the live release marker, then Home, `/admin/`, staging robots
and the unauthenticated/no-store session API. Success produces bounded evidence
accepted by the existing runner-result workflow.

## Rollback

If finalization fails, use the exact `ROLLBACK_ID` printed by the deploy command:

```bash
bash "$HOME/private/kalite-filo-deploy/staging/deploy-release.sh" rollback ROLLBACK_ID
```

The failed release is preserved in the private deploy directory for diagnosis.
Confirm the previous staging version is restored. For a planned rollback drill,
reapply the already verified new release without another upload:

```bash
bash "$HOME/private/kalite-filo-deploy/staging/deploy-release.sh" reapply ROLLBACK_ID
```

Run HTTPS finalization again after reapply. The previous version is retained as
the rollback target again. Do not delete the rollback or failed-release
directory until the incident or drill is reviewed.

Production publishing remains disabled. This script rejects every target except
the canonical staging document root.
