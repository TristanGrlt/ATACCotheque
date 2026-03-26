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

export interface Level {
  id: number;
  name: string;
}

export interface LevelFormData {
  levelId: number | null;
}

interface LevelFormProps {
  mode: "create" | "edit";
  initialData?: LevelFormData;
  levels: Level[];
  onSubmit: (data: LevelFormData) => void;
  onCancel: () => void;
}

export function LevelForm({
  mode,
  initialData,
  levels,
  onSubmit,
  onCancel,
}: LevelFormProps) {
  const [selectedLevelId, setSelectedLevelId] = useState<string>(
    initialData?.levelId?.toString() ?? ""
  );

  useEffect(() => {
    setSelectedLevelId(initialData?.levelId?.toString() ?? "");
  }, [initialData]);

  const handleSubmit = () => {
    if (!selectedLevelId) return;
    onSubmit({ levelId: Number(selectedLevelId) });
  };

  return (
    <div className="mb-4 p-3 border rounded-xl bg-muted">
      <FieldGroup>
        <Field>
          <Select value={selectedLevelId} onValueChange={setSelectedLevelId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionner un niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Niveaux</SelectLabel>
                {levels.map((level) => (
                  <SelectItem key={level.id} value={level.id.toString()}>
                    {level.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <div className="flex gap-2">
            <Button onClick={handleSubmit}>
              {mode === "create" ? "Ajouter le niveau" : "Enregistrer"}
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
