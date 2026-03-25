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
import { Link, useNavigate } from "react-router-dom";
type reviewExam = {
  id: number;
  path: string;
  year: number;
  courseName: string;
  parcours: string[];
};

export function ValidExam() {
  const navigate = useNavigate();
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

  if (reviewExam.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <h1 className="text-4xl font-bold mb-4 text-center">
          Aucune annale en attente de validation pour le moment
        </h1>
        <p className="text-muted-foreground text-center max-w-2xl">
          Toutes les annales soumises ont été révisées ou il n'y a pas encore
          d'annales soumises. Revenez plus tard pour voir les nouvelles annales
          en attente de validation.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {reviewExam.map((exam) => (
        <Card className="relative  w-full max-w-sm  pt-0">
          <iframe
            src={`${API_ENDPOINT}/pastExam/adminFile/${exam.id}`}
          ></iframe>
          <CardHeader>
            <CardAction>
              <Badge variant="secondary">{exam.year}</Badge>
            </CardAction>
            <CardTitle>{exam.courseName} </CardTitle>
            <CardDescription>{exam.parcours.join(", ")}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link to={`/admin/manageExam?id=${exam.id}`} className="w-full">
              <Button className="w-full">Réviser l'annale</Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
