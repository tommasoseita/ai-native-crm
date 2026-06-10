import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.mustChangePassword ? "/change-password" : "/");

  return (
    <div className="flex h-full items-center justify-center bg-[var(--sidebar)]">
      <div className="w-full max-w-sm px-6">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)] text-white text-[15px] font-bold">
            W
          </div>
          <span className="text-[18px] font-semibold">Wibo</span>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <h1 className="text-[15px] font-semibold">Sign in</h1>
          <p className="mt-1 mb-4 text-[12.5px] text-[var(--muted-foreground)]">
            Use the credentials your administrator gave you.
          </p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
