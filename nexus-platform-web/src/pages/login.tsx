import { Button } from "@/components/ui/button"
import { Sparkles, Target, Search } from "lucide-react"

const floatingTopics = [
  { label: "LLM Inference", x: "8%", y: "12%", delay: "0s" },
  { label: "RAG Pipelines", x: "55%", y: "8%", delay: "0.5s" },
  { label: "Distributed Systems", x: "38%", y: "22%", delay: "1s" },
  { label: "KV Cache Optimization", x: "5%", y: "55%", delay: "1.5s" },
  { label: "Embeddings", x: "58%", y: "52%", delay: "2s" },
  { label: "Attention Mechanisms", x: "8%", y: "78%", delay: "2.5s" },
  { label: "Vector Search", x: "48%", y: "75%", delay: "0.8s" },
]

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Distillation",
    description: "Key insights extracted from every piece of content you save",
    color: "text-amber-400",
  },
  {
    icon: Target,
    title: "Dynamic Taxonomy",
    description: "Your knowledge auto-organizes into a browsable hierarchy",
    color: "text-purple-400",
  },
  {
    icon: Search,
    title: "AI Search with Citations",
    description: "Ask questions, get answers sourced from your knowledge base",
    color: "text-rose-400",
  },
]

export default function LoginPage() {
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/auth/google`
  }

  return (
    <>
      {/* Left half — branding with floating topic bubbles */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-background" />

        {/* Floating topic bubbles */}
        {floatingTopics.map((topic) => (
          <div
            key={topic.label}
            className="absolute animate-float rounded-full border border-border/40 bg-card/60 px-4 py-2 text-[13px] font-medium text-muted-foreground backdrop-blur-sm"
            style={{
              left: topic.x,
              top: topic.y,
              animationDelay: topic.delay,
            }}
          >
            {topic.label}
          </div>
        ))}

        {/* Center branding */}
        <div className="relative flex h-full flex-col items-center justify-center px-12">
          <h1 className="bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent">
            Nexus
          </h1>
          <p className="mt-3 text-center text-lg text-muted-foreground">
            Your knowledge, distilled
            <br />
            and connected.
          </p>
        </div>
      </div>

      {/* Right half — sign in form */}
      <div className="flex w-full flex-col items-center justify-center px-8 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Mobile-only logo */}
          <div className="mb-8 lg:hidden">
            <h1 className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              Nexus
            </h1>
          </div>

          <h2 className="text-2xl font-semibold text-foreground">Welcome to Nexus</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to start building your personal knowledge system from the content you already
            save.
          </p>

          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            size="lg"
            className="mt-8 w-full gap-3 rounded-lg"
          >
            <svg className="size-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
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
            Continue with Google
          </Button>

          {/* Features */}
          <div className="mt-12">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
              What you get
            </p>
            <div className="space-y-4">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md bg-card p-1.5">
                    <feature.icon className={`size-4 ${feature.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{feature.title}</p>
                    <p className="text-[13px] text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-12 text-center text-xs text-muted-foreground/50">
            &copy; {new Date().getFullYear()} Nexus
          </p>
        </div>
      </div>
    </>
  )
}
