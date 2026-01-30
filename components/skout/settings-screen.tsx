"use client"

import { ArrowLeft, User, LogOut, ChevronRight } from "lucide-react"
import { useAppStore } from "@/lib/store"

export default function SettingsScreen() {
  const { user, setLoggedIn, setCurrentView } = useAppStore()

  const handleSignOut = () => {
    if (confirm("Are you sure you want to sign out?")) {
      setLoggedIn(false)
      setCurrentView("login")
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background px-4">
      {/* Header */}
      <header className="flex items-center justify-between pt-14 pb-4">
        <button onClick={() => setCurrentView("search")} className="p-1">
          <ArrowLeft size={24} className="text-foreground" />
        </button>
        <span className="text-lg font-semibold text-foreground">Settings</span>
        <div className="w-6" />
      </header>

      {/* Profile Section */}
      <div className="mb-8">
        <p className="mb-3 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          Profile
        </p>
        <div className="rounded-2xl bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <User size={28} className="text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-foreground">{user?.email ?? "No email"}</p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">Tap to edit profile</p>
            </div>
            <ChevronRight size={20} className="text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-2xl bg-card p-4"
        >
          <LogOut size={20} className="text-destructive" />
          <span className="text-base font-semibold text-destructive">Sign Out</span>
        </button>
      </div>
    </div>
  )
}
