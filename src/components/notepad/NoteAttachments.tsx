import { useEffect, useRef, useState, type DragEvent } from "react";
import {
  ChevronDown,
  Download,
  ExternalLink,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Film,
  Image as ImageIcon,
  Loader2,
  Music,
  Paperclip,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  deleteNotepadAttachment,
  notepadAttachmentUrl,
  uploadNotepadAttachment,
} from "@/lib/notepad-client";
import { cn } from "@/lib/utils";
import type { NotepadAttachment } from "../../../lib/notepad/types";
import {
  ATTACHMENT_FILE_ACCEPT,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_NOTE,
} from "../../../lib/notepad/types";

const MAX_ATTACHMENT_MB = MAX_ATTACHMENT_BYTES / (1024 * 1024);

type NoteAttachmentsProps = {
  noteId: string;
  attachments: NotepadAttachment[];
  onChange: (attachments: NotepadAttachment[]) => void;
  readOnly?: boolean;
  /** Compact strip for canvas compose; expands on demand. */
  compact?: boolean;
  /** When viewing a shared note, pass the share token for public downloads. */
  shareToken?: string;
  className?: string;
};

type UploadJob = {
  id: string;
  name: string;
};

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKind(mimeType: string): {
  label: string;
  Icon: typeof FileText;
  tone: string;
} {
  if (mimeType.startsWith("image/")) {
    return {
      label: "Image",
      Icon: ImageIcon,
      tone: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    };
  }
  if (mimeType.startsWith("audio/")) {
    return {
      label: "Audio",
      Icon: Music,
      tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    };
  }
  if (mimeType.startsWith("video/")) {
    return {
      label: "Video",
      Icon: Film,
      tone: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    };
  }
  if (mimeType === "application/pdf") {
    return {
      label: "PDF",
      Icon: FileText,
      tone: "bg-red-500/10 text-red-700 dark:text-red-300",
    };
  }
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("opendocument.spreadsheet")
  ) {
    return {
      label: "Sheet",
      Icon: FileSpreadsheet,
      tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    };
  }
  if (mimeType.includes("zip") || mimeType.includes("compressed")) {
    return {
      label: "Archive",
      Icon: FileArchive,
      tone: "bg-amber-500/10 text-amber-800 dark:text-amber-300",
    };
  }
  if (mimeType.startsWith("text/") || mimeType === "application/json") {
    return {
      label: "Text",
      Icon: FileText,
      tone: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
    };
  }
  return {
    label: "Doc",
    Icon: FileText,
    tone: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  };
}

function canInlinePreview(mimeType: string): boolean {
  return mimeType.startsWith("image/") || mimeType === "application/pdf";
}

function ImageThumb({
  attachmentId,
  name,
  shareToken,
}: {
  attachmentId: string;
  name: string;
  shareToken?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let revoked = false;
    const url = notepadAttachmentUrl(attachmentId, { inline: true, shareToken });

    void fetch(url, { credentials: shareToken ? "omit" : "include" })
      .then((res) => {
        if (!res.ok) throw new Error("preview failed");
        return res.blob();
      })
      .then((blob) => {
        if (revoked) return;
        setSrc(URL.createObjectURL(blob));
      })
      .catch(() => {
        if (!revoked) setFailed(true);
      });

    return () => {
      revoked = true;
      setSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [attachmentId, shareToken]);

  if (failed || !src) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-300">
        <ImageIcon className="h-4 w-4" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className="h-10 w-10 shrink-0 rounded-md object-cover ring-1 ring-black/5"
    />
  );
}

