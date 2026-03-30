"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Key, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Role } from "./columnsRole";
import { UserBadge } from "@/components/userBadge";

export type User = {
  id: number;
  username: string;
  roles: Role[];
};

type ColumnActions = {
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onReinitMfa: (user: User) => void;
};

export const createColumns = ({
  onEdit,
  onDelete,
  onReinitMfa,
}: ColumnActions): ColumnDef<User>[] => [
  {
    accessorKey: "username",
    header: "Nom d'utilisateur",
    enableSorting: true,
  },
  {
    accessorKey: "roles",
    header: "Rôles",
    enableSorting: false,
    cell: ({ row }) => {
      const roles = row.getValue("roles") as Role[];
      return (
        <div className="flex gap-1 flex-wrap">
          {roles.length === 0 ? (
            <span className="text-muted-foreground">aucun</span>
          ) : null}
          {roles.map((role) => (
            <UserBadge key={role.id} text={role.name} color={role.color} />
          ))}
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    enableSorting: false,
    cell: ({ row }) => {
      const user = row.original;

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
            <DropdownMenuItem onClick={() => onReinitMfa(user)}>
              <Key />
              Réinitialiser 2FA
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(user)}>
              <Pencil />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(user)}
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
