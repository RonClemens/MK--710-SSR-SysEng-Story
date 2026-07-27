import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { IS_STATIC_MODE } from "../api/deployMode";
import { getStoredApiKey, getStoredModel, setStoredApiKey, setStoredModel } from "../api/directAi";

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

  const [apiKeyInput, setApiKeyInput] = useState(() => getStoredApiKey());
  const [modelInput, setModelInput] = useState(() => getStoredModel());
  const [hasStoredKey, setHasStoredKey] = useState(() => Boolean(getStoredApiKey()));

  const aiAvailable = IS_STATIC_MODE ? hasStoredKey : serverAiEnabled;
  const active = aiAvailable && userEnabled;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(userEnabled));
  }, [userEnabled]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  function saveKey() {
    const trimmed = apiKeyInput.trim();
    setStoredApiKey(trimmed);
    setStoredModel(modelInput.trim());
    setHasStoredKey(Boolean(trimmed));
  }

  function clearKey() {
    setStoredApiKey("");
    setApiKeyInput("");
    setHasStoredKey(false);
  }

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
        {open ? (
          <>
            <span>Close AI Assistant</span>
            <span className="ai-panel-close-icon" aria-hidden="true">
              ×
            </span>
          </>
        ) : (
          "◂ AI Assistant"
        )}
      </button>
      {open && (
        <div className="ai-panel-body">
          {IS_STATIC_MODE ? (
            <div className="ai-banner">
              <strong>This is a static demo with no backend — your browser talks to Anthropic directly.</strong>
              <p>
                The API key you enter below is stored only in this browser's local storage and is sent only to
                api.anthropic.com — never to any server this app controls (there isn't one in this deployment).
                Anyone with devtools open on this page can read that key out of network requests, so only use a
                key you're comfortable exposing that way. Do not enter CUI or program-sensitive data here — this
                is illustrative/demo data only.
              </p>
            </div>
          ) : (
            <div className="ai-banner">
              <strong>Data leaves this environment when the AI Assistant is used.</strong>
              <p>
                Data entered here is sent to the Claude API ({serverAiEnabled ? "configured provider" : "not configured"}) as
                context for this feature. Do not enter CUI or program-sensitive data until this has been cleared by
                your program's security/ISSM office.
              </p>
            </div>
          )}

          {IS_STATIC_MODE && (
            <div className="ai-byok">
              <label className="form-field">
                <span>Your Anthropic API key</span>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk-ant-…"
                  autoComplete="off"
                />
              </label>
              <label className="form-field">
                <span>Model</span>
                <input
                  type="text"
                  value={modelInput}
                  onChange={(e) => setModelInput(e.target.value)}
                  placeholder="claude-sonnet-5"
                />
              </label>
              <div className="form-actions" style={{ justifyContent: "flex-start" }}>
                <button className="button-primary" onClick={saveKey}>
                  Save key
                </button>
                {hasStoredKey && (
                  <button className="button-secondary" onClick={clearKey}>
                    Clear key
                  </button>
                )}
              </div>
              {!hasStoredKey && <p className="hint">Enter and save a key to enable the assistant below.</p>}
            </div>
          )}

          <label className="ai-toggle">
            <input
              type="checkbox"
              checked={userEnabled}
              onChange={(e) => setUserEnabled(e.target.checked)}
            />
            <span>Enable AI Assistant (uncheck to make zero external API calls)</span>
          </label>

          {!IS_STATIC_MODE && !serverAiEnabled && (
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
