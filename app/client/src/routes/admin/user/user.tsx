import { useState, useCallback, useMemo } from "react"
import { DataTableServer } from "@/components/dataTable/dataTableServer"
import { createColumns, type User } from "./columnsUser"
import { AddUser } from "@/components/admin/user/addUser"
import { usePaginatedData } from "@/hooks/usePaginatedData"
import { apiRequest, getRequestMessage } from "@/services/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { DeleteConfirmDialog } from "@/components/deleteConfirmDialog"
import { UserFormDialog } from "@/components/admin/user/userFormDialog"

export function User() {
  
  const [selectedRows, setSelectedRows] = useState<User[]>([])
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [usersToDelete, setUsersToDelete] = useState(false)
  const [openEditUser, setOpenEditUser] = useState<User | null>(null);

  const {
    data,
    pagination,
    isLoading,
    setData,
    handlePageChange,
    handlePageSizeChange,
    handleSearchChange,
    handleSortChange,
    refetch,
  } = usePaginatedData<User>({
    endpoint: '/user',
    initialPageSize: 20,
  })

  // -----  EDIT  -----
  const handleEdit = useCallback((user: User) => {
    setOpenEditUser(user)
  }, [])

  // -----  DELETE  -----
  const handleDelete = useCallback((user: User) => {
    setUserToDelete(user);
  }, [])

  const confirmDelete = useCallback(async () => {
    if (userToDelete) {
      try {
        await apiRequest.delete(`/user/${userToDelete.id}`);
        setData(prev => prev.filter(u => u.id !== userToDelete.id));
        setUserToDelete(null);
        toast.success(`${userToDelete.username} a été supprimé(e)`);
        refetch();
      } catch (err) {
        toast.error(`Une erreur est survenue lors de la suppression : ${getRequestMessage(err)}`);
      }
    }
  }, [userToDelete, setData, refetch])

  // -----  ROW SELECTION  -----
  const handleRowSelection = useCallback((rows: User[]) => {
    setSelectedRows(rows);
  }, [])

  const handleDeleteSelected = useCallback(() => {
    if (selectedRows.length === 0) return;
    setUsersToDelete(true);
  }, [selectedRows])

  const confirmDeleteSelected = useCallback(async () => {
    if (selectedRows.length === 0) return

    const selectedIds = selectedRows.map(r => r.id)
    const deletedIds: User["id"][] = []
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
      setSelectedRows([])
      const successCount = deletedIds.length
      toast.success(`${successCount} utilisateur${successCount > 1 ? 's ont' : ' a'} été supprimé${successCount > 1 ? 's' : ''}`)
      refetch()
    }

    if (errors.length > 0) {
      toast.error(`Une erreur est survenue lors de la suppression de ${errors.length} utilisateur${errors.length > 1 ? 's' : ''} : ${getRequestMessage(errors[0])}`)
    }

    setUsersToDelete(false)
  }, [selectedRows, setData, refetch])

  // -----  MEMO  -----
  const columns = useMemo(() => createColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  }), [handleEdit, handleDelete])

  return (
    <div className="mx-auto mt-2">
      <div className="mb-6 flex justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground mt-2">
            {pagination.totalCount} utilisateur{pagination.totalCount > 1 ? 's' : ''} au total
          </p>
        </div>
        {selectedRows.length > 0 ? (
          <Button variant="destructive" onClick={handleDeleteSelected}>
            <Trash2 />
            Supprimer la sélection ({selectedRows.length})
          </Button>
        ) : (
          <AddUser 
            onUserCreated={(user) => {
              setData((prev) => [...prev, user])
              refetch()
            }}
          />
        )}
      </div>
        
      <DataTableServer
        columns={columns}
        data={data}
        pagination={pagination}
        searchKey="username"
        searchPlaceholder="Rechercher par nom d'utilisateur..."
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        onRowSelectionChange={handleRowSelection}
        isLoading={isLoading}
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
        open={usersToDelete}
        onOpenChange={(open) => !open && setUsersToDelete(false)}
        onConfirm={confirmDeleteSelected}
        title={`Supprimer ${selectedRows.length} utilisateur${selectedRows.length > 1 ? 's' : ''} ?`}
        description="Cette action est irréversible. La sélection sera définitivement supprimée"
      />

      <UserFormDialog
          mode="edit"
          user={openEditUser ?? undefined}
          open={openEditUser != null}
          onOpenChange={() => setOpenEditUser(null)}
          onUserSaved={(user) => {
            setData((prev) => [...prev, user])
            refetch()
          }}
          title={`Modifier l'utilisateur "${openEditUser?.username?? ""}"`}
          description={`Modifier les champs si dessous de l'utilisateur "${openEditUser?.username?? ""}". Le mot de passe renseigné devra être changer par l'utilisateur lors de sa première connexion`}
        />
    </div>
  )
}