import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import { ChevronsUpDown, Loader2, Plus, Trash2 } from "lucide-react";
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
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      {loading ? (
        <Card className="w-full max-w-xs">
          <CardHeader>
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="aspect-video w-full" />
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <div className="flex flex-col items-center gap-2 text-center">
              <a>
                <div className="flex size-12 items-center justify-center rounded-md">
                  <img src={logo} alt="atacc logo" />
                </div>
              </a>
              <h1 className="text-xl font-bold">
                Ajoutez une annale sur l'Attacothèque !
              </h1>
            </div>
          </CardHeader>

          <CardContent>
            <form encType="multipart/form-data" onSubmit={handleSubmit}>
              <FieldGroup className="space-y-4">
                {errorMessage && (
                  <div className="text-red-500 text-sm font-medium text-center">
                    {errorMessage}
                  </div>
                )}

                <FieldLabel>Choisissez la filière</FieldLabel>
                <Combobox
                  value={selectedCourse ? selectedCourse.course : ""}
                  onValueChange={(val) => {
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
                  <ComboboxInput placeholder="Rechercher un cours" />
                  <ComboboxContent>
                    {filteredCourses.length === 0 && (
                      <ComboboxEmpty>Aucun cours trouvé</ComboboxEmpty>
                    )}
                    <ComboboxList>
                      {filteredCourses.map((course: Course) => (
                        <ComboboxItem key={course.id} value={course.course}>
                          <Item size="sm" className="p-0">
                            <ItemContent>
                              <ItemTitle className="whitespace-nowrap">
                                {course.course}
                              </ItemTitle>
                              <ItemDescription>
                                {course.level} {course.parcours}
                              </ItemDescription>
                            </ItemContent>
                          </Item>
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>

                <Field>
                  <FieldLabel>Type d'examen</FieldLabel>
                  <Select
                    value={selectedExamId}
                    onValueChange={setSelectedExamId}
                    disabled={!selectedCourse}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisissez le type de l'examen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {examType.map((type: Exam) => (
                          <SelectItem key={type.id} value={String(type.id)}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>Année de l'examen</FieldLabel>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisissez l'année" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {years.map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year - 1 + "/" + year}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <FieldLabel>Téléverser une annale</FieldLabel>
                    <Input
                      id="file-main"
                      name="file-main"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileChange(e, setSelectedFile)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Seul le format pdf est accepté.
                    </p>
                  </div>
                </div>

                <Collapsible
                  open={isOpen}
                  onOpenChange={setIsOpen}
                  className="w-full border p-3 rounded-lg bg-slate-50/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-slate-700">
                      Annexes optionnelles
                    </h4>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <ChevronsUpDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent className="space-y-4">
                    {annexes.map((annexe, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-md bg-white space-y-3 shadow-sm relative group"
                      >
                        <div className="flex items-end gap-2">
                          <Field className="flex-1">
                            <FieldLabel className="text-xs">
                              Type de document
                            </FieldLabel>
                            <Select
                              value={annexe.type}
                              onValueChange={(val) =>
                                updateAnnexe(index, "type", val)
                              }
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="url">URL</SelectItem>
                                <SelectItem value="fichier">Fichier</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>

                          <div className="flex gap-1 mb-[2px]">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-9 text-blue-600 border-blue-200 hover:bg-blue-50"
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
                                className="size-9 text-red-500 border-red-100 hover:bg-red-50"
                                onClick={() => removeAnnexe(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <div className="space-y-1">
                            <p className="text-[11px] font-bold uppercase text-slate-400">
                              Source
                            </p>
                            {annexe.type === "url" ? (
                              <Input
                                className="h-9"
                                placeholder="https://lien-vers-correction.pdf"
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
                              <Input
                                className="h-9 text-xs py-1"
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
                          <div className="space-y-1">
                            <p className="text-[11px] font-bold uppercase text-slate-400">
                              Commentaire
                            </p>
                            <Input
                              className="h-9"
                              placeholder="Ex: Correction détaillée..."
                              value={annexe.comment}
                              onChange={(e) =>
                                updateAnnexe(index, "comment", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>

                <div className="flex justify-center space-x-3 mt-8">
                  <Button  type="submit" disabled={submitting}>
                    {submitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Envoyer
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
