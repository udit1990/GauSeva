/**
 * Lightweight offline evidence queue.
 * When uploads fail (e.g. network issue), the metadata is stored in
 * localStorage. On next app load or when online, pending items are retried.
 * Note: File blobs are stored as base64 in localStorage — suitable for
 * small photos; for large videos a full IndexedDB approach would be better.
 */

import { supabase } from "@/integrations/supabase/client";

interface QueueItem {
  id: string;
  orderId: string;
  fileName: string;
  mediaType: "image" | "video";
  caption: string | null;
  uploadedBy: string;
  base64: string;
  mimeType: string;
  createdAt: string;
}

const STORAGE_KEY = "evidence_upload_queue";

function getQueue(): QueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveQueue(queue: QueueItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function getQueueLength(): number {
  return getQueue().length;
}

export async function addToQueue(
  orderId: string,
  file: File,
  caption: string | null,
  uploadedBy: string
): Promise<void> {
  const base64 = await fileToBase64(file);
  const item: QueueItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    orderId,
    fileName: file.name,
    mediaType: file.type.startsWith("video/") ? "video" : "image",
    caption,
    uploadedBy,
    base64,
    mimeType: file.type,
    createdAt: new Date().toISOString(),
  };
  const queue = getQueue();
  queue.push(item);
  saveQueue(queue);
}

export async function processQueue(): Promise<{ success: number; failed: number }> {
  const queue = getQueue();
  if (queue.length === 0) return { success: 0, failed: 0 };

  let success = 0;
  const remaining: QueueItem[] = [];

  for (const item of queue) {
    try {
      const blob = base64ToBlob(item.base64, item.mimeType);
      const ext = item.fileName.split(".").pop() || "jpg";
      const path = `${item.orderId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("order-evidence")
        .upload(path, blob);
      if (uploadError) throw uploadError;

      const { data: inserted, error: insertError } = await supabase
        .from("order_evidence")
        .insert({
          order_id: item.orderId,
          storage_path: path,
          media_type: item.mediaType,
          caption: item.caption,
          uploaded_by: item.uploadedBy,
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      // Trigger evidence validation pipeline (best-effort async)
      if (inserted?.id) {
        supabase.functions
          .invoke("evidence-process", {
            body: { evidence_id: inserted.id, order_id: item.orderId },
          })
          .catch(() => {});
      }

      success++;
    } catch {
      remaining.push(item);
    }
  }

  saveQueue(remaining);
  return { success, failed: remaining.length };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function base64ToBlob(dataUrl: string, mimeType: string): Blob {
  const base64 = dataUrl.split(",")[1];
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mimeType });
}
