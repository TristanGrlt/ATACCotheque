import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import logo from "/atacc_logo.png";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { apiRequest, getRequestMessage } from "@/services/api";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { API_ENDPOINT } from "@/config/env";
import { useIsMobile } from "@/hooks/use-mobile";
import { DeleteConfirmDialog } from "@/components/deleteConfirmDialog";

type Course = {
  id: number;
  course: string;
  level: string;
  major: string;
  parcours: string;
};

type ExamType = {
  id: number;
  name: string;
};

type AnnexeForm = {
  id?: number;
  type: "url" | "fichier";
  value: string | File | null;
  comment: string;
  originalUrl?: string | null;
};

export function ManageExam() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const examId = searchParams.get("id");

  const isMobile = useIsMobile();
  const isInitializingRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [courses, setCourses] = useState([]);
  const [examType, setExamType] = useState<ExamType[]>([]);

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(true);

  const [annexes, setAnnexes] = useState<AnnexeForm[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await apiRequest.get("/course");
        setCourses(data);
      } catch (error) {
        console.log(getRequestMessage(error));
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const all_course = useMemo(() => {
    if (!courses || courses.length === 0) {
      return [];
    }
    
    const courseMap = new Map();
    
    // API returns flat array of courses, each with parcours array
    courses.forEach((courseData: any) => {
      // If parcours array exists, create entry for each parcours
      if (courseData.parcours && courseData.parcours.length > 0) {
        courseData.parcours.forEach((parcoursData: any) => {
          const key = `${courseData.id}_${parcoursData.id}`;
          courseMap.set(key, {
            id: courseData.id,
            course: courseData.name,
            level: courseData.levelName || "",
            major: courseData.name,
            parcours: parcoursData.name,
          });
        });
      } else {
        // Fallback if no parcours
        courseMap.set(courseData.id, {
          id: courseData.id,
          course: courseData.name,
          level: courseData.levelName || "",
          major: courseData.name,
          parcours: "",
        });
      }
    });
    
    return Array.from(courseMap.values());
  }, [courses]);

  useEffect(() => {
    if (!examId || all_course.length === 0) return;

    const fetchExam = async () => {
      try {
        isInitializingRef.current = true;

        const { data } = await apiRequest.get(`/pastExam/${examId}`);

        const found = all_course.find((c: Course) => c.id === data.course.id);

        if (found) {
          // Fetch exam types FIRST
          try {
            const { data: typeData } = await apiRequest.get("/examType", {
              params: { courseTypeId: found.id },
            });

            // Set all form fields at once
            setExamType(typeData);
            setSelectedCourse(found);
            setInputValue(found.course);
            setSelectedYear(String(data.year));
            setSelectedExamId(String(data.examtype.id));
          } catch (error) {
            console.error(
              "Erreur lors du chargement des types d'examens:",
              error,
            );
          }
        }

        const { data: annexeData } = await apiRequest.get(
          `/pastExam/annexeById/${examId}`,
        );
        if (annexeData.length > 0) {
          setAnnexes(
            annexeData.map((a: any) => ({
              id: a.id,
              type: a.type === "FILE" ? "fichier" : "url",
              value: a.type === "URL" ? a.url : null,
              comment: a.name,
              originalUrl: a.type === "URL" ? a.url : null,
            })),
          );
        } else {
          setAnnexes([]);
        }
      } catch (error: any) {
        console.error(getRequestMessage(error));
        if (error.response && error.response.status === 404) {
          navigate("/404", { replace: true });
        } else {
          setErrorMessage("Impossible de charger les données de cette annale.");
        }
      } finally {
        isInitializingRef.current = false;
      }
    };
    fetchExam();
  }, [examId, all_course, navigate]);

  const years = [];
  for (let i = 2026; i >= 2005; --i) {
    years.push(i);
  }

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
  ) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const addAnnexe = () => {
    if (annexes.length < 5) {
      setAnnexes([...annexes, { type: "url", value: "", comment: "" }]);
    }
  };

  const removeAnnexe = (index: number) => {
    setAnnexes(annexes.filter((_, i) => i !== index));
  };

  const updateAnnexe = (
    index: number,
    field: keyof AnnexeForm,
    value: string | File | null,
  ) => {
    const newAnnexes = [...annexes];
    newAnnexes[index] = { ...newAnnexes[index], [field]: value };
    setAnnexes(newAnnexes);
  };

  const filteredCourses = useMemo(() => {
    if (!inputValue) return all_course;
    return all_course.filter((c: Course) =>
      c.course.toLowerCase().includes(inputValue.toLowerCase()),
    );
  }, [all_course, inputValue]);

  const handleCourseSelect = (val: string | null) => {
    // Skip course selection logic during initialization
    if (isInitializingRef.current) {
      return;
    }

    if (!val) {
      setSelectedCourse(null);
      setExamType([]);
      setSelectedExamId("");
      return;
    }

    const found = all_course.find((c: any) => c.course === val);
    if (found) {
      setSelectedCourse((prevCourse) => {
        if (prevCourse?.id === found.id) {
          return prevCourse;
        }

        setInputValue(found.course);
        setSelectedExamId("");
        setExamType([]);

        apiRequest
          .get("/examType", { params: { courseTypeId: found.id } })
          .then(({ data }) => setExamType(data))
          .catch((err) => console.error("Erreur types examens:", err));

        return found;
      });
    }
  };

  const handleDelete = () => {
    setErrorMessage("");
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setSubmitting(true);
    setErrorMessage("");
    try {
      await apiRequest.delete(`/pastExam/${examId}`);
      navigate(-1);
    } catch (error: any) {
      const serverError =
        error.response?.data?.error ||
        error.response?.data?.message ||
        getRequestMessage(error);
      setErrorMessage(serverError || "Erreur lors de la suppression");
      setSubmitting(false);
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleValidate = async () => {
    setSubmitting(true);
    setErrorMessage("");

    if (!selectedCourse || !selectedExamId || !selectedYear) {
      setErrorMessage("Veuillez remplir tous les champs obligatoires.");
      setSubmitting(false);
      return;
    }

    if (annexes.length > 5) {
      setErrorMessage("Vous ne pouvez pas ajouter plus de 5 annexes.");
      setSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("examId", String(examId));
      formData.append("courseId", String(selectedCourse.id));
      formData.append("examTypeId", selectedExamId);
      formData.append("year", selectedYear);

      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const metadata = annexes.map((formAnnexe, index) => {
        const basePayload: any = {
          id: formAnnexe.id,
          type: formAnnexe.type === "url" ? "URL" : "FILE",
          comment: formAnnexe.comment,
        };

        if (formAnnexe.type === "url") {
          basePayload.url = formAnnexe.value;
        } else if (
          formAnnexe.type === "fichier" &&
          formAnnexe.value instanceof File
        ) {
          const fileKey = `annexe_file_${index}`;
          formData.append(fileKey, formAnnexe.value);
          basePayload.fileKey = fileKey;
        }
        return basePayload;
      });

      formData.append("annexes_metadata", JSON.stringify(metadata));

      await apiRequest.put("/pastExam/updateAnnale", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate(-1);
    } catch (err: any) {
      setErrorMessage(getRequestMessage(err) || "Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`flex w-full bg-background ${isMobile ? "flex-col" : "h-screen overflow-hidden"}`}
    >
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Supprimer cette annale ?"
        description="Cette action est irréversible."
      />
      {loading ? (
        <Card className={`w-full m-4 ${isMobile ? "" : "max-w-xs"}`}>
          <CardHeader>
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="aspect-video w-full" />
          </CardContent>
        </Card>
      ) : (
        <div
          className={`w-full bg-card shrink-0 ${isMobile ? "border-b border-border" : "max-w-md overflow-y-auto border-r border-border h-full"}`}
        >
          <Card
            className={`w-full shadow-none border-none ${isMobile ? "pb-6" : "pb-12"}`}
          >
            <CardHeader className="pb-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <a>
                  <div className="flex h-16 items-center justify-center rounded-md">
                    <img
                      src={logo}
                      alt="atacc logo"
                      className="h-full object-contain"
                    />
                  </div>
                </a>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Gestion de l'Annale
                </h1>
              </div>
            </CardHeader>

            <CardContent>
              <form encType="multipart/form-data">
                <FieldGroup className="space-y-3">
                  {errorMessage && (
                    <div className="text-destructive text-sm font-medium text-center bg-destructive/10 p-2 rounded-md">
                      {errorMessage}
                    </div>
                  )}

                  <Field>
                    <FieldLabel>Filière</FieldLabel>
                    <Combobox
                      value={selectedCourse ? selectedCourse.course : ""}
                      onValueChange={handleCourseSelect}
                      inputValue={inputValue}
                      onInputValueChange={setInputValue}
                    >
                      <ComboboxInput placeholder="Rechercher un cours..." />
                      <ComboboxContent>
                        {filteredCourses.length === 0 && (
                          <ComboboxEmpty>Aucun cours trouvé</ComboboxEmpty>
                        )}
                        <ComboboxList>
                          {filteredCourses.map((course: Course) => (
                            <ComboboxItem key={course.id} value={course.course}>
                              <Item size="sm" className="p-0">
                                <ItemContent>
                                  <ItemTitle className="whitespace-nowrap font-medium text-foreground">
                                    {course.course}
                                  </ItemTitle>
                                  <ItemDescription className="text-muted-foreground">
                                    {course.level} {course.parcours}
                                  </ItemDescription>
                                </ItemContent>
                              </Item>
                            </ComboboxItem>
                          ))}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                  </Field>

                  <Field>
                    <FieldLabel>Type d'examen</FieldLabel>
                    <Select
                      key={examType.length ? "loaded" : "empty"}
                      value={selectedExamId}
                      onValueChange={setSelectedExamId}
                      disabled={!selectedCourse || examType.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {examType.map((type: ExamType) => (
                            <SelectItem key={type.id} value={String(type.id)}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>Année académique</FieldLabel>
                    <Select
                      value={selectedYear}
                      onValueChange={setSelectedYear}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Année" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {years.map((year) => (
                            <SelectItem key={year} value={String(year)}>
                              {year - 1}/{year}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel>Remplacer l'annale (Optionnel)</FieldLabel>
                    <Input
                      id="file-main"
                      name="file-main"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, setSelectedFile)}
                      className="cursor-pointer file:cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Ne chargez un fichier que si vous souhaitez écraser le
                      document principal actuel (PDF uniquement).
                    </p>
                  </Field>

                  <Collapsible
                    open={isOpen}
                    onOpenChange={setIsOpen}
                    className="w-full border border-border p-4 rounded-xl bg-muted/30"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-foreground">
                        Annexes ({annexes.length}/5)
                      </h4>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                        >
                          <ChevronsUpDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                    </div>

                    <CollapsibleContent className="space-y-4">
                      {annexes.map((annexe, index) => (
                        <div
                          key={index}
                          className="p-4 border border-border rounded-lg bg-background space-y-4 shadow-sm relative group"
                        >
                          <div className="flex items-end gap-3">
                            <Field className="flex-1">
                              <FieldLabel className="text-xs font-semibold text-muted-foreground">
                                Type
                              </FieldLabel>
                              <Select
                                value={annexe.type}
                                onValueChange={(val) =>
                                  updateAnnexe(
                                    index,
                                    "type",
                                    val as "url" | "fichier",
                                  )
                                }
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="url">Lien URL</SelectItem>
                                  <SelectItem value="fichier">
                                    Fichier PDF
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </Field>

                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0"
                              onClick={() => removeAnnexe(index)}
                              title="Retirer cette annexe"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-muted-foreground uppercase">
                                Source{" "}
                                {annexe.id &&
                                annexe.type === "fichier" &&
                                !annexe.value
                                  ? "(Fichier existant)"
                                  : ""}
                              </label>
                              {annexe.type === "url" ? (
                                <Input
                                  className="h-9"
                                  placeholder="https://..."
                                  value={
                                    typeof annexe.value === "string"
                                      ? annexe.value
                                      : annexe.originalUrl || ""
                                  }
                                  onChange={(e) =>
                                    updateAnnexe(index, "value", e.target.value)
                                  }
                                />
                              ) : (
                                <Input
                                  className="h-9 text-xs py-1.5 cursor-pointer file:cursor-pointer"
                                  type="file"
                                  accept=".pdf"
                                  onChange={(e) =>
                                    e.target.files &&
                                    updateAnnexe(
                                      index,
                                      "value",
                                      e.target.files[0],
                                    )
                                  }
                                />
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-muted-foreground uppercase">
                                Nom ou Commentaire
                              </label>
                              <Input
                                className="h-9"
                                placeholder="Ex: Correction détaillée"
                                value={annexe.comment}
                                onChange={(e) =>
                                  updateAnnexe(index, "comment", e.target.value)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      {annexes.length < 5 && (
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full border-dashed border-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                          onClick={addAnnexe}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Ajouter une annexe
                        </Button>
                      )}
                    </CollapsibleContent>
                  </Collapsible>

                  <div className="flex flex-col sm:flex-row gap-3 pt-3 pb-2">
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full sm:w-1/2"
                      disabled={submitting}
                      onClick={handleDelete}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer
                    </Button>

                    <Button
                      type="button"
                      className="w-full sm:w-1/2 bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={submitting}
                      onClick={handleValidate}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Valider
                    </Button>
                  </div>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <div
        className={`flex flex-col bg-muted/10 p-2 ${isMobile ? "h-[70vh] w-full" : "grow overflow-hidden h-full"}`}
      >
        <Tabs
          defaultValue="annale"
          className="flex flex-col h-full rounded-xl border border-border bg-card overflow-hidden"
        >
          {annexes.filter((a) => a.id && a.type === "fichier").length > 0 && (
            <TabsList className="mx-4 mt-4 w-fit max-w-full flex-wrap bg-muted">
              <TabsTrigger
                value="annale"
                className="data-[state=active]:bg-background"
              >
                Annale Principale
              </TabsTrigger>

              {annexes
                .filter((a) => a.id && a.type === "fichier")
                .map((annexe, i) => (
                  <TabsTrigger
                    key={`tab-${annexe.id}`}
                    value={`annexe-${annexe.id}`}
                    className="data-[state=active]:bg-background"
                  >
                    Annexe {i + 1}
                  </TabsTrigger>
                ))}
            </TabsList>
          )}

          <TabsContent
            value="annale"
            className="flex-1 mt-2 mb-0 h-full w-full"
          >
            <iframe
              className="w-full h-full border-none"
              src={`${API_ENDPOINT}/pastExam/adminFile/${examId}`}
              title="Viewer du fichier principal"
            />
          </TabsContent>

          {annexes
            .filter((a) => a.id && a.type === "fichier")
            .map((annexe) => (
              <TabsContent
                key={`content-${annexe.id}`}
                value={`annexe-${annexe.id}`}
                className="flex-1 mt-2 mb-0 h-full w-full"
              >
                <iframe
                  className="w-full h-full border-none"
                  src={`${API_ENDPOINT}/pastExam/adminAnnexe/${annexe.id}`}
                  title="Viewer de l'annexe"
                />
              </TabsContent>
            ))}
        </Tabs>
      </div>
    </div>
  );
}
