type StreamOptions = {
  url: string;
  body: Record<string, unknown>;
  signal?: AbortSignal | null;
  onChunk: (chunk: string) => void;
};

export async function streamChat({ url, body, signal, onChunk }: StreamOptions) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: signal ?? undefined,
  });

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const rawLine of lines) {
        let line = rawLine.trim();
        if (!line) continue;

        // Support SSE style: lines starting with "data: "
        if (line.startsWith("data: ")) {
          line = line.slice(6).trim();
        }

        if (!line || line === "[DONE]") continue;

        // Try to parse JSON payloads, but be tolerant to plain text as well.
        try {
          const data = JSON.parse(line);

          // Common payload shapes handled here. Try multiple possibilities.
          if (data == null) continue;
          // 1) explicit `chunk` field (custom streaming format)
          if (typeof data.chunk !== "undefined") {
            onChunk(String(data.chunk));
            continue;
          }
          // 2) OpenAI-like delta/choices
          if (
            data.choices &&
            Array.isArray(data.choices) &&
            data.choices[0] &&
            data.choices[0].delta &&
            typeof data.choices[0].delta.content === "string"
          ) {
            onChunk(String(data.choices[0].delta.content));
            continue;
          }
          // 3) message content field
          if (data.message && data.message.content) {
            const content =
              typeof data.message.content === "string"
                ? data.message.content
                : // sometimes message.content can be an object with `parts` or `text`
                  JSON.stringify(data.message.content);
            onChunk(content);
            continue;
          }
          // 4) top-level text/string response
          if (typeof data === "string") {
            onChunk(data);
            continue;
          }
          // 5) best-effort: find first string field in object
          const found = Object.values(data).find((v) => typeof v === "string");
          if (typeof found === "string") {
            onChunk(found);
            continue;
          }
        } catch (e) {
          // If not JSON, treat the line itself as a text chunk.
          try {
            onChunk(line);
          } catch (err) {
            console.warn("Malformed stream payload", e, line);
          }
        }
      }
    }
  } finally {
    try {
      reader.cancel();
    } catch {
      // ignore
    }
  }
}
