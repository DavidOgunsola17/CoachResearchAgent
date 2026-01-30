"use client"

import { Menu, X, School, Mail, Phone, AtSign, Briefcase } from "lucide-react"
import { useAppStore, getInitials, getAvatarGradient } from "@/lib/store"

export default function CoachProfileScreen() {
  const { results, selectedCoachIndex, setCurrentView, setDrawerOpen } = useAppStore()
  const coach = results[selectedCoachIndex]

  if (!coach) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <p className="text-muted-foreground">Coach not found.</p>
        <button
          onClick={() => setCurrentView("results")}
          className="mt-4 text-primary"
        >
          Go Back
        </button>
      </div>
    )
  }

  const initials = getInitials(coach.name)
  const [gradientStart, gradientEnd] = getAvatarGradient(coach.name)
  const subtitle = [coach.school, coach.position].filter(Boolean).join(" \u2022 ")

  const handleClose = () => setCurrentView("results")

  const details = [
    { icon: School, label: "SCHOOL", value: coach.school },
    { icon: Briefcase, label: "POSITION", value: coach.position },
    { icon: Mail, label: "EMAIL", value: coach.email, href: `mailto:${coach.email}` },
    { icon: Phone, label: "PHONE", value: coach.phone, href: `tel:${coach.phone}` },
    { icon: AtSign, label: "TWITTER / X", value: coach.twitter, href: `https://twitter.com/${coach.twitter.replace("@", "")}` },
  ].filter((d) => d.value)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-14 pb-3">
        <button onClick={() => setDrawerOpen(true)} className="p-1">
          <Menu size={26} className="text-foreground" />
        </button>
        <span className="text-xl font-black tracking-[0.2em] text-foreground">SKOUT</span>
        <button onClick={handleClose} className="p-1">
          <X size={26} className="text-muted-foreground" />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-10">
        {/* Avatar Section */}
        <div className="flex flex-col items-center pb-7 pt-5">
          <div
            className="flex h-32 w-32 items-center justify-center rounded-full mb-5"
            style={{
              background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
            }}
          >
            <span className="text-4xl font-bold text-foreground">{initials}</span>
          </div>
          <h1 className="mb-1.5 text-2xl font-extrabold text-foreground">{coach.name}</h1>
          <p className="px-10 text-center text-[15px] text-muted-foreground">{subtitle}</p>
        </div>

        {/* Detail Card */}
        <div className="mx-5 rounded-2xl bg-card px-5 py-2">
          {details.map((detail, index) => {
            const Icon = detail.icon
            const isLast = index === details.length - 1
            const content = (
              <div
                className={`flex items-center gap-4 py-4 ${!isLast ? "border-b border-border" : ""}`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                  <Icon size={20} className="text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="mb-0.5 text-[11px] font-bold tracking-wide text-primary">
                    {detail.label}
                  </p>
                  <p className="text-base font-medium text-foreground">{detail.value}</p>
                </div>
              </div>
            )

            if (detail.href) {
              return (
                <a
                  key={detail.label}
                  href={detail.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:opacity-80"
                >
                  {content}
                </a>
              )
            }

            return <div key={detail.label}>{content}</div>
          })}
        </div>
      </div>
    </div>
  )
}