export function NoteAttachments({
  noteId,
  attachments,
  onChange,
  readOnly = false,
  compact = false,
  shareToken,
  className,
}: NoteAttachmentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(!compact);
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<UploadJob[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const dragDepth = useRef(0);

  const atLimit = attachments.length >= MAX_ATTACHMENTS_PER_NOTE;
  const uploading = queue.length > 0;
  const remaining = MAX_ATTACHMENTS_PER_NOTE - attachments.length;

  useEffect(() => {
    if (compact && attachments.length === 0 && !uploading) {
      setExpanded(false);
    }
  }, [compact, attachments.length, uploading]);

  const uploadFiles = async (files: FileList | File[]) => {
    if (readOnly) return;
    const list = Array.from(files).filter(Boolean);
    if (!list.length) return;

    if (atLimit) {
      toast.error(`Maximum of ${MAX_ATTACHMENTS_PER_NOTE} attachments per note`);
      return;
    }

    const slots = Math.max(0, remaining);
    const toUpload = list.slice(0, slots);
    if (list.length > slots) {
      toast.message(
        `Only ${slots} more file${slots === 1 ? "" : "s"} allowed on this note`,
      );
    }
    if (!toUpload.length) return;

    if (compact) setExpanded(true);

    let nextAttachments = [...attachments];

    for (const file of toUpload) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        toast.error(
          `${file.name} is too large (max ${MAX_ATTACHMENT_MB} MB)`,
        );
        continue;
      }
      const jobId = crypto.randomUUID();
      setQueue((prev) => [...prev, { id: jobId, name: file.name }]);
      try {
        const result = await uploadNotepadAttachment(noteId, file);
        nextAttachments = [...nextAttachments, result.attachment];
        onChange(nextAttachments);
      } catch (err) {
        toast.error(
          err instanceof Error
            ? `${file.name}: ${err.message}`
            : `Failed to upload ${file.name}`,
        );
      } finally {
        setQueue((prev) => prev.filter((j) => j.id !== jobId));
      }
    }

    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = async (attachment: NotepadAttachment) => {
    if (readOnly) return;
    setRemovingId(attachment.id);
    setConfirmId(null);
    try {
      await deleteNotepadAttachment(noteId, attachment.id);
      onChange(attachments.filter((a) => a.id !== attachment.id));
      toast.success("Attachment removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove file");
    } finally {
      setRemovingId(null);
    }
  };

  const onDragEnter = (e: DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current += 1;
    if (e.dataTransfer.types.includes("Files")) setDragging(true);
  };

  const onDragLeave = (e: DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDragging(false);
    }
  };

  const onDragOver = (e: DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = 0;
    setDragging(false);
    void uploadFiles(e.dataTransfer.files);
  };

  if (readOnly && attachments.length === 0) return null;

  const fileInput = !readOnly ? (
    <input
      ref={inputRef}
      type="file"
      multiple
      className="sr-only"
      accept={ATTACHMENT_FILE_ACCEPT}
      onChange={(e) => void uploadFiles(e.target.files ?? [])}
      disabled={uploading || atLimit}
    />
  ) : null;

  if (compact && !expanded) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {fileInput}
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-2.5 py-1 text-xs text-[#1b1b1f]/70 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:bg-[#f7f7f8] hover:text-[#1b1b1f]",
            attachments.length > 0 && "pr-2",
          )}
        >
          <Paperclip className="h-3.5 w-3.5" />
          <span>
            {attachments.length > 0
              ? `${attachments.length} file${attachments.length === 1 ? "" : "s"}`
              : "Attach"}
          </span>
          {attachments.length > 0 && (
            <ChevronDown className="h-3 w-3 opacity-50" />
          )}
        </button>
        {!readOnly && (
          <button
            type="button"
            disabled={uploading || atLimit}
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-black/[0.08] bg-white text-[#1b1b1f]/55 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:bg-[#f7f7f8] hover:text-[#1b1b1f] disabled:opacity-40"
            aria-label="Add attachment"
            title="Add attachment"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <section
      className={cn(
        "relative space-y-3 rounded-xl transition-colors",
        compact
          ? "border border-black/[0.06] bg-[#fafafa] p-3"
          : "border bg-muted/20 p-3 sm:p-4",
        dragging && "border-dashed border-foreground/30 bg-muted/40",
        className,
      )}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {fileInput}

      {dragging && !readOnly && (
        <div className="pointer-events-none absolute inset-2 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-foreground/25 bg-background/80 backdrop-blur-[2px]">
          <p className="text-sm font-medium">Drop files to attach</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              compact ? "bg-white shadow-sm" : "bg-background shadow-sm ring-1 ring-border/60",
            )}
          >
            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-none">Attachments</p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {attachments.length === 0
                ? readOnly
                  ? "No files"
                  : `PDF, docs, images · up to ${MAX_ATTACHMENT_MB} MB`
                : `${attachments.length} of ${MAX_ATTACHMENTS_PER_NOTE}`}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-8 gap-1.5",
                compact && "border-black/[0.08] bg-white shadow-sm",
              )}
              disabled={uploading || atLimit}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">
                {uploading ? "Uploading…" : "Add"}
              </span>
            </Button>
          )}
          {compact && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setExpanded(false)}
              aria-label="Collapse attachments"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {queue.length > 0 && (
        <ul className="space-y-1.5">
          {queue.map((job) => (
            <li
              key={job.id}
              className="flex items-center gap-2 rounded-lg bg-background/80 px-2.5 py-2 text-xs text-muted-foreground ring-1 ring-border/50"
            >
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              <span className="min-w-0 flex-1 truncate">Uploading {job.name}…</span>
            </li>
          ))}
        </ul>
      )}

      {attachments.length === 0 && !uploading ? (
        !readOnly && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={atLimit}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-6 text-center transition",
              compact
                ? "border-black/10 bg-white hover:border-black/20 hover:bg-[#f7f7f8]"
                : "border-border bg-background/50 hover:border-foreground/25 hover:bg-background",
            )}
          >
            <Paperclip className="h-5 w-5 text-muted-foreground/70" />
            <span className="text-sm text-muted-foreground">
              Drop files here or click to browse
            </span>
          </button>
        )
      ) : (
        <ul className="space-y-1.5">
          {attachments.map((attachment) => {
            const { label, Icon, tone } = fileKind(attachment.mimeType);
            const href = notepadAttachmentUrl(attachment.id, { shareToken });
            const previewHref = canInlinePreview(attachment.mimeType)
              ? notepadAttachmentUrl(attachment.id, {
                  inline: true,
                  shareToken,
                })
              : href;
            const isImage = attachment.mimeType.startsWith("image/");
            const confirming = confirmId === attachment.id;
            const removing = removingId === attachment.id;

            return (
              <li
                key={attachment.id}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg px-2 py-2 transition",
                  compact
                    ? "bg-white ring-1 ring-black/[0.05] hover:ring-black/10"
                    : "bg-background ring-1 ring-border/60 hover:ring-border",
                  confirming && "ring-destructive/40",
                )}
              >
                {isImage ? (
                  <ImageThumb
                    attachmentId={attachment.id}
                    name={attachment.name}
                    shareToken={shareToken}
                  />
                ) : (
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
                      tone,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <a
                    href={previewHref}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-sm font-medium leading-tight hover:underline"
                    title={attachment.name}
                  >
                    {attachment.name}
                  </a>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="rounded bg-muted px-1 py-px font-medium uppercase tracking-wide text-[10px] text-muted-foreground">
                      {label}
                    </span>
                    <span aria-hidden>·</span>
                    <span>{formatBytes(attachment.size)}</span>
                  </p>
                </div>

                {confirming ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={removing}
                      onClick={() => void handleRemove(attachment)}
                    >
                      {removing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Delete"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={removing}
                      onClick={() => setConfirmId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                      <a
                        href={previewHref}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${attachment.name}`}
                        title="Open"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                      <a
                        href={href}
                        download={attachment.name}
                        aria-label={`Download ${attachment.name}`}
                        title="Download"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                    {!readOnly && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        disabled={removing}
                        onClick={() => setConfirmId(attachment.id)}
                        aria-label={`Remove ${attachment.name}`}
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
