import {validator} from "hono/validator";
import {ZodSchema} from "zod";
import {respondInvalidRequest} from "./response";
import {basicAuth} from "hono/basic-auth";
import config from "../config";
import {Hashed} from "../config/ext/hashed";

export function validate(schema: ZodSchema) {
    return validator('json', function (value, c) {
        const result = schema.safeParse(value);
        if (!result.success) {
            return respondInvalidRequest(c);
        }
        return result.data;
    })
}

type UserMap = { [username: string]: string | Hashed };

export function createBasicAuth(users: UserMap) {
    return basicAuth({
        verifyUser: async (username, password, context) => {
            const pwd = users[username];
            if (!pwd) return false;
            const isValid = typeof pwd === "string" ? pwd === password : await pwd.verify(password);
            if (isValid) {
                context.set("user", username);
                return true;
            }
            return isValid;
        }
    });
}

export const useBasicAuth = createBasicAuth(config.users);
