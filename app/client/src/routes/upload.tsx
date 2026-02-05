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
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
