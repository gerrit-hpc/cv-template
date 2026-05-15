// Provide a fallback DATABASE_URL so the module-level `env` export in
// lib/env.ts does not throw when that module is imported during tests.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgres://localhost:5432/kb_test";
}

import "@testing-library/dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
