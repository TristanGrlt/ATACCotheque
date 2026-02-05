import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"


import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import logo from '/atacc_logo.png'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiRequest } from "@/services/api"


export function Upload() {
  const [majors, setMajors] = useState([])
  const [loading, setLoading] = useState(true)
const [selectedMajor, setSelectedMajor] = useState("")
  const [selectedCycle, setSelectedCycle] = useState("")
  const [courses, setCourses] = useState([]) 
  const [selectedCourse, setSelectedCourse] = useState("") 
  
  const [selectedYear, setSelectedYear] = useState("")
  const [selectedSemester, setSelectedSemester] = useState("")
  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const { data } = await apiRequest.get("/major")
        setMajors(data.major)
      } catch (error) {
        console.error("Error fetching majors:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMajors()
  }, [])




    useEffect(() => {
   
    if (selectedMajor && selectedCycle) {
        
        
        const fetchCourses = async () => {
            try {
              
                const { data } = await apiRequest.get("/course", {
                    params: {
                        major: selectedMajor, 
                        cycle: selectedCycle
                    }
                });
                setCourses(data.courses);
            } catch (error) {
                console.error(error);
            }
        }
        fetchCourses();

    } else {
       
        setCourses([]);
    }

  }, [selectedMajor, selectedCycle])





  
  const years = [];
    for (let i = 2026; i >=2005; --i) {
         years.push(i);
    }
  return (
       <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">

        <Card className="w-full max-w-sm shadow-xl">
         <CardHeader>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <a>
                      <div className="flex size-12 items-center justify-center rounded-md">
                        <img src={logo} alt="atacc logo" />
                      </div>
                    </a>
                    <h1 className="text-xl font-bold">Ajoutez une annale sur l'Attacothèque ! </h1>
                  
                  </div>
               
                </CardHeader>

        <CardContent>

            <form encType='multipart/form-data' >

            <FieldGroup>
                <Field>
                    <FieldLabel>
                        Filières 
                    </FieldLabel>
                   <Select value={selectedMajor} onValueChange={setSelectedMajor}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choisisez votre filière "/>

                            
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {
                                    majors.map((item: any) => (
                                    <SelectItem key={item._id} value={item._id}>
                                    {item.name}
                                </SelectItem>
                                    ))
                                }
                               
                            </SelectGroup>
                        </SelectContent>

                        
                   </Select>
                     <FieldLabel>
                        Cycle 
                    </FieldLabel>
                     <Select value={selectedCycle} onValueChange={setSelectedCycle} >
                    <SelectTrigger>
                            <SelectValue placeholder="Choisissez un cycle"/>
                                
                            
                        </SelectTrigger>

                         <SelectContent>
                            <SelectGroup>
                             
                                 
                                     <SelectItem value="L1">
                                        L1
                                 </SelectItem>
                                 <SelectItem value="L2">
                                        L2
                                 </SelectItem>
                                 <SelectItem value="L3">
                                        L3
                                 </SelectItem>
                                 <SelectItem value="M1">
                                        M1
                                 </SelectItem>
                                 <SelectItem value="M2">
                                        M2
                                 </SelectItem>
                               
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                <FieldLabel>Matière</FieldLabel>
                <Select 
                  value={selectedCourse} 
                  onValueChange={setSelectedCourse} 
                  disabled={courses.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisissez une matière" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {courses.map((course: any) => (
                        <SelectItem key={course._id} value={course._id}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                    
                    <FieldLabel>
                        Année 
                    </FieldLabel>
                    

                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                            <SelectValue placeholder="Choisissez une année "/>
                                
                            
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

                      <FieldLabel>
                        Type d'exam 
                    </FieldLabel>
                     <Select >
                    <SelectTrigger>
                            <SelectValue placeholder="Choisissez le semestre"/>
                                
                            
                        </SelectTrigger>

                         <SelectContent>
                            <SelectGroup>
                             
                                 
                                     <SelectItem value="CC1">
                                        CC1
                                 </SelectItem>
                                 
                                     <SelectItem value="CC2">
                                        CC2
                                 </SelectItem>
                                 
                                     <SelectItem value="CC3">
                                        CC3
                                 </SelectItem>
                                 
                                     <SelectItem value="EXAM">
                                        EXAM
                                 </SelectItem>
                                 
                                     <SelectItem value="CCTP">
                                        CCTP
                                 </SelectItem>
                                     <SelectItem value="SC">
                                        Seconde chance
                                 </SelectItem>
                               
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                 <FieldLabel>
                        Semestre 
                    </FieldLabel>
                     <Select  value={selectedSemester} onValueChange={setSelectedSemester}>
                    <SelectTrigger>
                            <SelectValue placeholder="Choisissez le semestre"/>
                                
                            
                        </SelectTrigger>

                         <SelectContent>
                            <SelectGroup>
                             
                                 
                                     <SelectItem value="s1">
                                        S1
                                 </SelectItem>
                                  <SelectItem value="s2">
                                        S2
                                 </SelectItem>
                               
                            </SelectGroup>
                        </SelectContent>
                    </Select>
        
            
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


                </Field>
            </FieldGroup>                     
            
            </form>
        </CardContent>

        </Card>

                                
     </div>
  )
}
