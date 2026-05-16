import { describe, it, expect } from "vitest";
import { parseSSE } from "@/lib/chat/parse-sse";

function makeStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<unknown[]> {
  const results: unknown[] = [];
  for await (const item of parseSSE(stream)) {
    results.push(item);
  }
  return results;
}

describe("parseSSE", () => {
  it("parses a single frame", async () => {
    const stream = makeStream(['data: {"type":"text_delta","text":"hello"}\n\n']);
    expect(await collect(stream)).toEqual([{ type: "text_delta", text: "hello" }]);
  });

  it("parses multiple frames in one chunk", async () => {
    const stream = makeStream([
      'data: {"type":"text_delta","text":"a"}\n\ndata: {"type":"text_delta","text":"b"}\n\n',
    ]);
    expect(await collect(stream)).toEqual([
      { type: "text_delta", text: "a" },
      { type: "text_delta", text: "b" },
    ]);
  });

  it("parses a frame split across chunks", async () => {
    const stream = makeStream([
      'data: {"type":"text_delt',
      'a","text":"split"}\n\n',
    ]);
    expect(await collect(stream)).toEqual([{ type: "text_delta", text: "split" }]);
  });

  it("skips malformed data lines and continues", async () => {
    const stream = makeStream([
      'data: not-json\n\ndata: {"type":"done","finishReason":"end_turn"}\n\n',
    ]);
    expect(await collect(stream)).toEqual([{ type: "done", finishReason: "end_turn" }]);
  });

  it("returns nothing when stream is empty", async () => {
    const stream = makeStream([]);
    expect(await collect(stream)).toEqual([]);
  });

  it("returns when stream closes after partial buffer with no trailing newlines", async () => {
    const stream = makeStream(['data: {"type":"text_delta","text":"x"}\n\n']);
    expect(await collect(stream)).toEqual([{ type: "text_delta", text: "x" }]);
  });
});
