"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useAppStore } from "@/lib/store"

export default function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)

  const { setLoggedIn, setCurrentView } = useAppStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return

    setLoading(true)
    // Simulate login delay
    await new Promise((resolve) => setTimeout(resolve, 800))
    setLoading(false)
    setLoggedIn(true, email)
    setCurrentView("search")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Logo Section */}
      <div className="flex flex-1 flex-col items-center justify-center">
        <h1 className="text-5xl font-black tracking-[0.2em] text-foreground">SKOUT</h1>
        <div className="mt-2 h-1 w-10 rounded-full bg-foreground" />
      </div>

      {/* Welcome Card */}
      <div className="mx-4 mb-6 rounded-3xl bg-card p-6 pb-8">
        <h2 className="mb-2 text-2xl font-bold text-foreground">Welcome to SKOUT</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Find Coaches. Save Contacts. Reach
          <br />
          Out Fast. Start your journey here.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Email Input */}
          <div className="rounded-xl border border-border bg-secondary px-4 py-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Password Input */}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-3">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="mt-2 w-full rounded-full bg-primary py-4 text-base font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : isSignUp ? (
              "Create Account"
            ) : (
              "Continue with Email"
            )}
          </button>
        </form>

        {/* Toggle Sign In / Sign Up */}
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="mt-4 w-full text-center text-sm text-primary"
        >
          {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
        </button>

        {/* Divider */}
        <div className="mt-5 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Social Buttons */}
        <div className="mt-5 flex gap-4">
          <button className="flex flex-1 items-center justify-center rounded-2xl border border-border bg-secondary py-4">
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-foreground">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
          </button>
          <button className="flex flex-1 items-center justify-center rounded-2xl border border-border bg-secondary py-4">
            <svg viewBox="0 0 24 24" className="h-6 w-6">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
