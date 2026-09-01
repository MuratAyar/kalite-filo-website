# Staging artifact deployment

`scripts/deploy-staging-artifact.mjs` is the staging-only transport boundary for
an artifact produced by `scripts/run-staging-publish.mjs --apply`. It refuses an
artifact unless the supplied runner result is `release_ready`, all four local
stages passed and the artifact SHA-256 still matches.

The transport uses the workstation's OpenSSH client and SSH agent/key. Passwords,
private keys and cPanel credentials must not be placed in this repository, the
admin browser or command arguments. The target account must already trust the
server host key. Non-interactive `BatchMode` is mandatory.

## Required external environment

Set these in the operator's PowerShell session:

```powershell
$env:KALITE_FILO_STAGING_SSH_TARGET = 'CPANEL_USER@CPANEL_SSH_HOST'
$env:KALITE_FILO_STAGING_DOCUMENT_ROOT = '/home/CPANEL_USER/staging.kalitefilo.com.tr'
$env:KALITE_FILO_STAGING_REMOTE_WORK_ROOT = '/home/CPANEL_USER/private/kalite-filo-deploy/staging'
```

Optional variables are `KALITE_FILO_STAGING_SSH_PORT` and
`KALITE_FILO_STAGING_SSH_KEY`. The key value is a local path and remains outside
the repository. `KALITE_FILO_STAGING_ORIGIN` may be omitted; if supplied it must
equal `https://staging.kalitefilo.com.tr`.

The remote account must provide `bash`, `sha256sum`, `unzip`, `rsync` and
`realpath`. The script validates their availability before changing the document
root. It also rejects a symlinked or non-canonical document root.

## Run

```powershell
node scripts/deploy-staging-artifact.mjs `
  --release-result C:\secure-runner\result-release-ready.json `
  --artifact C:\secure-runner\kalite-filo-staging.zip `
  --result C:\secure-runner\result-staging.json
```

The remote private work root retains
`rollback-<publish-request-id>-<artifact-hash-prefix>/`. A failed transfer is
restored automatically. A failed HTTPS smoke check also requests restoration.
The retained rollback directory is not public and is not deleted automatically.

Success writes bounded `succeeded` evidence for the existing authenticated
runner-result endpoint. Deployment is not considered successful merely because
upload completed: public Home, `/admin/`, staging robots policy and the
unauthenticated/no-store staging session contract must all pass.

Do not point this script at production. Production publishing remains disabled.
