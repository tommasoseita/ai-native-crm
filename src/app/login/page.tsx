import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.mustChangePassword ? "/change-password" : "/");

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
          <h1 className="text-[17.5px] font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 mb-5 text-[13px] text-[var(--muted-foreground)]">
            Use the credentials your administrator gave you.
          </p>
          <LoginForm />
          <p
            className="mt-5 pt-4 text-[12px] text-[var(--muted-foreground)]"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            Don&apos;t have an account? Ask your administrator to invite you.
          </p>
        </div>
      </div>
    </div>
  );
}
