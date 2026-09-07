export function modelClient({ apiKey, model, fetchImpl = fetch, endpoint = "https://openrouter.ai/api/v1/chat/completions", onUsage = () => {}, signal }) {
  if (!apiKey || !model) throw new Error("OpenRouter key and explicit model ID are required");
  if (endpoint !== "https://openrouter.ai/api/v1/chat/completions") throw new Error("Only the OpenRouter endpoint is allowed; never forward a server key to a client-provided URL");
  return async ({ stage, system, instruction, payload, schema, maxTokens = 10000 }) => {
    const res = await fetchImpl(endpoint, {
      method: "POST", redirect: "manual", signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(240000)]) : AbortSignal.timeout(240000),
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}`, "x-title": "Dageno Topic Prompt V3" },
      body: JSON.stringify({ model, max_tokens: maxTokens, response_format: { type: "json_object" }, messages: [
        { role: "system", content: system },
        { role: "user", content: `${instruction}\n\nOUTPUT JSON SCHEMA:\n${JSON.stringify(schema)}\n\nUNTRUSTED RESEARCH DATA:\n${JSON.stringify(payload)}` }
      ] })
    });
    if (res.status >= 300 && res.status < 400) { await res.body?.cancel(); throw new Error("OpenRouter redirect refused; credentials are not forwarded"); }
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(`${stage}: OpenRouter request failed (HTTP ${res.status}). ${res.status === 402 ? "Insufficient credits." : "Check model permissions and provider availability."}`);
    const choice = data.choices?.[0];
    if (choice?.finish_reason === "length") throw new Error(`${stage}: model output truncated; narrow the transport batch, not the industry scope`);
    const content = choice?.message?.content;
    if (typeof content !== "string" || !content.trim()) throw new Error(`${stage}: no final model output`);
    onUsage({ stage, requestedModel: model, returnedModel: data.model, usage: data.usage || null });
    try { return JSON.parse(content.replace(/^```json\s*/i, "").replace(/\s*```$/, "")); } catch { throw new Error(`${stage}: invalid JSON, no fabricated repair fields`); }
  };
}
