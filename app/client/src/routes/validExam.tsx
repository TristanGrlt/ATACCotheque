import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { API_ENDPOINT } from "@/config/env";
import { apiRequest, getRequestMessage } from "@/services/api";
import { useEffect, useState } from "react";

type reviewExam = {
  id: number;
  path: string;
  year: number;
  courseName: string;
  parcours: string[];
};

export function ValidExam() {
  const [reviewExam, setReviewExam] = useState<reviewExam[]>([]);
  useEffect(() => {
    const fetchToReview = async () => {
      try {
        const { data } = await apiRequest.get("/pastExam/toReview");
        setReviewExam(data);
      } catch (error) {
        console.log(getRequestMessage(error));
      } finally {
      }
    };
    fetchToReview();
  }, []);

  return (
    <div className="flex flex-wrap gap-3">
      {reviewExam.map((exam) => (
        <Card className="relative  w-full max-w-sm  pt-0">
        <iframe src={`${API_ENDPOINT}/pastExam/invalidFile/${exam.id}`} ></iframe>
          <CardHeader>
            <CardAction>
              <Badge variant="secondary">{exam.year}</Badge>
            </CardAction>
            <CardTitle>{exam.courseName} </CardTitle>
            <CardDescription>
             {exam.parcours.join(", ")}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full">Réviser l'annale</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
