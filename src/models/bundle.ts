import { db } from "../db/db"; // Assuming 'db' is your Bun SQLite instance
import { randomString } from "../utils/rand";
import {z} from "zod";

// Interface for raw data, typically from the database
interface BundleData {
    id: string;
    version: string;
    tag: string;
    note: string;
    author: string;
    is_disposed: boolean;
    is_force_upgrade: boolean;
    created_at: string | Date; // DB might return string, internally use Date
}

// Interface for parameters when creating a new Bundle instance
export interface CreateBundleParams {
    version: string;
    tag: string;
    note: string;
    author: string;
    is_force_upgrade?: boolean;
}

import {isUnsafeSegment} from "../utils/pathSafety";

const safePathString = (minLen: number, maxLen: number, fieldName: string) =>
    z.string()
        .min(minLen, `${fieldName} is required`)
        .max(maxLen, `${fieldName} must be at most ${maxLen} characters long`)
        .refine(val => !isUnsafeSegment(val), { message: "Must contain only alphanumeric characters, dots, hyphens, and underscores" });

export const CreateBundleParamsSchema = z.object({
    version: safePathString(1, 20, "Version"),
    tag: safePathString(1, 256, "Tag"),
    note: z.string().max(512, "Note must be at most 512 characters long").optional(),
    is_force_upgrade: z.boolean().optional().default(false),
})

export const SetForceUpgradeParamsSchema = z.object({
    enabled: z.boolean(),
})

export type SetForceUpgradeParams = z.infer<typeof SetForceUpgradeParamsSchema>;

// Interface for data allowed when updating a Bundle
interface UpdateBundleData {
    note?: string;
    // Add other updatable fields here if necessary (e.g., a new tag, but version changes usually mean a new bundle)
}

export class Bundle {
    public readonly id: string;
    public readonly version: string;
    public readonly tag: string;
    public note: string;
    public readonly author: string;
    public is_disposed: boolean;
    public is_force_upgrade: boolean;
    public readonly created_at: Date;

    private constructor(data: {
        id: string;
        version: string;
        tag: string;
        note: string;
        author: string;
        is_disposed?: boolean;
        is_force_upgrade?: boolean;
        created_at?: Date;
    }) {
        this.id = data.id;
        this.version = data.version;
        this.tag = data.tag;
        this.note = data.note;
        this.author = data.author;
        this.is_disposed = data.is_disposed ?? false;
        this.is_force_upgrade = data.is_force_upgrade ?? false;
        this.created_at = data.created_at ?? new Date();
    }

    /**
     * Creates a Bundle instance from raw data (e.g., from the database).
     * Ensures that the returned object's fields are in the correct types for application logic.
     */
    static from(data: BundleData): Bundle {
        return new Bundle({
            ...data,
            created_at: new Date(data.created_at), // Ensure created_at is a Date object
        });
    }

    /**
     * Generates a unique ID for a bundle.
     * Format: version-sanitized_tag-random_string
     */
    static generateId(version: string, tag: string): string {
        const sanitizedTag = tag.replace(/\s+/g, "_").toLowerCase();
        return `${version}-${sanitizedTag}-${randomString(8)}`;
    }

    /**
     * Creates a new Bundle instance. This method is preferred for creating new bundles
     * that are intended to be persisted.
     * The returned object is not yet saved to the database; call .save() on it.
     */
    static create(params: CreateBundleParams): Bundle {
        const id = Bundle.generateId(params.version, params.tag);
        return new Bundle({
            id,
            version: params.version,
            tag: params.tag,
            note: params.note,
            author: params.author,
            is_disposed: false,
            is_force_upgrade: params.is_force_upgrade ?? false,
            created_at: new Date(),
        });
    }

    // --- Static Query Methods ---
    // These methods query the database and return Bundle instances or arrays of Bundle instances, or null.
    // These return values are plain JavaScript objects/arrays suitable for JSON serialization in a REST API.

    /**
     * Retrieves a bundle by its ID. Returns a Bundle object or null.
     */
    static getById(id: string): Bundle | null {
        const stmt = db.query("SELECT * FROM bundles WHERE id = $id");
        const result = stmt.get({ id: id }) as BundleData | null;
        return result ? Bundle.from(result) : null;
    }

    /**
     * Retrieves the latest non-disposed bundle by version and tag. Returns a Bundle object or null.
     */
    static getByVersionTag(version: string, tag: string): Bundle | null {
        const stmt = db.query(`
            SELECT * FROM bundles
            WHERE version = $version AND tag = $tag AND is_disposed = 0
            ORDER BY created_at DESC
            LIMIT 1
        `);
        console.debug("Querying for bundle by version and tag:", { version, tag });
        const result = stmt.get({ version: version, tag: tag }) as BundleData | null;
        return result ? Bundle.from(result) : null;
    }

