// POST /api/chat/[slug] streams SSE; we fetch+read manually since EventSource
// only supports GET, but the chat route is a POST.
export async function* parseSSE(stream: ReadableStream<Uint8Array>): AsyncGenerator<unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        for (const line of frame.split("\n")) {
          if (line.startsWith("data: ")) {
            try {
              yield JSON.parse(line.slice(6));
            } catch {
              console.warn("parseSSE: malformed data line", line);
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
