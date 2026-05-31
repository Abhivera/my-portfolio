import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Lock, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getNotepadAuthStatus,
  getNotepadContent,
  logoutNotepad,
  saveNotepadContent,
  verifyNotepadPassword,
} from "@/lib/notepad-client";
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

  const [content, setContent] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [contentLoading, setContentLoading] = useState(false);
  const lastSavedContentRef = useRef("");
  const autosaveReadyRef = useRef(false);

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
      const data = await getNotepadContent();
      setContent(data.content);
      lastSavedContentRef.current = data.content;
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

  useEffect(() => {
    if (!authenticated || contentLoading || !autosaveReadyRef.current) {
      return;
    }
    if (content === lastSavedContentRef.current) {
      return;
    }

    setSaveStatus("pending");

    const timer = window.setTimeout(() => {
      void (async () => {
        setSaveStatus("saving");
        try {
          const result = await saveNotepadContent(content);
          lastSavedContentRef.current = content;
          setUpdatedAt(result.updatedAt);
          setSaveStatus("saved");
        } catch {
          setSaveStatus("error");
          toast.error("Autosave failed");
        }
      })();
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [content, authenticated, contentLoading]);

  const handleLogout = async () => {
    if (content !== lastSavedContentRef.current) {
      try {
        await saveNotepadContent(content);
      } catch {
        toast.error("Could not save before sign out");
        return;
      }
    }
    await logoutNotepad();
    autosaveReadyRef.current = false;
    setAuthenticated(false);
    setContent("");
    setUpdatedAt(null);
    setSaveStatus("idle");
    lastSavedContentRef.current = "";
    toast.success("Signed out");
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
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster />
      <header className="border-b px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-semibold tracking-tight">Notepad</h1>
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
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => void handleLogout()}>
            <LogOut className="h-4 w-4 mr-1.5" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-4xl mx-auto w-full">
        {contentLoading ? (
          <p className="text-sm text-muted-foreground">Loading notes…</p>
        ) : (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing…"
            className="min-h-[calc(100vh-8rem)] resize-none font-mono text-sm leading-relaxed"
          />
        )}
      </main>
    </div>
  );
}
