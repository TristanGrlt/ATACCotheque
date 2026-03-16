import { useEffect, useState, useCallback, type SyntheticEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  if (!exam) return null
  const [year, setYear] = useState(exam?.year.toString() ?? '')
  const [isLoading, setIsLoading] = useState(false)
  const [courseId, setCourseId] = useState<string>('')
  const [examTypeId, setExamTypeId] = useState<string>('')
  const [courses, setCourses] = useState<any[]>([])
  const [examTypes, setExamTypes] = useState<any[]>([])
  const [isFetchingOptions, setIsFetchingOptions] = useState(false)

  useEffect(() => {
    if (open) {
      const fetchOptions = async () => {
        setIsFetchingOptions(true)
        try {
          const [coursesRes, typesRes] = await Promise.all([
            apiRequest.get('/course'),
            apiRequest.get('/examType')
          ])
          setCourses(coursesRes.data?.data || coursesRes.data || [])
          setExamTypes(typesRes.data?.data || typesRes.data || [])
        } catch (err) {
          toast.error(`Erreur chargement options: ${getRequestMessage(err)}`)
        } finally {
          setIsFetchingOptions(false)
        }
      }
      fetchOptions()
    }
  }, [open])

  const handleSubmit = useCallback(
    async (e: SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!exam) return

      setIsLoading(true)
      try {
        const payload: Record<string, any> = { year: parseInt(year, 10) }
        if (courseId) payload.courseId = parseInt(courseId, 10)
        if (examTypeId) payload.examTypeId = parseInt(examTypeId, 10)
        await apiRequest.put(`/exam/${exam.id}`, payload)
        toast.success('Examen mise à jour avec succès')
        onOpenChange(false)
        onSaved?.()
      } catch (err) {
        toast.error(`Erreur: ${getRequestMessage(err)}`)
      } finally {
        setIsLoading(false)
      }
    },
    [exam, year, courseId, examTypeId, onOpenChange, onSaved]
  )

  const selectedCourseDetails = courses.find(c => c.id.toString() === courseId)

  const displayLevel = selectedCourseDetails?.level?.name ?? exam?.level ?? ''
  const displayMajor = selectedCourseDetails?.level?.major?.name ?? exam?.major ?? ''

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
            <Select disabled={isFetchingOptions} onValueChange={setCourseId} value={courseId}>
              <SelectTrigger>
                <SelectValue placeholder="Changer le cours..." />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Type</Label>
            <Select disabled={isFetchingOptions} onValueChange={setExamTypeId} value={examTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Changer le type..." />
              </SelectTrigger>
              <SelectContent>
                {examTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Niveau</Label>
            <Input value={displayLevel} disabled className="bg-muted" />
          </div>

          <div>
            <Label>Spécialité</Label>
            <Input value={displayMajor} disabled className="bg-muted" />
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
