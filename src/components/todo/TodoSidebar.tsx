import { FileText, Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TodoList } from "../../../lib/todo/types";
import { listProgress } from "@/lib/todo-utils";

type TodoSidebarProps = {
  lists: TodoList[];
  activeListId: string;
  onSelect: (id: string) => void;
  onNewPage: () => void;
  onDelete: (id: string) => void;
};

export function TodoSidebar({
  lists,
  activeListId,
  onSelect,
  onNewPage,
  onDelete,
}: TodoSidebarProps) {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r bg-muted/30">
      <div className="flex items-center justify-between px-3 py-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Private
        </span>
        <button
          type="button"
          onClick={onNewPage}
          className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted"
          aria-label="New page"
        >
          <Plus className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <ul className="space-y-0.5 pb-4">
          {lists.map((list) => {
            const active = list.id === activeListId;
            const { done, total } = listProgress(list);

            return (
              <li key={list.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(list.id)}
                  className={`flex w-full items-center gap-2 rounded-md py-1.5 pl-2 pr-8 text-left text-sm transition-colors ${
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <span className="shrink-0 text-base leading-none" aria-hidden>
                    {list.icon || "📄"}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{list.title || "Untitled"}</span>
                  {total > 0 && (
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {done}/{total}
                    </span>
                  )}
                </button>

                {lists.length > 1 && (
                  <button
                    type="button"
                    className="absolute right-1 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded bg-background/95 text-red-600 opacity-0 pointer-events-none shadow-sm ring-1 ring-border/60 transition-opacity hover:bg-red-50 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
                    aria-label={`Delete "${list.title || "Untitled"}"`}
                    title="Delete page"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(list.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </ScrollArea>

      <div className="border-t p-2">
        <button
          type="button"
          onClick={onNewPage}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <FileText className="h-4 w-4" />
          New page
        </button>
      </div>
    </aside>
  );
}
