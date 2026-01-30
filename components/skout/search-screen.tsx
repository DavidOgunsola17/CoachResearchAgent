"use client"

import { useState } from "react"
import { SlidersHorizontal, Check, X } from "lucide-react"
import { useAppStore, SPORTS, simulateSearch } from "@/lib/store"
import Header from "./header"

export default function SearchScreen() {
  const [sportPickerOpen, setSportPickerOpen] = useState(false)
  const { school, sport, setSchool, setSport, setSearchStage, setResults, setCurrentView } = useAppStore()

  const handleSearch = async () => {
    if (!school.trim() && !sport) return

    // Start search animation
    setSearchStage("discovering")
    setCurrentView("results")

    // Simulate multi-stage search
    await new Promise((r) => setTimeout(r, 1000))
    setSearchStage("extracting")
    await new Promise((r) => setTimeout(r, 1000))
    setSearchStage("normalizing")
    await new Promise((r) => setTimeout(r, 800))

    // Get results
    const results = await simulateSearch(school, sport)
    setResults(results)
    setSearchStage("complete")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header title="SKOUT 1.0" showDropdown />

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <h1 className="mb-7 text-center text-[32px] font-extrabold leading-tight text-foreground">
          Where do you
          <br />
          want to play?
        </h1>

        {/* School Input */}
        <div className="mb-3 w-full rounded-full bg-card px-6 py-5">
          <input
            type="text"
            placeholder="Search school name..."
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            className="w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Sport Selector */}
        <button
          onClick={() => setSportPickerOpen(true)}
          className="mb-3 flex w-full items-center justify-between rounded-full bg-card px-6 py-5"
        >
          <span className={`text-[15px] ${sport ? "text-foreground" : "text-muted-foreground"}`}>
            {sport || "Select sport type"}
          </span>
          <SlidersHorizontal size={22} className="text-primary" />
        </button>
      </div>

      {/* Bottom */}
      <div className="px-6 pb-9">
        <button
          onClick={handleSearch}
          disabled={!school.trim() && !sport}
          className="mb-4 w-full rounded-full bg-foreground py-5 text-base font-bold text-background transition-opacity disabled:opacity-50"
        >
          Find Opportunities
        </button>
        <p className="text-center text-[11px] font-semibold tracking-[0.15em] text-primary">
          POWERED BY SKOUT INTELLIGENCE
        </p>
      </div>

      {/* Sport Picker Modal */}
      {sportPickerOpen && (
        <SportPicker
          selected={sport}
          onSelect={(s) => {
            setSport(s)
            setSportPickerOpen(false)
          }}
          onClose={() => setSportPickerOpen(false)}
        />
      )}
    </div>
  )
}

interface SportPickerProps {
  selected: string
  onSelect: (sport: string) => void
  onClose: () => void
}

function SportPicker({ selected, onSelect, onClose }: SportPickerProps) {
  const [localSelected, setLocalSelected] = useState(selected)

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-card px-6 pb-10 pt-3 animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="mb-5 flex justify-center">
          <div className="h-1 w-10 rounded-full bg-muted-foreground" />
        </div>

        <h2 className="mb-1.5 text-2xl font-bold text-foreground">Select Sport</h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Which athletic program are you interested in?
        </p>

        {/* Sports List */}
        <div className="space-y-1">
          {SPORTS.map((sport) => {
            const isSelected = localSelected === sport.value
            return (
              <button
                key={sport.value}
                onClick={() => setLocalSelected(sport.value)}
                className={`flex w-full items-center gap-3.5 rounded-xl border-b border-border px-1 py-3.5 ${
                  isSelected ? "bg-primary/10" : ""
                }`}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${sport.color}20` }}
                >
                  <span className="text-lg" style={{ color: sport.color }}>
                    {sport.label === "Football" && "🏈"}
                    {sport.label === "Basketball" && "🏀"}
                    {sport.label === "Soccer" && "⚽"}
                    {sport.label === "Track & Field" && "🏃"}
                    {sport.label === "Baseball" && "⚾"}
                    {sport.label === "Volleyball" && "🏐"}
                    {sport.label === "Field Hockey" && "🏑"}
                    {sport.label === "Wrestling" && "🤼"}
                  </span>
                </div>
                <span className={`flex-1 text-left text-base font-medium ${isSelected ? "text-primary font-semibold" : "text-foreground"}`}>
                  {sport.label}
                </span>
                {isSelected && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                    <Check size={14} className="text-foreground" />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Done Button */}
        <button
          onClick={() => onSelect(localSelected)}
          className="mt-6 w-full rounded-full bg-foreground py-4 text-base font-bold text-background"
        >
          Done
        </button>
      </div>
    </>
  )
}