    /**
     * Retrieves all bundles, with optional filters. Returns an array of Bundle objects.
     */
    static getAll(options?: {
        limit?: number;
        offset?: number;
        includeDisposed?: boolean;
        author?: string;
        version?: string;
        tag?: string;
    }): Bundle[] {
        let query = "SELECT * FROM bundles";
        const conditions: string[] = [];
        const params: Record<string, any> = {};

        if (!options?.includeDisposed) {
            conditions.push("is_disposed = 0"); // Use 0 for false in query
        }
        if (options?.author) {
            conditions.push("author = $author");
            params.author = options.author;
        }
        if (options?.version) {
            conditions.push("version = $version");
            params.version = options.version;
        }
        if (options?.tag) {
            conditions.push("tag = $tag");
            params.tag = options.tag;
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY created_at DESC";

        if (options?.limit !== undefined) {
            query += " LIMIT $limit";
            params.limit = options.limit;
        }
        if (options?.offset !== undefined) {
            query += " OFFSET $offset";
            params.offset = options.offset;
        }

        console.debug(query, params)
        const stmt = db.query(query);
        const results = stmt.all(params) as BundleData[];
        return results.map(Bundle.from);
    }

    // --- Instance Methods ---
    // These methods operate on a specific Bundle instance.
    // They typically modify the database and/or the instance's state.

    /**
     * Saves (inserts) the current bundle instance into the database.
     * This method has side effects (DB write) and returns void.
     */
    save(): void {
        const stmt = db.query(`
            INSERT INTO bundles (id, version, tag, note, author, is_disposed, is_force_upgrade, created_at)
            VALUES ($id, $version, $tag, $note, $author, $is_disposed, $is_force_upgrade, $created_at)
        `);
        stmt.run({
            id: this.id,
            version: this.version,
            tag: this.tag,
            note: this.note,
            author: this.author,
            is_disposed: this.is_disposed ? 1 : 0, // SQLite expects 0 or 1 for boolean
            is_force_upgrade: this.is_force_upgrade ? 1 : 0,
            created_at: this.created_at.toISOString(),
        });
    }

    /**
     * Updates specified fields of the bundle in the database.
     * This method has side effects (DB write) and returns void.
     */
    update(data: UpdateBundleData): void {
        const fieldsToUpdate: string[] = [];
        const params: Record<string, any> = { $id: this.id };

        if (data.note !== undefined) {
            fieldsToUpdate.push("note = $note");
            params.note = data.note;
            this.note = data.note; // Update instance property
        }
        // Add other updatable fields here, e.g.:
        // if (data.tag !== undefined) {
        //     fieldsToUpdate.push("tag = $tag");
        //     params.$tag = data.tag;
        //     this.tag = data.tag; // If tag is not readonly
        // }

        if (fieldsToUpdate.length === 0) {
            // Consider throwing an error or returning a status if no actual update occurs
            console.warn("No fields provided to update for Bundle ID:", this.id);
            return;
        }

        const stmt = db.query(`
            UPDATE bundles
            SET ${fieldsToUpdate.join(", ")}
            WHERE id = $id
        `);
        stmt.run(params);
    }

    /**
     * Marks the bundle as disposed in the database.
     * This method has side effects (DB write) and returns void.
     */
    dispose(): void {
        if (this.is_disposed) {
            return;
        }
        const stmt = db.query("UPDATE bundles SET is_disposed = 1 WHERE id = $id");
        stmt.run({ id: this.id });
        this.is_disposed = true;
    }

    /**
     * Marks the bundle as not disposed (recovers it) in the database.
     * This method has side effects (DB write) and returns void.
     */
    recover(): void {
        if (!this.is_disposed) {
            return;
        }
        const stmt = db.query("UPDATE bundles SET is_disposed = 0 WHERE id = $id"); // Use 0 for false
        stmt.run({ id: this.id });
        this.is_disposed = false; // Update instance property
    }

    markForceUpgrade(): void {
        if (this.is_force_upgrade) {
            return;
        }
        const stmt = db.query("UPDATE bundles SET is_force_upgrade = 1 WHERE id = $id");
        stmt.run({ id: this.id });
        this.is_force_upgrade = true;
    }

    clearForceUpgrade(): void {
        if (!this.is_force_upgrade) {
            return;
        }
        const stmt = db.query("UPDATE bundles SET is_force_upgrade = 0 WHERE id = $id");
        stmt.run({ id: this.id });
        this.is_force_upgrade = false;
    }

    /**
     * Returns true if there exists any non-disposed bundle for the given
     * (version, tag) that is flagged as force-upgrade within the window
     * (afterBundleId.created_at, upToCreatedAt]. Implements the "sticky"
     * semantic so clients below a mandate cannot escape it via a later
     * non-mandatory push.
     *
     * - If afterBundleId is omitted, the lower bound is open (all history).
     * - If afterBundleId is provided but the bundle cannot be resolved, the
     *   function returns false rather than fabricating stickiness against
     *   an unknown reference point (could be a forged or stale ID from the
     *   client).
     * - If upToCreatedAt is provided, the upper bound is inclusive; this
     *   prevents counting bundles that are newer than what the client would
     *   actually receive (defensive against reserved-but-not-uploaded
     *   bundles or future churn).
     */
    static hasForceUpgradeAfter(
        version: string,
        tag: string,
        afterBundleId?: string,
        upToCreatedAt?: Date
    ): boolean {
        const params: Record<string, string> = { version, tag };
        const conditions: string[] = [
            "version = $version",
            "tag = $tag",
            "is_disposed = 0",
            "is_force_upgrade = 1",
        ];

        if (afterBundleId) {
            const reference = Bundle.getById(afterBundleId);
            if (!reference) {
                return false;
            }
            conditions.push("created_at > $after_created_at");
            params.after_created_at = reference.created_at.toISOString();
        }

        if (upToCreatedAt) {
            conditions.push("created_at <= $up_to_created_at");
            params.up_to_created_at = upToCreatedAt.toISOString();
        }

        const stmt = db.query(`
            SELECT 1 FROM bundles
            WHERE ${conditions.join(" AND ")}
            LIMIT 1
        `);
        return stmt.get(params) !== null;
    }
}
