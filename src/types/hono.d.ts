import {Bundle} from "../models/bundle";

export type AppContextEnv = {
    Variables: {
        user: string; // Set by useBasicAuth
        bundle?: Bundle; // Optionally set by a middleware
    };
}
