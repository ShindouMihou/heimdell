import {Bundle} from "../models/bundle";
import {Hashed} from "./ext/hashed";

export type Config = {
    // This defines the environment name that will be used
    // for logging and other purposes.
    environmentName: string,

    // This defines where the SQLite database will be stored.
    // We do not auto-create the folder, so please create the folder first
    // before anything else.
    databasePath: `${string}.sqlite`,

    // Storage Path defines where the files, such as bundles, will be stored.
    // Do not store any sensitive data here, as this will be available for all
    // requests to retrieve.
    storagePath: string,

    // Each user will be able to communicate with Heimdell through the
    // CLI to deploy and send updates to the server.
    // Define your users here in the format: username: password
    users: {
        [username: string]: string | Hashed
    },

    // Tags define the different applications that Heimdell will serve,
    // as Heimdell is designed to be a multi-application host, you can tag
    // your applications here and be able to create a bundle release for
    // it based on the tag.
    // Example: heimdell-client, heimdell-admin
    tags: string[],

    // onBundlePush is a hook that will be called when a new bundle is pushed
    // to the server. You can use this to perform actions such as sending
    // notifications or triggering other processes.
    onBundlePush?: (bundle: Bundle, environment: string) => Promise<void>,

    // onBundleRollback is a hook that will be called when a bundle is rolled back
    // to the server. You can use this to perform actions such as sending
    // notifications or triggering other processes.
    onBundleRollback?: (bundle: Bundle, environment: string) => Promise<void>,

    // onBundleDispose is a hook that will be called when a bundle is disposed
    // to the server. You can use this to perform actions such as sending
    // notifications or triggering other processes.
    onBundleDispose?: (bundle: Bundle, environment: string) => Promise<void>,

    // onBundleReserve is a hook that will be called when a bundle is reserved
    // to the server. You can use this to perform actions such as sending
    // notifications or triggering other processes.
    onBundleReserve?: (bundle: Bundle, environment: string) => Promise<void>
}
