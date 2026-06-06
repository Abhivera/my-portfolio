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
