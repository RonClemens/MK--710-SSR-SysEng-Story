# /mock-data

Synthetic mirror-baseline data for public-side testing, per [Architecture Guidance](/vendor/architecture-guidance-v1.4.0.md)
§2/§4. Everything here is illustrative/demo data (the MHC/MCC/IPS "Test Set" example) — **not real program data** —
and is safe to keep in the public repo.

## Contents

- `seed.json` — consumed by the server-backed mode. `server/src/db.ts` seeds `server/data/db.json` (the mutable
  runtime store, gitignored, never committed) from this file on first boot if `db.json` doesn't yet exist.
- `seed.ts` — the equivalent for the static (GitHub Pages) build, which has no server to read a file from at
  request time; it's imported directly into the client bundle and used to seed `localStorage` on first load.

Both files describe the same illustrative dataset; they're kept as two files (JSON for the server, a typed `.ts`
module for the client bundle) rather than one, since the static build has no runtime file-read capability — see
`/methodology/README.md` and the root `config.json` for how a CUI deployment points at real program data instead
of this directory. **Real program data must never be added to this directory** — it stays in this repo specifically
because it's safe to publish.
