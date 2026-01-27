import { useState, useCallback, useMemo, useEffect } from "react"
import { DataTable } from "@/components/dataTable/dataTable"
import { createColumns, type User } from "./columns"
import { AddUser } from "@/components/admin/addUser"
import { apiRequest } from "@/services/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2 } from "lucide-react"
import { DeleteConfirmDialog } from "@/components/deleteConfirmDialog"

export function User() {
  
  const [data, setData] = useState<User[]>([])
  const [selectedRows, setSelectedRows] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [usersToDelete, setUsersToDelete] = useState(false)

  useEffect(() => {

    // -----  LOAD  -----
    const loadUsers = async () => {
      try {
        const { data } = await apiRequest.get('/user')
        setData(data)
      } catch (err) {
        toast("Erreur lors du chargement de la page", {
          description: typeof err === "object" && err !== null && "error" in err ? (err as any).error : "Erreur inconnue"
        })
      } finally {
        setIsLoading(false);
      }
    }
    loadUsers()
  }, [])

  // -----  EDIT  -----
  const handleEdit = useCallback((_user: User) => {
    console.log("Édit")
  }, [])

  // -----  DELETE  -----
  const handleDelete = useCallback((user: User) => {
    setUserToDelete(user)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (userToDelete) {
      await apiRequest.delete(`/user/${userToDelete._id}`)
      setData(data.filter(u => u._id !== userToDelete._id))
      setUserToDelete(null)
      toast.success(`${userToDelete.username} a été supprimé`)
    }
  }, [data, userToDelete])

  // -----  ROW SELECTION DEL  -----
  const handleRowSelection = useCallback((rows: User[]) => {
    setSelectedRows(rows)
  }, [])

  const handleDeleteSelected = useCallback(() => {
    if (selectedRows.length === 0) return
    setUsersToDelete(true);    
  }, [selectedRows])

  const confirmDeleteSelected = useCallback(async () => {
    const selectedIds = selectedRows.map(r => r._id)
    setData(data.filter(u => !selectedIds.includes(u._id)))
    for (const id of selectedIds) {
      await apiRequest.delete(`/user/${id}`)
    }
    toast.success(`${selectedRows.length} utilisateur ont été supprimé`)
  }, [selectedRows])

  // -----  MEMO  -----
  const columns = useMemo(() => createColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  }), [handleEdit, handleDelete])

  return (
    <div className="mx-auto pt-6">
      <div className="mb-6 flex justify-between">
        <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
        {selectedRows.length > 0 ? (
          <Button variant="destructive" onClick={handleDeleteSelected}>
            <Trash2 />
            Supprimer la sélection
          </Button>) : (
            <AddUser />
          )}
      </div>
        
      {isLoading ? (
        <div className="flex w-full max-w-sm flex-col gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div className="flex gap-4" key={index}>
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <DataTable 
            columns={columns} 
            data={data}
            searchKey="username"
            searchPlaceholder="Filtrer par nom d'utilisateurs..."
            onRowSelectionChange={handleRowSelection}
          />

          <DeleteConfirmDialog
            open={!!userToDelete}
            onOpenChange={(open) => !open && setUserToDelete(null)}
            onConfirm={confirmDelete}
            title="Supprimer cet utilisateur ?"
            description="Cette action est irréversible. L'utilisateur"
            itemName={userToDelete?.username}
          />

          <DeleteConfirmDialog
            open={!!usersToDelete}
            onOpenChange={(open) => !open && setUsersToDelete(false)}
            onConfirm={confirmDeleteSelected}
            title={`Supprimer la sélection de ${selectedRows.length} d'utilisateur(s) ?`}
            description="Cette action est irréversible. La sélection sera définitivement supprimé"
          />
        </>
      )}
    </div>
  )
}