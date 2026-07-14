import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { MarkdownPreview } from "@/components/notepad/MarkdownPreview";
import { NoteAttachments } from "@/components/notepad/NoteAttachments";
import { StylusCanvas } from "@/components/notepad/StylusCanvas";
import { getSharedNote } from "@/lib/notepad-client";
import type { PublicSharedNote } from "../../lib/notepad/types";

export const Route = createFileRoute("/notepad/share/$token")({
  component: SharedNotePage,
  head: () => ({
    meta: [
      { title: "Shared note" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function SharedNotePage() {
  const { token } = Route.useParams();
  const [note, setNote] = useState<PublicSharedNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getSharedNote(token);
        if (cancelled) return;
        setNote(data);
        document.title = `${data.title || "Untitled"} · Shared note`;
      } catch {
        if (!cancelled) {
          setNote(null);
          setError("This share link is invalid or has been revoked.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Loading shared note…</p>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Link unavailable
          </h1>
          <p className="text-sm text-muted-foreground">
            {error ?? "Shared note not found."}
          </p>
          <p className="text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              ← Back to portfolio
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const attachments = note.attachments ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="shrink-0 border-b px-4 py-3">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Shared note
            </p>
            <h1 className="truncate text-sm font-semibold tracking-tight">
              {note.title || "Untitled"}
            </h1>
          </div>
          <p className="shrink-0 text-xs text-muted-foreground">
            Read-only · no sign-in
          </p>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        {note.noteType === "canvas" ? (
          <>
            {note.inkData ? (
              <div className="min-h-0 flex-1 bg-white">
                <StylusCanvas
                  inkData={note.inkData}
                  readOnly
                  fillHeight
                  className="min-h-[70vh] flex-1"
                />
              </div>
            ) : (
              <div className="mx-auto w-full max-w-5xl px-4 py-10">
                <p className="text-sm text-muted-foreground">
                  This canvas note is empty.
                </p>
              </div>
            )}
            {attachments.length > 0 && (
              <div className="border-t px-4 py-6 md:px-6">
                <div className="mx-auto w-full max-w-5xl">
                  <NoteAttachments
                    noteId="shared"
                    attachments={attachments}
                    onChange={() => {}}
                    readOnly
                    shareToken={token}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 md:px-6">
            {note.content.trim() ? (
              <MarkdownPreview content={note.content} />
            ) : (
              <p className="text-sm text-muted-foreground">This note is empty.</p>
            )}
            <NoteAttachments
              noteId="shared"
              attachments={attachments}
              onChange={() => {}}
              readOnly
              shareToken={token}
            />
          </div>
        )}
      </main>
    </div>
  );
}
