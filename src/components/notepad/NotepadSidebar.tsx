import { FileText, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
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
                  className={`flex w-full flex-col gap-0.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <span className="truncate">{note.title || "Untitled"}</span>
                  {note.content.trim() && (
                    <span className="truncate text-[11px] font-normal text-muted-foreground">
                      {note.content.split("\n").find((line: string) => line.trim()) ?? ""}
                    </span>
                  )}
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={`absolute right-1 top-1.5 flex h-6 w-6 items-center justify-center rounded transition-opacity hover:bg-background data-[state=open]:opacity-100 ${
                        active
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                      aria-label="Note options"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => onRename(note.id)}>
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Rename
                    </DropdownMenuItem>
                    {notes.length > 1 && (
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
