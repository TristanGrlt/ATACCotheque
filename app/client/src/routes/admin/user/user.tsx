"use client"

import { useState, useCallback, useMemo } from "react"
import { DataTable } from "@/components/dataTable/dataTable"
import { createColumns, type User } from "./columns"
// import { toast } from "sonner" // ou votre système de notifications

// Données de test en dur
const mockUsers: User[] = [
  {
    id: 1,
    name: "Jean Dupont",
    email: "jean.dupont@example.com",
    role: "admin",
  },
  {
    id: 2,
    name: "Marie Martin",
    email: "marie.martin@example.com",
    role: "user",
  },
  {
    id: 3,
    name: "Pierre Dubois",
    email: "pierre.dubois@example.com",
    role: "moderator",
  },
  {
    id: 4,
    name: "Sophie Laurent",
    email: "sophie.laurent@example.com",
    role: "user",
  },
  {
    id: 5,
    name: "Luc Bernard",
    email: "luc.bernard@example.com",
    role: "admin",
  },
  {
    id: 6,
    name: "Claire Petit",
    email: "claire.petit@example.com",
    role: "user",
  },
  {
    id: 7,
    name: "Thomas Moreau",
    email: "thomas.moreau@example.com",
    role: "moderator",
  },
  {
    id: 8,
    name: "Emma Simon",
    email: "emma.simon@example.com",
    role: "user",
  },
  {
    id: 9,
    name: "Nicolas Michel",
    email: "nicolas.michel@example.com",
    role: "admin",
  },
  {
    id: 10,
    name: "Julie Lefevre",
    email: "julie.lefevre@example.com",
    role: "user",
  },
  {
    id: 11,
    name: "Antoine Garcia",
    email: "antoine.garcia@example.com",
    role: "moderator",
  },
  {
    id: 12,
    name: "Camille Roux",
    email: "camille.roux@example.com",
    role: "user",
  },
]

export function User() {
  const [data, setData] = useState<User[]>(mockUsers)
  const [selectedRows, setSelectedRows] = useState<User[]>([])

  // Gérer l'édition
  const handleEdit = useCallback((user: User) => {
    console.log("Éditer:", user)
    // toast?.success(`Édition de ${user.name}`)
    // Ici vous pouvez ouvrir un modal, naviguer vers une page, etc.
  }, [])

  // Gérer la suppression
  const handleDelete = useCallback((user: User) => {
    if (confirm(`Voulez-vous vraiment supprimer ${user.name} ?`)) {
      setData(data.filter(u => u.id !== user.id))
      // toast?.success(`${user.name} supprimé avec succès`)
    }
  }, [data])

  // Gérer la sélection de lignes
  const handleRowSelection = useCallback((rows: User[]) => {
    setSelectedRows(rows)
    console.log("Lignes sélectionnées:", rows)
  }, [])

  // Supprimer toutes les lignes sélectionnées
  const handleDeleteSelected = useCallback(() => {
    if (selectedRows.length === 0) return
    
    if (confirm(`Supprimer ${selectedRows.length} utilisateur(s) ?`)) {
      const selectedIds = selectedRows.map(r => r.id)
      setData(data.filter(u => !selectedIds.includes(u.id)))
      // toast?.success(`${selectedRows.length} utilisateur(s) supprimé(s)`)
    }
  }, [selectedRows])

  const columns = useMemo(() => createColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  }), [handleEdit, handleDelete])

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
        <p className="text-muted-foreground mt-2">
          Gérez vos utilisateurs avec tri, filtrage et pagination
        </p>
      </div>

      {/* Actions groupées (optionnel) */}
      {selectedRows.length > 0 && (
        <div className="mb-4 flex items-center gap-2 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedRows.length} élément(s) sélectionné(s)
          </span>
          <button
            onClick={handleDeleteSelected}
            className="ml-auto px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
          >
            Supprimer la sélection
          </button>
        </div>
      )}

      <DataTable 
        columns={columns} 
        data={data}
        searchKey="email"
        searchPlaceholder="Filtrer par email..."
        onRowSelectionChange={handleRowSelection}
      />
    </div>
  )
}