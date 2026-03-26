import { Badge } from "@/components/ui/badge";
import { DeleteConfirmDialog } from "@/components/deleteConfirmDialog";
import { Pencil, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MajorIconMap } from "@/config/icons";

// ── Types ──────────────────────────────────────────────

export interface ItemBadge {
  id: number | string;
  label: string;
  className?: string;
}

export interface ListItem {
  id: number;
  name: string;
  icon?: string;
  badges?: ItemBadge[];
}

interface EditableDeletableItemListProps<T extends ListItem> {
  /** Items to display */
  items: T[];
  /** Currently selected item id */
  selectedId?: number | string | null;
  /** Callback when an item is clicked (selection) */
  onSelect?: (item: T) => void;
  /** Callback when an item is confirmed for deletion */
  onDelete?: (item: T) => void;
  /** Render the form for editing a given item. Return null/undefined to disable editing. */
  renderForm?: (item: T, onCancel: () => void) => ReactNode;
  /** Message when the list is empty and no form is showing */
  emptyMessage?: string;
  /** Label used in the delete confirmation dialog */
  deleteLabel?: string;
}

// ── Component ──────────────────────────────────────────

export function EditableDeletableItemList<T extends ListItem>({
  items,
  selectedId,
  onSelect,
  onDelete,
  renderForm,
  emptyMessage = "Aucun élément",
  deleteLabel,
}: EditableDeletableItemListProps<T>) {
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);

  const handleEdit = (item: T, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(item.id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleDeleteClick = (item: T, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(item);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget && onDelete) {
      onDelete(deleteTarget);
    }
    setDeleteTarget(null);
  };

  if (items.length === 0 && editingId === null) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const isSelected = selectedId != null && item.id === selectedId;
          const isEditing = editingId === item.id;

          if (isEditing && renderForm) {
            return <li key={item.id}>{renderForm(item, handleCancelEdit)}</li>;
          }

          return (
            <li
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect?.(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onSelect?.(item);
              }}
              className={cn(
                "group relative flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors cursor-pointer select-none",
                "hover:bg-accent",
                isSelected &&
                  "bg-accent border-primary/30 ring-1 ring-primary/20",
              )}
            >
              {/* Optional Icon */}
              {item.icon && MajorIconMap[item.icon] ? (
                <span className="text-muted-foreground mr-1">
                  {(() => {
                    const IconComp = MajorIconMap[item.icon!];
                    return <IconComp size={16} />;
                  })()}
                </span>
              ) : null}

              {/* Item name */}
              <span className="font-medium">{item.name}</span>

              {/* Badges */}
              {item.badges && item.badges.length > 0 && (
                <div className="flex flex-wrap gap-1 ml-auto mr-12">
                  {item.badges.map((badge) => (
                    <Badge
                      key={badge.id}
                      variant="secondary"
                      className={cn("text-[10px] px-1.5 py-0", badge.className)}
                    >
                      {badge.label}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Actions (visible on hover desktop, always visible on mobile) */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex lg:hidden lg:group-hover:flex items-center gap-1">
                {renderForm && (
                  <button
                    type="button"
                    onClick={(e) => handleEdit(item, e)}
                    className="p-1 rounded-md hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                    title="Modifier"
                  >
                    <Pencil size={14} />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(item, e)}
                    className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title={`Supprimer ${deleteLabel ?? "cet élément"} ?`}
        itemName={deleteTarget?.name}
      />
    </>
  );
}
