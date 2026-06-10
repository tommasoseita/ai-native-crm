import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div
      className="flex h-full items-center justify-center"
      style={{
        background:
          "radial-gradient(80% 60% at 50% 0%, rgba(91,95,239,0.07), transparent 60%), var(--bg)",
      }}
    >
      <div className="w-full max-w-[400px] px-6">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white text-[18px] font-bold"
            style={{
              background:
                "linear-gradient(135deg, var(--accent), var(--accent-strong))",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,.18), var(--shadow-md)",
            }}
          >
            W
          </div>
          <span className="text-[18px] font-semibold tracking-tight">Wibo</span>
        </div>
        <div
          className="animate-scale-in rounded-2xl px-7 py-7"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-xl)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{
                background: "var(--accent-soft)",
                color: "var(--accent-strong)",
              }}
              aria-hidden
            >
              <ShieldCheck size={15} strokeWidth={2} />
            </span>
            <h1 className="text-[17.5px] font-semibold tracking-tight">
              {user.mustChangePassword ? "Set a new password" : "Change password"}
            </h1>
          </div>
          <p className="mt-2 mb-5 text-[13px] text-[var(--muted-foreground)]">
            {user.mustChangePassword
              ? "Your password was set by an administrator. Choose your own before continuing."
              : "Pick a new password for your account."}
          </p>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
