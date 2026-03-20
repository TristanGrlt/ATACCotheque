import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  EditableDeletableItemList,
  type ListItem,
} from "@/components/admin/pedago/EditableDeletableItemList";
import {
  ParcoursForm,
  type ParcoursFormData,
  type Major,
} from "@/components/admin/pedago/ParcoursForm";
import {
  LevelForm,
  type LevelFormData,
  type Level,
} from "@/components/admin/pedago/LevelForm";
import {
  CourseForm,
  type CourseFormData,
  type ExamType,
} from "@/components/admin/pedago/CourseForm";
import { RefDialog } from "@/components/admin/pedago/refDialog";
import {
  ArrowLeft,
  BookOpen,
  Layers,
  Network,
  Plus,
  Settings,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiRequest, getRequestMessage } from "@/services/api";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  CourseFormConnect,
  type CourseFormConnectData,
} from "@/components/admin/pedago/CourseFormConnect";

// ── Data types ─────────────────────────────────────────

interface Parcours {
  id: number;
  name: string;
  majorIds: number[];
}

interface Course {
  id: number;
  name: string;
  semestre: number;
  levelId: number;
  parcoursIds: number[];
  examTypeIds: number[];
}

// ── Main page ──────────────────────────────────────────

export function Pedago() {
  const [showRefDialog, setShowRefDialog] = useState(false);
  const [majors, setMajors] = useState<Major[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [parcours, setParcours] = useState<Parcours[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedParcoursId, setSelectedParcoursId] = useState<number | null>(
    null,
  );
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  const [filteredLevels, setFilteredLevels] = useState<Level[]>([]);

  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const { data } = await apiRequest.get("/major");
        setMajors(data);
      } catch (error) {
        toast.error("Erreur lors du chargement des filières");
      }
    };
    const fetchLevel = async () => {
      try {
        const { data } = await apiRequest.get("/level");
        setLevels(data);
      } catch (error) {
        toast.error("Erreur lors du chargement des niveaux");
      }
    };
    const fetchExamType = async () => {
      try {
        const { data } = await apiRequest.get("/exam-type");
        setExamTypes(data);
      } catch (error) {
        toast.error("Erreur lors du chargement des Examens");
      }
    };
    const fetchParcours = async () => {
      try {
        const { data } = await apiRequest.get("/parcours");
        setParcours(data);
      } catch (error) {
        toast.error("Erreur lors du chargement des parcours");
      }
    };

    fetchMajors();
    fetchLevel();
    fetchExamType();
    fetchParcours();
  }, []);

  // --- Sélection ---

  const selectedParcours =
    parcours.find((p) => p.id === selectedParcoursId) ?? null;
  const selectedLevel = levels.find((l) => l.id === selectedLevelId) ?? null;

  // ── Helpers pour mapper les items avec badges ────────

  const parcoursItems = useMemo<(ListItem & Parcours)[]>(
    () =>
      parcours.map((p) => ({
        ...p,
        badges: p.majorIds
          .map((mId) => {
            const major = majors.find((m) => m.id === mId);
            return major ? { id: major.id, label: major.name } : null;
          })
          .filter(Boolean) as {
          id: number;
          label: string;
        }[],
      })),
    [parcours, majors],
  );

  useEffect(() => {
    if (!selectedParcoursId) return;

    const fetchParcoursLevels = async () => {
      try {
        const { data } = await apiRequest.get(
          `/parcours/${selectedParcoursId}/levels`,
        );
        setFilteredLevels(data);
      } catch (error) {
        toast.error("Erreur lors du chargement des niveaux du parcours");
      }
    };
    fetchParcoursLevels();
  }, [selectedParcoursId]);

  useEffect(() => {
    if (!selectedParcoursId || !selectedLevelId) return;

    const fetchCourses = async () => {
      try {
        const { data } = await apiRequest.get(
          `/parcours/${selectedParcoursId}/levels/${selectedLevelId}/courses`,
        );
        setCourses(data);
      } catch (error) {
        toast.error(
          "Erreur lors du chargement des cours : " + getRequestMessage(error),
        );
      }
    };
    fetchCourses();
  }, [selectedParcoursId, selectedLevelId]);

  const levelItems = useMemo<(ListItem & Level)[]>(
    () => filteredLevels.map((l) => ({ ...l, badges: [] })),
    [filteredLevels],
  );

  const courseItems = useMemo<(ListItem & Course)[]>(
    () =>
      courses.map((c) => ({
        ...c,
        badges: (c.examTypeIds || [])
          .map((eId) => {
            const et = examTypes.find((e) => e.id === eId);
            return et ? { id: et.id, label: et.name } : null;
          })
          .filter(Boolean) as { id: number; label: string }[],
      })),
    [courses, examTypes],
  );

  // ── CRUD handlers ────────────────────────────────────

  const handleAddParcours = async (data: ParcoursFormData) => {
    const elem = data;
    try {
      const { data } = await apiRequest.post("/parcours", {
        name: elem.name,
        majorIds: elem.majorIds,
        levelIds: [],
      });
      setParcours((prev) => [...prev, data]);
      toast.success("Parcours ajouté");
    } catch (error) {
      toast.error(
        `Erreur lors de l'ajout du parcours : ${getRequestMessage(error)}`,
      );
      throw error;
    }
  };

  const handleEditParcours = async (id: number, data: ParcoursFormData) => {
    const elem = data;
    try {
      const { data } = await apiRequest.put(`/parcours/${id}`, {
        name: elem.name,
        majorIds: elem.majorIds,
      });
      setParcours((prev) => prev.map((p) => (p.id === id ? data : p)));
      toast.success("Parcours mis à jour");
    } catch (error) {
      toast.error(
        `Erreur lors de la mise à jour du parcours : ${getRequestMessage(error)}`,
      );
    }
  };

  const handleDeleteParcours = (item: ListItem) => {
    try {
      apiRequest.delete(`/parcours/${item.id}`);
      setParcours((prev) => prev.filter((p) => p.id !== item.id));
      if (selectedParcoursId === item.id) {
        setSelectedParcoursId(null);
        setSelectedLevelId(null);
      }
      toast.success("Parcours supprimé");
    } catch (error) {
      toast.error(
        `Erreur lors de la suppression du parcours : ${getRequestMessage(error)}`,
      );
      throw error;
    }
  };

  const handleAddLevel = async (data: LevelFormData) => {
    if (!selectedParcours || data.levelId == null) return;

    try {
      const { data: updatedLevels } = await apiRequest.post(
        `/parcours/${selectedParcours.id}/levels/${data.levelId}`,
        {},
      );
      setFilteredLevels(updatedLevels);
      toast.success("Niveau ajouté");
    } catch (error) {
      toast.error(`Erreur: ${getRequestMessage(error)}`);
    }
  };

  const handleDeleteLevel = async (item: ListItem) => {
    if (!selectedParcours) return;

    try {
      const { data: updatedLevels } = await apiRequest.delete(
        `/parcours/${selectedParcours.id}/levels/${item.id}`,
      );
      setFilteredLevels(updatedLevels);
      if (selectedLevelId === item.id) setSelectedLevelId(null);
      toast.success("Niveau supprimé");
    } catch (error) {
      toast.error(`Erreur: ${getRequestMessage(error)}`);
    }
  };

  const handleAddCourse = async (data: CourseFormData) => {
    if (!selectedLevelId || !selectedParcoursId) return;

    try {
      const { data: newCourse } = await apiRequest.post("/course", {
        name: data.name,
        semestre: data.semestre,
        aliases: data.aliases,
        levelId: selectedLevelId,
        parcoursIds: [selectedParcoursId],
        examTypeIds: data.examTypeIds,
      });
      setCourses((prev) => [...prev, newCourse]);
      toast.success("Cours ajouté");
    } catch (error) {
      toast.error(
        `Erreur lors de l'ajout du cours : ${getRequestMessage(error)}`,
      );
      throw error;
    }
  };

  const handleEditCourse = async (id: number, data: CourseFormData) => {
    try {
      const { data: updatedCourse } = await apiRequest.put(`/course/${id}`, {
        name: data.name,
        semestre: data.semestre,
        aliases: data.aliases,
        examTypeIds: data.examTypeIds,
      });
      setCourses((prev) => prev.map((c) => (c.id === id ? updatedCourse : c)));
      toast.success("Cours mis à jour");
    } catch (error) {
      toast.error(
        `Erreur lors de la mise à jour du cours : ${getRequestMessage(error)}`,
      );
    }
  };

  const handleDeleteCourse = async (item: ListItem) => {
    if (!selectedParcoursId || !selectedLevelId) return;

    try {
      await apiRequest.delete(
        `/parcours/${selectedParcoursId}/levels/${selectedLevelId}/courses/${item.id}`,
      );
      setCourses((prev) => prev.filter((c) => c.id !== item.id));
      toast.success("Cours supprimé du parcours et niveau");
    } catch (error) {
      toast.error(
        `Erreur lors de la suppression du cours : ${getRequestMessage(error)}`,
      );
      throw error;
    }
  };

  const handleAddCourseConnect = async (data: CourseFormConnectData) => {
    if (!selectedLevelId || !selectedParcoursId) return;

    // Vérifier que le cours n'existe pas déjà
    if (courses.some((c) => c.id === data.courseId)) {
      toast.error("Ce cours est déjà associé à ce niveau");
      return;
    }

    try {
      const { data: newCourse } = await apiRequest.post(
        `/parcours/${selectedParcoursId}/levels/${selectedLevelId}/courses/${data.courseId}`,
        {},
      );
      setCourses((prev) => [...prev, newCourse]);
      toast.success("Cours ajouté au parcours et niveau");
    } catch (error) {
      toast.error(
        `Erreur lors de la connexion du cours : ${getRequestMessage(error)}`,
      );
    }
  };

  // ── Columns ──────────────────────────────────────────

  const ParcoursColumn = () => {
    const [isAdding, setIsAdding] = useState(false);
    const visibilityClass = selectedParcoursId ? "hidden lg:flex" : "flex";

    return (
      <div
        className={`${visibilityClass} w-full lg:w-1/3 xl:w-1/4 rounded-2xl border flex-col h-full`}
      >
        <div className="p-2 border bg-muted rounded-t-xl flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2 pl-2">
            <Network size={18} />
            Parcours
          </h2>
          <Button onClick={() => setIsAdding(!isAdding)} variant="outline">
            {isAdding ? <X /> : <Plus />}
          </Button>
        </div>
        <div className="p-3 flex-1 overflow-y-auto">
          {isAdding && (
            <ParcoursForm
              mode="create"
              majors={majors}
              onSubmit={(data) => {
                handleAddParcours(data);
                setIsAdding(false);
              }}
              onCancel={() => setIsAdding(false)}
            />
          )}
          <EditableDeletableItemList
            items={parcoursItems.sort((a, b) => a.name.localeCompare(b.name))}
            selectedId={selectedParcoursId}
            onSelect={(item) => {
              setSelectedParcoursId(item.id as number);
              setSelectedLevelId(null);
              setCourses([]);
            }}
            onDelete={handleDeleteParcours}
            deleteLabel="ce parcours"
            emptyMessage="Aucun parcours"
            renderForm={(item, onCancel) => (
              <ParcoursForm
                mode="edit"
                majors={majors}
                initialData={{ name: item.name, majorIds: item.majorIds }}
                onSubmit={(data) => {
                  handleEditParcours(item.id as number, data);
                  onCancel();
                }}
                onCancel={onCancel}
              />
            )}
          />
        </div>
      </div>
    );
  };

  const LevelColumn = () => {
    const [isAdding, setIsAdding] = useState(false);
    const isVisibleOnMobile = selectedParcoursId && !selectedLevelId;
    const visibilityClass = isVisibleOnMobile ? "flex" : "hidden lg:flex";

    if (!selectedParcours)
      return (
        <div className="hidden lg:flex w-1/4 bg-muted rounded-xl border flex-col items-center justify-center space-y-3 h-full">
          <Layers size={32} />
          <p className="text-sm font-medium text-center px-4">
            Sélectionnez un parcours
            <br />
            pour gérer ses niveaux
          </p>
        </div>
      );

    return (
      <div
        className={`${visibilityClass} w-full lg:w-1/3 xl:w-1/4 rounded-2xl border flex-col h-full`}
      >
        <div className="p-2 border bg-muted rounded-t-xl flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2 pl-2">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-1 h-auto"
              onClick={() => {
                setSelectedParcoursId(null);
                setSelectedLevelId(null);
                setCourses([]);
              }}
            >
              <ArrowLeft size={18} />
            </Button>
            <Layers size={18} />
            Niveaux
          </h2>
          <Button onClick={() => setIsAdding(!isAdding)} variant="outline">
            {isAdding ? <X /> : <Plus />}
          </Button>
        </div>
        <div className="p-3 flex-1 overflow-y-auto">
          {isAdding && (
            <LevelForm
              mode="create"
              levels={levels}
              onSubmit={(data) => {
                handleAddLevel(data);
                setIsAdding(false);
              }}
              onCancel={() => setIsAdding(false)}
            />
          )}
          <EditableDeletableItemList
            items={levelItems.sort((a, b) => a.name.localeCompare(b.name))}
            selectedId={selectedLevelId}
            onSelect={(item) => setSelectedLevelId(item.id as number)}
            onDelete={handleDeleteLevel}
            deleteLabel="ce niveau"
            emptyMessage="Aucun niveau dans ce parcours"
          />
        </div>
      </div>
    );
  };

  const CourseColumn = () => {
    const [addingMode, setAddingMode] = useState<null | "new" | "existing">(
      null,
    );
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const isVisibleOnMobile = selectedLevelId !== null;
    const visibilityClass = isVisibleOnMobile ? "flex" : "hidden lg:flex";

    if (!selectedLevel)
      return (
        <div className="hidden lg:flex bg-muted rounded-xl border flex-col items-center justify-center space-y-3 h-full w-full lg:w-1/3 xl:w-1/2">
          <BookOpen size={32} />
          <p className="text-sm font-medium text-center px-4">
            Sélectionnez un niveau <br /> pour voir ses cours
          </p>
        </div>
      );

    return (
      <div
        className={`${visibilityClass} w-full lg:w-1/3 xl:w-1/2 rounded-2xl border flex-col h-full`}
      >
        <div className="p-2 border bg-muted rounded-t-xl flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2 pl-2">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-1 h-auto"
              onClick={() => setSelectedLevelId(null)}
            >
              <ArrowLeft size={18} />
            </Button>
            <BookOpen size={18} />
            Cours
          </h2>
          <DropdownMenu
            open={addingMode ? false : isDropdownOpen}
            onOpenChange={(open) => {
              if (addingMode) {
                setAddingMode(null);
              } else {
                setIsDropdownOpen(open);
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="outline">{addingMode ? <X /> : <Plus />}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setAddingMode("new")}>
                Créer un nouveau cours
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAddingMode("existing")}>
                Sélectionner un cours existant
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="p-3 flex-1 overflow-y-auto">
          {addingMode === "new" && (
            <CourseForm
              mode="create"
              examTypes={examTypes}
              onSubmit={(data) => {
                handleAddCourse(data);
                setAddingMode(null);
              }}
              onCancel={() => setAddingMode(null)}
            />
          )}
          {addingMode === "existing" && (
            <CourseFormConnect
              onCancel={() => setAddingMode(null)}
              onSubmit={(data) => {
                handleAddCourseConnect(data);
                setAddingMode(null);
              }}
            />
          )}
          <EditableDeletableItemList
            items={courseItems.sort((a, b) => a.name.localeCompare(b.name))}
            selectedId={null}
            onDelete={handleDeleteCourse}
            deleteLabel="ce cours"
            emptyMessage="Aucun cours pour ce niveau"
            renderForm={(item, onCancel) => (
              <CourseForm
                mode="edit"
                examTypes={examTypes}
                initialData={{
                  name: item.name,
                  semestre: item.semestre,
                  aliases: (item as any).aliases ?? "",
                  examTypeIds: item.examTypeIds,
                }}
                onSubmit={(data) => {
                  handleEditCourse(item.id as number, data);
                  onCancel();
                }}
                onCancel={onCancel}
              />
            )}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <Toaster />
      <div className="m-3">
        <div className="mb-6 flex justify-between">
          <div>
            <h1 className="text-3xl font-bold">Maquette pédagogique</h1>
            <p className="text-muted-foreground mt-2">
              Gestion des cours <br />
            </p>
          </div>
          <Button onClick={() => setShowRefDialog(true)}>
            <Settings />
            Référenciels
          </Button>
        </div>

        <div className="max-w-7xl mx-auto h-[75vh] min-h-125 flex flex-col lg:flex-row gap-1 lg:gap-2">
          <ParcoursColumn />
          <LevelColumn />
          <CourseColumn />
        </div>

        <RefDialog
          open={showRefDialog}
          onOpenChange={setShowRefDialog}
          majors={majors}
          levels={levels}
          examTypes={examTypes}
          onMajorAdded={async (major, icon) => {
            try {
              const { data } = await apiRequest.post("/major", {
                name: major,
                icon,
              });
              setMajors((prev) => [...prev, data]);
              toast.success("Filière ajoutée");
            } catch (error) {
              toast.error("Erreur lors de l'ajout");
              throw error;
            }
          }}
          onMajorUpdated={async (id, name, icon) => {
            try {
              const { data } = await apiRequest.put(`/major/${id}`, {
                name,
                icon,
              });
              setMajors((prev) => prev.map((m) => (m.id === id ? data : m)));
              toast.success("Filière mise à jour");
            } catch (error) {
              toast.error("Erreur lors de la mise à jour");
              throw error;
            }
          }}
          onMajorDeleted={async (id) => {
            try {
              await apiRequest.delete(`/major/${id}`);
              setMajors((prev) => prev.filter((m) => m.id !== id));
              toast.success("Filière supprimée");
            } catch (error) {
              toast.error("Erreur lors de la suppression");
              throw error;
            }
          }}
          onLevelAdded={async (major) => {
            try {
              const { data } = await apiRequest.post("/level", { name: major });
              setLevels((prev) => [...prev, data]);
              toast.success("Niveau ajoutée");
            } catch (error) {
              toast.error("Erreur lors de l'ajout");
              throw error;
            }
          }}
          onLevelUpdated={async (id, name) => {
            try {
              const { data } = await apiRequest.put(`/level/${id}`, { name });
              setLevels((prev) => prev.map((m) => (m.id === id ? data : m)));
              toast.success("Niveau mise à jour");
            } catch (error) {
              toast.error("Erreur lors de la mise à jour");
              throw error;
            }
          }}
          onLevelDeleted={async (id) => {
            try {
              await apiRequest.delete(`/level/${id}`);
              setLevels((prev) => prev.filter((m) => m.id !== id));
              toast.success("Niveau supprimée");
            } catch (error) {
              toast.error("Erreur lors de la suppression");
              throw error;
            }
          }}
          onExamTypeAdded={async (major) => {
            try {
              const { data } = await apiRequest.post("/exam-type", {
                name: major,
              });
              setExamTypes((prev) => [...prev, data]);
              toast.success("Examens ajoutée");
            } catch (error) {
              toast.error("Erreur lors de l'ajout");
              throw error;
            }
          }}
          onExamTypeUpdated={async (id, name) => {
            try {
              const { data } = await apiRequest.put(`/exam-type/${id}`, {
                name,
              });
              setExamTypes((prev) => prev.map((m) => (m.id === id ? data : m)));
              toast.success("Examens mise à jour");
            } catch (error) {
              toast.error("Erreur lors de la mise à jour");
              throw error;
            }
          }}
          onExamTypeDeleted={async (id) => {
            try {
              await apiRequest.delete(`/exam-type/${id}`);
              setExamTypes((prev) => prev.filter((m) => m.id !== id));
              toast.success("Examens supprimée");
            } catch (error) {
              toast.error("Erreur lors de la suppression");
              throw error;
            }
          }}
        />
      </div>
    </>
  );
}
