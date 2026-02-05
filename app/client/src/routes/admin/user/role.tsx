import { useState, useCallback, useMemo, useEffect } from "react"
import { DataTable } from "@/components/dataTable/dataTable"
import { createColumns, type Role } from "./columnsRole"
import { AddUser } from "@/components/admin/addUser"
import { apiRequest, getRequestMessage } from "@/services/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2 } from "lucide-react"
import { DeleteConfirmDialog } from "@/components/deleteConfirmDialog"

export function Role() {
  
  const [data, setData] = useState<Role[]>([])
  const [selectedRows, setSelectedRows] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userToDelete, setUserToDelete] = useState<Role | null>(null)
  const [usersToDelete, setUsersToDelete] = useState(false)

  useEffect(() => {

    // -----  LOAD  -----
    const loadUsers = async () => {
      try {
        const { data: users } = await apiRequest.get('/role')
        setData(users)
      } catch (err) {
        toast.error("Erreur lors du chargement de la page", {
          description: getRequestMessage(err)
        })
      } finally {
        setIsLoading(false);
      }
    }
    loadUsers()
  }, [])

  // -----  EDIT  -----
  const handleEdit = useCallback((_user: Role) => {
    console.log("Édit")
  }, [])

  // -----  DELETE  -----
  const handleDelete = useCallback((user: Role) => {
    setUserToDelete(user)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (userToDelete) {
      try {
        await apiRequest.delete(`/user/${userToDelete.id}`)
      } catch (err) {
        toast.error(`Une erreur est survenue lors de la supression : ${getRequestMessage(err)}`);
        return;
      }
      setData(data.filter(u => u.id !== userToDelete.id))
      setUserToDelete(null)
      toast.success(`${userToDelete.name} a été supprimé(e)`)
    }
  }, [data, userToDelete])

  // -----  ROW SELECTION DEL  -----
  const handleRowSelection = useCallback((rows: Role[]) => {
    setSelectedRows(rows)
  }, [])

  const handleDeleteSelected = useCallback(() => {
    if (selectedRows.length === 0) return
    setUsersToDelete(true);    
  }, [selectedRows, data, setData])

  const confirmDeleteSelected = useCallback(async () => {
    if (selectedRows.length === 0) return

    const selectedIds = selectedRows.map(r => r.id)
    const deletedIds: Role["id"][] = []
    const errors: unknown[] = []

    for (const id of selectedIds) {
      try {
        await apiRequest.delete(`/user/${id}`)
        deletedIds.push(id)
      } catch (err) {
        errors.push(err)
      }
    }

    if (deletedIds.length > 0) {
      setData(prev => prev.filter(u => !deletedIds.includes(u.id)))
      setSelectedRows(prev => prev.filter(u => !deletedIds.includes(u.id)))
      const successCount = deletedIds.length
      toast.success(`${successCount} utilisateur${successCount > 1 ? 's ont' : ' a'} été supprimé${successCount > 1 ? 's' : ''}`)
    }

    if (errors.length > 0) {
      toast.error(`Une erreur est survenue lors de la suppression de ${errors.length} utilisateur${errors.length > 1 ? 's' : ''} : ${getRequestMessage(errors[0])}`)
    }

    setUsersToDelete(false)
  }, [selectedRows])

  // -----  MEMO  -----
  const columns = useMemo(() => createColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  }), [handleEdit, handleDelete])

  return (
    <div className="mx-auto mt-2">
      <div className="mb-6 flex justify-between">
        <h1 className="text-3xl font-bold">Gestion des rôles</h1>
        {selectedRows.length > 0 ? (
          <Button variant="destructive" onClick={handleDeleteSelected}>
            <Trash2 />
            Supprimer la sélection
          </Button>) : (
            <AddUser
            />
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
            searchPlaceholder="Filtrer par rôles..."
            onRowSelectionChange={handleRowSelection}
          />

          <DeleteConfirmDialog
            open={!!userToDelete}
            onOpenChange={(open) => !open && setUserToDelete(null)}
            onConfirm={confirmDelete}
            title="Supprimer cet utilisateur ?"
            description="Cette action est irréversible. L'utilisateur"
            itemName={userToDelete?.name}
          />

          <DeleteConfirmDialog
            open={!!usersToDelete}
            onOpenChange={(open) => !open && setUsersToDelete(false)}
            onConfirm={confirmDeleteSelected}
            title={`Supprimer la sélection de ${selectedRows.length} utilisateur${selectedRows.length > 1 ? 's' : ''} ?`}
            description="Cette action est irréversible. La sélection sera définitivement supprimée"
          />
        </>
      )}
    </div>
  )
}