// Minimal type declarations for `aircall-everywhere`. The package ships
// no .d.ts; these are derived from the v2.0.6 source we vendored.

declare module "aircall-everywhere" {
  export type AircallSize = "big" | "small" | "auto";

  export type AircallLoginPayload = {
    user: {
      user_id: number;
      user_email: string;
      first_name: string;
      last_name: string;
      [key: string]: unknown;
    };
    settings?: Record<string, unknown>;
  };

  export type AircallEventName =
    | "incoming_call"
    | "outgoing_call"
    | "outgoing_answered"
    | "call_end_ringtone"
    | "call_ended"
    | "comment_saved"
    | "external_dial"
    | "powerdialer_updated"
    | "redirect_event";

  export type AircallCallPayload = {
    call_id?: number;
    from?: string;
    to?: string;
    direction?: "inbound" | "outbound";
    user?: { user_id: number; first_name?: string; last_name?: string };
    [key: string]: unknown;
  };

  export type AircallWorkspaceOptions = {
    domToLoadWorkspace: string;
    onLogin?: (payload: AircallLoginPayload) => void;
    onLogout?: () => void;
    size?: AircallSize;
    debug?: boolean;
    workspaceUrl?: string;
    integrationToLoad?: string;
    path?: string;
  };

  type SendCallback = (success: boolean, payload?: unknown) => void;

  export default class AircallWorkspace {
    constructor(options: AircallWorkspaceOptions);
    on(eventName: AircallEventName, cb: (payload: AircallCallPayload) => void): void;
    removeListener(eventName: AircallEventName): boolean;
    send(eventName: string, value?: unknown, cb?: SendCallback): void;
    isLoggedIn(cb: (success: boolean, value?: { isLoggedIn: boolean }) => void): void;
  }
}
