"use client"

import { useAppStore } from "@/lib/store"
import LoginScreen from "./login-screen"
import SearchScreen from "./search-screen"
import ResultsScreen from "./results-screen"
import CoachProfileScreen from "./coach-profile-screen"
import ContactsScreen from "./contacts-screen"
import TemplatesScreen from "./templates-screen"
import TemplateEditorScreen from "./template-editor-screen"
import SettingsScreen from "./settings-screen"
import Drawer from "./drawer"

export default function SkoutApp() {
  const { currentView } = useAppStore()

  const renderScreen = () => {
    switch (currentView) {
      case "login":
        return <LoginScreen />
      case "search":
        return <SearchScreen />
      case "results":
        return <ResultsScreen />
      case "profile":
        return <CoachProfileScreen />
      case "contacts":
        return <ContactsScreen />
      case "templates":
        return <TemplatesScreen />
      case "template-editor":
        return <TemplateEditorScreen />
      case "settings":
        return <SettingsScreen />
      default:
        return <LoginScreen />
    }
  }

  return (
    <div className="relative mx-auto min-h-screen max-w-md bg-background">
      {renderScreen()}
      {currentView !== "login" && <Drawer />}
    </div>
  )
}
