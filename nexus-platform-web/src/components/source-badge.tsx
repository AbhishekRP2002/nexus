import type { SourceType } from "@/lib/types"
import { cn } from "@/lib/utils"

const sourceConfig: Record<SourceType, { label: string; prefix: string; className: string }> = {
  twitter: {
    label: "TWITTER",
    prefix: "𝕏",
    className: "bg-sky-500/15 text-sky-400",
  },
  web: {
    label: "WEB",
    prefix: "◉",
    className: "bg-emerald-500/15 text-emerald-400",
  },
  linkedin: {
    label: "LINKEDIN",
    prefix: "in",
    className: "bg-blue-500/15 text-blue-400",
  },
}

export function SourceBadge({
  sourceType,
  className,
}: {
  sourceType: SourceType
  className?: string
}) {
  const config = sourceConfig[sourceType]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        config.className,
        className,
      )}
    >
      <span className="text-[10px]">{config.prefix}</span>
      {config.label}
    </span>
  )
}
