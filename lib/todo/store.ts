import { randomUUID } from "node:crypto";
import { getDb } from "../notepad/db.js";
import {
  MAX_ICON_LENGTH,
  MAX_ITEMS_PER_LIST,
  MAX_ITEM_TEXT_LENGTH,
  MAX_LISTS,
  MAX_TITLE_LENGTH,
  WORKSPACE_ID,
  type LegacyTodoDoc,
  type TodoBlock,
  type TodoList,
  type TodoWorkspaceData,
  type TodoWorkspaceDoc,
} from "./types.js";

function sanitizeBlock(block: TodoBlock): TodoBlock {
  const type = block.type === "heading" ? "heading" : "todo";
  return {
    id: block.id.slice(0, 64),
    type,
    text: block.text.slice(0, MAX_ITEM_TEXT_LENGTH),
    checked: type === "todo" ? Boolean(block.checked) : false,
    indent: Math.min(Math.max(0, Math.floor(block.indent)), 3),
  };
}

function sanitizeList(list: TodoList): TodoList {
  return {
    id: list.id.slice(0, 64),
    title: list.title.slice(0, MAX_TITLE_LENGTH),
    icon: (list.icon || "📄").slice(0, MAX_ICON_LENGTH),
    items: list.items.slice(0, MAX_ITEMS_PER_LIST).map(sanitizeBlock),
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
  };
}

export function sanitizeWorkspace(data: TodoWorkspaceData): TodoWorkspaceData {
  const lists = data.lists.slice(0, MAX_LISTS).map(sanitizeList);
  const activeListId = lists.some((l) => l.id === data.activeListId)
    ? data.activeListId
    : (lists[0]?.id ?? data.activeListId);

  return { lists, activeListId };
}

function migrateLegacyDoc(doc: Omit<LegacyTodoDoc, "_id">): TodoWorkspaceData {
  const now = new Date().toISOString();
  const list: TodoList = {
    id: randomUUID(),
    title: doc.title || "Untitled",
    icon: "📋",
    items: (doc.items ?? []).map((item) => ({
      ...item,
      type: item.type === "heading" ? "heading" : "todo",
    })),
    createdAt: doc.updatedAt?.toISOString() ?? now,
    updatedAt: doc.updatedAt?.toISOString() ?? now,
  };

  if (list.items.length === 0) {
    list.items = [
      {
        id: randomUUID(),
        type: "todo",
        text: "",
        checked: false,
        indent: 0,
      },
    ];
  }

  return { lists: [list], activeListId: list.id };
}

function defaultWorkspace(): TodoWorkspaceData {
  const now = new Date().toISOString();
  const list: TodoList = {
    id: randomUUID(),
    title: "Untitled",
    icon: "📄",
    items: [
      {
        id: randomUUID(),
        type: "todo",
        text: "",
        checked: false,
        indent: 0,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
  return { lists: [list], activeListId: list.id };
}

export async function getTodoWorkspace(): Promise<
  TodoWorkspaceData & { updatedAt: string | null }
> {
  const db = await getDb();
  const collection = db.collection<TodoWorkspaceDoc | LegacyTodoDoc>("todos");

  const workspaceDoc = await collection.findOne({ _id: WORKSPACE_ID });
  if (workspaceDoc && "lists" in workspaceDoc) {
    const data = sanitizeWorkspace({
      lists: workspaceDoc.lists,
      activeListId: workspaceDoc.activeListId,
    });
    return {
      ...data,
      updatedAt: workspaceDoc.updatedAt?.toISOString() ?? null,
    };
  }

  const legacyDoc = await collection.findOne({ _id: "shared" });
  if (legacyDoc && "title" in legacyDoc) {
    const migrated = migrateLegacyDoc(legacyDoc);
    const updatedAt = new Date();
    await collection.updateOne(
      { _id: WORKSPACE_ID },
      {
        $set: {
          _id: WORKSPACE_ID,
          lists: migrated.lists,
          activeListId: migrated.activeListId,
          updatedAt,
        },
      },
      { upsert: true },
    );
    return { ...migrated, updatedAt: updatedAt.toISOString() };
  }

  const fresh = defaultWorkspace();
  return { ...fresh, updatedAt: null };
}

export async function saveTodoWorkspace(data: TodoWorkspaceData): Promise<string> {
  const sanitized = sanitizeWorkspace(data);
  const db = await getDb();
  const updatedAt = new Date();

  await db.collection<TodoWorkspaceDoc>("todos").updateOne(
    { _id: WORKSPACE_ID },
    {
      $set: {
        _id: WORKSPACE_ID,
        lists: sanitized.lists,
        activeListId: sanitized.activeListId,
        updatedAt,
      },
    },
    { upsert: true },
  );

  return updatedAt.toISOString();
}
