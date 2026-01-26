"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { DataTable } from "@/components/dataTable/dataTable"
import { createColumns, type User } from "./columns"
import { AddUser } from "@/components/admin/addUser"
import { apiRequest } from "@/services/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash, Trash2 } from "lucide-react"

export function User() {
  
  const [data, setData] = useState<User[]>([])
  const [selectedRows, setSelectedRows] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
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











  const handleEdit = useCallback((user: User) => {
    console.log("Édit")
  }, [])

  const handleDelete = useCallback((user: User) => {
    if (confirm(`Voulez-vous vraiment supprimer ${user.username} ?`)) {
      setData(data.filter(u => u._id !== user._id))
    }
  }, [data])

  const handleRowSelection = useCallback((rows: User[]) => {
    setSelectedRows(rows)
    console.log("Lignes sélectionnées:", rows)
  }, [])

  const handleDeleteSelected = useCallback(() => {
    if (selectedRows.length === 0) return
    
    if (confirm(`Supprimer ${selectedRows.length} utilisateur(s) ?`)) {
      const selectedIds = selectedRows.map(r => r._id)
      setData(data.filter(u => !selectedIds.includes(u._id)))
      // toast?.success(`${selectedRows.length} utilisateur(s) supprimé(s)`)
    }
  }, [selectedRows])

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
        <DataTable 
          columns={columns} 
          data={data}
          searchKey="username"
          searchPlaceholder="Filtrer par nom d'utilisateurs..."
          onRowSelectionChange={handleRowSelection}
        />
      )}
    </div>
  )
}