import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditableDeletableItemList, type ListItem } from "@/components/admin/pedago/EditableDeletableItemList";
import { FileText, Folder, Layers, Network, Plus } from "lucide-react";
import { useState } from "react";

// ── Types ──────────────────────────────────────────────

export interface RefMajor {
  id: number;
  name: string;
  color: string;
}

export interface RefLevel {
  id: number;
  name: string;
}

export interface RefExamType {
  id: number;
  name: string;
}

interface RefDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  majors: RefMajor[];
  levels: RefLevel[];
  examTypes: RefExamType[];
  onMajorsChange: (majors: RefMajor[]) => void;
  onLevelsChange: (levels: RefLevel[]) => void;
  onExamTypesChange: (examTypes: RefExamType[]) => void;
}

// ── Couleurs cycliques pour les filières ───────────────

const MAJOR_COLORS = [
  "bg-blue-100 text-blue-800",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-purple-100 text-purple-800",
  "bg-rose-100 text-rose-800",
  "bg-cyan-100 text-cyan-800",
  "bg-orange-100 text-orange-800",
  "bg-indigo-100 text-indigo-800",
];

function getMajorColor(index: number) {
  return MAJOR_COLORS[index % MAJOR_COLORS.length];
}

// ── Inline rename form (simple input + cancel) ────────

function RenameForm({
  initialName,
  onSubmit,
  onCancel,
}: {
  initialName: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);

  return (
    <div className="flex gap-2 p-2 border rounded-lg bg-muted">
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) onSubmit(name.trim());
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Nom..."
      />
      <Button
        size="sm"
        onClick={() => name.trim() && onSubmit(name.trim())}
      >
        OK
      </Button>
      <Button size="sm" variant="outline" onClick={onCancel}>
        Annuler
      </Button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────

export function RefDialog({
  open,
  onOpenChange,
  majors,
  levels,
  examTypes,
  onMajorsChange,
  onLevelsChange,
  onExamTypesChange,
}: RefDialogProps) {
  const [newItemName, setNewItemName] = useState("");
  const [activeTab, setActiveTab] = useState("majors");

  const generateId = () => Date.now() + Math.floor(Math.random() * 1000);

  // ── Add ──

  const handleAdd = () => {
    const name = newItemName.trim();
    if (!name) return;

    if (activeTab === "majors") {
      onMajorsChange([
        ...majors,
        { id: generateId(), name, color: getMajorColor(majors.length) },
      ]);
    } else if (activeTab === "levels") {
      onLevelsChange([...levels, { id: generateId(), name }]);
    } else {
      onExamTypesChange([...examTypes, { id: generateId(), name }]);
    }
    setNewItemName("");
  };

  // ── Rename ──

  const handleRename = (id: number | string, name: string) => {
    if (activeTab === "majors") {
      onMajorsChange(majors.map((m) => (m.id === id ? { ...m, name } : m)));
    } else if (activeTab === "levels") {
      onLevelsChange(levels.map((l) => (l.id === id ? { ...l, name } : l)));
    } else {
      onExamTypesChange(examTypes.map((e) => (e.id === id ? { ...e, name } : e)));
    }
  };

  // ── Delete ──

  const handleDelete = (item: ListItem) => {
    if (activeTab === "majors") {
      onMajorsChange(majors.filter((m) => m.id !== item.id));
    } else if (activeTab === "levels") {
      onLevelsChange(levels.filter((l) => l.id !== item.id));
    } else {
      onExamTypesChange(examTypes.filter((e) => e.id !== item.id));
    }
  };

  // ── Build list items ──

  const majorItems: ListItem[] = majors.map((m) => ({
    id: m.id,
    name: m.name,
    badges: [{ id: m.id, label: m.name, className: m.color }],
  }));

  const levelItems: ListItem[] = levels.map((l) => ({ id: l.id, name: l.name }));

  const examTypeItems: ListItem[] = examTypes.map((e) => ({
    id: e.id,
    name: e.name,
  }));

  const activeItems =
    activeTab === "majors"
      ? majorItems
      : activeTab === "levels"
        ? levelItems
        : examTypeItems;

  const deleteLabel =
    activeTab === "majors"
      ? "cette filière"
      : activeTab === "levels"
        ? "ce niveau"
        : "ce type d'examen";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            Référentiels Globaux
          </DialogTitle>
          <DialogDescription>
            Gérez les filières, niveaux et types d'examen de votre établissement.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v);
            setNewItemName("");
          }}
          className="flex-1 flex flex-col gap-0 overflow-hidden"
        >
          <TabsList variant="line" className="w-full border-b px-6">
            <TabsTrigger value="majors" className="gap-1.5">
              <Folder size={15} />
              <span className="hidden sm:inline">Filières</span>
              <span className="sm:hidden">Filières</span>
            </TabsTrigger>
            <TabsTrigger value="levels" className="gap-1.5">
              <Layers size={15} />
              Niveaux
            </TabsTrigger>
            <TabsTrigger value="exams" className="gap-1.5">
              <FileText size={15} />
              Examens
            </TabsTrigger>
          </TabsList>

          {/* Single shared content area — rendered from the active tab */}
          <TabsContent value={activeTab} className="flex-1 overflow-hidden flex flex-col" forceMount>
            {/* Add bar */}
            <div className="flex gap-2 px-6 py-4">
              <Input
                className="flex-1"
                placeholder="Nom..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <Button size="sm" onClick={handleAdd} className="shrink-0">
                <Plus size={16} />
              </Button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <EditableDeletableItemList
                items={activeItems}
                onDelete={handleDelete}
                deleteLabel={deleteLabel}
                emptyMessage="Aucun élément"
                renderForm={(item, onCancel) => (
                  <RenameForm
                    initialName={item.name}
                    onSubmit={(name) => {
                      handleRename(item.id, name);
                      onCancel();
                    }}
                    onCancel={onCancel}
                  />
                )}
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}