import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EditableDeletableItemList,
  type ListItem,
} from "@/components/admin/pedago/EditableDeletableItemList";
import { FileText, Folder, Layers, Plus } from "lucide-react";
import { useState } from "react";
import { MajorIconMap } from "@/config/icons";

// ── Types ──────────────────────────────────────────────

export interface RefMajor {
  id: number;
  name: string;
  icon?: string;
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
  // Majors
  onMajorAdded: (major: string, icon?: string) => Promise<void>;
  onMajorUpdated: (id: number, name: string, icon?: string) => Promise<void>;
  onMajorDeleted: (id: number) => Promise<void>;
  // Levels
  onLevelAdded: (level: string) => Promise<void>;
  onLevelUpdated: (id: number, name: string) => Promise<void>;
  onLevelDeleted: (id: number) => Promise<void>;
  // ExamTypes
  onExamTypeAdded: (examType: string) => Promise<void>;
  onExamTypeUpdated: (id: number, name: string) => Promise<void>;
  onExamTypeDeleted: (id: number) => Promise<void>;
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
      <Button size="sm" onClick={() => name.trim() && onSubmit(name.trim())}>
        OK
      </Button>
      <Button size="sm" variant="outline" onClick={onCancel}>
        Annuler
      </Button>
    </div>
  );
}

function RenameMajorForm({
  initialName,
  initialIcon,
  onSubmit,
  onCancel,
}: {
  initialName: string;
  initialIcon?: string;
  onSubmit: (name: string, icon?: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [icon, setIcon] = useState(initialIcon || "Book");

  return (
    <div className="flex gap-2 p-2 border rounded-lg bg-muted flex-wrap">
      <Select value={icon} onValueChange={setIcon}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Icône" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(MajorIconMap).map(([iconName, IconComp]) => (
            <SelectItem key={iconName} value={iconName}>
              <div className="flex items-center gap-2">
                <IconComp size={16} />
                <span>{iconName}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) onSubmit(name.trim(), icon);
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Nom..."
        className="flex-1 h-9"
      />
      <Button
        size="sm"
        onClick={() => name.trim() && onSubmit(name.trim(), icon)}
        className="h-9"
      >
        OK
      </Button>
      <Button size="sm" variant="outline" onClick={onCancel} className="h-9">
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
  onMajorAdded,
  onMajorUpdated,
  onMajorDeleted,
  onLevelAdded,
  onLevelUpdated,
  onLevelDeleted,
  onExamTypeAdded,
  onExamTypeUpdated,
  onExamTypeDeleted,
}: RefDialogProps) {
  const [newItemName, setNewItemName] = useState("");
  const [newItemIcon, setNewItemIcon] = useState("Book");
  const [activeTab, setActiveTab] = useState("majors");

  // ── Add ──

  const handleAdd = async () => {
    const name = newItemName.trim();
    if (!name) return;

    try {
      if (activeTab === "majors") {
        await onMajorAdded(name, newItemIcon);
      } else if (activeTab === "levels") {
        await onLevelAdded(name);
      } else {
        await onExamTypeAdded(name);
      }
      setNewItemName("");
      setNewItemIcon("Book");
    } catch (error) {
      throw error;
    }
  };

  // ── Rename ──

  const handleRename = async (id: number, name: string, icon?: string) => {
    try {
      if (activeTab === "majors") {
        await onMajorUpdated(id, name, icon);
      } else if (activeTab === "levels") {
        await onLevelUpdated(id, name);
      } else {
        await onExamTypeUpdated(id, name);
      }
    } catch (error) {
      throw error;
    }
  };

  // ── Delete ──

  const handleDelete = async (item: ListItem) => {
    try {
      if (activeTab === "majors") {
        await onMajorDeleted(item.id);
      } else if (activeTab === "levels") {
        await onLevelDeleted(item.id);
      } else {
        await onExamTypeDeleted(item.id);
      }
    } catch (error) {
      throw error;
    }
  };

  // ── Build list items ──

  const majorItems: ListItem[] = majors.map((m) => ({
    id: m.id,
    name: m.name,
    icon: m.icon,
    badges: [{ id: m.id, label: m.name }],
  }));

  const levelItems: ListItem[] = levels.map((l) => ({
    id: l.id,
    name: l.name,
  }));

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
            Gérez les filières, niveaux et types d'examen de votre
            établissement.
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
          <TabsContent
            value={activeTab}
            className="flex-1 overflow-hidden flex flex-col"
            forceMount
          >
            {/* Add bar */}
            <div className="flex gap-2 px-6 py-4">
              {activeTab === "majors" && (
                <Select value={newItemIcon} onValueChange={setNewItemIcon}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Icône" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MajorIconMap).map(
                      ([iconName, IconComp]) => (
                        <SelectItem key={iconName} value={iconName}>
                          <div className="flex items-center gap-2">
                            <IconComp size={16} />
                            <span>{iconName}</span>
                          </div>
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              )}
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
                renderForm={(item, onCancel) => {
                  if (activeTab === "majors") {
                    return (
                      <RenameMajorForm
                        initialName={item.name}
                        initialIcon={item.icon}
                        onSubmit={(name, icon) => {
                          handleRename(item.id, name, icon);
                          onCancel();
                        }}
                        onCancel={onCancel}
                      />
                    );
                  }
                  return (
                    <RenameForm
                      initialName={item.name}
                      onSubmit={(name) => {
                        handleRename(item.id, name);
                        onCancel();
                      }}
                      onCancel={onCancel}
                    />
                  );
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
