"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { createSignedUpload, publicUrlFor, removeUploadedFile } from "@/lib/uploads/server";
import { avatarPath } from "@/lib/uploads/config";

async function getSelf() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." as string, userId: null };
  return { error: null, userId: user.id };
}

export async function requestOwnAvatarUpload(meta: {
  fileName: string;
  contentType: string;
  size: number;
}): Promise<{ signedUrl?: string; token?: string; path?: string; error?: string }> {
  const { error: authErr, userId } = await getSelf();
  if (authErr || !userId) return { error: authErr ?? "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  const path = avatarPath(userId, meta.fileName);
  const { upload, error } = await createSignedUpload("avatar", {
    contentType: meta.contentType,
    size: meta.size,
    path,
  });
  if (error || !upload) return { error };

  return { signedUrl: upload.signedUrl, token: upload.token, path: upload.path };
}

export async function confirmOwnAvatarUpload(path: string): Promise<{ url?: string; error?: string }> {
  const { error: authErr, userId } = await getSelf();
  if (authErr || !userId) return { error: authErr ?? "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." };

  const admin = createAdminClient();
  const url = publicUrlFor("avatar", path);

  const { error } = await admin
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", userId);
  if (error) {
    await removeUploadedFile("avatar", path);
    return { error: error.message };
  }

  revalidatePath("/portal", "layout");
  return { url };
}
