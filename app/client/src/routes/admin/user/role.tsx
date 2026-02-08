import { useState, useCallback, useMemo } from "react"
import { DataTableServer } from "@/components/dataTable/dataTableServer"
import { createColumns, type Role } from "./columnsRole"
import { usePaginatedData } from "@/hooks/usePaginatedData"
import { apiRequest, getRequestMessage } from "@/services/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { DeleteConfirmDialog } from "@/components/deleteConfirmDialog"
import { AddRole } from "@/components/admin/user/addRole"
import { RoleFormDialog } from "@/components/admin/user/roleFormDialog"

export function Role() {
  
  const [selectedRows, setSelectedRows] = useState<Role[]>([])
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const [rolesToDelete, setRolesToDelete] = useState(false)
  const [openEditRole, setOpenEditRole] = useState<Role | null>(null);
  

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
  } = usePaginatedData<Role>({
    endpoint: '/role',
    initialPageSize: 20,
  })

  // -----  EDIT  -----
  const handleEdit = useCallback((role: Role) => {
    setOpenEditRole(role)
  }, [])

  // -----  DELETE  -----
  const handleDelete = useCallback((role: Role) => {
    setRoleToDelete(role)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (roleToDelete) {
      try {
        await apiRequest.delete(`/role/${roleToDelete.id}`)
        setData(prev => prev.filter(r => r.id !== roleToDelete.id))
        setRoleToDelete(null)
        toast.success(`Le rôle "${roleToDelete.name}" a été supprimé`)
        refetch()
      } catch (err) {
        toast.error(`Une erreur est survenue lors de la suppression : ${getRequestMessage(err)}`);
      }
    }
  }, [roleToDelete, setData, refetch])

  // -----  ROW SELECTION  -----
  const handleRowSelection = useCallback((rows: Role[]) => {
    setSelectedRows(rows)
  }, [])

  const handleDeleteSelected = useCallback(() => {
    if (selectedRows.length === 0) return
    setRolesToDelete(true)
  }, [selectedRows])

  const confirmDeleteSelected = useCallback(async () => {
    if (selectedRows.length === 0) return

    const selectedIds = selectedRows.map(r => r.id)
    const deletedIds: Role["id"][] = []
    const errors: unknown[] = []

    for (const id of selectedIds) {
      try {
        await apiRequest.delete(`/role/${id}`)
        deletedIds.push(id)
      } catch (err) {
        errors.push(err)
      }
    }

    if (deletedIds.length > 0) {
      setData(prev => prev.filter(r => !deletedIds.includes(r.id)))
      setSelectedRows([])
      const successCount = deletedIds.length
      toast.success(`${successCount} rôle${successCount > 1 ? 's ont' : ' a'} été supprimé${successCount > 1 ? 's' : ''}`)
      refetch()
    }

    if (errors.length > 0) {
      toast.error(`Une erreur est survenue lors de la suppression de ${errors.length} rôle${errors.length > 1 ? 's' : ''} : ${getRequestMessage(errors[0])}`)
    }

    setRolesToDelete(false)
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
          <h1 className="text-3xl font-bold">Gestion des rôles</h1>
          <p className="text-muted-foreground mt-2">
            {pagination.totalCount} rôle{pagination.totalCount > 1 ? 's' : ''} au total
          </p>
        </div>
        {selectedRows.length > 0 ? (
          <Button variant="destructive" onClick={handleDeleteSelected}>
            <Trash2 />
            Supprimer la sélection ({selectedRows.length})
          </Button>
        ) : (
          <AddRole 
            onRoleCreated={(role) => {
              setData((prev) => [...prev, role])
              refetch()
            }}
          />
        )}
      </div>
        
      <DataTableServer
        columns={columns}
        data={data}
        pagination={pagination}
        searchKey="name"
        searchPlaceholder="Rechercher par nom de rôle..."
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
        onRowSelectionChange={handleRowSelection}
        isLoading={isLoading}
      />

      <DeleteConfirmDialog
        open={!!roleToDelete}
        onOpenChange={(open) => !open && setRoleToDelete(null)}
        onConfirm={confirmDelete}
        title="Supprimer ce rôle ?"
        description="Cette action est irréversible. Le rôle"
        itemName={roleToDelete?.name}
      />

      <DeleteConfirmDialog
        open={rolesToDelete}
        onOpenChange={(open) => !open && setRolesToDelete(false)}
        onConfirm={confirmDeleteSelected}
        title={`Supprimer ${selectedRows.length} rôle${selectedRows.length > 1 ? 's' : ''} ?`}
        description="Cette action est irréversible. La sélection sera définitivement supprimée"
      />

      <RoleFormDialog
        mode="edit"
        role={openEditRole ?? undefined}
        open={openEditRole != null}
        onOpenChange={() => setOpenEditRole(null)}
        onRoleSaved={(role) => {
            setData((prev) => [...prev, role])
            refetch()
          }}
        title={`Modifier le rôle "${openEditRole?.name?? ""}"`}
        description={`Remplisez les champs si dessous pour modifier le rôle ${openEditRole?.name?? ""}`}
      />
    </div>
  )
}