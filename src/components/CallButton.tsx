"use client";

import { Phone } from "lucide-react";
import { useDialer } from "./AircallDialer";

type Variant = "primary" | "secondary" | "icon" | "link";

/**
 * "Call" trigger that goes through the embedded Aircall dialer.
 * Place it next to any contact phone number in the app.
 *
 * - `phone` is the E.164 (or any digits-containing) number to dial.
 * - `contact` is optional but improves the in-call UX: the dialer
 *   shows the contact's name + company in the call banner, and an
 *   "Open" button that pushes to `href`.
 */
export function CallButton({
  phone,
  contact,
  variant = "secondary",
  label,
}: {
  phone: string | null | undefined;
  contact?: { name?: string; company?: string; href?: string };
  variant?: Variant;
  label?: string;
}) {
  const { dial } = useDialer();

  if (!phone) return null;

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dial(phone, contact);
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="btn-icon"
        aria-label={`Call ${contact?.name ?? phone}`}
        title={`Call ${contact?.name ?? phone}`}
      >
        <Phone size={13} />
      </button>
    );
  }

  if (variant === "link") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 text-[var(--accent-strong)] hover:underline"
      >
        <Phone size={11} />
        {label ?? phone}
      </button>
    );
  }

  const className = variant === "primary" ? "btn-accent" : "btn-secondary";
  return (
    <button type="button" onClick={onClick} className={className}>
      <Phone size={variant === "primary" ? 14 : 12} />
      {label ?? "Call"}
    </button>
  );
}
