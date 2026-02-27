import { useState } from "react"
import { Link2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

function isValidUrl(str: string) {
  try {
    const url = new URL(str)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export function AddUrlDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [url, setUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = url.trim()

    if (!trimmed) return

    if (!isValidUrl(trimmed)) {
      toast.error("Invalid URL", {
        description: "Please enter a valid HTTP or HTTPS URL.",
      })
      return
    }

    setIsSubmitting(true)

    // Simulate API call — replace with actual api.post() later
    setTimeout(() => {
      toast.success("Content added", {
        description: "Processing now — it will appear in your Feed shortly.",
      })
      setUrl("")
      setIsSubmitting(false)
      onOpenChange(false)
    }, 600)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="size-4 text-primary" />
            Add URL
          </DialogTitle>
          <DialogDescription>
            Paste a URL to extract and distill its content into your knowledge base.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="py-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article..."
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!url.trim() || isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Content"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
