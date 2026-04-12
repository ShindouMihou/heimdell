import {db} from "../db";

db.exec(`
CREATE TABLE IF NOT EXISTS bundle_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bundle_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('update_check', 'download')),
    platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'unknown')),
    device_id TEXT,
    device_os TEXT,
    user_agent TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bundle_events_bundle_id_type
ON bundle_events (bundle_id, event_type);

CREATE INDEX IF NOT EXISTS idx_bundle_events_bundle_id_created
ON bundle_events (bundle_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bundle_events_created
ON bundle_events (created_at DESC);
`);

console.debug("🏪 SQLITE: `bundle_events` table has been created.");
