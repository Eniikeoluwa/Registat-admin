# Admin API integration

Verified against the live OpenAPI specification on 8 November 2026.
Source: https://registat-be.onrender.com/v1/registat/openapi.json

The original page shells, stylesheets, cards, tabs, buttons and schema forms are retained.
New controls use those styles. No live customer data was created or modified during verification.

Staff authentication uses `POST /v1/auth/admin-login`; refresh uses the refresh bearer token.
The session endpoint restores an identity-bound permission snapshot and forces a fresh login
when it is missing, invalid or belongs to a different role assignment. Backend checks remain authoritative.
Verification and reset use email-bound UUID challenges and emailed codes.

| Endpoint | Screen / action | Required permission or role |
| --- | --- | --- |
| `PATCH /v1/users/me` | Settings → personal information | Authenticated staff |
| `GET /v1/users/admin` | Customer or staff details → profile / overview / histories / notes | users:read |
| `GET /v1/users/admin/{id}` | Customer or staff details → profile / overview / histories / notes | users:read |
| `PATCH /v1/users/admin/{id}` | Customer or staff details → profile / overview / histories / notes | users:write |
| `PATCH /v1/users/admin/{id}/status` | Customer or staff details → profile / overview / histories / notes | users:status |
| `GET /v1/users/admin/customers` | Customers → list / create / summary / export | users:read |
| `POST /v1/users/admin/customers` | Customers → list / create / summary / export | users:write |
| `GET /v1/users/admin/customers/summary` | Customers → list / create / summary / export | users:read |
| `GET /v1/users/admin/customers/export` | Customers → list / create / summary / export | users:read |
| `GET /v1/users/admin/{id}/overview` | Customer or staff details → profile / overview / histories / notes | users:read |
| `GET /v1/users/admin/{id}/status-history` | Customer or staff details → profile / overview / histories / notes | users:read |
| `POST /v1/users/admin/{id}/welcome-email` | Customer or staff details → profile / overview / histories / notes | users:write |
| `POST /v1/users/admin/{id}/notes` | Customer or staff details → profile / overview / histories / notes | users:notes:write |
| `GET /v1/users/admin/{id}/notes` | Customer or staff details → profile / overview / histories / notes | users:notes:read |
| `GET /v1/users/admin/{id}/profile-history` | Customer or staff details → profile / overview / histories / notes | users:notes:read |
| `PATCH /v1/users/admin/{id}/role` | Customer or staff details → profile / overview / histories / notes | superAdmin |
| `GET /v1/users/admin/{id}/role-history` | Customer or staff details → profile / overview / histories / notes | superAdmin |
| `GET /v1/payments/admin` | Payments → list / details → verify / recover | payments:read |
| `GET /v1/payments/admin/{reference}` | Payments → list / details → verify / recover | payments:read |
| `POST /v1/payments/admin/{reference}/verify` | Payments → list / details → verify / recover | payments:reconcile |
| `POST /v1/payments/admin/{reference}/recover` | Payments → list / details → verify / recover | payments:reconcile |
| `POST /v1/notifications/admin` | Settings or customer details → send notification | notifications:send |
| `POST /v1/documents/admin/upload` | Documents; application / customer / company details | documents:write |
| `GET /v1/documents/admin` | Documents; application / customer / company details | documents:read |
| `GET /v1/documents/admin/{id}/access-url` | Documents; application / customer / company details | documents:read |
| `PATCH /v1/documents/admin/{id}/review` | Documents; application / customer / company details | documents:write |
| `GET /v1/dashboard/admin` | Dashboard | dashboard:read |
| `GET /v1/dashboard/admin/activity` | Dashboard → view all activity | dashboard:read |
| `GET /v1/compliance/admin/requirements` | Compliance → requirements → create / details / edit | compliance:read |
| `POST /v1/compliance/admin/requirements` | Compliance → requirements → create / details / edit | compliance:write |
| `GET /v1/compliance/admin/requirements/{id}` | Compliance → requirements → create / details / edit | compliance:read |
| `PATCH /v1/compliance/admin/requirements/{id}` | Compliance → requirements → create / details / edit | compliance:write |
| `POST /v1/compliance/admin` | Compliance → filings → details / history / notes / reopen / export | compliance:write |
| `GET /v1/compliance/admin` | Compliance → filings → details / history / notes / reopen / export | compliance:read |
| `GET /v1/compliance/admin/{id}` | Compliance → filings → details / history / notes / reopen / export | compliance:read |
| `PATCH /v1/compliance/admin/{id}` | Compliance → filings → details / history / notes / reopen / export | compliance:write |
| `POST /v1/compliance/admin/{id}/reopen` | Compliance → filings → details / history / notes / reopen / export | compliance:write |
| `GET /v1/compliance/admin/{id}/history` | Compliance → filings → details / history / notes / reopen / export | compliance:read |
| `GET /v1/compliance/admin/summary` | Compliance → filings → details / history / notes / reopen / export | compliance:read |
| `GET /v1/compliance/admin/export` | Compliance → filings → details / history / notes / reopen / export | compliance:read |
| `GET /v1/compliance/admin/{id}/notes` | Compliance → filings → details / history / notes / reopen / export | compliance:read |
| `POST /v1/compliance/admin/{id}/notes` | Compliance → filings → details / history / notes / reopen / export | compliance:write |
| `GET /v1/companies/admin` | Companies → create / details / edit / convert application | companies:read |
| `POST /v1/companies/admin` | Companies → create / details / edit / convert application | companies:write |
| `GET /v1/companies/admin/{id}` | Companies → create / details / edit / convert application | companies:read |
| `PATCH /v1/companies/admin/{id}` | Companies → create / details / edit / convert application | companies:write |
| `POST /v1/companies/admin/from-application/{id}` | Companies → create / details / edit / convert application | companies:write |
| `GET /v1/catalog/admin` | Services & pricing / jurisdictions → catalogue tabs | catalog:read |
| `GET /v1/catalog/admin/countries` | Services & pricing / jurisdictions → catalogue tabs | catalog:read |
| `POST /v1/catalog/admin/countries` | Services & pricing / jurisdictions → catalogue tabs | catalog:write |
| `GET /v1/catalog/admin/countries/{id}` | Services & pricing / jurisdictions → catalogue tabs | catalog:read |
| `PATCH /v1/catalog/admin/countries/{id}` | Services & pricing / jurisdictions → catalogue tabs | catalog:write |
| `GET /v1/catalog/admin/services` | Services & pricing / jurisdictions → catalogue tabs | catalog:read |
| `POST /v1/catalog/admin/services` | Services & pricing / jurisdictions → catalogue tabs | catalog:write |
| `GET /v1/catalog/admin/services/{id}` | Services & pricing / jurisdictions → catalogue tabs | catalog:read |
| `PATCH /v1/catalog/admin/services/{id}` | Services & pricing / jurisdictions → catalogue tabs | catalog:write |
| `GET /v1/catalog/admin/forms` | Services & pricing / jurisdictions → catalogue tabs | catalog:read |
| `POST /v1/catalog/admin/forms` | Services & pricing / jurisdictions → catalogue tabs | catalog:write |
| `GET /v1/catalog/admin/forms/{id}` | Services & pricing / jurisdictions → catalogue tabs | catalog:read |
| `PATCH /v1/catalog/admin/forms/{id}` | Services & pricing / jurisdictions → catalogue tabs | catalog:write |
| `PATCH /v1/catalog/admin/currency-settings` | Services & pricing / jurisdictions → catalogue tabs | catalog:write |
| `POST /v1/catalog/admin/nice-classes` | Services & pricing / jurisdictions → catalogue tabs | catalog:write |
| `PATCH /v1/catalog/admin/nice-classes/{id}` | Services & pricing / jurisdictions → catalogue tabs | catalog:write |
| `POST /v1/catalog/admin/add-ons` | Services & pricing / jurisdictions → catalogue tabs | catalog:write |
| `PATCH /v1/catalog/admin/add-ons/{id}` | Services & pricing / jurisdictions → catalogue tabs | catalog:write |
| `POST /v1/catalog/admin/fees` | Services & pricing / jurisdictions → catalogue tabs | catalog:write |
| `PATCH /v1/catalog/admin/fees/{id}` | Services & pricing / jurisdictions → catalogue tabs | catalog:write |
| `POST /v1/auth/create-sub-admin` | Settings → staff accounts → create sub-admin | staff:create |
| `GET /v1/applications/admin` | Applications → new / details / review / case management | applications:read |
| `POST /v1/applications/admin` | Applications → new / details / review / case management | applications:write |
| `GET /v1/applications/admin/{id}` | Applications → new / details / review / case management | applications:read |
| `PATCH /v1/applications/admin/{id}/status` | Applications → new / details / review / case management | applications:write |
| `PATCH /v1/applications/admin/{id}/case` | Applications → new / details / review / case management | applications:write |
| `POST /v1/applications/admin/{id}/notes` | Applications → new / details / review / case management | applications:write |
| `GET /v1/applications/admin/{id}/notes` | Applications → new / details / review / case management | applications:read |
| `POST /v1/applications/admin/{id}/requests` | Applications → new / details / review / case management | applications:write |
| `GET /v1/applications/admin/{id}/requests` | Applications → new / details / review / case management | applications:read |
| `PATCH /v1/applications/admin/{id}/requests/{requestId}` | Applications → new / details / review / case management | applications:write |
| `POST /v1/applications/admin/{id}/trademark-search-report` | Applications → new / details / review / case management | applications:write, documents:write |

## Verification

- Contract fixtures exercise every current admin operation through the local proxy, including JSON and multipart requests.
- Authentication tests cover staff login, challenge payloads, identity/permission binding, tampering and token rotation.
- Negative tests cover non-staff access, missing permissions, role restrictions, malformed IDs, upload metadata, conditional filing validation and backend failures.
- Browser checks use a temporary localhost fixture backend for login, dashboard, customers, cases, documents, compliance, staff and payments.
- Live signed-in verification needs an existing staff account. No credentials are stored in this repository.

The documentation currently labels exchange-rate writes with `catalog:write`, while the guide also grants finance staff `currency-rates:write`. The proxy accepts either permission for that single route and lets the backend make the final authorization decision.
