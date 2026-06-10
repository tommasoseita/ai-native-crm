import { Users } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { PageHeader } from "@/components/PageHeader";
import { AddUserButton, UsersManager } from "@/components/UsersManager";
import { listUsers, requireAdmin } from "@/lib/auth";

export default async function UsersSettingsPage() {
  const admin = await requireAdmin();
  const users = await listUsers();

  return (
    <>
      <TopBar title="Users" icon={<Users size={14} className="text-sky-500" />} />
      <PageHeader
        icon={<Users size={14} className="text-sky-500" />}
        title="Users"
        count={users.length}
        description="People who can sign in to this workspace"
        action={<AddUserButton />}
      />
      <UsersManager users={users} currentUserId={admin.id} />
    </>
  );
}
