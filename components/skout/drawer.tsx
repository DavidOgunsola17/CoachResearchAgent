"use client"

import { X, Compass, Users, Layers, Settings, ChevronRight, User } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export default function Drawer() {
  const { drawerOpen, setDrawerOpen, currentView, setCurrentView, user } = useAppStore()

  const navItems = [
    { label: "SKOUT", view: "search" as const, icon: Compass },
    { label: "All Contacts", view: "contacts" as const, icon: Users },
    { label: "Templates", view: "templates" as const, icon: Layers },
  ]

  const handleNavigate = (view: typeof currentView) => {
    setCurrentView(view)
    setDrawerOpen(false)
  }

  if (!drawerOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={() => setDrawerOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 z-50 w-[280px] bg-card flex flex-col animate-in slide-in-from-left duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-14 pb-5">
          <h1 className="text-2xl font-black tracking-widest text-foreground">SKOUT</h1>
          <button
            onClick={() => setDrawerOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.view
            return (
              <button
                key={item.view}
                onClick={() => handleNavigate(item.view)}
                className={cn(
                  "flex w-full items-center gap-3.5 rounded-full px-5 py-4",
                  isActive ? "bg-foreground" : "bg-secondary"
                )}
              >
                <Icon
                  size={22}
                  className={isActive ? "text-background" : "text-muted-foreground"}
                />
                <span
                  className={cn(
                    "text-base font-semibold",
                    isActive ? "text-background" : "text-foreground"
                  )}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Bottom Section */}
        <div className="px-4 pb-8">
          {/* Settings Card */}
          <button
            onClick={() => handleNavigate("settings")}
            className="flex w-full items-center gap-3 rounded-2xl bg-secondary p-3.5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card">
              <User size={20} className="text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[15px] font-bold text-foreground">Settings</p>
              <p className="text-xs text-muted-foreground">
                {user?.email ?? "Profile & Preferences"}
              </p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>

          <div className="my-4 h-px bg-border" />

          <p className="px-1 text-[11px] font-semibold tracking-[0.15em] text-muted-foreground">
            SKOUT INTELLIGENCE V1.0.4
          </p>
        </div>
      </div>
    </>
  )
}
