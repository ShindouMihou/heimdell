export type Config = {
    databasePath: `${string}.sqlite`,
    storagePath: string,
    users: {
        [username: string]: string
    },
    tags: string[]
}
