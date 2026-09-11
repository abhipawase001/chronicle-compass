type Part =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "file"; file: { filename: string; file_data: string } };

export type AiPart = Part;

export class AiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function friendly(status: number, message: string) {
  if (status === 402) return message || "AI credits are exhausted. Add credits to keep analysing.";
  if (status === 429) return "The AI service is busy right now. Try again in a moment.";
  if (status === 403) return message || "AI access is blocked for this workspace.";
  return message || "The AI service could not process this request.";
}

export async function aiJson<T>({
  system,
  parts,
  model = "google/gemini-3.8-flash",
}: {
  system: string;
  parts: Part[];
  model?: string;
}): Promise<T> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new AiError(401, "AI is not configured for this project.");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: parts },
      ],
    }),
  });

  if (!res.ok) {
    let message = "";
    try {
      const body = (await res.json()) as { error?: { message?: string }; message?: string };
      message = body.error?.message ?? body.message ?? "";
    } catch {
      message = await res.text().catch(() => "");
    }
    throw new AiError(res.status, friendly(res.status, message));
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content ?? "";
  const cleaned = raw
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const start = cleaned.search(/[[{]/);
  const slice = start >= 0 ? cleaned.slice(start) : cleaned;
  try {
    return JSON.parse(slice) as T;
  } catch {
    throw new AiError(502, "The AI response could not be read. Try again.");
  }
}

export function toBase64(bytes: ArrayBuffer) {
  const view = new Uint8Array(bytes);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < view.length; i += chunk) {
    binary += String.fromCharCode(...view.subarray(i, i + chunk));
  }
  return btoa(binary);
}
