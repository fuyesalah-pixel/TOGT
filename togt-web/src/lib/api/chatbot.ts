import { apiPost, API_URL } from "./client";
export interface ChatbotResponse { reply: string; suggestions: string[]; packages?: Array<{ id: string; title: string; description: string; price?: number | null; currency?: string | null; duration?: string | null }>; links?: Array<{ label: string; url: string }> }
export function askChatbot(message: string, conversationId?: string) { return apiPost<ChatbotResponse>("/chatbot/ask", { message, conversationId }); }
export async function streamChatbot(message: string, conversationId: string, onChunk: (chunk: string, meta?: ChatbotResponse["packages"]) => void) {
  const response = await fetch(`${API_URL}/api/chatbot/stream`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", Accept: "text/event-stream" }, body: JSON.stringify({ message, conversationId }) });
  if (!response.ok || !response.body) throw new Error("Assistant unavailable");
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
  while (true) { const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const events = buffer.split("\n\n"); buffer = events.pop() ?? ""; for (const event of events) { const line = event.split("\n").find((item) => item.startsWith("data: ")); if (!line) continue; const data = line.slice(6); if (data === "[DONE]") return; try { const parsed = JSON.parse(data) as { chunk?: string; meta?: { packages?: ChatbotResponse["packages"] } }; onChunk(parsed.chunk ?? "", parsed.meta?.packages); } catch { /* ignore malformed SSE */ } } }
}
