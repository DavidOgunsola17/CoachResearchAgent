"use client"

import { cn } from "@/lib/utils"

interface SearchProgressProps {
  stage: "idle" | "discovering" | "extracting" | "normalizing" | "complete"
}

const STAGES = [
  { key: "discovering" as const, label: "Finding directories..." },
  { key: "extracting" as const, label: "Extracting coach data..." },
  { key: "normalizing" as const, label: "Cleaning up results..." },
]

function stageIndex(stage: SearchProgressProps["stage"]): number {
  switch (stage) {
    case "discovering":
      return 0
    case "extracting":
      return 1
    case "normalizing":
      return 2
    case "complete":
      return 3
    default:
      return -1
  }
}

export default function SearchProgress({ stage }: SearchProgressProps) {
  const currentIndex = stageIndex(stage)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-10">
      {/* Spinner */}
      <div className="mb-8 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />

      {/* Stages */}
      <div className="mb-8 space-y-4">
        {STAGES.map((s, i) => {
          const isActive = s.key === stage
          const isDone = currentIndex > i

          return (
            <div key={s.key} className="flex items-center gap-3">
              <div
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  isDone && "bg-green-500",
                  isActive && "bg-primary",
                  !isDone && !isActive && "bg-secondary"
                )}
              />
              <span
                className={cn(
                  "text-[15px]",
                  isDone && "text-green-500",
                  isActive && "font-semibold text-foreground",
                  !isDone && !isActive && "text-muted-foreground"
                )}
              >
                {isDone ? s.label.replace("...", " ✓") : s.label}
              </span>
            </div>
          )
        })}
      </div>

      <p className="text-sm text-muted-foreground">This may take up to a minute</p>
    </div>
  )
}
