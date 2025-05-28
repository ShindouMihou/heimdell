import {Config} from "./type";

const config = {
    databasePath: ".db/heimdell.sqlite",

    // Storage Path defines where the files, such as bundles, will be stored.
    // Do not store any sensitive data here, as this will be available for all
    // requests to retrieve.
    storagePath: ".data/",

    // Each user will be able to communicate with Heimdell through the
    // CLI to deploy and send updates to the server.
    // Define your users here in the format: username: password
    users: {},

    // Tags define the different applications that Heimdell will serve,
    // as Heimdell is designed to be a multi-application host, you can tag
    // your applications here and be able to create a bundle release for
    // it based on the tag.
    // Example: heimdell-client, heimdell-admin
    tags: [""]
} as Config;
export default config;
