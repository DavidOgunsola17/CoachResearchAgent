"use client"

import { useState, useRef } from "react"
import { ArrowLeft, Zap, User, School, Pen, Star, Play } from "lucide-react"
import { useAppStore, SMART_VARIABLES, Template } from "@/lib/store"

export default function TemplateEditorScreen() {
  const { templates, editingTemplateIndex, addTemplate, updateTemplate, setCurrentView } =
    useAppStore()

  const isEditing = editingTemplateIndex >= 0 && editingTemplateIndex < templates.length
  const existingTemplate = isEditing ? templates[editingTemplateIndex] : null

  const [name, setName] = useState(existingTemplate?.name ?? "")
  const [subjectLine, setSubjectLine] = useState(existingTemplate?.subject_line ?? "")
  const [messageBody, setMessageBody] = useState(existingTemplate?.message_body ?? "")

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertVariable = (placeholder: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newText = messageBody.slice(0, start) + placeholder + messageBody.slice(end)
    setMessageBody(newText)

    // Set cursor position after inserted variable
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + placeholder.length
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  const handleSave = () => {
    if (!name.trim()) {
      alert("Please enter a template name.")
      return
    }
    if (!messageBody.trim()) {
      alert("Please enter a message body.")
      return
    }

    const template: Template = {
      id: existingTemplate?.id ?? crypto.randomUUID(),
      name: name.trim(),
      subject_line: subjectLine.trim(),
      message_body: messageBody.trim(),
      is_default: existingTemplate?.is_default ?? false,
    }

    if (isEditing) {
      updateTemplate(template)
    } else {
      addTemplate(template)
    }

    setCurrentView("templates")
  }

  const hasHighlight = messageBody.includes("{HIGHLIGHTS}")

  const getVariableIcon = (label: string) => {
    if (label.includes("Coach")) return User
    if (label.includes("School")) return School
    if (label.includes("Sport")) return Pen
    if (label.includes("GPA")) return Star
    return User
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-14 pb-3">
        <button onClick={() => setCurrentView("templates")} className="p-1">
          <ArrowLeft size={24} className="text-foreground" />
        </button>
        <span className="text-xl font-black tracking-[0.2em] text-foreground">SKOUT</span>
        <button onClick={handleSave} className="text-[17px] font-bold text-destructive">
          Save
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-10">
        {/* Template Name */}
        <div className="mt-5">
          <label className="mb-2.5 block text-sm font-bold text-foreground">Template Name</label>
          <div className="rounded-2xl bg-card px-4 py-3.5">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter template name"
              className="w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Subject Line */}
        <div className="mt-5">
          <label className="mb-2.5 block text-sm font-bold text-foreground">Subject Line</label>
          <div className="rounded-2xl bg-card px-4 py-3.5">
            <input
              type="text"
              value={subjectLine}
              onChange={(e) => setSubjectLine(e.target.value)}
              placeholder="Enter email subject line"
              className="w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Message Content */}
        <div className="mt-5">
          <label className="mb-2.5 block text-sm font-bold text-foreground">Message Content</label>
          <div className="rounded-2xl bg-card p-4">
            <textarea
              ref={textareaRef}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder="Tap to start typing..."
              className="min-h-[120px] w-full resize-none bg-transparent text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
            />

            {/* Highlight Video Thumbnail */}
            {hasHighlight && (
              <div className="relative mt-4 flex h-36 items-center justify-center rounded-xl bg-red-500">
                <div className="flex h-13 w-13 items-center justify-center rounded-full bg-black/40">
                  <Play size={28} className="ml-1 text-foreground" />
                </div>
                <div className="absolute bottom-2.5 left-2.5 rounded-md bg-black/50 px-2.5 py-1">
                  <span className="text-[11px] font-bold tracking-wide text-foreground">
                    {"{HIGHLIGHTS}"}
                  </span>
                </div>
              </div>
            )}

            <p className="mt-3 text-sm italic text-muted-foreground">Tap to continue typing...</p>
          </div>
        </div>

        {/* Smart Variables */}
        <div className="mt-7">
          <div className="mb-3.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap size={18} className="text-amber-500" />
              <span className="text-lg font-extrabold text-foreground">Smart Variables</span>
            </div>
            <span className="text-[13px] text-muted-foreground">Tap to insert</span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {SMART_VARIABLES.map((v) => {
              const Icon = getVariableIcon(v.label)
              return (
                <button
                  key={v.placeholder}
                  onClick={() => insertVariable(v.placeholder)}
                  className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2.5"
                  style={{ backgroundColor: `${v.color}18` }}
                >
                  <Icon size={16} style={{ color: v.color }} />
                  <span className="text-sm font-semibold" style={{ color: v.color }}>
                    {v.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
