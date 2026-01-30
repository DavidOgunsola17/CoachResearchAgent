"use client"

import { Menu } from "lucide-react"
import { useAppStore } from "@/lib/store"
import CoachCard from "./coach-card"
import SearchProgress from "./search-progress"

export default function ResultsScreen() {
  const {
    searchStage,
    results,
    selectedCoaches,
    toggleSelectCoach,
    clearSelection,
    saveContact,
    removeContact,
    isContactSaved,
    setCurrentView,
    setSelectedCoachIndex,
    setSearchStage,
    setResults,
    setDrawerOpen,
  } = useAppStore()

  const selectMode = selectedCoaches.size > 0

  // Show loading state
  if (searchStage !== "complete") {
    return <SearchProgress stage={searchStage} />
  }

  const handleCardPress = (index: number) => {
    if (selectMode) {
      toggleSelectCoach(results[index].id)
    } else {
      setSelectedCoachIndex(index)
      setCurrentView("profile")
    }
  }

  const handleSaveToggle = (index: number) => {
    const coach = results[index]
    if (isContactSaved(coach.id)) {
      removeContact(coach.id)
    } else {
      saveContact(coach)
    }
  }

  const handleExit = () => {
    clearSelection()
    setSearchStage("idle")
    setResults([])
    setCurrentView("search")
  }

  const handleMessage = () => {
    alert(
      selectMode
        ? `Send a message to ${selectedCoaches.size} selected coach${selectedCoaches.size > 1 ? "es" : ""}?\n\n(Messaging will be available in a future update)`
        : "Long-press coaches to select them for bulk messaging, or tap MESSAGE to message all.\n\n(Messaging will be available in a future update)"
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-14 pb-3">
        <button onClick={() => setDrawerOpen(true)} className="p-1">
          <Menu size={26} className="text-foreground" />
        </button>
        <span className="text-xl font-black tracking-[0.2em] text-foreground">SKOUT</span>
        {selectMode ? (
          <button onClick={clearSelection} className="text-[15px] font-semibold text-primary">
            Cancel
          </button>
        ) : (
          <div className="w-[26px]" />
        )}
      </header>

      {/* Title Section */}
      <div className="px-5 pb-4">
        <h1 className="text-[32px] font-extrabold text-foreground">Coaches</h1>
        <p className="text-[15px] text-muted-foreground">
          I found {results.length} coach{results.length !== 1 ? "es" : ""} for you!
        </p>
        {selectMode && (
          <p className="mt-1 text-sm font-semibold text-primary">
            {selectedCoaches.size} selected
          </p>
        )}
      </div>

      {/* Coach List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {results.map((coach, index) => (
          <CoachCard
            key={coach.id}
            coach={coach}
            index={index}
            saved={isContactSaved(coach.id)}
            selected={selectedCoaches.has(coach.id)}
            selectMode={selectMode}
            onPress={() => handleCardPress(index)}
            onSaveToggle={() => handleSaveToggle(index)}
          />
        ))}
      </div>

      {/* Bottom Buttons */}
      <div className="space-y-2.5 px-5 pb-9 pt-3">
        <button
          onClick={handleMessage}
          className="w-full rounded-full bg-primary py-4 text-[15px] font-extrabold tracking-widest text-foreground"
        >
          MESSAGE{selectMode ? ` (${selectedCoaches.size})` : ""}
        </button>
        <button
          onClick={handleExit}
          className="w-full rounded-full bg-foreground py-4 text-[15px] font-extrabold tracking-widest text-background"
        >
          EXIT
        </button>
      </div>
    </div>
  )
}
