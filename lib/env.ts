import { z } from "zod";

const Schema = z
  .object({
    DATABASE_URL: z.string().url(),
    KB_SOURCE_REPO_PATH: z.string().optional(),
    ADMIN_PASSWORD_HASH: z.string().optional(),
    SESSION_SECRET: z.string().optional(),
    LLM_PROVIDER: z.enum(["anthropic", "pi"]),
    ANTHROPIC_API_KEY: z.string().optional(),
    ANTHROPIC_MODEL: z.string().optional(),
    PI_API_KEY: z.string().optional(),
    PI_MODEL: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.ADMIN_PASSWORD_HASH && (val.SESSION_SECRET?.length ?? 0) < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SESSION_SECRET"],
        message: "SESSION_SECRET must be ≥32 chars when ADMIN_PASSWORD_HASH is set",
      });
    }
    if (val.LLM_PROVIDER === "anthropic" && !val.ANTHROPIC_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ANTHROPIC_API_KEY"],
        message: "ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic",
      });
    }
    if (val.LLM_PROVIDER === "pi" && !val.PI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["PI_API_KEY"],
        message: "PI_API_KEY is required when LLM_PROVIDER=pi",
      });
    }
  });

export type Env = z.infer<typeof Schema>;

export function parseEnv(raw: Record<string, string | undefined>): Env {
  return Schema.parse(raw);
}

export const env: Env = parseEnv(process.env);
