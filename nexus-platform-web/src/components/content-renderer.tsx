import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Highlight from "@tiptap/extension-highlight"
import Typography from "@tiptap/extension-typography"

interface ContentRendererProps {
  content: string
}

export default function ContentRenderer({ content }: ContentRendererProps) {
  const editor = useEditor({
    extensions: [StarterKit, Highlight, Typography],
    content,
    editable: false,
  })

  return (
    <div className="prose prose-neutral max-w-none dark:prose-invert">
      <EditorContent editor={editor} />
    </div>
  )
}
