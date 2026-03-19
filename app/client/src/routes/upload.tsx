import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AlertCircle, ChevronsUpDown, FileUp, Loader2, Plus, Trash2, UploadCloud } from "lucide-react";
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

type Course = {
  id: number;
  course: string;
  level: string;
  major: string;
  parcours: string;
};

type Exam = {
  id: number;
  name: string;
};

type Annexe = {
  type: "url" | "fichier";
  value: string | File | null;
  comment: string;
};

export function Upload() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [courses, setCourses] = useState([]);
  const [examType, setExamType] = useState<Exam[]>([]);

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileOption, setSelectedFileOption] = useState<File | null>(
    null,
  );

  const [selectedComment, setSelectedComment] = useState("");
  const [selectedUrl, setSelectedUrl] = useState("");

  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [annexes, setAnnexes] = useState<Annexe[]>([
    { type: "url", value: "", comment: "" },
  ]);
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
    if (annexes.length > 1) {
      setAnnexes(annexes.filter((_, i) => i !== index));
    }
  };

  const updateAnnexe = (
    index: number,
    field: keyof Annexe,
    value: string | File | null,
  ) => {
    const newAnnexes = [...annexes];
    newAnnexes[index] = { ...newAnnexes[index], [field]: value };
    setAnnexes(newAnnexes);
  };

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await apiRequest.get("/course");
        setCourses(data);
      } catch (error) {
        console.log(getRequestMessage(error));
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      const fetchExamType = async () => {
        try {
          const { data } = await apiRequest.get("/examType", {
            params: {
              courseTypeId: selectedCourse.id,
            },
          });
          setExamType(data);
        } catch (error) {
          console.log(getRequestMessage(error));
        }
      };
      fetchExamType();
    } else {
      setExamType([]);
    }
  }, [selectedCourse]);

  const years = [];
  for (let i = 2026; i >= 2005; --i) {
    years.push(i);
  }

  const all_course = useMemo(() => {
    if (!courses) return [];

    const courseMap = new Map();

    courses.forEach((majorData: any) => {
      majorData.parcours?.forEach((parcoursData: any) => {
        parcoursData.courses?.forEach((courseData: any) => {
          if (courseMap.has(courseData.id)) {
            const existingCourse = courseMap.get(courseData.id);
            if (!existingCourse.parcours.includes(parcoursData.name)) {
              existingCourse.parcours += ` et ${parcoursData.name}`;
            }
          } else {
            courseMap.set(courseData.id, {
              id: courseData.id,
              course: courseData.name,
              level: courseData.level?.name || "",
              major: majorData.name,
              parcours: parcoursData.name,
            });
          }
        });
      });
    });

    return Array.from(courseMap.values());
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (!inputValue) {
      return all_course;
    }
    return all_course.filter((c: Course) =>
      c.course.toLowerCase().includes(inputValue.toLowerCase()),
    );
  }, [all_course, inputValue]);

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
   event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
  
    if (!selectedCourse || !selectedExamId || !selectedFile || !selectedYear) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires.');
      setSubmitting(false);
      return;
    }
    if (annexes.length > 5) {
      setErrorMessage('Vous ne pouvez pas ajouter plus de 5 annexes.');
      setSubmitting(false);
      return;
    }
    try {
      const formData = new FormData();
      formData.append("courseId", String(selectedCourse.id));
      formData.append("examTypeId", selectedExamId);
      formData.append("year", selectedYear);
      formData.append("file", selectedFile); 
      
      const metadata = annexes.map((annexe, index) => {
        if (annexe.type === 'url') {
          return { type: 'url', comment: annexe.comment, url: annexe.value };
        } else if (annexe.type === 'fichier' && annexe.value instanceof File) {
          const fileKey = `annexe_file_${index}`;
          formData.append(fileKey, annexe.value);
          return { type: 'fichier', comment: annexe.comment, fileKey: fileKey };
        }
        return null;
      }).filter(Boolean); 

  
      formData.append('annexes_metadata', JSON.stringify(metadata));

      await apiRequest.post("/pastExam/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate('/'); 

    } catch (err: any) {
      setErrorMessage(getRequestMessage(err) || "Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

return (
    // pb-32 pour laisser de la place au dock de navigation flottant en bas
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-6 md:p-10 pb-32 font-sans text-foreground selection:bg-primary/20">
      
      {loading ? (
        <Card className="w-full max-w-3xl rounded-3xl border-border/70 shadow-lg">
          <CardHeader className="text-center pt-10 pb-6 px-6">
            <Skeleton className="w-16 h-16 rounded-2xl mx-auto mb-5" />
            <Skeleton className="h-8 w-2/3 mx-auto mb-2" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </CardHeader>
          <CardContent className="px-6 sm:px-10 pb-10">
            <Skeleton className="h-12 w-full rounded-xl mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
            <Skeleton className="h-32 w-full rounded-2xl mt-6" />
          </CardContent>
        </Card>
      ) : (
        // max-w-xl pour un formulaire plus large
        <Card className="w-full max-w-3xl rounded-3xl border border-border/70 bg-card shadow-lg">
          
          {/* --- En-tête de Carte (Intégré comme demandé) --- */}
          <CardHeader className="text-center pt-10 pb-6 px-6 sm:px-10">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-5 mx-auto border border-border/50">
              {/* Icône de nuage teinté comme sur l'image */}
              <UploadCloud className="w-9 h-9 text-slate-700" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground mb-1">
              Partager un fichier sinon l'URSAF
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Aidez les futurs étudiants.ça suffit enough ça suffit enough
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 sm:px-10 pb-10">
            <form encType="multipart/form-data" onSubmit={handleSubmit}>
              <FieldGroup className="space-y-6">
                
                {/* Message d'erreur */}
                {errorMessage && (
                  <div className="bg-destructive/10 text-destructive text-sm font-semibold p-3 rounded-xl flex items-center gap-2 border border-destructive/20">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {errorMessage}
                  </div>
                )}

                {/* Champ complet "TITRE" -> Mappe à la Combobox de recherche de cours */}
                <Field>
                  <FieldLabel className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-1.5">
                    CHOISISSEZ LA FILIERE SVP (PAS DE CONNERIE)
                  </FieldLabel>
                  <Combobox
                    value={selectedCourse ? selectedCourse.course : ""}
                    onValueChange={(val : any) => {
                      if (!val) {
                        setSelectedCourse(null);
                        return;
                      }
                      const found = all_course.find((c: any) => c.course === val);
                      if (found) {
                        setSelectedCourse(found);
                        setInputValue(found.course);
                      }
                    }}
                    inputValue={inputValue}
                    onInputValueChange={setInputValue}
                  >
                    <ComboboxInput 
                      placeholder="Ex: Algèbre - Partiel 2024 (Rechercher cours)" 
                      className="h-12 rounded-xl bg-background border-border/70"
                    />
                    <ComboboxContent className="rounded-xl border-border/70 shadow-xl">
                      {filteredCourses.length === 0 && (
                        <ComboboxEmpty>Aucun cours trouvé</ComboboxEmpty>
                      )}
                      <ComboboxList>
                        {filteredCourses.map((course: Course) => (
                          <ComboboxItem key={course.id} value={course.course} className="rounded-lg m-1">
                            <Item size="sm" className="p-0">
                              <ItemContent>
                                <ItemTitle className="whitespace-nowrap font-semibold">
                                  {course.course}
                                </ItemTitle>
                                <ItemDescription className="text-xs text-muted-foreground">
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

                {/* Grille responsive : 2 colonnes pour MATIÈRE (Type) et TYPE (Année) */}
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Image "MATIÈRE" -> Mappe au Select Type d'examen */}
                  <Field>
                    <FieldLabel className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-1.5">
                      TYPE D'EXAMEN 
                    </FieldLabel>
                    <Select
                      value={selectedExamId}
                      onValueChange={setSelectedExamId}
                      disabled={!selectedCourse}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-background border-border/70">
                        <SelectValue placeholder="Type..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/70">
                        <SelectGroup>
                          {examType.map((type: Exam) => (
                            <SelectItem key={type.id} value={String(type.id)} className="rounded-lg m-0.5">
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>

                  {/* Image "TYPE" -> Mappe au Select Année (Widening) */}
                  <Field>
                    <FieldLabel className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-1.5">
                      ANNÉE 
                    </FieldLabel>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="h-12 rounded-xl bg-background border-border/70">
                        <SelectValue placeholder="Année..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/70">
                        <SelectGroup>
                          {years.map((year) => (
                            <SelectItem key={year} value={String(year)} className="rounded-lg m-0.5">
                              {year - 1 + " / " + year}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                {/* Zone de dépot de fichier pointillée (Principal) */}
                <Field className="pt-2">
                  <FieldLabel className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-2">
                    TELEVERSER UNE ANNALE (PDF SVP POTO)
                  </FieldLabel>
                  {/* Grand label pointillé servant de zone de clic géante */}
                  <label htmlFor="file-main" className="bg-linear-to-r from-primary/10 to-primary/5  block w-full border-2 border-dashed border-border/80 rounded-2xl p-8 sm:p-12 text-center hover:bg-muted/30 transition-colors cursor-pointer group bg-muted/10">
                    <div className="flex justify-center mb-4"> 
                      {/* Icône FileUp au centre */}
                      <FileUp className="w-8 h-8 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <p className="font-semibold text-foreground text-sm tracking-tight">Toucher pour choisir un PDF</p>
                    <p className="text-xs text-muted-foreground mt-1">Seul le format PDF est accepté.</p>
                    {/* Affiche le nom du fichier s'il est sélectionné */}
                    {selectedFile && <span className="text-primary font-bold text-xs mt-3 block truncate">Fichier sélectionné : {selectedFile.name}</span>}
                  </label>
                  {/* Input caché, activé par le label via htmlFor/id */}
                  <Input
                    id="file-main"
                    name="file-main"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileChange(e, setSelectedFile)}
                    className="hidden" // Cache l'input natif
                  />
                </Field>

                 {/* Annexes optionnelles (Collapsible conservé et re-stylé) */}
                <Collapsible
                  open={isOpen}
                  onOpenChange={setIsOpen}
                  className="w-full border border-border/70 p-4 rounded-2xl bg-muted/20 transition-all shadow-inner mt-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-foreground">
                        Annexes optionnelles
                      </h4>
                      <p className="text-xs text-muted-foreground">Corrigés, codes sources, liens...</p>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-9 rounded-full hover:bg-muted/50">
                        <ChevronsUpDown className="h-4 w-4 text-foreground" />
                      </Button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent className="space-y-4 pt-4 border-t border-border/70 mt-4">
                    {annexes.map((annexe, index) => (
                      <Card
                        key={index}
                        className="p-4 border border-border/70 rounded-xl bg-card space-y-4 shadow relative group"
                      >
                        <div className="flex items-end gap-2">
                          <Field className="flex-1">
                            <FieldLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 ml-1">
                              TYPE D'ANNEXE
                            </FieldLabel>
                            <Select
                              value={annexe.type}
                              onValueChange={(val: "url" | "fichier") =>
                                updateAnnexe(index, "type", val)
                              }
                            >
                              <SelectTrigger className="h-10 rounded-lg bg-background border-border/70 text-foreground">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-lg border-border/70">
                                <SelectItem value="url">Lien URL</SelectItem>
                                <SelectItem value="fichier">Fichier</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>

                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-10 rounded-lg text-primary border-primary/30 bg-primary/5 hover:bg-primary/10"
                              onClick={addAnnexe}
                              disabled={annexes.length >= 5}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            {annexes.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-10 rounded-lg text-destructive border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
                                onClick={() => removeAnnexe(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 pt-2">
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">
                              {annexe.type === "url" ? "Lien web" : "Fichier (PDF)"}
                            </p>
                            {annexe.type === "url" ? (
                              <Input
                                className="h-10 rounded-lg bg-background border-border/70 text-foreground"
                                placeholder="https://..."
                                value={
                                  typeof annexe.value === "string"
                                    ? annexe.value
                                    : ""
                                }
                                onChange={(e) =>
                                  updateAnnexe(index, "value", e.target.value)
                                }
                              />
                            ) : (
                              <label htmlFor={`file-annexe-${index}`} className="flex items-center gap-2 h-10 w-full rounded-lg bg-background border border-border/70 px-3 text-sm text-muted-foreground cursor-pointer hover:bg-muted/20">
                                <FileUp className="w-4 h-4 text-muted-foreground" />
                                <span className="flex-1 truncate">
                                  {annexe.value instanceof File ? annexe.value.name : "Toucher pour choisir..."}
                                </span>
                              </label>
                            )}
                            <Input
                              id={`file-annexe-${index}`}
                              className="hidden"
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
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">
                              Commentaire
                            </p>
                            <Input
                              className="h-10 rounded-lg bg-background border-border/70 text-foreground"
                              placeholder="Ex: Correction détaillée..."
                              value={annexe.comment}
                              onChange={(e) =>
                                updateAnnexe(index, "comment", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </CollapsibleContent>
                </Collapsible>

                {/* Bouton Envoyer customisé (Sombre comme image) */}
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    // Couleur sombre spécifique bg-slate-950
                    className="w-full h-12 rounded-xl
                     font-semibold tracking-wide text-sm transition-colors shadow-md"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      "Envoyer"
                    )}
                  </Button>
                </div>                
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}