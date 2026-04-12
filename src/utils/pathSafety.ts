import * as path from "node:path";

export const SAFE_PATH_SEGMENT = /^[a-zA-Z0-9._-]+$/;

export function isUnsafeSegment(segment: string): boolean {
    if (!SAFE_PATH_SEGMENT.test(segment)) return true;
    if (segment === "." || segment === "..") return true;
    return false;
}

export function safeBundlePath(storagePath: string, ...segments: string[]): string {
    for (const segment of segments) {
        if (isUnsafeSegment(segment)) {
            throw new Error(`Invalid path segment: "${segment}" contains disallowed characters`);
        }
    }

    const resolved = path.resolve(storagePath, "bundles", ...segments);
    const storageRoot = path.resolve(storagePath, "bundles");

    if (!resolved.startsWith(storageRoot + path.sep) && resolved !== storageRoot) {
        throw new Error("Path traversal detected");
    }

    return resolved;
}
