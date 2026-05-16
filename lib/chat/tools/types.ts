import type { Static, TSchema } from "typebox";

export interface KbTool<TParams extends TSchema = TSchema> {
  name: string;
  description: string;
  parameters: TParams;
  execute: (args: Static<TParams>) => Promise<unknown>;
}
