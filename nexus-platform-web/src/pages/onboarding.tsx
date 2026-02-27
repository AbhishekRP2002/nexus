import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Zap, Globe, Linkedin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const steps = [
  { id: 1, label: "Account" },
  { id: 2, label: "Sources" },
  { id: 3, label: "Ready" },
]

const sources = [
  {
    id: "twitter",
    name: "Twitter / X",
    icon: () => (
      <div className="flex size-10 items-center justify-center rounded-lg bg-sky-500/15">
        <span className="text-lg font-bold text-sky-400">𝕏</span>
      </div>
    ),
    description: "Auto-sync your bookmarks. Threads get unrolled and links get followed.",
    action: "Connect Twitter",
    actionVariant: "default" as const,
    recommended: true,
    available: true,
    footnote: null,
  },
  {
    id: "web",
    name: "Web Pages",
    icon: () => (
      <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/15">
        <Globe className="size-5 text-emerald-400" />
      </div>
    ),
    description: "Paste any URL to extract and distill articles, blog posts, and papers.",
    action: "Always available",
    actionVariant: "outline" as const,
    recommended: false,
    available: true,
    footnote: null,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: () => (
      <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/15">
        <Linkedin className="size-5 text-blue-400" />
      </div>
    ),
    description: "Paste LinkedIn post URLs to capture insights from your professional feed.",
    action: "Manual URL only",
    actionVariant: "outline" as const,
    recommended: false,
    available: false,
    footnote: "AUTO-SYNC COMING SOON",
  },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [currentStep] = useState(2) // Sources step

  function handleConnect(sourceId: string) {
    if (sourceId === "twitter") {
      // Will redirect to Twitter OAuth later
      globalThis.location.assign(`${import.meta.env.VITE_API_BASE_URL}/api/auth/twitter`)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 pt-20">
      {/* Progress dots */}
      <div className="mb-10 flex items-center gap-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              "h-1 w-8 rounded-full transition-colors",
              step.id < currentStep
                ? "bg-primary"
                : step.id === currentStep
                  ? "bg-primary"
                  : "bg-muted",
            )}
          />
        ))}
      </div>

      {/* Icon */}
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
        <Zap className="size-7 text-primary" />
      </div>

      {/* Heading */}
      <h1 className="mb-3 text-center text-3xl font-semibold text-foreground">
        Connect your sources
      </h1>
      <p className="mb-10 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
        Nexus automatically syncs content from your connected accounts. Start with Twitter for
        instant bookmark import, or skip and add content manually.
      </p>

      {/* Source cards */}
      <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        {sources.map((source) => (
          <Card
            key={source.id}
            className={cn(
              "relative gap-0 py-0 transition-colors",
              source.recommended ? "border-primary/40 bg-card/60" : "border-border/40 bg-card/30",
            )}
          >
            {source.recommended && (
              <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider">
                Recommended
              </Badge>
            )}
            <CardContent className="flex flex-col gap-4 p-5 pt-6">
              <source.icon />
              <div>
                <h3 className="text-sm font-semibold text-foreground">{source.name}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {source.description}
                </p>
              </div>
              <div className="mt-auto">
                <Button
                  variant={source.actionVariant}
                  className="w-full"
                  disabled={!source.available && source.id !== "web"}
                  onClick={() => handleConnect(source.id)}
                >
                  {source.action}
                </Button>
                {source.footnote && (
                  <p className="mt-2 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                    {source.footnote}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Skip link */}
      <button
        onClick={() => navigate("/")}
        className="mt-8 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Skip for now, I'll add content manually &rarr;
      </button>
    </div>
  )
}
