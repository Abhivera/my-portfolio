import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckSquare,
  Heading,
  ListFilter,
  Lock,
  LogOut,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Toaster } from "@/components/ui/sonner";
import { TodoRow } from "@/components/todo/TodoRow";
import { TodoSidebar } from "@/components/todo/TodoSidebar";
import {
  getNotepadAuthStatus,
  logoutNotepad,
  verifyNotepadPassword,
} from "@/lib/notepad-client";
import { getGoalWorkspace, saveGoalWorkspace } from "@/lib/goal-client";
import {
  adjustIndent,
  countProgress,
  createHeadingBlock,
  createTodoBlock,
  createTodoList,
  defaultWorkspace,
  getActiveList,
  insertItemAfter,
  moveItem,
  removeItemAt,
  toggleItem,
  updateActiveList,
  updateItemText,
} from "@/lib/todo-utils";
import type { TodoBlock, TodoWorkspaceData } from "../../lib/todo/types";

export const Route = createFileRoute("/goal")({
  component: GoalPage,
  head: () => ({
    meta: [
      { title: "Goals" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const AUTOSAVE_DELAY_MS = 800;

type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";
type FilterMode = "all" | "active" | "done";

function GoalPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [workspace, setWorkspace] = useState<TodoWorkspaceData>(defaultWorkspace);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [contentLoading, setContentLoading] = useState(false);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const lastSavedRef = useRef<string>(JSON.stringify(defaultWorkspace()));
  const autosaveReadyRef = useRef(false);
  const inputRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const activeList = getActiveList(workspace);
  const items = activeList?.items ?? [];
  const title = activeList?.title ?? "Untitled";

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
      const data = await getGoalWorkspace();
      const loaded: TodoWorkspaceData = {
        lists: data.lists.length > 0 ? data.lists : defaultWorkspace().lists,
        activeListId: data.activeListId,
      };
      if (!loaded.lists.some((l) => l.id === loaded.activeListId)) {
        loaded.activeListId = loaded.lists[0]?.id ?? loaded.activeListId;
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
    (next: TodoWorkspaceData) => JSON.stringify(next) !== lastSavedRef.current,
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
          const result = await saveGoalWorkspace(workspace);
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
      const result = await saveGoalWorkspace(workspace);
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
    setWorkspace(defaultWorkspace());
    setUpdatedAt(null);
    setSaveStatus("idle");
    lastSavedRef.current = JSON.stringify(defaultWorkspace());
    toast.success("Signed out");
  };

  const setTitle = (nextTitle: string) => {
    setWorkspace((prev) =>
      updateActiveList(prev, (list) => ({ ...list, title: nextTitle })),
    );
  };

  const setItems = (updater: (items: TodoBlock[]) => TodoBlock[]) => {
    setWorkspace((prev) =>
      updateActiveList(prev, (list) => ({ ...list, items: updater(list.items) })),
    );
  };

  const handleSelectList = async (id: string) => {
    if (id === workspace.activeListId) return;
    if (!(await flushSave())) {
      toast.error("Could not save. Try again.");
      return;
    }
    setWorkspace((prev) => ({ ...prev, activeListId: id }));
    setFilter("all");
    setFocusedIndex(null);
  };

  const handleNewPage = async () => {
    if (!(await flushSave())) {
      toast.error("Could not save. Try again.");
      return;
    }
    const list = createTodoList();
    setWorkspace((prev) => ({
      lists: [...prev.lists, list],
      activeListId: list.id,
    }));
    setFilter("all");
    setFocusedIndex(null);
    toast.success("New page created");
  };

  const handleDeletePage = async (id: string) => {
    if (workspace.lists.length <= 1) {
      toast.error("Cannot delete the only page");
      return;
    }
    const list = workspace.lists.find((l) => l.id === id);
    const confirmed = window.confirm(
      `Delete "${list?.title || "Untitled"}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    const nextLists = workspace.lists.filter((l) => l.id !== id);
    const nextActive =
      workspace.activeListId === id
        ? (nextLists[0]?.id ?? workspace.activeListId)
        : workspace.activeListId;

    const next: TodoWorkspaceData = { lists: nextLists, activeListId: nextActive };
    setWorkspace(next);
    if (isDirty(next)) {
      try {
        const result = await saveGoalWorkspace(next);
        lastSavedRef.current = JSON.stringify(next);
        setUpdatedAt(result.updatedAt);
      } catch {
        toast.error("Could not delete page");
        void loadContent();
      }
    }
    toast.success("Page deleted");
  };

  const focusItem = (index: number) => {
    window.requestAnimationFrame(() => {
      inputRefs.current[index]?.focus();
    });
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const block = items[index];

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setItems((prev) => {
        const next = insertItemAfter(prev, index);
        focusItem(index + 1);
        return next;
      });
      return;
    }

    if (e.key === "Backspace" && block?.text === "") {
      e.preventDefault();
      if (items.length > 1) {
        setItems((prev) => {
          const next = removeItemAt(prev, index);
          focusItem(Math.max(0, index - 1));
          return next;
        });
      }
      return;
    }

    if (e.key === "Tab" && block?.type === "todo") {
      e.preventDefault();
      setItems((prev) => adjustIndent(prev, index, e.shiftKey ? -1 : 1));
    }

    if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault();
      focusItem(index - 1);
    }

    if (e.key === "ArrowDown" && index < items.length - 1) {
      e.preventDefault();
      focusItem(index + 1);
    }
  };

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (index: number) => {
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    const from = dragIndexRef.current;
    const to = dragOverIndex;
    dragIndexRef.current = null;
    setDragOverIndex(null);
    if (from !== null && to !== null && from !== to) {
      setItems((prev) => moveItem(prev, from, to));
    }
  };

  const filteredItems = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      if (item.type === "heading") {
        return filter === "all";
      }
      if (filter === "active") return !item.checked;
      if (filter === "done") return item.checked;
      return true;
    });

  const { done, total } = countProgress(items);
  const progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;

  const saveStatusLabel = (() => {
    switch (saveStatus) {
      case "pending":
        return "Unsaved changes…";
      case "saving":
        return "Saving…";
      case "saved":
        return "Saved";
      case "error":
        return "Save failed";
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
            <h1 className="text-2xl font-semibold tracking-tight">Private goals</h1>
            <p className="text-sm text-muted-foreground">
              Enter the shared password to view and edit your goals.
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
            <CheckSquare className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Goals</h1>
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
        <Button variant="ghost" size="sm" onClick={() => void handleLogout()}>
          <LogOut className="h-4 w-4 mr-1.5" />
          Sign out
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        {sidebarOpen && (
          <TodoSidebar
            lists={workspace.lists}
            activeListId={workspace.activeListId}
            onSelect={(id) => void handleSelectList(id)}
            onNewPage={() => void handleNewPage()}
            onDelete={(id) => void handleDeletePage(id)}
          />
        )}

        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12">
          <div className="mx-auto max-w-3xl">
            {contentLoading ? (
              <p className="text-sm text-muted-foreground">Loading goals…</p>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    className="mt-1 text-4xl leading-none hover:opacity-70"
                    onClick={() => {
                      const icons = ["📄", "📋", "🚀", "💡", "🎯", "📚", "☁️", "🐳"];
                      const current = activeList?.icon ?? "📄";
                      const idx = icons.indexOf(current);
                      const nextIcon = icons[(idx + 1) % icons.length];
                      setWorkspace((prev) =>
                        updateActiveList(prev, (list) => ({ ...list, icon: nextIcon })),
                      );
                    }}
                    title="Click to change icon"
                  >
                    {activeList?.icon ?? "📄"}
                  </button>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Untitled"
                    className="w-full bg-transparent text-4xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/40"
                  />
                </div>

                {total > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {done} of {total} completed
                      </span>
                      <span>{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-1.5" />
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-1 border-b pb-2">
                  <div className="flex items-center gap-1">
                    <ListFilter className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                    {(["all", "active", "done"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setFilter(mode)}
                        className={`rounded-md px-2.5 py-1 text-xs capitalize transition-colors ${
                          filter === mode
                            ? "bg-muted font-medium text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setItems((prev) => [...prev, createHeadingBlock()]);
                        focusItem(items.length);
                      }}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                    >
                      <Heading className="h-4 w-4" />
                      Add heading
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setItems((prev) => [...prev, createTodoBlock()]);
                        focusItem(items.length);
                      }}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                    >
                      <Plus className="h-4 w-4" />
                      Add goal
                    </button>
                  </div>
                </div>

                <div className="space-y-0.5">
                  {filteredItems.map(({ item, index }) => (
                    <TodoRow
                      key={item.id}
                      item={item}
                      index={index}
                      isFocused={focusedIndex === index}
                      draggable={filter === "all"}
                      onFocus={() => setFocusedIndex(index)}
                      onToggle={() => setItems((prev) => toggleItem(prev, index))}
                      onTextChange={(text) =>
                        setItems((prev) => updateItemText(prev, index, text))
                      }
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onDelete={() => setItems((prev) => removeItemAt(prev, index))}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      isDragOver={dragOverIndex === index}
                      inputRef={(el) => {
                        inputRefs.current[index] = el;
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
