import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Paperclip,
  PenLine,
  Pencil,
  Plus,
  Trash2,
  Globe,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { normalizeNoteType } from "@/lib/notepad-utils";
import type {
  NoteType,
  NotepadCollection,
  NotepadNote,
} from "../../../lib/notepad/types";

type NotepadSidebarProps = {
  notes: NotepadNote[];
  collections: NotepadCollection[];
  activeNoteId: string;
  onSelect: (id: string) => void;
  onNewNote: (type: NoteType, collectionId?: string | null) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onMoveNote: (noteId: string, collectionId: string | null) => void;
  onNewCollection: () => void;
  onRenameCollection: (id: string, title: string) => void;
  onDeleteCollection: (id: string) => void;
};

function notePreviewLine(note: NotepadNote): string {
  if (normalizeNoteType(note) === "canvas") {
    return note.inkData?.trim() ? "Canvas drawing" : "Empty canvas";
  }
  return note.content.split("\n").find((line) => line.trim())?.trim() ?? "";
}

function NewNoteMenu({
  onNewNote,
  collectionId = null,
  className,
  label,
  compact,
}: {
  onNewNote: (type: NoteType, collectionId?: string | null) => void;
  collectionId?: string | null;
  className?: string;
  label?: string;
  compact?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1 rounded transition-colors hover:bg-muted",
            className,
          )}
          aria-label={
            collectionId ? "Add note to collection" : "Create note"
          }
          onClick={(e) => e.stopPropagation()}
        >
          {label ? (
            <>
              <Plus className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
            </>
          ) : (
            <Plus
              className={cn(
                "text-muted-foreground",
                compact ? "h-3.5 w-3.5" : "h-3.5 w-3.5",
              )}
            />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuItem onClick={() => onNewNote("markdown", collectionId)}>
          <FileText className="mr-2 h-3.5 w-3.5" />
          Note
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onNewNote("canvas", collectionId)}>
          <PenLine className="mr-2 h-3.5 w-3.5" />
          Canvas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NoteRow({
  note,
  active,
  canDelete,
  collections,
  onSelect,
  onDelete,
  onRename,
  onMoveNote,
}: {
  note: NotepadNote;
  active: boolean;
  canDelete: boolean;
  collections: NotepadCollection[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onMoveNote: (noteId: string, collectionId: string | null) => void;
}) {
  const noteType = normalizeNoteType(note);
  const preview = notePreviewLine(note);
  const attachmentCount = note.attachments?.length ?? 0;
  const currentCollectionId = note.collectionId ?? null;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.title);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showActions = active || hovered || confirmDelete;

  useEffect(() => {
    if (!editing) setDraft(note.title);
  }, [note.title, editing]);

  useEffect(() => {
    if (!editing) return;
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }, [editing]);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  const clearConfirmDelete = () => {
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
    setConfirmDelete(false);
  };

  const commitRename = () => {
    if (!editing) return;
    setEditing(false);
    const next = draft.trim() || "Untitled";
    if (next !== (note.title || "Untitled")) {
      onRename(note.id, next);
    } else {
      setDraft(note.title);
    }
  };

  const cancelRename = () => {
    setEditing(false);
    setDraft(note.title);
  };

  const startRename = () => {
    clearConfirmDelete();
    setDraft(note.title || "Untitled");
    setEditing(true);
  };

  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => {
        setConfirmDelete(false);
        confirmTimerRef.current = null;
      }, 3000);
      return;
    }
    clearConfirmDelete();
    onDelete(note.id);
  };

  return (
    <li
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        clearConfirmDelete();
      }}
      onFocus={() => setHovered(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setHovered(false);
          clearConfirmDelete();
        }
      }}
    >
      {editing ? (
        <div
          className={cn(
            "flex w-full items-center gap-1.5 rounded-md py-1.5 pl-2 pr-2",
            active ? "bg-muted" : "bg-muted/60",
          )}
        >
          {noteType === "canvas" ? (
            <PenLine className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
          ) : (
            <FileText className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
          )}
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitRename();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancelRename();
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none"
            aria-label="Rename note"
          />
        </div>
      ) : (
        <div
          className={cn(
            "flex items-center rounded-lg transition-colors",
            active
              ? "bg-muted"
              : "hover:bg-muted/50",
          )}
        >
          <button
            type="button"
            onClick={() => onSelect(note.id)}
            onDoubleClick={(e) => {
              e.preventDefault();
              startRename();
            }}
            className={cn(
              "flex min-w-0 flex-1 flex-col gap-0.5 py-2 pl-2.5 text-left text-sm transition-colors",
              showActions ? "pr-1" : "pr-2.5",
              active
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="flex min-w-0 items-center gap-1.5">
              {noteType === "canvas" ? (
                <PenLine className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
              ) : (
                <FileText className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
              )}
              <span className="truncate" title={note.title || "Untitled"}>
                {note.title || "Untitled"}
              </span>
              {note.shareToken && (
                <span title="Publicly shared" className="inline-flex shrink-0">
                  <Globe
                    className="h-3 w-3 text-emerald-600/80"
                    aria-label="Publicly shared"
                  />
                </span>
              )}
              {attachmentCount > 0 && (
                <span
                  className="inline-flex shrink-0 items-center gap-0.5 text-[10px] font-medium tabular-nums text-muted-foreground/80"
                  title={`${attachmentCount} attachment${attachmentCount === 1 ? "" : "s"}`}
                >
                  <Paperclip className="h-2.5 w-2.5" />
                  {attachmentCount}
                </span>
              )}
            </span>
            {preview && (
              <span className="truncate pl-5 text-[11px] font-normal leading-snug text-muted-foreground/80">
                {preview}
              </span>
            )}
          </button>

          <div
            className={cn(
              "flex shrink-0 items-center gap-px pr-1.5 transition-opacity duration-150",
              showActions
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none w-0 overflow-hidden opacity-0 pr-0",
            )}
          >
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
              aria-label={`Rename "${note.title || "Untitled"}"`}
              title="Rename"
              onClick={(e) => {
                e.stopPropagation();
                startRename();
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>

            {canDelete && (
              <button
                type="button"
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                  confirmDelete
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "text-muted-foreground hover:bg-red-500/10 hover:text-red-600",
                )}
                aria-label={
                  confirmDelete
                    ? `Confirm delete "${note.title || "Untitled"}"`
                    : `Delete "${note.title || "Untitled"}"`
                }
                title={
                  confirmDelete
                    ? "Click again to confirm delete"
                    : "Delete note"
                }
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}

            {collections.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground data-[state=open]:bg-background/70 data-[state=open]:text-foreground"
                    aria-label="Move note"
                    title="Move"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    disabled={currentCollectionId === null}
                    onClick={() => onMoveNote(note.id, null)}
                  >
                    Move to Uncategorized
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {collections.map((collection) => (
                    <DropdownMenuItem
                      key={collection.id}
                      disabled={currentCollectionId === collection.id}
                      onClick={() => onMoveNote(note.id, collection.id)}
                    >
                      Move to {collection.title || "Untitled"}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

function CollectionHeader({
  collection,
  noteCount,
  isCollapsed,
  onToggle,
  onNewNote,
  onRename,
  onDelete,
}: {
  collection: NotepadCollection;
  noteCount: number;
  isCollapsed: boolean;
  onToggle: () => void;
  onNewNote: (type: NoteType, collectionId?: string | null) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(collection.title);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showActions = hovered || confirmDelete;

  useEffect(() => {
    if (!editing) setDraft(collection.title);
  }, [collection.title, editing]);

  useEffect(() => {
    if (!editing) return;
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }, [editing]);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, []);

  const clearConfirmDelete = () => {
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
    setConfirmDelete(false);
  };

  const commitRename = () => {
    if (!editing) return;
    setEditing(false);
    const next = draft.trim() || "Untitled";
    if (next !== (collection.title || "Untitled")) {
      onRename(collection.id, next);
    } else {
      setDraft(collection.title);
    }
  };

  const cancelRename = () => {
    setEditing(false);
    setDraft(collection.title);
  };

  const startRename = () => {
    clearConfirmDelete();
    setDraft(collection.title || "Untitled");
    setEditing(true);
  };

  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => {
        setConfirmDelete(false);
        confirmTimerRef.current = null;
      }, 3000);
      return;
    }
    clearConfirmDelete();
    onDelete(collection.id);
  };

  return (
    <div
      className="flex items-center gap-0.5 rounded-md px-1 py-1 hover:bg-muted/50"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        clearConfirmDelete();
      }}
      onFocus={() => setHovered(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setHovered(false);
          clearConfirmDelete();
        }
      }}
    >
      {editing ? (
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <Folder className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitRename();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancelRename();
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="min-w-0 flex-1 bg-transparent text-xs font-medium text-foreground outline-none"
            aria-label="Rename collection"
          />
        </div>
      ) : (
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-1 text-left text-xs font-medium text-foreground"
          onClick={onToggle}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            startRename();
          }}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
          )}
          <Folder className="h-3.5 w-3.5 shrink-0 opacity-70" />
          <span className="truncate" title={collection.title}>
            {collection.title || "Untitled"}
          </span>
          <span className="ml-auto shrink-0 tabular-nums text-[10px] text-muted-foreground">
            {noteCount}
          </span>
        </button>
      )}

      {!editing && (
        <div
          className={cn(
            "flex shrink-0 items-center gap-px transition-opacity duration-150",
            showActions
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none w-0 overflow-hidden opacity-0",
          )}
        >
          <NewNoteMenu
            onNewNote={onNewNote}
            collectionId={collection.id}
            compact
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-background/70 hover:text-foreground"
          />
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
            aria-label={`Rename "${collection.title || "Untitled"}"`}
            title="Rename collection"
            onClick={(e) => {
              e.stopPropagation();
              startRename();
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-md transition-colors",
              confirmDelete
                ? "bg-red-600 text-white hover:bg-red-700"
                : "text-muted-foreground hover:bg-red-500/10 hover:text-red-600",
            )}
            aria-label={
              confirmDelete
                ? `Confirm delete "${collection.title || "Untitled"}"`
                : `Delete "${collection.title || "Untitled"}"`
            }
            title={
              confirmDelete
                ? "Click again to confirm delete"
                : "Delete collection"
            }
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export function NotepadSidebar({
  notes,
  collections,
  activeNoteId,
  onSelect,
  onNewNote,
  onDelete,
  onRename,
  onMoveNote,
  onNewCollection,
  onRenameCollection,
  onDeleteCollection,
}: NotepadSidebarProps) {
  const canDelete = notes.length > 1;
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const { uncategorized, byCollection } = useMemo(() => {
    const map = new Map<string, NotepadNote[]>();
    for (const collection of collections) {
      map.set(collection.id, []);
    }
    const loose: NotepadNote[] = [];
    for (const note of notes) {
      const cid = note.collectionId ?? null;
      if (cid && map.has(cid)) {
        map.get(cid)!.push(note);
      } else {
        loose.push(note);
      }
    }
    return { uncategorized: loose, byCollection: map };
  }, [notes, collections]);

  const toggleCollapsed = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-muted/20">
      <div className="flex items-center justify-between gap-1 px-3 pb-2 pt-3">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Notes
        </span>
        <div className="flex items-center gap-px">
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="New collection"
            title="New collection"
            onClick={onNewCollection}
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
          <NewNoteMenu
            onNewNote={onNewNote}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-3 pb-4">
          {collections.map((collection) => {
            const isCollapsed = Boolean(collapsed[collection.id]);
            const collectionNotes = byCollection.get(collection.id) ?? [];

            return (
              <div key={collection.id}>
                <CollectionHeader
                  collection={collection}
                  noteCount={collectionNotes.length}
                  isCollapsed={isCollapsed}
                  onToggle={() => toggleCollapsed(collection.id)}
                  onNewNote={onNewNote}
                  onRename={onRenameCollection}
                  onDelete={onDeleteCollection}
                />

                {!isCollapsed && (
                  <ul className="ml-2 space-y-0.5 border-l border-border/50 pl-2">
                    {collectionNotes.length === 0 ? (
                      <li className="px-2 py-1.5 text-[11px] text-muted-foreground">
                        Empty collection
                      </li>
                    ) : (
                      collectionNotes.map((note) => (
                        <NoteRow
                          key={note.id}
                          note={note}
                          active={note.id === activeNoteId}
                          canDelete={canDelete}
                          collections={collections}
                          onSelect={onSelect}
                          onDelete={onDelete}
                          onRename={onRename}
                          onMoveNote={onMoveNote}
                        />
                      ))
                    )}
                  </ul>
                )}
              </div>
            );
          })}

          <div>
            {collections.length > 0 && (
              <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Uncategorized
              </p>
            )}
            <ul className="space-y-0.5">
              {uncategorized.map((note) => (
                <NoteRow
                  key={note.id}
                  note={note}
                  active={note.id === activeNoteId}
                  canDelete={canDelete}
                  collections={collections}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onRename={onRename}
                  onMoveNote={onMoveNote}
                />
              ))}
              {uncategorized.length === 0 && collections.length === 0 && (
                <li className="px-2 py-2 text-xs text-muted-foreground">
                  No notes yet
                </li>
              )}
            </ul>
          </div>
        </div>
      </ScrollArea>

      <div className="space-y-0.5 border-t border-border/60 p-2">
        <button
          type="button"
          onClick={onNewCollection}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
        >
          <FolderPlus className="h-4 w-4 shrink-0" />
          New collection
        </button>
        <NewNoteMenu
          onNewNote={onNewNote}
          label="New note"
          className="w-full gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted/70 hover:text-foreground"
        />
      </div>
    </aside>
  );
}
