"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "./Toast";

type SyncResult = {
  ok: boolean;
  fetched?: number;
  inserted?: number;
  recordingsStored?: number;
  recordingsFailed?: number;
  recordingsPending?: number;
  storageAvailable?: boolean;
  error?: string;
};

/**
 * Admin trigger for the Aircall polling job. The same endpoint is hit by
 * Vercel Cron every 3 minutes, but a button to force a refresh between
 * ticks (and surface the result) is useful in day-to-day operations.
 */
export function SyncNowButton() {
  const [pending, setPending] = useState(false);
  const toast = useToast();

  const onClick = async () => {
    setPending(true);
    try {
      const res = await fetch("/api/aircall/sync", { method: "GET" });
      const body = (await res.json().catch(() => ({}))) as SyncResult;
      if (!res.ok || !body.ok) {
        toast.error(body.error ?? `Sync failed (HTTP ${res.status})`);
        return;
      }
      const inserted = body.inserted ?? 0;
      const stored = body.recordingsStored ?? 0;
      const failed = body.recordingsFailed ?? 0;
      const parts = [
        `${inserted} new call${inserted === 1 ? "" : "s"}`,
        stored > 0 ? `${stored} recording${stored === 1 ? "" : "s"} stored` : null,
        failed > 0 ? `${failed} failed` : null,
      ].filter(Boolean);
      toast.success(`Sync complete · ${parts.join(" · ")}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="btn-ghost"
      style={{ height: 28 }}
      title="Pull the latest calls from Aircall and store any new recordings"
    >
      {pending ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <RefreshCw size={12} />
      )}
      <span>{pending ? "Syncing…" : "Sync Aircall"}</span>
    </button>
  );
}
