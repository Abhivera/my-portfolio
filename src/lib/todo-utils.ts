import type { TodoBlock, TodoList, TodoWorkspaceData } from "../../lib/todo/types";

export function createTodoBlock(overrides: Partial<TodoBlock> = {}): TodoBlock {
  return {
    id: crypto.randomUUID(),
    type: "todo",
    text: "",
    checked: false,
    indent: 0,
    ...overrides,
  };
}

export function createHeadingBlock(overrides: Partial<TodoBlock> = {}): TodoBlock {
  return createTodoBlock({ type: "heading", checked: false, ...overrides });
}

export function createTodoList(title = "Untitled"): TodoList {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title,
    icon: "📄",
    items: [createTodoBlock()],
    createdAt: now,
    updatedAt: now,
  };
}

export function defaultWorkspace(): TodoWorkspaceData {
  const list = createTodoList();
  return { lists: [list], activeListId: list.id };
}

export function getActiveList(workspace: TodoWorkspaceData): TodoList | undefined {
  return workspace.lists.find((l) => l.id === workspace.activeListId);
}

export function updateActiveList(
  workspace: TodoWorkspaceData,
  updater: (list: TodoList) => TodoList,
): TodoWorkspaceData {
  const now = new Date().toISOString();
  return {
    ...workspace,
    lists: workspace.lists.map((list) =>
      list.id === workspace.activeListId
        ? { ...updater(list), updatedAt: now }
        : list,
    ),
  };
}

export function defaultTodoItems(): TodoBlock[] {
  return [createTodoBlock()];
}

export function moveItem(items: TodoBlock[], from: number, to: number): TodoBlock[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = [...items];
  const [removed] = next.splice(from, 1);
  next.splice(to, 0, removed);
  return next;
}

export function insertItemAfter(
  items: TodoBlock[],
  index: number,
  block?: TodoBlock,
): TodoBlock[] {
  const current = items[index];
  const next = [...items];
  next.splice(
    index + 1,
    0,
    block ?? createTodoBlock({ indent: current?.type === "heading" ? 0 : (current?.indent ?? 0) }),
  );
  return next;
}

export function removeItemAt(items: TodoBlock[], index: number): TodoBlock[] {
  if (items.length <= 1) {
    return [createTodoBlock()];
  }
  return items.filter((_, i) => i !== index);
}

export function adjustIndent(items: TodoBlock[], index: number, delta: number): TodoBlock[] {
  const next = [...items];
  const item = next[index];
  if (!item || item.type === "heading") return items;
  next[index] = {
    ...item,
    indent: Math.min(3, Math.max(0, item.indent + delta)),
  };
  return next;
}

export function toggleItem(items: TodoBlock[], index: number): TodoBlock[] {
  const next = [...items];
  const item = next[index];
  if (!item || item.type !== "todo") return items;
  next[index] = { ...item, checked: !item.checked };
  return next;
}

export function updateItemText(items: TodoBlock[], index: number, text: string): TodoBlock[] {
  const next = [...items];
  const item = next[index];
  if (!item) return items;
  next[index] = { ...item, text };
  return next;
}

export function countProgress(items: TodoBlock[]): { done: number; total: number } {
  const todos = items.filter(
    (item) => item.type === "todo" && item.text.trim().length > 0,
  );
  return {
    done: todos.filter((item) => item.checked).length,
    total: todos.length,
  };
}

export function listProgress(list: TodoList): { done: number; total: number } {
  return countProgress(list.items);
}

export type ParsedMarkdown = {
  title?: string;
  blocks: TodoBlock[];
};

export function looksLikeMarkdown(text: string): boolean {
  const lines = text.split(/\r?\n/);
  if (lines.length <= 1) {
    const trimmed = text.trim();
    return (
      /^#{1,6}\s/.test(trimmed) ||
      /^[-*+]\s+\[[ xX]\]/.test(trimmed) ||
      /^---+$/.test(trimmed)
    );
  }
  return lines.some((line) => {
    const trimmed = line.trim();
    return (
      /^#{1,6}\s/.test(trimmed) ||
      /^[-*+]\s+\[[ xX]\]/.test(trimmed) ||
      /^[-*+]\s+\S/.test(trimmed) ||
      /^---+$/.test(trimmed)
    );
  });
}

export function parseMarkdownToBlocks(markdown: string): ParsedMarkdown {
  const lines = markdown.split(/\r?\n/);
  const blocks: TodoBlock[] = [];
  let title: string | undefined;
  let firstH1Seen = false;
  let currentHeadingLevel = 0;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || /^---+$/.test(trimmed)) continue;

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      if (level === 1 && !firstH1Seen) {
        title = text;
        firstH1Seen = true;
        currentHeadingLevel = level;
        continue;
      }
      firstH1Seen = true;
      currentHeadingLevel = level;
      blocks.push(createHeadingBlock({ text }));
      continue;
    }

    const checkboxMatch = trimmed.match(/^[-*+]\s+\[([ xX])\]\s*(.+)$/);
    if (checkboxMatch) {
      const checked = checkboxMatch[1].toLowerCase() === "x";
      const text = checkboxMatch[2].trim();
      const indent = Math.min(3, Math.max(0, currentHeadingLevel - 1));
      blocks.push(createTodoBlock({ text, checked, indent }));
      continue;
    }

    const listMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (listMatch) {
      const text = listMatch[1].trim();
      const indent = Math.min(3, Math.max(0, currentHeadingLevel - 1));
      blocks.push(createTodoBlock({ text, indent }));
      continue;
    }

    const indent = Math.min(3, Math.max(0, currentHeadingLevel - 1));
    blocks.push(createTodoBlock({ text: trimmed, indent }));
  }

  return { title, blocks: blocks.length > 0 ? blocks : [createTodoBlock()] };
}

export function insertBlocksAt(
  items: TodoBlock[],
  index: number,
  blocks: TodoBlock[],
): TodoBlock[] {
  if (blocks.length === 0) return items;
  const current = items[index];
  if (current?.text === "") {
    const next = [...items];
    next.splice(index, 1, ...blocks);
    return next;
  }
  const next = [...items];
  next.splice(index + 1, 0, ...blocks);
  return next;
}
