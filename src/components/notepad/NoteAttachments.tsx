import { useRef, useState } from "react";
import {
  FileArchive,
  FileSpreadsheet,
  FileText,
  Film,
  Image as ImageIcon,
  Loader2,
  Music,
  Paperclip,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
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
  /** When viewing a shared note, pass the share token for public downloads. */
  shareToken?: string;
  className?: string;
};

type UploadJob = {
  id: string;
  name: string;
};

function fileKind(mimeType: string): {
  Icon: typeof FileText;
  tone: string;
} {
  if (mimeType.startsWith("image/")) {
    return {
      Icon: ImageIcon,
      tone: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    };
  }
  if (mimeType.startsWith("audio/")) {
    return {
      Icon: Music,
      tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    };
  }
  if (mimeType.startsWith("video/")) {
    return {
      Icon: Film,
      tone: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    };
  }
  if (mimeType === "application/pdf") {
    return {
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
      Icon: FileSpreadsheet,
      tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    };
  }
  if (mimeType.includes("zip") || mimeType.includes("compressed")) {
    return {
      Icon: FileArchive,
      tone: "bg-amber-500/10 text-amber-800 dark:text-amber-300",
    };
  }
  return {
    Icon: FileText,
    tone: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  };
}

function canInlinePreview(mimeType: string): boolean {
  return mimeType.startsWith("image/") || mimeType === "application/pdf";
}

/** Compact top-bar attachment icons — add / open / remove without a large panel. */
export function NoteAttachments({
  noteId,
  attachments,
  onChange,
  readOnly = false,
  shareToken,
  className,
}: NoteAttachmentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<UploadJob[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const atLimit = attachments.length >= MAX_ATTACHMENTS_PER_NOTE;
  const uploading = queue.length > 0;
  const remaining = MAX_ATTACHMENTS_PER_NOTE - attachments.length;

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

  if (readOnly && attachments.length === 0) return null;

  return (
    <div className={cn("flex max-w-[min(100%,18rem)] items-center gap-1", className)}>
      {!readOnly && (
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          accept={ATTACHMENT_FILE_ACCEPT}
          onChange={(e) => void uploadFiles(e.target.files ?? [])}
          disabled={uploading || atLimit}
        />
      )}

      <div className="flex min-w-0 items-center gap-1 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {attachments.map((attachment) => {
          const { Icon, tone } = fileKind(attachment.mimeType);
          const href = canInlinePreview(attachment.mimeType)
            ? notepadAttachmentUrl(attachment.id, {
                inline: true,
                shareToken,
              })
            : notepadAttachmentUrl(attachment.id, { shareToken });
          const removing = removingId === attachment.id;

          return (
            <div key={attachment.id} className="group relative shrink-0">
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                title={attachment.name}
                aria-label={`Open ${attachment.name}`}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-black/[0.06] transition hover:ring-black/15",
                  tone,
                )}
              >
                {removing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </a>
              {!readOnly && (
                <button
                  type="button"
                  disabled={removing}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void handleRemove(attachment);
                  }}
                  className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-[#1b1b1f] text-white shadow-sm group-hover:flex disabled:opacity-50"
                  aria-label={`Remove ${attachment.name}`}
                  title="Remove"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          );
        })}

        {queue.map((job) => (
          <div
            key={job.id}
            title={`Uploading ${job.name}…`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/60"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          </div>
        ))}
      </div>

      {!readOnly && (
        <button
          type="button"
          disabled={uploading || atLimit}
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-black/[0.08] bg-white text-[#1b1b1f]/55 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:bg-[#f7f7f8] hover:text-[#1b1b1f] disabled:opacity-40"
          aria-label="Add attachment"
          title={
            atLimit
              ? `Maximum ${MAX_ATTACHMENTS_PER_NOTE} attachments`
              : "Attach file"
          }
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : attachments.length === 0 ? (
            <Paperclip className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
}
