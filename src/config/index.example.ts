import {Config} from "./type";
import {Bundle} from "../models/bundle";
import {hashed} from "./ext/hashed";

const config = {
    // This defines the environment name that will be used
    // for logging and other purposes.
    environmentName: process.env.HEIMDELL_ENVIRONMENT_NAME || "development",

    // This defines where the SQLite database will be stored.
    // We do not auto-create the folder, so please create the folder first
    // before anything else.
    databasePath: ".db/heimdell.sqlite",

    // Storage Path defines where the files, such as bundles, will be stored.
    // Do not store any sensitive data here, as this will be available for all
    // requests to retrieve.
    storagePath: ".data/",

    // Each user will be able to communicate with Heimdell through the
    // CLI to deploy and send updates to the server.
    //
    // Make sure to generate a hash of the password using the CLI (`heimdell hash <password>`).
    // Define your users here in the format: username: hashed("argon2id hash").
    //
    // We use Argon2id (default for Bun.password) for hashing passwords. It's also the most
    // secure option available in Bun and in the industry right now.
    //
    // You may also define passwords insecurely by using a string value, but we
    // do not recommend it for security purposes.
    users: {
        example: hashed("$argon2id$v=19$m=65536,t=3,p=4$Z3Vlc3Q$u1k7mXr0bYpIhX6n0qv1fQ")
    },

    // Tags define the different applications that Heimdell will serve,
    // as Heimdell is designed to be a multi-application host, you can tag
    // your applications here and be able to create a bundle release for
    // it based on the tag.
    // Example: heimdell-client, heimdell-admin
    tags: [""],

    // onBundlePush is a hook that will be called when a new bundle is pushed
    // to the server. You can use this to perform actions such as sending
    // notifications or triggering other processes.
    onBundlePush: async (bundle: Bundle, environment: string) => {},

    // onBundleRollback is a hook that will be called when a bundle is rolled back
    // to the server. You can use this to perform actions such as sending
    // notifications or triggering other processes.
    onBundleRollback: async (bundle: Bundle, environment: string) => {},

    // onBundleDispose is a hook that will be called when a bundle is disposed
    // to the server. You can use this to perform actions such as sending
    // notifications or triggering other processes.
    onBundleDispose: async (bundle: Bundle, environment: string) => {},

    // onBundleReserve is a hook that will be called when a bundle is reserved
    // to the server. You can use this to perform actions such as sending
    // notifications or triggering other processes.
    onBundleReserve: async (bundle: Bundle, environment: string) => {}
} as Config;
export default config;
