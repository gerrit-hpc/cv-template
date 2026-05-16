// Provide fallbacks so the module-level `env` export in lib/env.ts does not
// throw when that module is imported during tests.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgres://localhost:5432/kb_test";
}
if (!process.env.LLM_PROVIDER) {
  process.env.LLM_PROVIDER = "anthropic";
  process.env.ANTHROPIC_API_KEY = "sk-test-placeholder";
}

import "@testing-library/dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
