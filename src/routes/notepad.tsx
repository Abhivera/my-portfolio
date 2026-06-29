import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Lock, LogOut, Pencil, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NotepadSidebar } from "@/components/notepad/NotepadSidebar";
import { MarkdownPreview } from "@/components/notepad/MarkdownPreview";
import {
  getNotepadAuthStatus,
  getNotepadWorkspace,
  logoutNotepad,
  saveNotepadWorkspace,
  verifyNotepadPassword,
} from "@/lib/notepad-client";
import {
  createNotepadNote,
  defaultNotepadWorkspace,
  getActiveNote,
  updateActiveNote,
} from "@/lib/notepad-utils";
import type { NotepadWorkspaceData } from "../../lib/notepad/types";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/notepad")({
  component: NotepadPage,
  head: () => ({
    meta: [
      { title: "Notepad" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const AUTOSAVE_DELAY_MS = 800;

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
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");

  const lastSavedRef = useRef<string>(JSON.stringify(defaultNotepadWorkspace()));
  const autosaveReadyRef = useRef(false);

  const activeNote = getActiveNote(workspace);
  const title = activeNote?.title ?? "Untitled";
  const content = activeNote?.content ?? "";

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

  const handleSelectNote = async (id: string) => {
    if (id === workspace.activeNoteId) return;
    if (!(await flushSave())) {
      toast.error("Could not save. Try again.");
      return;
    }
    setWorkspace((prev) => ({ ...prev, activeNoteId: id }));
  };

  const handleNewNote = async () => {
    if (!(await flushSave())) {
      toast.error("Could not save. Try again.");
      return;
    }
    const note = createNotepadNote();
    setWorkspace((prev) => ({
      notes: [...prev.notes, note],
      activeNoteId: note.id,
    }));
    toast.success("New note created");
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

    const nextNotes = workspace.notes.filter((n) => n.id !== id);
    const nextActive =
      workspace.activeNoteId === id
        ? (nextNotes[0]?.id ?? workspace.activeNoteId)
        : workspace.activeNoteId;

    const next: NotepadWorkspaceData = {
      notes: nextNotes,
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

  const handleRenameNote = (id: string) => {
    const note = workspace.notes.find((n) => n.id === id);
    const nextTitle = window.prompt("Rename note", note?.title || "Untitled");
    if (nextTitle === null) return;

    setWorkspace((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === id ? { ...n, title: nextTitle.trim() || "Untitled" } : n,
      ),
    }));
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
    <div className="flex h-screen flex-col bg-background">
      <Toaster />
      <header className="flex shrink-0 items-center justify-between gap-4 border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <StickyNote className="h-4 w-4" />
          </Button>
          <div>
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
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("edit")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === "edit"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={viewMode === "edit"}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === "preview"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={viewMode === "preview"}
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => void handleLogout()}>
            <LogOut className="h-4 w-4 mr-1.5" />
            Sign out
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {sidebarOpen && (
          <NotepadSidebar
            notes={workspace.notes}
            activeNoteId={workspace.activeNoteId}
            onSelect={(id) => void handleSelectNote(id)}
            onNewNote={() => void handleNewNote()}
            onDelete={(id) => void handleDeleteNote(id)}
            onRename={handleRenameNote}
          />
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-4xl w-full h-full flex flex-col gap-4">
            {contentLoading ? (
              <p className="text-sm text-muted-foreground">Loading notes…</p>
            ) : viewMode === "preview" ? (
              <>
                <h2 className="w-full text-2xl font-semibold tracking-tight">
                  {title || "Untitled"}
                </h2>
                <MarkdownPreview content={content} className="flex-1" />
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled"
                  className="w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/40"
                />
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing… Markdown supported."
                  className="min-h-[calc(100vh-12rem)] flex-1 resize-none font-mono text-sm leading-relaxed"
                />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
