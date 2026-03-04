import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiRequest, getRequestMessage } from '@/services/api'
import { toast } from 'sonner'
import type { Exam } from '@/routes/admin/exam/columnsExam'

interface ExamFormDialogProps {
  exam: Exam | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

export function ExamFormDialog({ exam, open, onOpenChange, onSaved }: ExamFormDialogProps) {
  const [year, setYear] = useState(exam?.year.toString() ?? '')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!exam) return

      setIsLoading(true)
      try {
        await apiRequest.put(`/exam/${exam.id}`, {
          year: parseInt(year, 10),
        })
        toast.success('Examen mise à jour avec succès')
        onOpenChange(false)
        onSaved?.()
      } catch (err) {
        toast.error(`Erreur: ${getRequestMessage(err)}`)
      } finally {
        setIsLoading(false)
      }
    },
    [exam, year, onOpenChange, onSaved]
  )

  if (!exam) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier l'examen</DialogTitle>
          <DialogDescription>
            ID: {exam.id} | Cours: {exam.course}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Cours</Label>
            <Input value={exam.course} disabled className="bg-muted" />
          </div>
          
          <div>
            <Label>Type</Label>
            <Input value={exam.type} disabled className="bg-muted" />
          </div>
          
          <div>
            <Label>Niveau</Label>
            <Input value={exam.level} disabled className="bg-muted" />
          </div>
          
          <div>
            <Label>Spécialité</Label>
            <Input value={exam.major} disabled className="bg-muted" />
          </div>
          
          <div>
            <Label htmlFor="year">Année *</Label>
            <Input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2024"
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
