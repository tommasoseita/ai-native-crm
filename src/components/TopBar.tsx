import { HelpCircle } from "lucide-react";
import { ViewAsPicker } from "./ViewAsPicker";
import { currentSdr } from "@/lib/viewAs";

export async function TopBar({
  title,
  icon,
  right,
}: {
  title: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
}) {
  const sdr = await currentSdr();
  return (
    <header className="flex h-12 items-center border-b border-[var(--border)] bg-white px-5">
      <div className="flex items-center gap-2 text-[13px] font-medium">
        {icon}
        <span>{title}</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {right}
        <ViewAsPicker current={sdr} />
        <button className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-[var(--muted-foreground)] hover:bg-[var(--sidebar-hover)]">
          <HelpCircle size={13} />
          <span>Help</span>
        </button>
      </div>
    </header>
  );
}
