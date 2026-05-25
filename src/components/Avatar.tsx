import { colorFromString } from "@/lib/utils";

type Size = "xs" | "sm" | "md" | "lg";

const sizeMap: Record<Size, string> = {
  xs: "h-5 w-5 text-[10px]",
  sm: "h-6 w-6 text-[11px]",
  md: "h-7 w-7 text-xs",
  lg: "h-10 w-10 text-sm",
};

export function Avatar({
  name,
  size = "sm",
  color,
}: {
  name: string;
  size?: Size;
  color?: string;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const bg = color ?? colorFromString(name);
  return (
    <span
      className={`${sizeMap[size]} inline-flex items-center justify-center rounded-full font-medium text-white shrink-0`}
      style={{ background: bg }}
      aria-label={name}
      title={name}
    >
      {initials}
    </span>
  );
}

export function CompanyLogo({
  name,
  domain,
  size = "sm",
}: {
  name: string;
  domain?: string;
  size?: Size;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const bg = colorFromString(domain ?? name);
  return (
    <span
      className={`${sizeMap[size]} inline-flex items-center justify-center rounded-md font-semibold text-white shrink-0`}
      style={{ background: bg }}
      aria-label={name}
      title={name}
    >
      {initials}
    </span>
  );
}
