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

              <div className="flex justify-center space-x-3 mt-8">
                <Button type="submit">Submit</Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
