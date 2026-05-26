"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2, Slash, Sparkles, Wrench } from "lucide-react";

const SUGGESTIONS = [
  "How many should I enroll today?",
  "Who should I call first?",
  "Forecast my pipeline at 70% close",
  "Which contacts haven't been contacted in a month?",
];

type Role = "user" | "assistant";

type ToolBadge = { name: string; status: "running" | "done" };

type ChatMessage = {
  role: Role;
  content: string;
  tools?: ToolBadge[];
};

const TOOL_LABELS: Record<string, string> = {
  get_context: "Checking workspace context",
  get_daily_queue: "Looking up the queue",
  get_enrollment_capacity: "Calculating capacity",
  suggest_enrollments: "Picking top contacts to enroll",
  list_people: "Searching contacts",
  get_person: "Reading contact details",
  list_companies: "Searching companies",
  get_company: "Reading company details",
  list_deals: "Looking up deals",
  get_pipeline_summary: "Summarizing the pipeline",
  list_sequences: "Reading sequences",
};

export function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamingTools, setStreamingTools] = useState<ToolBadge[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streamingText, streamingTools]);

  const reset = () => {
    setMessages([]);
    setStreamingText("");
    setStreamingTools([]);
    setInput("");
    inputRef.current?.focus();
  };

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);
    setStreamingText("");
    setStreamingTools([]);

    const payload = nextMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let accumulated = "";
    const tools: ToolBadge[] = [];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
      }
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          const json = part.slice(6);
          let event: { type: string; [k: string]: unknown };
          try {
            event = JSON.parse(json);
          } catch {
            continue;
          }
          if (event.type === "text_delta") {
            accumulated += event.text as string;
            setStreamingText(accumulated);
          } else if (event.type === "tool_call_start") {
            tools.push({ name: event.name as string, status: "running" });
            setStreamingTools([...tools]);
          } else if (event.type === "tool_call_end") {
            const last = tools.find(
              (t) => t.name === event.name && t.status === "running",
            );
            if (last) last.status = "done";
            setStreamingTools([...tools]);
          } else if (event.type === "error") {
            accumulated += `\n\nError: ${event.error}`;
            setStreamingText(accumulated);
          }
        }
      }
    } catch (err) {
      accumulated =
        accumulated +
        `\n\nError: ${err instanceof Error ? err.message : "Request failed"}`;
    } finally {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: accumulated,
          tools: tools.length > 0 ? tools : undefined,
        },
      ]);
      setStreaming(false);
      setStreamingText("");
      setStreamingTools([]);
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      {messages.length > 0 && (
        <div
          ref={scrollRef}
          className="mb-3 max-h-[420px] overflow-y-auto scrollbar-thin rounded-xl border border-[var(--border)] bg-white p-4 flex flex-col gap-4"
        >
          {messages.map((m, i) => (
            <MessageBubble key={i} message={m} />
          ))}
          {streaming && (
            <MessageBubble
              message={{
                role: "assistant",
                content: streamingText,
                tools: streamingTools,
              }}
              streaming
            />
          )}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-[var(--border)] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus-within:border-[var(--accent)]/40 focus-within:shadow-[0_0_0_3px_rgba(91,95,239,0.08)]"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask anything..."
          rows={3}
          disabled={streaming}
          className="w-full resize-none rounded-xl bg-transparent px-4 pt-3 text-[14px] outline-none placeholder:text-[var(--muted)] disabled:opacity-60"
        />
        <div className="flex items-center justify-between px-3 pb-2.5">
          <div className="flex items-center gap-2 text-[11.5px] text-[var(--muted)]">
            <Sparkles size={11} className="text-[var(--accent)]" />
            <span>Sonnet 4.6</span>
            {messages.length > 0 && (
              <>
                <span className="text-[var(--border)]">·</span>
                <button
                  type="button"
                  onClick={reset}
                  className="hover:text-[var(--foreground)]"
                >
                  New chat
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)]"
              aria-label="Commands"
            >
              <Slash size={13} />
            </button>
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-[var(--accent-soft)] disabled:hover:text-[var(--accent)]"
              aria-label="Send"
            >
              {streaming ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ArrowUp size={14} />
              )}
            </button>
          </div>
        </div>
      </form>

      {messages.length === 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="rounded-full border border-[var(--border)] bg-white px-2.5 py-1 text-[11.5px] text-[var(--muted-foreground)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  message,
  streaming,
}: {
  message: ChatMessage;
  streaming?: boolean;
}) {
  if (message.role === "user") {
    return (
      <div className="self-end max-w-[85%] rounded-2xl bg-[var(--accent)] text-white px-3 py-2 text-[13.5px] whitespace-pre-wrap">
        {message.content}
      </div>
    );
  }
  return (
    <div className="self-start max-w-full flex flex-col gap-1.5">
      {message.tools && message.tools.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {message.tools.map((t, i) => (
            <ToolPill key={`${t.name}-${i}`} badge={t} />
          ))}
        </div>
      )}
      {(message.content || streaming) && (
        <div className="rounded-2xl bg-[var(--sidebar)] border border-[var(--border)] px-3 py-2 text-[13.5px] whitespace-pre-wrap leading-relaxed">
          {message.content}
          {streaming && !message.content && (
            <span className="text-[var(--muted)] italic">Thinking…</span>
          )}
          {streaming && message.content && <Caret />}
        </div>
      )}
    </div>
  );
}

function ToolPill({ badge }: { badge: ToolBadge }) {
  const label = TOOL_LABELS[badge.name] ?? badge.name;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] ${
        badge.status === "running"
          ? "border-[var(--accent)]/40 bg-[var(--accent-soft)] text-[var(--accent)]"
          : "border-[var(--border)] bg-white text-[var(--muted-foreground)]"
      }`}
    >
      {badge.status === "running" ? (
        <Loader2 size={9} className="animate-spin" />
      ) : (
        <Wrench size={9} />
      )}
      {label}
    </span>
  );
}

function Caret() {
  return (
    <span className="ml-0.5 inline-block h-3.5 w-1 -mb-0.5 bg-[var(--accent)] animate-pulse" />
  );
}
