"use client"

import { Menu, X, ChevronDown } from "lucide-react"
import { useAppStore } from "@/lib/store"

interface HeaderProps {
  title?: string
  showLogo?: boolean
  showDropdown?: boolean
  rightAction?: React.ReactNode
  onBack?: () => void
}

export default function Header({
  title = "SKOUT",
  showLogo = true,
  showDropdown = false,
  rightAction,
  onBack,
}: HeaderProps) {
  const { setDrawerOpen } = useAppStore()

  return (
    <header className="flex items-center justify-between px-5 pt-14 pb-3">
      <button
        onClick={onBack || (() => setDrawerOpen(true))}
        className="p-1"
      >
        {onBack ? (
          <X size={26} className="text-muted-foreground" />
        ) : (
          <Menu size={26} className="text-foreground" />
        )}
      </button>

      {showLogo ? (
        <div className="flex items-center gap-1">
          <span className="text-lg font-black tracking-[0.2em] text-foreground">{title}</span>
          {showDropdown && <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      ) : (
        <span className="text-lg font-semibold text-foreground">{title}</span>
      )}

      <div className="min-w-[34px]">{rightAction}</div>
    </header>
  )
}
