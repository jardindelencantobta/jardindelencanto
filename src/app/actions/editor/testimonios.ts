"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { createSignedUpload, publicUrlFor } from "@/lib/uploads/server";
import { testimonialPhotoPath } from "@/lib/uploads/config";

async function verifyEditor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." as string };
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "editor"].includes(profile.role as string))
    return { error: "Sin permisos" as string };
  return { error: null };
}

export type TestimonioData = {
  client_name: string;
  event_type: string;
  content: string;
  rating: number;
  is_published: boolean;
  photo_url?: string | null;
};

export async function createTestimonio(data: TestimonioData): Promise<{ error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };
  if (!data.client_name.trim()) return { error: "El nombre es requerido" };
  if (!data.content.trim()) return { error: "La cita es requerida" };
  const admin = createAdminClient();
  const { error } = await admin.from("testimonials").insert({
    client_name: data.client_name.trim(),
    event_type: data.event_type || null,
    content: data.content.trim(),
    rating: data.rating,
    is_published: data.is_published,
    photo_url: data.photo_url ?? null,
  });
  if (error) return { error: error.message };
  revalidatePath("/editor/testimonios");
  return {};
}

export async function updateTestimonio(id: string, data: Partial<TestimonioData>): Promise<{ error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };
  const admin = createAdminClient();
  const { error } = await admin.from("testimonials").update(data).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/editor/testimonios");
  return {};
}

export async function deleteTestimonio(id: string): Promise<{ error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };
  const admin = createAdminClient();
  const { error } = await admin.from("testimonials").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/editor/testimonios");
  return {};
}

export async function requestTestimonioPhotoUpload(meta: {
  fileName: string;
  contentType: string;
  size: number;
}): Promise<{ signedUrl?: string; token?: string; path?: string; error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };

  const path = testimonialPhotoPath(meta.fileName);
  const { upload, error } = await createSignedUpload("testimonial-photo", {
    contentType: meta.contentType,
    size: meta.size,
    path,
  });
  if (error || !upload) return { error };

  return { signedUrl: upload.signedUrl, token: upload.token, path: upload.path };
}

export async function confirmTestimonioPhotoUpload(path: string): Promise<{ url?: string; error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };

  return { url: publicUrlFor("testimonial-photo", path) };
}
