import { useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Highlight from "@tiptap/extension-highlight"
import Typography from "@tiptap/extension-typography"
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Heading3,
  Undo2,
  Redo2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface TiptapEditorProps {
  content: string
  editable: boolean
  onUpdate?: (html: string) => void
  placeholder?: string
  className?: string
}

interface ToolbarAction {
  icon: React.ElementType
  label: string
  action: () => void
  isActive?: () => boolean
}

function EditorToolbar({ actions }: { actions: ToolbarAction[] }) {
  return (
    <div className="flex items-center gap-0.5 border-b border-border/40 bg-muted/20 px-2 py-1">
      {actions.map((item) => (
        <Tooltip key={item.label}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "size-7 rounded-md",
                item.isActive?.()
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={item.action}
            >
              <item.icon className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {item.label}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}

export function TiptapEditor({
  content,
  editable,
  onUpdate,
  placeholder = "Start writing...",
  className,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Highlight,
      Typography,
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[1.5em]",
        "data-placeholder": placeholder,
      },
    },
    onUpdate: ({ editor: e }) => {
      onUpdate?.(e.getHTML())
    },
  })

  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable)
    }
  }, [editor, editable])

  if (!editor) return null

  const toolbarActions: ToolbarAction[] = [
    {
      icon: Heading2,
      label: "Heading 2",
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: () => editor.isActive("heading", { level: 2 }),
    },
    {
      icon: Heading3,
      label: "Heading 3",
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: () => editor.isActive("heading", { level: 3 }),
    },
    {
      icon: Bold,
      label: "Bold",
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive("bold"),
    },
    {
      icon: Italic,
      label: "Italic",
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive("italic"),
    },
    {
      icon: Strikethrough,
      label: "Strikethrough",
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive("strike"),
    },
    {
      icon: Code,
      label: "Code",
      action: () => editor.chain().focus().toggleCode().run(),
      isActive: () => editor.isActive("code"),
    },
    {
      icon: List,
      label: "Bullet List",
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: () => editor.isActive("bulletList"),
    },
    {
      icon: ListOrdered,
      label: "Ordered List",
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: () => editor.isActive("orderedList"),
    },
    {
      icon: Quote,
      label: "Blockquote",
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: () => editor.isActive("blockquote"),
    },
    {
      icon: Undo2,
      label: "Undo",
      action: () => editor.chain().focus().undo().run(),
    },
    {
      icon: Redo2,
      label: "Redo",
      action: () => editor.chain().focus().redo().run(),
    },
  ]

  return (
    <div
      className={cn(
        "tiptap-content",
        editable && "rounded-lg border border-border/40 bg-card/20",
        className,
      )}
    >
      {editable && <EditorToolbar actions={toolbarActions} />}
      <div className={cn(editable && "px-4 py-3")}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
