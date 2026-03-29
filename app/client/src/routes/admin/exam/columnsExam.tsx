import type { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, Check, AlertCircle, FileStack } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export type Exam = {
  id: number
  course: string
  type: string
  level: string
  major: string
  year: number
  path: string
  isVerified: boolean
  annexeCount: number
}

type ColumnActions = {
  onDelete: (exam: Exam) => void
  onOpenDetails: (exam: Exam) => void
}

export const createColumnsExam = ({ onDelete, onOpenDetails }: ColumnActions): ColumnDef<Exam>[] => [
  {
    accessorKey: 'year',
    header: 'Année',
    cell: ({ row }) => <span className="font-semibold text-sm">{row.original.year}</span>,
  },
  {
    accessorKey: 'major',
    header: 'Spécialité',
    cell: ({ row }) => <span className="text-sm">{row.original.major}</span>,
  },
  {
    accessorKey: 'level',
    header: 'Niveau',
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {row.original.level}
      </Badge>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant="secondary" className="text-xs">
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: 'course',
    header: 'Cours',
    cell: ({ row }) => <span className="text-sm font-medium">{row.original.course}</span>,
  },
  {
    id: 'status',
    header: 'État',
    cell: ({ row }) => {
      const isVerified = row.original.isVerified
      return (
        <div className="flex items-center gap-2">
          {isVerified ? (
            <Badge className="bg-green-500/20 text-green-700 border-green-200 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Vérifié
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-200 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              En attente
            </Badge>
          )}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    id: 'annexes',
    header: 'Annexes',
    cell: ({ row }) => (
      <div className="flex items-center gap-2 text-sm">
        <FileStack className="h-4 w-4 opacity-60" />
        <span className="font-medium">{row.original.annexeCount}</span>
      </div>
    ),
    accessorFn: (row) => row.annexeCount,
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
            className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline ml-2 text-xs">Gérer</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(exam)}
            title="Supprimer"
            className="hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline ml-2 text-xs">Supprimer</span>
          </Button>
        </div>
      )
    },
    enableSorting: false,
  },
]
