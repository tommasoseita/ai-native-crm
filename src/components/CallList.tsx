import {
  ArrowDownLeft,
  ArrowUpRight,
  Mic,
  PhoneMissed,
  Voicemail,
} from "lucide-react";
import type { Call } from "@/lib/types";
import { Avatar } from "./Avatar";
import { formatDate, colorFromString } from "@/lib/utils";

type CallEntry = Call & { sdr?: { name: string; email?: string } };

function formatDuration(seconds: number): string {
  if (seconds === 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = formatDate(iso);
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

function DirectionIcon({ direction }: { direction: Call["direction"] }) {
  if (direction === "inbound") {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full"
        style={{ background: "var(--success-soft)", color: "var(--success)" }}
        title="Inbound"
      >
        <ArrowDownLeft size={12} strokeWidth={2.25} />
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-full"
      style={{ background: "var(--accent-soft)", color: "var(--accent-strong)" }}
      title="Outbound"
    >
      <ArrowUpRight size={12} strokeWidth={2.25} />
    </span>
  );
}

function StatusBadge({ call }: { call: Call }) {
  if (call.status === "missed") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
        style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
      >
        <PhoneMissed size={10} /> Missed
      </span>
    );
  }
  if (call.status === "voicemail") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
        style={{ background: "var(--warning-soft)", color: "#92400e" }}
      >
        <Voicemail size={10} /> Voicemail
      </span>
    );
  }
  if (call.durationSec > 0) {
    return (
      <span className="text-[11.5px] tabular-nums text-[var(--muted-foreground)]">
        {formatDuration(call.durationSec)}
      </span>
    );
  }
  return null;
}

function RecordingPlayer({ call }: { call: Call }) {
  if (call.recordingStatus !== "stored" || !call.recordingUrl) {
    if (call.recordingStatus === "pending") {
      return (
        <span className="text-[11px] text-[var(--muted)]">Recording syncing…</span>
      );
    }
    if (call.recordingStatus === "failed") {
      return (
        <span className="text-[11px] text-[var(--muted)]" title="Will be retried at the next sync">
          Recording unavailable
        </span>
      );
    }
    return null;
  }
  return (
    <div className="flex items-center gap-2">
      <Mic size={11} className="text-[var(--muted)] shrink-0" />
      <audio
        controls
        preload="none"
        src={`/api/recordings/${call.recordingUrl}`}
        className="h-8"
        style={{ maxWidth: 280 }}
      />
    </div>
  );
}

export function CallList({ calls }: { calls: CallEntry[] }) {
  if (calls.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-[12.5px] text-[var(--muted)]">
        No calls logged yet for this contact.
      </div>
    );
  }
  return (
    <ul>
      {calls.map((c, i) => (
        <li
          key={c.id}
          className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 text-[12.5px] ${
            i !== calls.length - 1 ? "border-b border-[var(--border)]" : ""
          }`}
        >
          <DirectionIcon direction={c.direction} />
          <div className="min-w-0 flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <span className="font-medium text-[var(--foreground)]">
                {formatDateTime(c.startedAt)}
              </span>
              <StatusBadge call={c} />
              {c.sdr && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[var(--muted-foreground)]">
                  <Avatar
                    name={c.sdr.name}
                    color={colorFromString(c.sdr.email ?? c.sdr.name)}
                    size="xs"
                  />
                  {c.sdr.name}
                </span>
              )}
            </div>
            <RecordingPlayer call={c} />
          </div>
          <span className="text-[11.5px] tabular-nums text-[var(--muted-foreground)]">
            {c.rawDigits ?? ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
