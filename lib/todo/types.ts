export type TodoBlockType = "todo" | "heading";

export type TodoBlock = {
  id: string;
  type: TodoBlockType;
  text: string;
  checked: boolean;
  indent: number;
};

/** @deprecated Use TodoBlock */
export type TodoItem = TodoBlock;

export type TodoList = {
  id: string;
  title: string;
  icon: string;
  items: TodoBlock[];
  createdAt: string;
  updatedAt: string;
};

export type TodoWorkspaceData = {
  lists: TodoList[];
  activeListId: string;
};

export type TodoWorkspaceDoc = {
  _id: "workspace";
  lists: TodoList[];
  activeListId: string;
  updatedAt: Date;
};

/** Legacy single-page format */
export type LegacyTodoDoc = {
  _id: "shared";
  title: string;
  items: TodoBlock[];
  updatedAt: Date;
};

export const WORKSPACE_ID = "workspace" as const;
export const MAX_INDENT = 3;
export const MAX_ITEMS_PER_LIST = 500;
export const MAX_LISTS = 50;
export const MAX_TITLE_LENGTH = 200;
export const MAX_ITEM_TEXT_LENGTH = 2000;
export const MAX_ICON_LENGTH = 8;
