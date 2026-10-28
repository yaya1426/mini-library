import { type Env, parseEnv } from "@/schemas/env.schema";

export const env: Env = parseEnv(process.env);

export { type Env, parseEnv };
