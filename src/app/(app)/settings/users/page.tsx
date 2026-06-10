import { Users } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { PageHeader } from "@/components/PageHeader";
import { AddUserButton, UsersManager } from "@/components/UsersManager";
import { SyncNowButton } from "@/components/SyncNowButton";
import { listUsers, requireAdmin } from "@/lib/auth";
import { listAircallUsers, type AircallUser } from "@/lib/aircall";

export default async function UsersSettingsPage() {
  const admin = await requireAdmin();
  const users = await listUsers();

  // Best-effort: if Aircall API is down or creds invalid, render the page
  // without the linker UI rather than blowing up the whole admin section.
  let aircallUsers: AircallUser[] = [];
  let aircallError: string | null = null;
  try {
    aircallUsers = await listAircallUsers();
  } catch (err) {
    aircallError = err instanceof Error ? err.message : "Aircall unreachable";
  }

  return (
    <>
      <TopBar
        title="Users"
        icon={<Users size={14} className="text-sky-500" />}
        right={<SyncNowButton />}
      />
      <PageHeader
        icon={<Users size={14} className="text-sky-500" />}
        title="Users"
        count={users.length}
        description="People who can sign in to this workspace"
        action={<AddUserButton />}
      />
      <UsersManager
        users={users}
        currentUserId={admin.id}
        aircallUsers={aircallUsers}
        aircallError={aircallError}
      />
    </>
  );
}
