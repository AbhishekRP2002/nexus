import { useParams } from "react-router-dom"

export default function ReaderPage() {
  const { id } = useParams()

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Reader</h1>
      <p className="text-muted-foreground">Content ID: {id}</p>
    </div>
  )
}
