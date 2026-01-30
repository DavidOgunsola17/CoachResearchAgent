"use client"

import { Check, Plus } from "lucide-react"
import { Coach, getAvatarColor, getInitials, getBadgeColor, useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

interface CoachCardProps {
  coach: Coach
  index: number
  saved: boolean
  selected?: boolean
  selectMode?: boolean
  onPress: () => void
  onLongPress?: () => void
  onSaveToggle: () => void
}

export default function CoachCard({
  coach,
  saved,
  selected,
  selectMode,
  onPress,
  onSaveToggle,
}: CoachCardProps) {
  const avatarColor = getAvatarColor(coach.name)
  const initials = getInitials(coach.name)
  const badgeColor = getBadgeColor(coach.position)
  const positionLabel = coach.position.toUpperCase()
  const schoolSport = [coach.school, coach.sport].filter(Boolean).join(" ")

  return (
    <button
      onClick={onPress}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl bg-card p-3.5 mb-2.5 text-left transition-all",
        selected && "ring-1 ring-primary"
      )}
    >
      {/* Selection checkbox */}
      {selectMode && (
        <div
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full border-2",
            selected ? "border-primary bg-primary" : "border-muted-foreground"
          )}
        >
          {selected && <Check size={12} className="text-foreground" />}
        </div>
      )}

      {/* Avatar */}
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: avatarColor }}
      >
        <span className="text-base font-bold text-foreground">{initials}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-bold text-foreground truncate">{coach.name}</span>
          <span
            className="rounded px-2 py-0.5 text-[10px] font-bold tracking-wide"
            style={{ backgroundColor: `${badgeColor}20`, color: badgeColor }}
          >
            {positionLabel}
          </span>
        </div>
        <p className="mt-0.5 text-[13px] text-muted-foreground truncate">{schoolSport}</p>
      </div>

      {/* Save button */}
      {!selectMode && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSaveToggle()
          }}
          className="flex items-center justify-center"
        >
          {saved ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500">
              <Check size={18} className="text-background" />
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary">
              <Plus size={20} className="text-foreground" />
            </div>
          )}
        </button>
      )}
    </button>
  )
}
