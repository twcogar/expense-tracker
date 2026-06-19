# Content Filtering Knowledge Hub — Apps Script Service

This folder is the shared production service layer for the Knowledge Hub. It replaces browser-local article storage with a governed Google Sheets repository, Apps Script role checks, lifecycle transitions, and an audit log.

## What this implementation provides

- Shared article catalog: SOPs, Troubleshooting Guides, Knowledge Articles, Governance Standards, Known Errors, and Service Requests.
- Lifecycle processing: Draft → In Review → Approved → Needs Review → Archived.
- Server-side editor and administrator roles.
- Audit entries for creation, metadata changes, lifecycle transitions, access changes, and banner changes.
- A non-destructive bootstrap that creates the `Articles`, `Settings`, and `Audit Log` sheets once and never clears the article catalog.
- An Apps Script HTML Service front end intended to be embedded in Google Sites.
- Exact-banner support through a Google Drive file ID. The app renders the source banner file itself and overlays only the six mapped action zones.

## Deploy

1. Create a standalone Apps Script project under the account that should own the shared data service.
2. Copy this folder into the project using clasp or the Apps Script editor.
3. Run `setupKnowledgeHub()` once from the editor and approve the requested permissions. This creates the shared data spreadsheet and seeds the initial controlled records.
4. Run `configureAccess({ adminEmails: 'admin@yourdomain', editorEmails: 'editor1@yourdomain,editor2@yourdomain', allowedDomain: 'yourdomain' })` from the editor. Keep the administrator and editor lists deliberately small.
5. Upload the approved banner artwork to Google Drive under the same owner account, then run `setApprovedBannerFileId('DRIVE_FILE_ID')`. The production app will render that file as its banner rather than reconstructing it.
6. Deploy as a Web App with the project owner as the executing account and access restricted to the district domain. Embed the deployed web-app URL in Google Sites.

## Governance notes

The default bootstrap administrator is the effective script owner. After configuring the final administrator list, remove any interim addresses that should not retain access. Editors can create and process records; administrators manage lifecycle defaults, domain restrictions, editor lists, administrator lists, and the banner file ID.

## Source structure

- `Code.gs` – web entry points and client-callable endpoints.
- `Repository.gs` – shared Sheets read/write layer.
- `ArticleService.gs` – article creation, metadata updates, lifecycle transitions, archive operations, and catalog IDs.
- `AuthService.gs` / `AdminService.gs` – role boundaries and access configuration.
- `AuditService.gs` – append-only audit records.
- `AssetService.gs` – approved banner Drive asset renderer.
- `Index.html` plus `P_*`, `S_*`, and `JS_*` files – modular HTML Service interface.

The web front end uses `google.script.run` for all shared writes. There is no browser-local article database in the Apps Script implementation.
