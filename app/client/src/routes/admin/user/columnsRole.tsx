"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserBadge } from "@/components/userBadge";

import type { PermValue } from "@/contexts/AuthContext";

export type Role = {
  id: number;
  name: string;
  color: string;
  permissions?: PermValue[];
};

type ColumnActions = {
  onEdit: (user: Role) => void;
  onDelete: (user: Role) => void;
};

export const createColumns = ({
  onEdit,
  onDelete,
}: ColumnActions): ColumnDef<Role>[] => [
  {
    accessorKey: "name",
    header: "Rôle",
    enableSorting: true,
    cell: ({ row }) => {
      const role = row.original;
      return <UserBadge key={role.id} text={role.name} color={role.color} />;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    enableSorting: false,
    cell: ({ row }) => {
      const role = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Ouvrir le menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(role)}>
              <Pencil />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(role)}
              variant="destructive"
            >
              <Trash2 />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
