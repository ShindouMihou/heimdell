import {validator} from "hono/validator";
import {ZodSchema} from "zod";
import {respondInvalidRequest} from "./response";
import {basicAuth} from "hono/basic-auth";
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
    verifyUser: async (username, password, context) => {
        const pwd = config.users[username];
        if (!pwd) return false;
        const isValid = typeof pwd === "string" ? pwd === password : await pwd.verify(password);
        if (isValid) {
            context.set("user", username);
            return true;
        }
        return isValid;
    }
})
