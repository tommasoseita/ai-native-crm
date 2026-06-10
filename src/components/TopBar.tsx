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
    <header
      className="sticky top-0 z-30 flex h-12 items-center px-5"
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset",
      }}
    >
      <div className="flex items-center gap-2 text-[13px] font-medium tracking-tight text-[var(--foreground)]">
        {icon && (
          <span className="flex items-center text-[var(--muted-foreground)]">
            {icon}
          </span>
        )}
        <span>{title}</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {right}
        <ViewAsPicker current={sdr} />
        <button className="btn-ghost" type="button">
          <HelpCircle size={13} strokeWidth={1.75} />
          <span>Help</span>
        </button>
      </div>
    </header>
  );
}
