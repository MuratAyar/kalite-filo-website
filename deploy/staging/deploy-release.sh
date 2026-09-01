#!/usr/bin/env bash
set -Eeuo pipefail

die() { printf 'DEPLOYMENT_FAILED: %s\n' "$1" >&2; exit 1; }
require_command() { command -v "$1" >/dev/null 2>&1 || die "required command is unavailable: $1"; }

action="${1:-}"
account_root="$(cd -- "${HOME:?HOME is unavailable}" && pwd -P)"
document_root="${account_root}/staging.kalitefilo.com.tr"
work_root="${account_root}/private/kalite-filo-deploy/staging"
uploads_root="${work_root}/uploads"
rollbacks_root="${work_root}/rollbacks"
results_root="${work_root}/results"

case "$action" in
  deploy)
    artifact="${2:-}"; expected_hash="${3:-}"; request_id="${4:-}"; snapshot_hash="${5:-}"; manifest_hash="${6:-}"
    [[ "$expected_hash" =~ ^[a-f0-9]{64}$ ]] || die "invalid artifact hash"
    [[ "$snapshot_hash" =~ ^[a-f0-9]{64}$ ]] || die "invalid snapshot hash"
    [[ "$manifest_hash" =~ ^[a-f0-9]{64}$ ]] || die "invalid manifest hash"
    [[ "$request_id" =~ ^publish-[0-9]{8}-[0-9]{6}-[a-f0-9]{12}$ ]] || die "invalid request ID"
    for utility in sha256sum unzip realpath php find mv awk date mkdir chmod; do require_command "$utility"; done
    mkdir -p -m 0700 "$uploads_root" "$rollbacks_root" "$results_root"
    artifact="$(realpath -- "$artifact")"
    [[ "$artifact" == "$uploads_root/"*.zip ]] || die "artifact must be a ZIP below the private uploads directory"
    [[ -f "$artifact" && ! -L "$artifact" ]] || die "artifact is missing or is a symbolic link"
    [[ "$(sha256sum "$artifact" | awk '{print $1}')" == "$expected_hash" ]] || die "artifact SHA-256 mismatch"
    [[ -d "$document_root" && ! -L "$document_root" ]] || die "canonical staging document root is missing or linked"
    [[ "$(realpath -- "$document_root")" == "$document_root" ]] || die "canonical staging document root mismatch"

    release_id="${request_id}-${expected_hash:0:12}"
    incoming="${work_root}/incoming-${release_id}"
    rollback="${rollbacks_root}/${release_id}"
    failed_release="${work_root}/failed-${release_id}-$(date -u +%Y%m%dT%H%M%SZ)"
    result_file="${results_root}/${release_id}.json"
    [[ ! -e "$incoming" && ! -e "$rollback" && ! -e "$result_file" ]] || die "release ID already exists"

    moved_old=0; moved_new=0
    restore_on_error() {
      status=$?
      [[ "$status" -ne 0 ]] || status=1
      trap - EXIT INT TERM
      if [[ "$moved_new" == 1 && -d "$document_root" ]]; then
        mv -- "$document_root" "$failed_release" || true
      elif [[ -d "$incoming" ]]; then
        mv -- "$incoming" "$failed_release" || true
      fi
      if [[ "$moved_old" == 1 && -d "$rollback" && ! -e "$document_root" ]]; then mv -- "$rollback" "$document_root" || true; fi
      exit "$status"
    }
    trap restore_on_error EXIT INT TERM

    while IFS= read -r entry; do
      normalized="${entry#./}"
      [[ "$normalized" != /* && "$normalized" != *\\* ]] || die "archive contains an unsafe path"
      [[ ! "$normalized" =~ (^|/)\.\.(/|$) ]] || die "archive contains path traversal"
    done < <(unzip -Z1 "$artifact")

    mkdir -m 0755 "$incoming"
    unzip -q "$artifact" -d "$incoming"
    [[ -z "$(find "$incoming" -type l -print -quit)" ]] || die "release contains a symbolic link"
    [[ -f "$incoming/index.html" && -f "$incoming/admin/index.html" && -f "$incoming/admin-api/session.php" ]] || die "release is incomplete"
    marker="$incoming/kalite-filo-release.json"
    [[ -f "$marker" ]] || die "release marker is missing"
    php -r '$m=json_decode(file_get_contents($argv[1]),true,512,JSON_THROW_ON_ERROR); if(($m["schemaVersion"]??null)!==1||($m["target"]??null)!=="staging"||($m["requestId"]??null)!==$argv[2]||($m["snapshotHash"]??null)!==$argv[3]||($m["manifestHash"]??null)!==$argv[4]) exit(1);' "$marker" "$request_id" "$snapshot_hash" "$manifest_hash" || die "release marker identity mismatch"

    mv -- "$document_root" "$rollback"; moved_old=1
    mv -- "$incoming" "$document_root"; moved_new=1
    chmod 0755 "$document_root"
    printf '{"schemaVersion":1,"target":"staging","requestId":"%s","snapshotHash":"%s","manifestHash":"%s","artifactHash":"%s","rollbackId":"%s","deployedAt":"%s"}\n' "$request_id" "$snapshot_hash" "$manifest_hash" "$expected_hash" "$release_id" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$result_file"
    chmod 0600 "$result_file"
    trap - EXIT INT TERM
    printf 'DEPLOYMENT_SUCCEEDED\nROLLBACK_ID=%s\nRESULT=%s\n' "$release_id" "$result_file"
    ;;
  rollback)
    release_id="${2:-}"
    [[ "$release_id" =~ ^publish-[0-9]{8}-[0-9]{6}-[a-f0-9]{12}-[a-f0-9]{12}$ ]] || die "invalid rollback ID"
    rollback="${rollbacks_root}/${release_id}"
    failed_release="${work_root}/rolled-back-${release_id}"
    [[ -d "$document_root" && ! -L "$document_root" && -d "$rollback" && ! -L "$rollback" && ! -e "$failed_release" ]] || die "rollback state is unavailable"
    moved_current=0
    restore_current() { status=$?; trap - ERR INT TERM; if [[ "$moved_current" == 1 && ! -e "$document_root" && -d "$failed_release" ]]; then mv -- "$failed_release" "$document_root" || true; fi; exit "$status"; }
    trap restore_current ERR INT TERM
    mv -- "$document_root" "$failed_release"; moved_current=1
    mv -- "$rollback" "$document_root"
    chmod 0755 "$document_root"
    trap - ERR INT TERM
    printf 'ROLLBACK_SUCCEEDED\nRESTORED=%s\nPRESERVED_FAILED_RELEASE=%s\n' "$release_id" "$failed_release"
    ;;
  reapply)
    release_id="${2:-}"
    [[ "$release_id" =~ ^publish-[0-9]{8}-[0-9]{6}-[a-f0-9]{12}-[a-f0-9]{12}$ ]] || die "invalid rollback ID"
    for utility in php mv chmod; do require_command "$utility"; done
    rollback="${rollbacks_root}/${release_id}"
    preserved_release="${work_root}/rolled-back-${release_id}"
    result_file="${results_root}/${release_id}.json"
    [[ -d "$document_root" && ! -L "$document_root" && -d "$preserved_release" && ! -L "$preserved_release" && ! -e "$rollback" && -f "$result_file" ]] || die "reapply state is unavailable"
    php -r '$m=json_decode(file_get_contents($argv[1]),true,512,JSON_THROW_ON_ERROR);$r=json_decode(file_get_contents($argv[2]),true,512,JSON_THROW_ON_ERROR);if(($m["target"]??null)!=="staging"||($m["requestId"]??null)!==($r["requestId"]??null)||($m["snapshotHash"]??null)!==($r["snapshotHash"]??null)||($m["manifestHash"]??null)!==($r["manifestHash"]??null))exit(1);' "$preserved_release/kalite-filo-release.json" "$result_file" || die "preserved release identity mismatch"
    moved_old=0; moved_new=0
    restore_old() { status=$?; trap - ERR INT TERM; if [[ "$moved_new" == 1 && -d "$document_root" ]]; then mv -- "$document_root" "$preserved_release" || true; fi; if [[ "$moved_old" == 1 && ! -e "$document_root" && -d "$rollback" ]]; then mv -- "$rollback" "$document_root" || true; fi; exit "$status"; }
    trap restore_old ERR INT TERM
    mv -- "$document_root" "$rollback"; moved_old=1
    mv -- "$preserved_release" "$document_root"; moved_new=1
    chmod 0755 "$document_root"
    trap - ERR INT TERM
    printf 'REAPPLY_SUCCEEDED\nROLLBACK_ID=%s\n' "$release_id"
    ;;
  *) die "usage: deploy-release.sh deploy <private-zip> <artifact-sha256> <request-id> <snapshot-sha256> <manifest-sha256> | rollback <rollback-id> | reapply <rollback-id>" ;;
esac
