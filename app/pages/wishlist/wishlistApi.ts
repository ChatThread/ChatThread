import { BASE_URL_API_V2 } from "@/constants/constants";
import { api } from "@/controllers/API/api";

// Shared wishlist API utilities (ported from wishlist_repository.dart)
export type WishlistItem = {
  id: string;
  title: string;
  description?: string | null;
  createdAt: string; // ISO string
  [key: string]: any;
};

export type PageResult<T> = {
  items: T[];
  total: number | null;
};

export async function fetchPage({ page, pageSize }: { page: number; pageSize: number; }): Promise<PageResult<WishlistItem>> {
  const url = `${BASE_URL_API_V2}wishlist/?page=${page}&size=${pageSize}`;
  const resp = await api.get(url);
  const data = resp?.data ?? null;
  if (data == null) return { items: [], total: null };

  let itemsPayload: any = null;
  let total: number | null = null;

  if (Array.isArray(data)) {
    itemsPayload = data;
  } else if (typeof data === "object") {
    itemsPayload = data.items ?? data.data ?? data;
    if (typeof data.total === "number") total = data.total;
    else if (typeof data.count === "number") total = data.count;
  }

  const out: WishlistItem[] = [];
  if (Array.isArray(itemsPayload)) {
    for (const e of itemsPayload) {
      if (e && typeof e === "object") {
        out.push({
          id: String(e['id'] ?? e['uid'] ?? e['uuid'] ?? ""),
          title: String(e['title'] ?? e['name'] ?? ""),
          description: e['description'] ?? e['body'] ?? null,
          createdAt: e['createdAt'] ?? e['created_at'] ?? e['created'] ?? new Date().toISOString(),
          ...e,
        });
      }
    }
  } else if (itemsPayload && typeof itemsPayload === "object") {
    out.push({
      id: String(itemsPayload['id'] ?? itemsPayload['uid'] ?? ""),
      title: String(itemsPayload['title'] ?? itemsPayload['name'] ?? ""),
      description: itemsPayload['description'] ?? itemsPayload['body'] ?? null,
      createdAt: itemsPayload['createdAt'] ?? itemsPayload['created_at'] ?? itemsPayload['created'] ?? new Date().toISOString(),
      ...itemsPayload,
    });
  }

  return { items: out, total };
}
export async function publish({ title, description }: { title: string; description?: string | null; }): Promise<WishlistItem | null> {
  const url = `${BASE_URL_API_V2}wishlist/`;
  const resp = await api.post(url, { title, description });
  // Return created item if backend returns it, else null
  return (resp?.data as any) ?? null;
}

export async function deleteItem(id: string) {
  const url = `${BASE_URL_API_V2}wishlist/${encodeURIComponent(id)}/delete`;
  const resp = await api.post(url);
  // axios will throw for non-2xx by default because of interceptor
  return resp?.data ?? null;
}
