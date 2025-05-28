import {validator} from "hono/validator";
import {ZodSchema} from "zod";
import {respondInvalidRequest} from "./response";
import {basicAuth} from "hono/dist/types/middleware/basic-auth";
import config from "../config";

export function validate(schema: ZodSchema) {
    return validator('json', function (value, c) {
        const result = schema.safeParse(value);
        if (!result.success) {
            return respondInvalidRequest(c);
        }
        return result.data;
    })
}

export const useBasicAuth = basicAuth({
    verifyUser: (username, password, context) => {
        const pwd = config.users[username];
        if (!pwd) return false;
        const isValid = pwd === password;
        if (isValid) {
            context.set("user", username);
            return true;
        }
        return isValid;
    }
})
