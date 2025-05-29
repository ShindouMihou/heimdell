import {db} from "../db";

db.exec(`
CREATE TABLE IF NOT EXISTS bundles (
    id TEXT PRIMARY KEY NOT NULL,
    version TEXT NOT NULL,
    tag TEXT NOT NULL,
    note TEXT,
    author TEXT NOT NULL,
    is_disposed INTEGER NOT NULL DEFAULT 0 CHECK (is_disposed IN (0, 1)),
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bundles_version_tag_disposed_created
ON bundles (version, tag, is_disposed, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bundles_author_disposed_created
ON bundles (author, is_disposed, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bundles_disposed_created
ON bundles (is_disposed, created_at DESC);
`);

console.debug("🏪 SQLITE: `bundles` table has been created.")
