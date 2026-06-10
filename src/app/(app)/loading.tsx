export default function Loading() {
  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-12 border-b border-[var(--border)] bg-[var(--surface)]" />
      <div className="px-6 pt-6 pb-5 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-start gap-3">
          <div className="skeleton h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="skeleton h-5 w-40" />
            <div className="skeleton h-3.5 w-64" />
          </div>
        </div>
      </div>
      <div className="px-6 py-6">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="skeleton h-12 w-full rounded-xl"
              style={{ opacity: 1 - i * 0.13 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
