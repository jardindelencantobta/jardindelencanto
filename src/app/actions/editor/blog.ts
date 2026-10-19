"use server";

import { createClient } from "@/lib/supabase/server";
import { createRawAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function verifyEditor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Recarga la página e inicia sesión de nuevo." as const };
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "editor"].includes(profile.role as string))
    return { error: "Sin permisos" as const };
  return { error: null };
}

export type BlogPostData = {
  titulo: string;
  slug: string;
  resumen?: string | null;
  contenido?: string | null;
  foto_url?: string | null;
  autor?: string | null;
};

export type BlogPostRow = {
  id: string;
  titulo: string;
  slug: string;
  resumen: string | null;
  contenido: string | null;
  foto_url: string | null;
  autor: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
};

function revalidate(slug?: string) {
  revalidatePath("/editor/blog");
  revalidatePath("/blog");
  revalidatePath("/");
  if (slug) revalidatePath(`/blog/${slug}`);
}

export async function createBlogPost(
  data: BlogPostData,
): Promise<{ row?: BlogPostRow; error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };
  if (!data.titulo.trim()) return { error: "El título es requerido" };
  if (!data.slug.trim()) return { error: "El slug es requerido" };

  const db = createRawAdminClient();
  const { data: row, error } = await db
    .from("blog_posts")
    .insert({
      titulo: data.titulo.trim(),
      slug: data.slug.trim(),
      resumen: data.resumen?.trim() || null,
      contenido: data.contenido?.trim() || null,
      foto_url: data.foto_url || null,
      autor: data.autor?.trim() || null,
    })
    .select("id,titulo,slug,resumen,contenido,foto_url,autor,is_published,published_at,created_at")
    .single();

  if (error) {
    if ((error as { code?: string }).code === "23505") return { error: "Ya existe un artículo con ese slug" };
    return { error: (error as { message: string }).message };
  }
  revalidate((row as BlogPostRow).slug);
  return { row: row as BlogPostRow };
}

export async function updateBlogPost(
  id: string,
  data: Partial<BlogPostData>,
): Promise<{ row?: BlogPostRow; error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };

  const db = createRawAdminClient();
  const { data: row, error } = await db
    .from("blog_posts")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id,titulo,slug,resumen,contenido,foto_url,autor,is_published,published_at,created_at")
    .single();

  if (error) return { error: (error as { message: string }).message };
  revalidate((row as BlogPostRow).slug);
  return { row: row as BlogPostRow };
}

export async function deleteBlogPost(id: string): Promise<{ error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };

  const db = createRawAdminClient();
  const { error } = await db.from("blog_posts").delete().eq("id", id);
  if (error) return { error: (error as { message: string }).message };
  revalidate();
  return {};
}

export async function togglePublish(
  id: string,
  isPublished: boolean,
): Promise<{ error?: string }> {
  const { error: authErr } = await verifyEditor();
  if (authErr) return { error: authErr };

  const db = createRawAdminClient();
  const { error } = await db
    .from("blog_posts")
    .update({
      is_published: isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: (error as { message: string }).message };
  revalidate();
  return {};
}
