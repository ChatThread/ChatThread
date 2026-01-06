import { WishlistItem } from "../models/WishlistItem";

const STORAGE_KEY = "wishlist_items";

function readStorage(): WishlistItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WishlistItem[];
  } catch (e) {
    console.error("Failed to read wishlist storage", e);
    return [];
  }
}

function writeStorage(items: WishlistItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to write wishlist storage", e);
  }
}

export const wishlistRepository = {
  async getAll(): Promise<WishlistItem[]> {
    return readStorage();
  },
  async getById(id: string): Promise<WishlistItem | undefined> {
    const items = readStorage();
    return items.find((i) => i.id === id);
  },
  async add(item: Omit<WishlistItem, "id" | "createdAt">): Promise<WishlistItem> {
    const items = readStorage();
    const newItem: WishlistItem = {
      id: String(Date.now()) + Math.random().toString(36).slice(2, 9),
      createdAt: new Date().toISOString(),
      ...item,
    } as WishlistItem;
    items.unshift(newItem);
    writeStorage(items);
    return newItem;
  },
  async remove(id: string): Promise<boolean> {
    const items = readStorage();
    const next = items.filter((i) => i.id !== id);
    writeStorage(next);
    return items.length !== next.length;
  },
};
