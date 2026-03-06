import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Drama, User2 } from "lucide-react";
import { User } from "./user";
import { Role } from "./role";


export function UserIndex() {
  
  return(
    <Tabs defaultValue="user">
      <div className="flex justify-center mt-3">
        <TabsList>
          <TabsTrigger value="user">
            <User2 />
            Utilisateur
          </TabsTrigger>
          <TabsTrigger value="role">
            <Drama />
            Rôle
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="user">
        <User />
      </TabsContent>
      <TabsContent value="role">
        <Role />
      </TabsContent>
    </Tabs>
  )
}