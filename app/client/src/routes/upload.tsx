import { useEffect, useState } from "react";
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

export function Upload() {
  const [loading, setLoading] = useState(true);

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [examType, setExamType] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState("");
   const [selectedYear, setSelectedYear] = useState("")
  const [selectedSemester, setSelectedSemester] = useState("")

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
                        courseTypeId : selectedCourse, 
                    }
                });
                setExamType(data);
            } catch (error) {
                console.log(getRequestMessage(error));

            } 
        }
        fetchExamType();

    } else {
       
        setExamType([]);
    }

  }, [selectedCourse])

  const years = [];
  for (let i = 2026; i >= 2005; --i) {
    years.push(i);
  }
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
              <Field>
                <FieldLabel>Matière</FieldLabel>
                <Select  onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisisez la matière" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {courses.map((item: any) =>
                        item.level.map((item_level: any) =>
                          item_level.course.map((item_course: any) => (
                            <SelectItem key={item_course.id} value={String(item_course.id)}>
                              {item_course.name} (  {item_level.name}  {item.name} )
                            </SelectItem>
                          )),
                        ),
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
      
              </Field>

               <Field>
                <FieldLabel>Type d'examen</FieldLabel>
                <Select value={selectedExamId} 
                    onValueChange={setSelectedExamId} 
                    disabled={!selectedCourse} >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisisez le type de l'examen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {
                          examType.map((type: any) => (
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
                <Select value={selectedSemester} 
                    onValueChange={setSelectedSemester} 
                    disabled={!selectedCourse} >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisisez le type de l'examen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                     {
                            years.map((year) => (
                            <SelectItem key={year} value={String(year)}>
                            {(year-1) + "/" + (year)}
                            </SelectItem>
                              ))
                      }

                      
                    </SelectGroup>
                  </SelectContent>
                </Select>
      
              </Field>
              <div className="space-y-6">
          
              <div className="space-y-2">
           

                   <FieldLabel>
                         Téléverser une annales  
                    </FieldLabel>
                <Input
                  id="file-1"
                  name="file-1"
                  type="file"
                  accept=".pdf"
                />
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
