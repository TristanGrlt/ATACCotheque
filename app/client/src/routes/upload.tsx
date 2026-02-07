import { useEffect, useState, useMemo } from "react";
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

import { ChevronsUpDown } from "lucide-react";

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
type Course = {
  id: number;
  course: string;
  level: string;
  major: string;
};

import { Skeleton } from "@/components/ui/skeleton"


type Exam = {
  id: number;
  name: string;
};
export function Upload() {
  const [loading, setLoading] = useState(true);

  const [courses, setCourses] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const [examType, setExamType] = useState([]);

  const [selectedExamId, setSelectedExamId] = useState("");

  const [selectedYear, setSelectedYear] = useState("");

  const [selectedSemester, setSelectedSemester] = useState("");

  const [inputValue, setInputValue] = useState("");

  const [isOpen, setIsOpen] = useState(false);

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
    return courses.flatMap((item: any) =>
      item.level.flatMap((item_level: any) =>
        item_level.course.map((item_course: any) => ({
          id: item_course.id,
          course: item_course.name,
          level: item_level.name,
          major: item.name,
        })),
      ),
    );
  }, [courses]);
  const filteredCourses = useMemo(() => {
    if (!inputValue) {
      return all_course;
    }
    return all_course.filter((c: Course) =>
      c.course.toLowerCase().includes(inputValue.toLowerCase()),
    );
  }, [all_course, inputValue]);

  return (

    
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      {loading ?  <Card className="w-full max-w-xs">
      <CardHeader>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="aspect-video w-full" />
      </CardContent>
    </Card> : 
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <div className="flex flex-col items-center gap-2 text-center">
            <a>
              <div className="flex size-12 items-center justify-center rounded-md">
                <img src={logo} alt="atacc logo" />
              </div>
            </a>

            <h1 className="text-xl font-bold">
              Ajoutez une annale sur l'Attacothèque !{" "}
            </h1>
          </div>
        </CardHeader>

        <CardContent>
          <form encType="multipart/form-data">
            <FieldGroup>
              <FieldLabel>Choisisez la filière</FieldLabel>
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
                              {course.level} {course.major}
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
                    <SelectValue placeholder="Choisisez le type de l'examen" />
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

                <Select
                  value={selectedSemester}
                  onValueChange={setSelectedSemester}
                  disabled={!selectedCourse}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisisez le type de l'examen" />
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
                  <FieldLabel>Téléverser une annales</FieldLabel>

                  <Input id="file-1" name="file-1" type="file" accept=".pdf" />

                  <p className="text-sm text-muted-foreground">
                    Seul le format pdf est accepté.
                  </p>
                </div>
              </div>
              <Collapsible
                open={isOpen}
                onOpenChange={setIsOpen}
                className="w-full flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">
                    Ajouter une annexe optionnelle
                  </h4>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <ChevronsUpDown className="h-4 w-4" />
                      <span className="sr-only">Toggle details</span>
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent className="grid gap-4 mt-2">
                  <div className="grid gap-2">
                    <p className="text-sm font-medium">Fichier annexe</p>
                    <Input type="file" accept=".pdf" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <p className="text-sm font-medium">Commentaire</p>
                      <Input type="text" />
                    </div>

                    <div className="grid gap-2">
                      <p className="text-sm font-medium">Url annexe</p>
                      <Input type="text" placeholder="https://...pdf" />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="flex justify-center space-x-3 mt-8">
                <Button type="submit">Submit</Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>}
    </div>
  );
}
