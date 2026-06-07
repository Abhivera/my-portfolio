import { GripVertical, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { TodoBlock } from "../../../lib/todo/types";

type TodoRowProps = {
  item: TodoBlock;
  index: number;
  isFocused: boolean;
  draggable: boolean;
  onFocus: () => void;
  onToggle: () => void;
  onTextChange: (text: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onDelete: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragOver: boolean;
  inputRef: (el: HTMLTextAreaElement | null) => void;
};

export function TodoRow({
  item,
  index,
  isFocused,
  draggable,
  onFocus,
  onToggle,
  onTextChange,
  onKeyDown,
  onPaste,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragOver,
  inputRef,
}: TodoRowProps) {
  const isHeading = item.type === "heading";

  return (
    <div
      className={`group flex items-start gap-1 rounded-md px-1 py-0.5 transition-colors ${
        isDragOver ? "bg-accent" : "hover:bg-muted/50"
      } ${isFocused ? "bg-muted/40" : ""}`}
      style={{ paddingLeft: `${item.indent * 24 + 4}px` }}
      draggable={draggable}
      onDragStart={() => draggable && onDragStart(index)}
      onDragOver={(e) => {
        if (!draggable) return;
        e.preventDefault();
        onDragOver(index);
      }}
      onDragEnd={() => draggable && onDragEnd()}
    >
      <button
        type="button"
        className={`flex h-6 w-5 shrink-0 cursor-grab items-center justify-center opacity-0 transition-opacity group-hover:opacity-40 active:cursor-grabbing ${
          isHeading ? "mt-1" : "mt-2"
        }`}
        tabIndex={-1}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {isHeading ? (
        <div className="mt-1.5 h-4 w-4 shrink-0" aria-hidden />
      ) : (
        <Checkbox
          checked={item.checked}
          onCheckedChange={() => onToggle()}
          className="mt-2.5 shrink-0 rounded-[4px]"
          aria-label={item.checked ? "Mark incomplete" : "Mark complete"}
        />
      )}

      <textarea
        ref={inputRef}
        value={item.text}
        onChange={(e) => onTextChange(e.target.value)}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onFocus={onFocus}
        rows={1}
        placeholder={isHeading ? "Heading" : "Goal"}
        className={`min-h-[2rem] flex-1 resize-none overflow-hidden bg-transparent py-1.5 leading-relaxed outline-none placeholder:text-muted-foreground/50 ${
          isHeading
            ? "text-[15px] font-semibold"
            : `text-[15px] ${item.checked ? "text-muted-foreground line-through" : ""}`
        }`}
        style={{ fieldSizing: "content" } as React.CSSProperties}
      />

      <button
        type="button"
        onClick={onDelete}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100 ${
          isHeading ? "mt-0.5" : "mt-1.5"
        }`}
        tabIndex={-1}
        aria-label="Delete item"
      >
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );
}
