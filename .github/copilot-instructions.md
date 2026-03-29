# Copilot Instructions — GS1 Digital Link Resolver CE v3

## Build, Test, and Run

```bash
# Build and start all services (MongoDB, data entry, web resolver, NGINX proxy)
docker compose up -d --build

# Stop all services
docker compose down

# Run the full test suite (requires running containers)
cd tests && python -m unittest setup_test.py

# Run a single test method
cd tests && python -m unittest setup_test.APITestCase.test_data_entry_CRUD_cycle -v
cd tests && python -m unittest setup_test.APITestCase.test_put_update_document -v
```

The API is available at `http://localhost:8080`. Swagger docs live at `http://localhost:8080/api/docs`.  
Tests use `Authorization: Bearer <SESSION_TOKEN>` (the token value from `.env`; defaults to `secret` in `.env.example`).

## Architecture

Four Docker containers on an internal network (`resolver-internal-network`):

| Service | Port | Role |
|---|---|---|
| `data-entry-service` | 3000 | Flask API for CRUD operations on resolver documents |
| `web-service` | 4000 | Flask app that resolves GS1 Digital Links → HTTP redirects |
| `frontend-proxy-service` | 8080 (exposed) | NGINX proxy: `/api/*` → data-entry, everything else → web |
| `database-service` | 27017 | MongoDB 7.0 (`resolver_ce` database, `gs1resolver` collection) |

The data entry server is the only writer; the web server is read-only. Both connect to MongoDB via the `MONGO_URI` environment variable.

## Data Model

### API format (v3) vs. MongoDB storage

The API accepts a compact "v3" JSON shape (`anchor`, `itemDescription`, `defaultLinktype`, `links[]`). Before storage, `_author_db_linkset_document()` converts it to an IETF-style linkset keyed by full GS1 vocabulary URIs (e.g. `https://gs1.org/voc/pip`). On read, `_convert_mongo_linkset_to_v3()` reverses the conversion.

### Document ID convention

| Context | Format | Example |
|---|---|---|
| API / URLs | `/01/09506000134369` | slash-separated GS1 Digital Link path |
| MongoDB `_id` | `01_09506000134369` | underscores (slashes disallowed in some DBs) |

Conversion helpers: `_reformat_id_for_db()` and `_reformat_id_for_external_use()` in `data_entry_db.py`; `convert_path_to_document_id()` in `data_entry_logic.py`.

### Link uniqueness key

A link is uniquely identified by the tuple **(linktype, hreflang, context)**. `href` is _not_ part of the key. This governs PUT merge behaviour (update vs. append) and DELETE-with-body matching. The helper `_find_matching_link()` in `data_entry_logic.py` implements this.

### Qualifiers

Optional path segments like `/10/LOT001/21/SER123` are stored as a list of dicts: `[{"10": "LOT001"}, {"21": "SER123"}]`. A document can contain multiple data entries with different qualifier sets. Template variables (`{0}`, `{1}`, `{lotnumber}`) allow partial matching at resolution time for serialised identifiers (AI codes 00, 8003, 8004).

### V2 format

Legacy v2 payloads (detected by the presence of `identificationKeyType`) are auto-converted to v3 via `_convert_v2_to_v3()`. No new code should use v2.

## Key Conventions

### API endpoints

- **POST `/api/new`** — Create or upsert. Accepts a single dict or a list. Uses `_process_document_upsert()` (not delete+create).
- **PUT `/api/<ai_code>/<ai_value>`** — Merge-update. Returns 404 if the document doesn't exist. Preserves fields not in the payload; merges links by uniqueness key.
- **DELETE `/api/<ai_code>/<ai_value>`** — Without a body: deletes the entire document. With a JSON body containing `links[]`: removes only the matching links (by uniqueness key).
- **GET `/api/<ai_code>/<ai_value>`** — Read document, returned as v3 format inside `{"data": [...], "response_status": 200}`.

### Authentication

Data entry endpoints require `Authorization: Bearer <SESSION_TOKEN>`. The token is set via the `SESSION_TOKEN` env var (configured in `.env`; see `.env.example`). The web resolver is public.

### Response format

All `data_entry_db` functions return `{"response_status": <int>, "data"|"error": ...}`. The namespace layer returns this dict as the response body with the matching HTTP status code.

### Error codes from the DB layer

- `200` — success
- `201` — created
- `404` — not found
- `409` — duplicate key
- `500` — internal error

### GS1 Digital Link Toolkit

A bundled Node.js library at `data_entry_server/src/gs1-digitallink-toolkit/` validates GS1 Digital Link syntax. Called via `subprocess` in `_call_gs1_toolkit()`. Requires Node.js in the container at `/usr/bin/node`.

## Modifying Code

- **Only the `data_entry_server/` directory** handles writes. The `web_server/` is read-only resolution logic — changes to the data model or API contract belong in data entry.
- After changing server code, rebuild with `docker compose up -d --build` and re-run the relevant test.
- The test suite in `tests/setup_test.py` doubles as user-facing documentation; keep comments explanatory for onboarding new users.
- The test file loads all `tests/test_*.json` fixtures automatically in `setUp()`.
