import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toggle } from "@/components/ui/toggle";
import { useState, useEffect } from "react";

export interface ExamType {
  id: number;
  name: string;
}

export interface CourseFormData {
  name: string;
  semestre: number;
  examTypeIds: number[];
}

interface CourseFormProps {
  mode: "create" | "edit";
  initialData?: CourseFormData;
  examTypes: ExamType[];
  onSubmit: (data: CourseFormData) => void;
  onCancel: () => void;
}

export function CourseForm({
  mode,
  initialData,
  examTypes,
  onSubmit,
  onCancel,
}: CourseFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [semestre, setSemestre] = useState(initialData?.semestre ?? 1);
  const [selectedExamTypeIds, setSelectedExamTypeIds] = useState<number[]>(
    initialData?.examTypeIds ?? []
  );

  useEffect(() => {
    setName(initialData?.name ?? "");
    setSemestre(initialData?.semestre ?? 1);
    setSelectedExamTypeIds(initialData?.examTypeIds ?? []);
  }, [initialData]);

  const toggleExamType = (id: number) => {
    setSelectedExamTypeIds((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      semestre,
      examTypeIds: selectedExamTypeIds,
    });
  };

  return (
    <div className="mb-4 p-3 border rounded-xl bg-muted">
      <FieldGroup>
        <div className="grid grid-cols-3 gap-4">
          <Field className="col-span-2">
            <FieldLabel>Nom du cours</FieldLabel>
            <Input
              placeholder="Ex : Algorithmique"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Semestre</FieldLabel>
            <Input
              type="number"
              min={1}
              value={semestre}
              onChange={(e) => setSemestre(Number(e.target.value))}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel>Types d'examen associés</FieldLabel>
          <ScrollArea>
            <div className="flex flex-wrap gap-2 max-h-32">
              {examTypes.map((examType) => (
                <Toggle
                  key={examType.id}
                  variant="outline"
                  pressed={selectedExamTypeIds.includes(examType.id)}
                  onPressedChange={() => toggleExamType(examType.id)}
                >
                  <span className="px-2 py-1 rounded-full text-xs">
                    {examType.name}
                  </span>
                </Toggle>
              ))}
            </div>
          </ScrollArea>
        </Field>
        <Field>
          <div className="flex gap-2">
            <Button onClick={handleSubmit}>
              {mode === "create" ? "Créer le cours" : "Enregistrer"}
            </Button>
            {mode === "edit" && (
              <Button variant="outline" onClick={onCancel}>
                Annuler
              </Button>
            )}
          </div>
        </Field>
      </FieldGroup>
    </div>
  );
}
