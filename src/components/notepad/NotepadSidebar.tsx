import { FileText, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { NotepadNote } from "../../../lib/notepad/types";

type NotepadSidebarProps = {
  notes: NotepadNote[];
  activeNoteId: string;
  onSelect: (id: string) => void;
  onNewNote: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string) => void;
};

export function NotepadSidebar({
  notes,
  activeNoteId,
  onSelect,
  onNewNote,
  onDelete,
  onRename,
}: NotepadSidebarProps) {
  const canDelete = notes.length > 1;

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r bg-muted/30">
      <div className="flex items-center justify-between px-3 py-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Notes
        </span>
        <button
          type="button"
          onClick={onNewNote}
          className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
          aria-label="New note"
          title="New note"
        >
          <Plus className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <ul className="space-y-0.5 pb-4">
          {notes.map((note) => {
            const active = note.id === activeNoteId;

            return (
              <li key={note.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(note.id)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 rounded-md py-1.5 pl-2 text-left text-sm transition-colors",
                    canDelete ? "pr-14" : "pr-8",
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <span className="truncate" title={note.title || "Untitled"}>
                    {note.title || "Untitled"}
                  </span>
                  {note.content.trim() && (
                    <span className="truncate text-[11px] font-normal text-muted-foreground">
                      {note.content.split("\n").find((line: string) => line.trim()) ?? ""}
                    </span>
                  )}
                </button>

                <div
                  className={cn(
                    "absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5 transition-opacity",
                    active
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
                  )}
                >
                  {canDelete && (
                    <button
                      type="button"
                      className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Delete "${note.title || "Untitled"}"`}
                      title="Delete note"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(note.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-background hover:text-foreground data-[state=open]:bg-background"
                        aria-label="Note options"
                        title="More options"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => onRename(note.id)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Rename
                      </DropdownMenuItem>
                      {canDelete && (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDelete(note.id)}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            );
          })}
        </ul>
      </ScrollArea>

      <div className="border-t p-2">
        <button
          type="button"
          onClick={onNewNote}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <FileText className="h-4 w-4" />
          New note
        </button>
      </div>
    </aside>
  );
}
