import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Globe, Link2Off, Lock, LogOut, Menu, PanelLeftClose, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NotepadSidebar } from "@/components/notepad/NotepadSidebar";
import { NoteAttachments } from "@/components/notepad/NoteAttachments";
import { MarkdownPreview } from "@/components/notepad/MarkdownPreview";
import { StylusCanvas } from "@/components/notepad/StylusCanvas";
import {
  createNoteShareLink,
  deleteNotepadAttachment,
  getNotepadAuthStatus,
  getNotepadWorkspace,
  logoutNotepad,
  revokeNoteShareLink,
  saveNotepadWorkspace,
  sharedNoteUrl,
  verifyNotepadPassword,
} from "@/lib/notepad-client";
import {
  createNotepadCollection,
  createNotepadNote,
  defaultNotepadWorkspace,
  getActiveNote,
  getWorkspaceCollections,
  normalizeNoteType,
  updateActiveNote,
} from "@/lib/notepad-utils";
import type {
  NoteType,
  NotepadAttachment,
  NotepadWorkspaceData,
} from "../../lib/notepad/types";
import {
  getInitialNotepadViewMode,
  persistNotepadViewMode,
  type NotepadViewMode,
} from "@/lib/notepad-view-mode";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notepad")({
  component: NotepadPage,
  head: () => ({
    meta: [
      { title: "Notepad" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const AUTOSAVE_DELAY_MS = 1200;

type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

function NotepadPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [workspace, setWorkspace] = useState<NotepadWorkspaceData>(defaultNotepadWorkspace);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [contentLoading, setContentLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewModeState] = useState<NotepadViewMode>(getInitialNotepadViewMode);

  const setViewMode = useCallback((mode: NotepadViewMode) => {
    setViewModeState(mode);
    persistNotepadViewMode(mode);
  }, []);

  useEffect(() => {
    if (viewMode === "compose" && window.matchMedia("(max-width: 768px)").matches) {
      setSidebarOpen(false);
    }
  }, [viewMode]);

  const lastSavedRef = useRef<string>(JSON.stringify(defaultNotepadWorkspace()));
  const autosaveReadyRef = useRef(false);

  const activeNote = getActiveNote(workspace);
  const title = activeNote?.title ?? "Untitled";
  const content = activeNote?.content ?? "";
  const inkData = activeNote?.inkData;
  const noteType = activeNote ? normalizeNoteType(activeNote) : "canvas";

  useEffect(() => {
    getNotepadAuthStatus()
      .then((data) => setAuthenticated(data.authenticated))
      .catch(() => setAuthenticated(false))
      .finally(() => setAuthChecked(true));
  }, []);

  const loadContent = useCallback(async () => {
    setContentLoading(true);
    autosaveReadyRef.current = false;
    try {
      const data = await getNotepadWorkspace();
      const loaded: NotepadWorkspaceData = {
        notes: data.notes.length > 0 ? data.notes : defaultNotepadWorkspace().notes,
        collections: data.collections ?? [],
        activeNoteId: data.activeNoteId,
      };
      if (!loaded.notes.some((n) => n.id === loaded.activeNoteId)) {
        loaded.activeNoteId = loaded.notes[0]?.id ?? loaded.activeNoteId;
      }
      setWorkspace(loaded);
      lastSavedRef.current = JSON.stringify(loaded);
      setUpdatedAt(data.updatedAt);
      setSaveStatus("idle");
    } catch {
      setAuthenticated(false);
      toast.error("Session expired. Please sign in again.");
    } finally {
      setContentLoading(false);
      autosaveReadyRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      void loadContent();
    }
  }, [authenticated, loadContent]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);
    try {
      const result = await verifyNotepadPassword(password);
      if (!result.success) {
        setLoginError(result.error ?? "Incorrect password");
        return;
      }
      setPassword("");
      setAuthenticated(true);
      toast.success("Welcome back");
    } catch {
      setLoginError("Could not verify password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const isDirty = useCallback(
    (next: NotepadWorkspaceData) => JSON.stringify(next) !== lastSavedRef.current,
    [],
  );

  useEffect(() => {
    if (!authenticated || contentLoading || !autosaveReadyRef.current) return;
    if (!isDirty(workspace)) return;

    setSaveStatus("pending");
    const timer = window.setTimeout(() => {
      void (async () => {
        setSaveStatus("saving");
        try {
          const result = await saveNotepadWorkspace(workspace);
          lastSavedRef.current = JSON.stringify(workspace);
          setUpdatedAt(result.updatedAt);
          setSaveStatus("saved");
        } catch {
          setSaveStatus("error");
          toast.error("Autosave failed");
        }
      })();
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [workspace, authenticated, contentLoading, isDirty]);

  const flushSave = async (): Promise<boolean> => {
    if (!isDirty(workspace)) return true;
    try {
      const result = await saveNotepadWorkspace(workspace);
      lastSavedRef.current = JSON.stringify(workspace);
      setUpdatedAt(result.updatedAt);
      return true;
    } catch {
      return false;
    }
  };

  const handleLogout = async () => {
    if (!(await flushSave())) {
      toast.error("Could not save before sign out");
      return;
    }
    await logoutNotepad();
    autosaveReadyRef.current = false;
    setAuthenticated(false);
    setWorkspace(defaultNotepadWorkspace());
    setUpdatedAt(null);
    setSaveStatus("idle");
    lastSavedRef.current = JSON.stringify(defaultNotepadWorkspace());
    toast.success("Signed out");
  };

  const setTitle = (nextTitle: string) => {
    setWorkspace((prev) =>
      updateActiveNote(prev, (note) => ({ ...note, title: nextTitle })),
    );
  };

  const setContent = (nextContent: string) => {
    setWorkspace((prev) =>
      updateActiveNote(prev, (note) => ({ ...note, content: nextContent })),
    );
  };

  const setInkData = useCallback((nextInkData: string | undefined) => {
    setWorkspace((prev) => {
      const active = prev.notes.find((n) => n.id === prev.activeNoteId);
      if (!active || active.inkData === nextInkData) return prev;
      return updateActiveNote(prev, (note) => ({
        ...note,
        inkData: nextInkData,
      }));
    });
  }, []);

  const setAttachments = useCallback((attachments: NotepadAttachment[]) => {
    setWorkspace((prev) =>
      updateActiveNote(prev, (note) => ({ ...note, attachments })),
    );
  }, []);

  const handleSelectNote = (id: string) => {
    if (id === workspace.activeNoteId) return;
    setWorkspace((prev) => ({ ...prev, activeNoteId: id }));
  };

  const handleNewNote = (
    type: NoteType,
    collectionId: string | null = null,
  ) => {
    const note = createNotepadNote("Untitled", type, collectionId);
    setWorkspace((prev) => ({
      ...prev,
      notes: [...prev.notes, note],
      collections: prev.collections ?? [],
      activeNoteId: note.id,
    }));
    setViewMode("compose");
    toast.success(type === "markdown" ? "Note created" : "Canvas created");
  };

  const handleDeleteNote = async (id: string) => {
    if (workspace.notes.length <= 1) {
      toast.error("Cannot delete the only note");
      return;
    }
    const note = workspace.notes.find((n) => n.id === id);
    const confirmed = window.confirm(
      `Delete "${note?.title || "Untitled"}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    const attachments = note?.attachments ?? [];
    for (const attachment of attachments) {
      try {
        await deleteNotepadAttachment(id, attachment.id);
      } catch {
        /* best-effort Drive cleanup */
      }
    }

    const nextNotes = workspace.notes.filter((n) => n.id !== id);
    const nextActive =
      workspace.activeNoteId === id
        ? (nextNotes[0]?.id ?? workspace.activeNoteId)
        : workspace.activeNoteId;

    const next: NotepadWorkspaceData = {
      notes: nextNotes,
      collections: workspace.collections ?? [],
      activeNoteId: nextActive,
    };
    setWorkspace(next);

    try {
      const result = await saveNotepadWorkspace(next);
      lastSavedRef.current = JSON.stringify(next);
      setUpdatedAt(result.updatedAt);
      toast.success("Note deleted");
    } catch {
      toast.error("Could not delete note");
      void loadContent();
    }
  };

  const handleRenameNote = (id: string, nextTitle: string) => {
    setWorkspace((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === id ? { ...n, title: nextTitle.trim() || "Untitled" } : n,
      ),
    }));
  };

  const setNoteShareTokenLocal = (noteId: string, shareToken: string | null) => {
    setWorkspace((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === noteId ? { ...n, shareToken } : n,
      ),
    }));
  };

  const handleShareNote = async () => {
    if (!activeNote) return;
    try {
      const result = await createNoteShareLink(activeNote.id);
      if (!result.shareToken) {
        toast.error("Could not create share link");
        return;
      }
      setNoteShareTokenLocal(activeNote.id, result.shareToken);
      const url = sharedNoteUrl(result.shareToken);
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Public link copied — anyone with the link can view");
      } catch {
        toast.success("Share link ready", { description: url });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not share note");
    }
  };

  const handleCopyShareLink = async () => {
    const token = activeNote?.shareToken?.trim();
    if (!token) return;
    const url = sharedNoteUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.message(url);
    }
  };

  const handleUnshareNote = async () => {
    if (!activeNote?.shareToken) return;
    const confirmed = window.confirm(
      "Stop public sharing? The old link will stop working.",
    );
    if (!confirmed) return;
    try {
      await revokeNoteShareLink(activeNote.id);
      setNoteShareTokenLocal(activeNote.id, null);
      toast.success("Share link revoked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not unshare");
    }
  };

  const handleMoveNote = (noteId: string, collectionId: string | null) => {
    setWorkspace((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === noteId ? { ...n, collectionId } : n,
      ),
    }));
  };

  const handleNewCollection = () => {
    const title = window.prompt("Collection name", "New collection");
    if (title === null) return;
    const collection = createNotepadCollection(title);
    setWorkspace((prev) => ({
      ...prev,
      collections: [...(prev.collections ?? []), collection],
    }));
    toast.success("Collection created");
  };

  const handleRenameCollection = (id: string, nextTitle: string) => {
    const now = new Date().toISOString();
    setWorkspace((prev) => ({
      ...prev,
      collections: (prev.collections ?? []).map((c) =>
        c.id === id
          ? { ...c, title: nextTitle.trim() || "Untitled", updatedAt: now }
          : c,
      ),
    }));
  };

  const handleDeleteCollection = (id: string) => {
    const collection = getWorkspaceCollections(workspace).find((c) => c.id === id);
    const count = workspace.notes.filter((n) => n.collectionId === id).length;
    const confirmed = window.confirm(
      count > 0
        ? `Delete collection "${collection?.title || "Untitled"}"? Notes inside will move to Uncategorized.`
        : `Delete collection "${collection?.title || "Untitled"}"?`,
    );
    if (!confirmed) return;

    setWorkspace((prev) => ({
      ...prev,
      collections: (prev.collections ?? []).filter((c) => c.id !== id),
      notes: prev.notes.map((n) =>
        n.collectionId === id ? { ...n, collectionId: null } : n,
      ),
    }));
    toast.success("Collection deleted");
  };

  const saveStatusLabel = (() => {
    switch (saveStatus) {
      case "pending":
        return "Unsaved changes…";
      case "saving":
        return "Saving…";
      case "saved":
        return "Saved";
      case "error":
        return "Save failed — retrying on next edit";
      default:
        return updatedAt
          ? `Last saved ${new Date(updatedAt).toLocaleString()}`
          : "All changes saved";
    }
  })();

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Toaster />
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Private notepad</h1>
            <p className="text-sm text-muted-foreground">
              Enter the shared password to view and edit notes.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
            </div>
            {loginError && (
              <p className="text-sm text-destructive" role="alert">
                {loginError}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Checking…" : "Unlock"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              ← Back to portfolio
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-screen flex-col",
        viewMode === "compose" && noteType === "canvas"
          ? "bg-white"
          : "bg-background",
      )}
    >
      <Toaster />
      <header
        className={cn(
          "flex shrink-0 items-center justify-between gap-4 px-3 py-1.5",
          viewMode === "compose" && noteType === "canvas"
            ? "pointer-events-none absolute inset-x-0 top-0 z-40 border-none bg-transparent"
            : "border-b",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2",
            viewMode === "compose" && noteType === "canvas" && "pointer-events-auto",
          )}
        >
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "shrink-0",
              viewMode === "compose" &&
                noteType === "canvas" &&
                "h-9 w-9 rounded-xl border border-black/[0.08] bg-white p-0 shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:bg-white",
            )}
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? "Hide notes sidebar" : "Show notes sidebar"}
            aria-expanded={sidebarOpen}
            aria-controls="notepad-sidebar"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
          {!(viewMode === "compose" && noteType === "canvas") && (
            <div className="min-w-0">
              <h1 className="text-sm font-semibold tracking-tight">Notepad</h1>
              <p
                className={`text-xs ${
                  saveStatus === "error"
                    ? "text-destructive"
                    : saveStatus === "saved"
                      ? "text-green-600 dark:text-green-500"
                      : "text-muted-foreground"
                }`}
              >
                {saveStatusLabel}
              </p>
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 sm:gap-2",
            viewMode === "compose" && noteType === "canvas" && "pointer-events-auto",
          )}
        >
          {viewMode === "compose" && noteType === "canvas" && (
            <span
              className={cn(
                "hidden rounded-lg bg-white/90 px-2 py-1 text-[11px] shadow-sm sm:inline",
                saveStatus === "error"
                  ? "text-destructive"
                  : saveStatus === "saved"
                    ? "text-green-600"
                    : "text-[#1b1b1f]/45",
              )}
            >
              {saveStatusLabel}
            </span>
          )}
          {activeNote?.shareToken ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  viewMode === "compose" &&
                    noteType === "canvas" &&
                    "rounded-xl border-black/[0.08] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:bg-white",
                )}
                onClick={() => void handleCopyShareLink()}
                aria-label="Copy public share link"
                title="Copy public link"
              >
                <Globe className="h-4 w-4 sm:mr-1.5 text-emerald-600" />
                <span className="hidden sm:inline">Copy link</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  viewMode === "compose" &&
                    noteType === "canvas" &&
                    "rounded-xl border border-black/[0.08] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:bg-white",
                )}
                onClick={() => void handleUnshareNote()}
                aria-label="Stop sharing"
                title="Stop sharing"
              >
                <Link2Off className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Unshare</span>
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className={cn(
                viewMode === "compose" &&
                  noteType === "canvas" &&
                  "rounded-xl border-black/[0.08] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:bg-white",
              )}
              onClick={() => void handleShareNote()}
              disabled={!activeNote}
              aria-label="Share note publicly"
              title="Share publicly"
            >
              <Share2 className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          )}
          {activeNote && (
            <NoteAttachments
              noteId={activeNote.id}
              attachments={activeNote.attachments ?? []}
              onChange={setAttachments}
              readOnly={viewMode === "preview"}
              className={cn(
                viewMode === "compose" &&
                  noteType === "canvas" &&
                  "rounded-xl bg-white/90 px-1 shadow-[0_1px_4px_rgba(0,0,0,0.08)]",
              )}
            />
          )}
          <Button
            variant={viewMode === "preview" ? "secondary" : "outline"}
            size="sm"
            className={cn(
              viewMode === "compose" &&
                noteType === "canvas" &&
                "rounded-xl border-black/[0.08] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:bg-white",
            )}
            onClick={() =>
              setViewMode(viewMode === "preview" ? "compose" : "preview")
            }
            aria-pressed={viewMode === "preview"}
          >
            <Eye className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">
              {viewMode === "preview" ? "Back to edit" : "Preview"}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              viewMode === "compose" &&
                noteType === "canvas" &&
                "rounded-xl border border-black/[0.08] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:bg-white",
            )}
            onClick={() => void handleLogout()}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </header>

      <div
        className={cn(
          "flex min-h-0 flex-1",
          viewMode === "compose" && noteType === "canvas" && "relative",
        )}
      >
        {sidebarOpen && (
          <div id="notepad-sidebar" className="shrink-0">
            <NotepadSidebar
              notes={workspace.notes}
              collections={getWorkspaceCollections(workspace)}
              activeNoteId={workspace.activeNoteId}
              onSelect={(id) => {
                handleSelectNote(id);
                if (window.matchMedia("(max-width: 768px)").matches) {
                  setSidebarOpen(false);
                }
              }}
              onNewNote={(type, collectionId) => {
                handleNewNote(type, collectionId ?? null);
              }}
              onDelete={(id) => void handleDeleteNote(id)}
              onRename={handleRenameNote}
              onMoveNote={handleMoveNote}
              onNewCollection={handleNewCollection}
              onRenameCollection={handleRenameCollection}
              onDeleteCollection={handleDeleteCollection}
            />
          </div>
        )}

        <main
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            viewMode === "compose" && noteType === "canvas"
              ? "overflow-hidden bg-white"
              : "overflow-y-auto p-4 md:p-6",
          )}
        >
          {viewMode === "compose" && noteType === "canvas" && !contentLoading ? (
            <div className="relative flex min-h-0 flex-1 flex-col">
              <StylusCanvas
                inkData={inkData}
                onInkChange={setInkData}
                fillHeight
                className="min-h-0 flex-1"
              />
            </div>
          ) : (
            <div
              className={cn(
                "mx-auto flex w-full max-w-5xl flex-col gap-4",
                viewMode === "compose" && noteType === "canvas" && "min-h-0 flex-1",
              )}
            >
              {contentLoading ? (
                <p className="text-sm text-muted-foreground">Loading notes…</p>
              ) : viewMode === "preview" ? (
                <>
                  <h2 className="w-full text-2xl font-semibold tracking-tight">
                    {title || "Untitled"}
                  </h2>
                  {noteType === "canvas" ? (
                    inkData ? (
                      <StylusCanvas
                        inkData={inkData}
                        readOnly
                        className="min-h-[220px] flex-none rounded-xl border border-black/10"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        This canvas note is empty.
                      </p>
                    )
                  ) : content.trim() ? (
                    <MarkdownPreview content={content} className="flex-1" />
                  ) : (
                    <p className="text-sm text-muted-foreground">This note is empty.</p>
                  )}
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Untitled"
                    className="w-full shrink-0 bg-transparent text-xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/40 md:text-2xl"
                  />
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Start writing… Markdown supported."
                    className="min-h-[50vh] resize-y font-mono text-sm leading-relaxed"
                  />
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
