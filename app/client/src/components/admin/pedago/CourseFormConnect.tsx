import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { apiRequest } from "@/services/api";
import { toast } from "sonner";

export interface Course {
  id: number;
  name: string;
  semestre: number;
  levelId: number;
  parcoursIds: number[];
  examTypeIds: number[];
}

export interface CourseFormConnectData {
  courseId: number;
}

interface CourseFormConnectProps {
  onSubmit: (data: CourseFormConnectData) => void;
  onCancel: () => void;
}

export function CourseFormConnect({
  onSubmit,
  onCancel,
}: CourseFormConnectProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const { data } = await apiRequest.get("/course");
        setCourses(data);
      } catch (error) {
        toast.error("Erreur lors du chargement des cours");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleSubmit = () => {
    if (!selectedCourseId) return;
    onSubmit({ courseId: Number(selectedCourseId) });
  };

  return (
    <div className="mb-4 p-3 border rounded-xl bg-muted">
      <FieldGroup>
        <Field>
          <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
            <SelectTrigger className="w-full" disabled={isLoading}>
              <SelectValue
                placeholder={
                  isLoading ? "Chargement..." : "Sélectionner un cours"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Cours disponibles</SelectLabel>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.name} (S{course.semestre})
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!selectedCourseId || isLoading}
            >
              Sélectionner
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </Field>
      </FieldGroup>
    </div>
  );
}
