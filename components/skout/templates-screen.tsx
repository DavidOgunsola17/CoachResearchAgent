"use client"

import { Menu, Edit3, Plus } from "lucide-react"
import { useAppStore, getTemplateColor } from "@/lib/store"

export default function TemplatesScreen() {
  const { templates, deleteTemplate, setEditingTemplateIndex, setCurrentView, setDrawerOpen } =
    useAppStore()

  const handleEdit = (index: number) => {
    setEditingTemplateIndex(index)
    setCurrentView("template-editor")
  }

  const handleCreate = () => {
    setEditingTemplateIndex(-1)
    setCurrentView("template-editor")
  }

  const handleDelete = (index: number) => {
    const template = templates[index]
    if (confirm(`Delete "${template.name}"? This cannot be undone.`)) {
      deleteTemplate(template.id)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-14 pb-3">
        <button onClick={() => setDrawerOpen(true)} className="p-1">
          <Menu size={26} className="text-foreground" />
        </button>
        <span className="text-xl font-black tracking-[0.2em] text-foreground">SKOUT</span>
        <div className="w-[26px]" />
      </header>

      {/* Title */}
      <div className="px-5 pb-5">
        <h1 className="text-[32px] font-extrabold text-foreground">Templates</h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Manage and generate your outreach templates here!
        </p>
      </div>

      {/* Template List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-3">
          {templates.map((template, index) => {
            const color = getTemplateColor(index)
            const preview =
              template.message_body.length > 35
                ? template.message_body.substring(0, 35) + "..."
                : template.message_body

            return (
              <button
                key={template.id}
                onClick={() => handleEdit(index)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  handleDelete(index)
                }}
                className="flex w-full items-center gap-3 rounded-2xl bg-card p-5 text-left"
              >
                <div className="flex-1">
                  <h3 className="mb-1.5 text-[17px] font-bold text-foreground">{template.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{preview}</p>
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${color}18` }}
                >
                  <Edit3 size={20} style={{ color }} />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Create Button */}
      <div className="px-5 pb-9 pt-2">
        <button
          onClick={handleCreate}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-4"
        >
          <Plus size={22} className="text-background" />
          <span className="text-base font-bold text-background">Create New Template</span>
        </button>
      </div>
    </div>
  )
}
