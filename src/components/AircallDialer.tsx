"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import AircallWorkspace, {
  type AircallCallPayload,
  type AircallLoginPayload,
} from "aircall-everywhere";
import {
  ChevronDown,
  ExternalLink,
  Loader2,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
} from "lucide-react";
import { useToast } from "./Toast";

// ─── Context ────────────────────────────────────────────────────────────────

type CallContext = {
  name?: string;
  href?: string;
  company?: string;
};

type ActiveCall = {
  direction: "inbound" | "outbound";
  phoneNumber: string;
  contact?: CallContext;
  startedAt: number;
};

type DialerState = {
  isReady: boolean;
  isLoggedIn: boolean;
  isOpen: boolean;
  aircallUser: AircallLoginPayload["user"] | null;
  activeCall: ActiveCall | null;
};

type DialerContextValue = {
  state: DialerState;
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Trigger an outbound call from anywhere in the app. */
  dial: (phoneNumber: string, contact?: CallContext) => void;
};

const Ctx = createContext<DialerContextValue | null>(null);

export function useDialer(): DialerContextValue {
  const v = useContext(Ctx);
  if (!v) {
    // Outside the provider (e.g. login page) — return a no-op so callers
    // don't have to null-check.
    return {
      state: {
        isReady: false,
        isLoggedIn: false,
        isOpen: false,
        aircallUser: null,
        activeCall: null,
      },
      open: () => {},
      close: () => {},
      toggle: () => {},
      dial: () => {},
    };
  }
  return v;
}

// ─── Provider ───────────────────────────────────────────────────────────────

const WORKSPACE_DOM_ID = "aircall-workspace-mount";

export function AircallDialerProvider({ children }: { children: ReactNode }) {
  const workspaceRef = useRef<AircallWorkspace | null>(null);
  const pendingDialRef = useRef<{
    phoneNumber: string;
    contact?: CallContext;
  } | null>(null);
  const lastDialedContactRef = useRef<CallContext | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [aircallUser, setAircallUser] = useState<AircallLoginPayload["user"] | null>(
    null,
  );
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);

  const toast = useToast();
  const router = useRouter();

  // Mount the Aircall workspace iframe once.
  useEffect(() => {
    const ws = new AircallWorkspace({
      domToLoadWorkspace: `#${WORKSPACE_DOM_ID}`,
      size: "big",
      debug: false,
      onLogin: (payload) => {
        setIsLoggedIn(true);
        setAircallUser(payload.user);
        setIsReady(true);
        // If a dial was queued before login, fire it now.
        const pending = pendingDialRef.current;
        if (pending) {
          pendingDialRef.current = null;
          ws.send("dial_number", { phone_number: pending.phoneNumber });
          lastDialedContactRef.current = pending.contact ?? null;
        }
      },
      onLogout: () => {
        setIsLoggedIn(false);
        setAircallUser(null);
        setActiveCall(null);
      },
    });

    workspaceRef.current = ws;
    // The iframe takes a beat to load. Mark `isReady` after a short
    // settle so the "Open dialer" button can show "Ready" instead of
    // staying in the loading state forever when nobody logs in.
    const t = window.setTimeout(() => setIsReady(true), 1500);

    ws.on("incoming_call", async (payload) => {
      const phoneNumber = String(payload.from ?? payload.to ?? "");
      const contact = await lookupContact(phoneNumber);
      setActiveCall({
        direction: "inbound",
        phoneNumber,
        contact: contact ?? undefined,
        startedAt: Date.now(),
      });
      setIsOpen(true);
      const label = contact?.name ?? phoneNumber;
      toast.show("info", `📞 Incoming call from ${label}`);
    });

    ws.on("outgoing_call", (payload) => {
      const phoneNumber = String(payload.to ?? payload.from ?? "");
      setActiveCall({
        direction: "outbound",
        phoneNumber,
        contact: lastDialedContactRef.current ?? undefined,
        startedAt: Date.now(),
      });
    });

    ws.on("call_ended", () => {
      setActiveCall(null);
      lastDialedContactRef.current = null;
    });

    return () => {
      window.clearTimeout(t);
      ws.removeListener("incoming_call");
      ws.removeListener("outgoing_call");
      ws.removeListener("call_ended");
      workspaceRef.current = null;
    };
    // We only want to set this up once for the whole session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const dial = useCallback(
    (phoneNumber: string, contact?: CallContext) => {
      setIsOpen(true);
      const ws = workspaceRef.current;
      if (!ws || !isLoggedIn) {
        // Queue: we'll dial as soon as Aircall reports logged in.
        pendingDialRef.current = { phoneNumber, contact };
        toast.show("info", "Sign in to Aircall in the dialer to place the call.");
        return;
      }
      lastDialedContactRef.current = contact ?? null;
      ws.send("dial_number", { phone_number: phoneNumber }, (success, err) => {
        if (!success) {
          const e = err as { message?: string } | undefined;
          toast.error(e?.message ?? "Aircall refused the call.");
        }
      });
    },
    [isLoggedIn, toast],
  );

  const openContactFromActiveCall = useCallback(() => {
    const href = activeCall?.contact?.href;
    if (href) router.push(href);
  }, [activeCall, router]);

  const value: DialerContextValue = useMemo(
    () => ({
      state: { isReady, isLoggedIn, isOpen, aircallUser, activeCall },
      open,
      close,
      toggle,
      dial,
    }),
    [isReady, isLoggedIn, isOpen, aircallUser, activeCall, open, close, toggle, dial],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <DialerUI
        isOpen={isOpen}
        isLoggedIn={isLoggedIn}
        activeCall={activeCall}
        toggle={toggle}
        close={close}
        openContact={openContactFromActiveCall}
      />
    </Ctx.Provider>
  );
}

