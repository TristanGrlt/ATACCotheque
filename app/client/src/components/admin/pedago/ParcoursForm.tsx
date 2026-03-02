import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toggle } from "@/components/ui/toggle";
import { useState, useEffect } from "react";

export interface Major {
  id: number;
  name: string;
}

export interface ParcoursFormData {
  name: string;
  majorIds: number[];
}

interface ParcoursFormProps {
  mode: "create" | "edit";
  initialData?: ParcoursFormData;
  majors: Major[];
  onSubmit: (data: ParcoursFormData) => void;
  onCancel: () => void;
}

export function ParcoursForm({
  mode,
  initialData,
  majors,
  onSubmit,
  onCancel,
}: ParcoursFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [selectedMajorIds, setSelectedMajorIds] = useState<number[]>(
    initialData?.majorIds ?? []
  );

  useEffect(() => {
    setName(initialData?.name ?? "");
    setSelectedMajorIds(initialData?.majorIds ?? []);
  }, [initialData]);

  const toggleMajor = (id: number) => {
    setSelectedMajorIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), majorIds: selectedMajorIds });
  };

  return (
    <div className="mb-4 p-3 border rounded-xl bg-muted">
      <FieldGroup>
        <Field>
          <Input
            placeholder="Nom du Parcours..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>Filières associées (depuis le référentiel)</FieldLabel>
          <ScrollArea>
            <div className="flex flex-wrap gap-2 max-h-32">
              {majors.map((major) => (
                <Toggle
                  key={major.id}
                  variant="outline"
                  pressed={selectedMajorIds.includes(major.id)}
                  onPressedChange={() => toggleMajor(major.id)}
                >
                  <span className={`px-2 py-1 rounded-full text-xs`}>
                    {major.name}
                  </span>
                </Toggle>
              ))}
            </div>
          </ScrollArea>
        </Field>
        <Field>
          <div className="flex gap-2">
            <Button onClick={handleSubmit}>
              {mode === "create" ? "Créer le parcours" : "Enregistrer"}
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
