import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ToastProvider } from "@/components/Toast";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();
  if (user.mustChangePassword) redirect("/change-password");

  return (
    <ToastProvider>
      <div className="flex h-full">
        <Sidebar user={{ name: user.name, email: user.email, role: user.role }} />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