async function lookupContact(phoneNumber: string): Promise<CallContext | null> {
  if (!phoneNumber) return null;
  try {
    const res = await fetch(
      "/api/contacts/by-phone?phone=" + encodeURIComponent(phoneNumber),
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as {
      person:
        | {
            id: string;
            name: string;
            role: string | null;
            companyName: string | null;
          }
        | null;
    };
    if (!body.person) return null;
    return {
      name: body.person.name,
      company: body.person.companyName ?? undefined,
      href: `/people/${body.person.id}`,
    };
  } catch {
    return null;
  }
}

// ─── UI ─────────────────────────────────────────────────────────────────────

function DialerUI({
  isOpen,
  isLoggedIn,
  activeCall,
  toggle,
  close,
  openContact,
}: {
  isOpen: boolean;
  isLoggedIn: boolean;
  activeCall: ActiveCall | null;
  toggle: () => void;
  close: () => void;
  openContact: () => void;
}) {
  const hasActiveCall = activeCall !== null;

  return (
    <>
      {/* Floating launcher */}
      <button
        type="button"
        onClick={toggle}
        aria-label={isOpen ? "Hide dialer" : "Open dialer"}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full text-white"
        style={{
          background: hasActiveCall
            ? "linear-gradient(135deg, var(--success), #34d399)"
            : "linear-gradient(135deg, var(--accent), var(--accent-strong))",
          boxShadow: "var(--shadow-lg)",
          transition: "transform var(--dur) var(--ease-spring), box-shadow var(--dur) var(--ease)",
          transform: isOpen ? "scale(0.92)" : "scale(1)",
        }}
      >
        {hasActiveCall ? (
          <span className="relative flex h-5 w-5 items-center justify-center">
            {activeCall?.direction === "inbound" ? (
              <PhoneIncoming size={18} />
            ) : (
              <PhoneOutgoing size={18} />
            )}
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-white animate-pulse-soft" />
          </span>
        ) : (
          <Phone size={18} />
        )}
      </button>

      {/* Always-mounted iframe host. We render it in a hidden / visible
          container based on `isOpen`; we never tear it down because the
          Aircall workspace session lives inside it. */}
      <div
        className="fixed bottom-20 right-5 z-40 origin-bottom-right"
        style={{
          width: 376,
          pointerEvents: isOpen ? "auto" : "none",
          opacity: isOpen ? 1 : 0,
          transform: isOpen
            ? "translateY(0) scale(1)"
            : "translateY(8px) scale(0.96)",
          transition:
            "opacity var(--dur) var(--ease-out), transform var(--dur) var(--ease-out)",
        }}
        aria-hidden={!isOpen}
      >
        <div
          className="rounded-2xl overflow-hidden border border-[var(--border)]"
          style={{
            background: "var(--surface)",
            boxShadow: "var(--shadow-xl)",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--border)]">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent), var(--accent-strong))",
              }}
            >
              <Phone size={12} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold leading-tight">Aircall</div>
              <div className="text-[11px] text-[var(--muted)] leading-tight">
                {!isLoggedIn
                  ? "Sign in below"
                  : hasActiveCall
                    ? "On a call"
                    : "Ready"}
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              className="btn-icon"
              aria-label="Hide dialer"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          {/* Call context banner */}
          {activeCall && (
            <div
              className="flex items-start gap-2 px-3 py-2 border-b border-[var(--border)]"
              style={{
                background:
                  activeCall.direction === "inbound"
                    ? "var(--success-soft)"
                    : "var(--accent-softer)",
              }}
            >
              {activeCall.direction === "inbound" ? (
                <PhoneIncoming
                  size={14}
                  className="mt-0.5 text-[var(--success)]"
                />
              ) : (
                <PhoneOutgoing
                  size={14}
                  className="mt-0.5 text-[var(--accent-strong)]"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-medium truncate">
                  {activeCall.contact?.name ?? activeCall.phoneNumber}
                </div>
                {activeCall.contact?.company && (
                  <div className="text-[11px] text-[var(--muted-foreground)] truncate">
                    {activeCall.contact.company}
                  </div>
                )}
              </div>
              {activeCall.contact?.href && (
                <button
                  type="button"
                  onClick={openContact}
                  className="btn-secondary"
                  style={{ height: 26, fontSize: 11 }}
                >
                  <ExternalLink size={11} />
                  Open
                </button>
              )}
            </div>
          )}

          {/* Aircall workspace iframe mount point */}
          <div
            id={WORKSPACE_DOM_ID}
            style={{ width: 376, height: 666, background: "#fff" }}
          >
            {/* The SDK injects an <iframe> here at mount time; this empty
                state is what users see for the ~500ms while it loads. */}
            <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-[var(--muted)] text-[12px]">
              <Loader2 size={16} className="animate-spin" />
              Loading Aircall…
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
