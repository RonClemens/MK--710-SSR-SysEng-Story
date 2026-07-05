import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";

const STORAGE_KEY = "pdr-workbench.ai-enabled";

interface ChatEntry {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  serverAiEnabled: boolean;
}

export function AiAssistantPanel({ serverAiEnabled }: Props) {
  const [open, setOpen] = useState(false);
  const [userEnabled, setUserEnabled] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  });
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = serverAiEnabled && userEnabled;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(userEnabled));
  }, [userEnabled]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;
    const nextMessages: ChatEntry[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setError(null);
    try {
      const { reply } = await api.chat(nextMessages);
      setMessages([...nextMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chat request failed");
    } finally {
      setSending(false);
    }
  }

  async function generateSummary() {
    setSummaryLoading(true);
    setError(null);
    try {
      const { summary } = await api.summary();
      setSummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Summary request failed");
    } finally {
      setSummaryLoading(false);
    }
  }

  function copySummary() {
    if (summary) navigator.clipboard.writeText(summary);
  }

  return (
    <div className={`ai-panel ${open ? "open" : "closed"}`}>
      <button className="ai-panel-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? "Close AI Assistant ▸" : "◂ AI Assistant"}
      </button>
      {open && (
        <div className="ai-panel-body">
          <div className="ai-banner">
            <strong>Data leaves this environment when the AI Assistant is used.</strong>
            <p>
              Data entered here is sent to the Claude API ({serverAiEnabled ? "configured provider" : "not configured"}) as
              context for this feature. Do not enter CUI or program-sensitive data until this has been cleared by
              your program's security/ISSM office.
            </p>
          </div>

          <label className="ai-toggle">
            <input
              type="checkbox"
              checked={userEnabled}
              onChange={(e) => setUserEnabled(e.target.checked)}
            />
            <span>Enable AI Assistant (uncheck to make zero external API calls)</span>
          </label>

          {!serverAiEnabled && (
            <p className="hint">
              The AI Assistant is disabled at the server level (AI_ASSISTANT_ENABLED=false). No API calls can be
              made until it is re-enabled in the server's .env configuration.
            </p>
          )}

          {active && (
            <>
              <div className="ai-summary-block">
                <button className="button-secondary" onClick={generateSummary} disabled={summaryLoading}>
                  {summaryLoading ? "Generating…" : "Generate PDR Readiness Summary (markdown)"}
                </button>
                {summary && (
                  <div className="ai-summary-output">
                    <div className="ai-summary-actions">
                      <button className="link-button" onClick={copySummary}>
                        Copy to clipboard
                      </button>
                      <button className="link-button" onClick={() => setSummary(null)}>
                        Clear
                      </button>
                    </div>
                    <pre className="markdown-output">{summary}</pre>
                  </div>
                )}
              </div>

              <div className="ai-chat">
                <div className="ai-chat-messages" ref={scrollRef}>
                  {messages.length === 0 && (
                    <p className="hint">
                      Ask about the current data — e.g. "Which CIs are still TBD?" or "Summarize open A/B risks."
                    </p>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={`chat-message ${m.role}`}>
                      <span className="chat-role">{m.role === "user" ? "You" : "Assistant"}</span>
                      <p>{m.content}</p>
                    </div>
                  ))}
                </div>
                <form
                  className="ai-chat-input"
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                >
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Ask the assistant about the current program data…"
                    rows={2}
                  />
                  <button className="button-primary" type="submit" disabled={sending}>
                    {sending ? "…" : "Send"}
                  </button>
                </form>
              </div>
            </>
          )}

          {error && <p className="form-error">{error}</p>}
        </div>
      )}
    </div>
  );
}
