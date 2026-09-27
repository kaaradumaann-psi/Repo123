# Browser E2E Production Release Specification

**Infrastructure status:** procedure ready  
**Execution status:** `PRODUCTION_E2E_BLOCKED` — no reachable configured production/staging environment or disposable identities were available.

## Required environment

- HTTPS staging/production URL with the release artifact.
- Disposable active psychologist users A and B, inactive user, and admin.
- Empty disposable client/record fixture namespace.
- Chrome, Firefox and WebKit/Safari-equivalent desktop runs; iPhone and Android camera runs.
- Supabase project linked to the exact migrations under test.

Credentials must be injected by the E2E runner/secret store and must never be committed, printed, screenshotted or attached to result JSON.

## Primary browser flow

For each supported desktop browser:

1. Open the HTTPS URL and capture deployed build/version/hash.
2. Verify unauthenticated protected route redirects to login.
3. Log in as User A; verify dashboard and active role.
4. Create a disposable record.
5. Enter a deterministic 566-answer fixture through the supported entry path.
6. Save, reopen and verify answer integrity.
7. Generate profile and compare frozen expected scores, validity, profile code and scoring version.
8. Open report editor; verify the adapter snapshot and `source_data_version`.
9. Save draft, create version, complete report, and verify immutable prior version.
10. Print/download PDF; verify Turkish characters, page breaks, tables, graphs, validity/clinical/profile sections and psychologist section.
11. Log out; verify protected content is unavailable after session termination.

## Cross-user/IDOR flow

1. Record User A record/report/version IDs in runner memory only.
2. Log out and log in as User B.
3. Attempt navigation and direct REST access to User A record, report and report version.
4. Require UI denial/not-found and zero-row REST results.
5. Attempt update/delete by ID; require zero affected rows.
6. Verify User A data remains unchanged after re-login.

## Inactive and admin flow

- Inactive identity must not access records/reports or invoke Edge Functions.
- Admin access must match documented policies and must not silently change ownership.
- Public signup must be unavailable if production policy says disabled.

## Delete workflow

Use disposable fixtures only:

1. Delete a draft report; require report-version cascade and record retention.
2. Delete a disposable record through the supported UI/API; verify reports/versions cascade, audit behavior and no orphan rows.
3. Delete a disposable psychologist through `admin-users`; verify Auth/profile/owned record/report/version/settings effects and audit behavior.
4. Preserve HTTP status, PostgREST error code and sanitized operation ID on failure. Frontend must display the failure; it must not swallow REST 400/409/500.

## PDF evidence

Archive:

- Browser name/version, OS and viewport.
- PDF SHA-256, page count and generated timestamp.
- Screenshots of print preview and representative pages with no real client data.
- Automated text/geometry verifier output.

## Result artifact

Each scenario records:

```json
{
  "id": "userB-userA-record-deny",
  "environment": "staging",
  "browser": "chromium",
  "expected": "DENY_ZERO_ROWS",
  "actual": "NOT_RUN",
  "status": "BLOCKED",
  "evidence": []
}
```

Only an actually executed artifact may change `PRODUCTION_E2E_BLOCKED` to PASS. Local component rendering, Node tests and synthetic OMR do not satisfy this gate.
