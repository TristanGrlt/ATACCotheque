import type { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export type Exam = {
  id: number
  course: string
  type: string
  level: string
  major: string
  year: number
}

type ColumnActions = {
  onDelete: (exam: Exam) => void
  onOpenDetails: (exam: Exam) => void
}

export const createColumnsExam = ({ onDelete, onOpenDetails }: ColumnActions): ColumnDef<Exam>[] => [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'course',
    header: 'Cours',
  },
  {
    accessorKey: 'type',
    header: 'Type',
  },
  {
    accessorKey: 'level',
    header: 'Niveau',
  },
  {
    accessorKey: 'major',
    header: 'Spécialité',
  },
  {
    accessorKey: 'year',
    header: 'Année',
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const exam = row.original
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onOpenDetails(exam)}
            title="Gérer les fichiers et annexes"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(exam)}
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
    enableSorting: false,
  },
]
