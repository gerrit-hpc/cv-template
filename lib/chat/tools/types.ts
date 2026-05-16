import type { Static, TSchema } from "typebox";

export interface ToolExecutionContext {
  toolCallId: string;
}

export interface KbTool<TParams extends TSchema = TSchema> {
  name: string;
  description: string;
  parameters: TParams;
  execute: (args: Static<TParams>, ctx?: ToolExecutionContext) => Promise<unknown>;
}
