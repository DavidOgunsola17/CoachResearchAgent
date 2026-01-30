"use client"

import { useState, useMemo } from "react"
import { Menu, Search, Trash2, X, MessageSquare, Check } from "lucide-react"
import { useAppStore, getAvatarColor, getInitials, getBadgeColor, Coach } from "@/lib/store"
import { cn } from "@/lib/utils"

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

interface Section {
  title: string
  data: Coach[]
}

export default function ContactsScreen() {
  const {
    savedContacts,
    removeContact,
    setDrawerOpen,
    setCurrentView,
  } = useAppStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Get unique schools
  const schools = useMemo(() => {
    const schoolSet = new Set(savedContacts.map((c) => c.school))
    return Array.from(schoolSet).sort()
  }, [savedContacts])

  // Filter contacts
  const filtered = useMemo(() => {
    let list = savedContacts

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.position.toLowerCase().includes(q) ||
          c.school.toLowerCase().includes(q)
      )
    }

    if (selectedSchool) {
      list = list.filter((c) => c.school === selectedSchool)
    }

    return list
  }, [savedContacts, searchQuery, selectedSchool])

  // Group by first letter
  const sections: Section[] = useMemo(() => {
    const groups: Record<string, Coach[]> = {}

    for (const c of filtered) {
      const letter = c.name.charAt(0).toUpperCase()
      if (!groups[letter]) groups[letter] = []
      groups[letter].push(c)
    }

    return Object.keys(groups)
      .sort()
      .map((letter) => ({
        title: letter,
        data: groups[letter].sort((a, b) => a.name.localeCompare(b.name)),
      }))
  }, [filtered])

  const availableLetters = useMemo(() => new Set(sections.map((s) => s.title)), [sections])

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return
    if (
      confirm(
        `Remove ${selectedIds.size} contact${selectedIds.size > 1 ? "s" : ""} from your saved list?`
      )
    ) {
      selectedIds.forEach((id) => removeContact(id))
      setSelectedIds(new Set())
      setEditMode(false)
    }
  }

  const handleAlphabetPress = (letter: string) => {
    const element = document.getElementById(`section-${letter}`)
    element?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-14 pb-3">
        <button onClick={() => setDrawerOpen(true)} className="p-1">
          <Menu size={26} className="text-foreground" />
        </button>
        <span className="text-xl font-black tracking-[0.2em] text-foreground">SKOUT</span>
        {editMode ? (
          <button onClick={handleDeleteSelected} className="p-1">
            <Trash2 size={22} className="text-destructive" />
          </button>
        ) : (
          <button onClick={() => setEditMode(true)} className="text-[15px] font-semibold text-primary">
            Edit
          </button>
        )}
      </header>

      {/* Title */}
      <div className="px-5 pb-4">
        <h1 className="text-[32px] font-extrabold text-foreground">All Contacts</h1>
        <p className="text-[15px] text-muted-foreground">
          You have {savedContacts.length} saved contact{savedContacts.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Search */}
      <div className="mx-5 mb-3.5 flex items-center gap-2.5 rounded-2xl bg-card px-4 py-3">
        <Search size={18} className="text-muted-foreground" />
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")}>
            <X size={18} className="text-muted-foreground" />
          </button>
        )}
      </div>

      {/* School Filter Chips */}
      <div className="mb-2.5 overflow-x-auto px-5">
        <div className="flex gap-2.5">
          <button
            onClick={() => setSelectedSchool(null)}
            className={cn(
              "whitespace-nowrap rounded-full border px-4 py-2.5 text-[13px] font-semibold",
              !selectedSchool
                ? "border-muted-foreground bg-secondary text-foreground"
                : "border-border bg-card text-muted-foreground"
            )}
          >
            All Schools
          </button>
          {schools.map((school) => (
            <button
              key={school}
              onClick={() => setSelectedSchool(selectedSchool === school ? null : school)}
              className={cn(
                "whitespace-nowrap rounded-full border px-4 py-2.5 text-[13px] font-semibold",
                selectedSchool === school
                  ? "border-muted-foreground bg-secondary text-foreground"
                  : "border-border bg-card text-muted-foreground"
              )}
            >
              {school}
            </button>
          ))}
        </div>
      </div>

      {/* Contact List with Alphabet Index */}
      <div className="relative flex flex-1 overflow-hidden">
        {sections.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <Search size={24} className="text-muted-foreground" />
            </div>
            <h3 className="mb-1.5 text-xl font-bold text-foreground">No contacts yet</h3>
            <p className="text-center text-sm text-muted-foreground">
              Save coaches from search results to see them here
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {sections.map((section) => (
                <div key={section.title} id={`section-${section.title}`}>
                  <p className="px-1 pt-4 pb-2 text-sm font-bold text-muted-foreground">
                    {section.title}
                  </p>
                  {section.data.map((coach) => (
                    <ContactCard
                      key={coach.id}
                      coach={coach}
                      editMode={editMode}
                      selected={selectedIds.has(coach.id)}
                      onPress={() => {
                        if (editMode) {
                          toggleSelection(coach.id)
                        } else {
                          // Could navigate to profile
                        }
                      }}
                      onLongPress={() => {
                        if (!editMode) {
                          setEditMode(true)
                          toggleSelection(coach.id)
                        }
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Alphabet Index */}
            <div className="absolute right-1 top-0 bottom-0 flex flex-col items-center justify-center">
              {ALPHABET.map((letter) => {
                const isAvailable = availableLetters.has(letter)
                return (
                  <button
                    key={letter}
                    onClick={() => handleAlphabetPress(letter)}
                    disabled={!isAvailable}
                    className={cn(
                      "px-1 py-[1px] text-[10px] font-semibold",
                      isAvailable ? "text-foreground" : "text-border"
                    )}
                  >
                    {letter}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Bottom Button */}
      <div className="px-5 pb-9 pt-2">
        {editMode ? (
          <button
            onClick={() => {
              setEditMode(false)
              setSelectedIds(new Set())
            }}
            className="w-full rounded-full border border-border bg-card py-4 text-[15px] font-extrabold tracking-widest text-foreground"
          >
            CANCEL
          </button>
        ) : (
          <button
            onClick={() => setCurrentView("search")}
            className="w-full rounded-full bg-foreground py-4 text-[15px] font-extrabold tracking-widest text-background"
          >
            BACK
          </button>
        )}
      </div>
    </div>
  )
}

interface ContactCardProps {
  coach: Coach
  editMode: boolean
  selected: boolean
  onPress: () => void
  onLongPress: () => void
}

function ContactCard({ coach, editMode, selected, onPress }: ContactCardProps) {
  const avatarColor = getAvatarColor(coach.name)
  const initials = getInitials(coach.name)
  const badgeColor = getBadgeColor(coach.position)
  const positionLabel = coach.position.toUpperCase()

  return (
    <button
      onClick={onPress}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl bg-card p-3.5 mb-2.5 text-left",
        selected && "ring-1 ring-primary"
      )}
    >
      {/* Checkbox */}
      {editMode && (
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
        className="flex h-13 w-13 items-center justify-center rounded-full"
        style={{ backgroundColor: avatarColor }}
      >
        <span className="text-[17px] font-bold text-foreground">{initials}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="mb-1 text-[17px] font-bold text-foreground truncate">{coach.name}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="rounded px-2 py-0.5 text-[10px] font-bold tracking-wide"
            style={{ backgroundColor: `${badgeColor}20`, color: badgeColor }}
          >
            {positionLabel}
          </span>
          {coach.school && (
            <span className="text-[13px] text-muted-foreground truncate">
              {"\u2022 "}{coach.school}
            </span>
          )}
        </div>
      </div>

      {/* Message icon */}
      {!editMode && (
        <button className="p-1">
          <MessageSquare size={20} className="text-muted-foreground" />
        </button>
      )}
    </button>
  )
}
