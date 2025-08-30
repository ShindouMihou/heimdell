export class Hashed {
    hash: string;

    constructor(hash: string) {
        if (!hash.startsWith("$argon2id")) {
            throw new Error("Unsupported hashing algorithm. Please use argon2id for your hashed passwords.")
        }
        this.hash = hash;
    }

    async verify(plain: string) {
        return Bun.password.verify(plain, this.hash);
    }
}
/**
 * Adds a special object property to a hashed password which helps Heimdell identify that the
 * password is hashed and handle it differently.
 *
 * We only support argon2id hashes. You can create one by using Bun.password.create.
 *
 * This is used for configuration purposes for backwards compatibility with unhashed
 * passwords.
 * @param hash
 */
export const hashed = (hash: string): Hashed => {
    return new Hashed(hash);
}