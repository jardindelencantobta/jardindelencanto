"use client";

import { useRef, useState, useTransition } from "react";
import {
  Plus, Pencil, Trash2, Loader2, Upload, BookOpen,
  Globe, EyeOff,
} from "lucide-react";
import {
  createBlogPost, updateBlogPost, deleteBlogPost, togglePublish,
  type BlogPostData, type BlogPostRow,
} from "@/app/actions/editor/blog";
import { generateSlug } from "@/lib/blog-utils";
import { uploadToColombiaHosting } from "@/lib/uploads/colombia-hosting";

const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

const inputCls =
  "w-full border border-negro/10 bg-crema/20 px-3 py-2.5 text-[0.83rem] text-negro rounded-lg focus:outline-none focus:border-dorado/70 transition-colors";

// ─── Formulario ────────────────────────────────────────────────────────────────

function BlogPostForm({
  initial,
  onDone,
  onCancel,
}: {
  initial?: BlogPostRow;
  onDone: (row: BlogPostRow) => void;
  onCancel: () => void;
}) {
  const [titulo, setTitulo] = useState(initial?.titulo ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [resumen, setResumen] = useState(initial?.resumen ?? "");
  const [contenido, setContenido] = useState(initial?.contenido ?? "");
  const [autor, setAutor] = useState(initial?.autor ?? "");
  const [fotoUrl, setFotoUrl] = useState<string | null>(initial?.foto_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const photoRef = useRef<HTMLInputElement>(null);
  const isNew = !initial;

  function handleTituloChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setTitulo(val);
    if (isNew) setSlug(generateSlug(val));
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > PHOTO_MAX_BYTES) { setError("La foto supera 5 MB"); return; }
    if (!PHOTO_ALLOWED_MIME.includes(f.type)) { setError("Solo JPG, PNG o WebP"); return; }

    setUploading(true);
    setError(null);
    const result = await uploadToColombiaHosting(f, "galeria/blog");
    setUploading(false);
    if (result.error) { setError(result.error); return; }
    setFotoUrl(result.url!);
    if (photoRef.current) photoRef.current.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: BlogPostData = {
      titulo: titulo.trim(),
      slug: slug.trim(),
      resumen: resumen.trim() || null,
      contenido: contenido.trim() || null,
      foto_url: fotoUrl,
      autor: autor.trim() || null,
    };
    startTransition(async () => {
      const res = initial
        ? await updateBlogPost(initial.id, data)
        : await createBlogPost(data);
      if (res.error) { setError(res.error); return; }
      onDone(res.row!);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-crema/40 border border-dorado/20 rounded-2xl p-5 space-y-4"
    >
      <h4 className="font-serif text-[0.95rem] text-negro">
        {initial ? "Editar artículo" : "Nuevo artículo"}
      </h4>

      {/* Foto de portada */}
      <div className="flex items-center gap-3">
        <div className="w-20 h-14 rounded-lg overflow-hidden ring-1 ring-negro/10 bg-dorado/5 flex items-center justify-center shrink-0">
          {fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fotoUrl} alt="Portada" className="w-full h-full object-cover" />
          ) : (
            <BookOpen size={22} className="text-dorado/30" />
          )}
          {uploading && (
            <div className="absolute inset-0 bg-negro/55 flex items-center justify-center rounded-lg">
              <Loader2 size={16} className="animate-spin text-blanco" />
            </div>
          )}
        </div>
        <input
          ref={photoRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handlePhoto}
        />
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => photoRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-negro/15 rounded-lg text-[0.78rem] text-negro hover:bg-negro/5 disabled:opacity-40 transition-colors"
          >
            <Upload size={13} />
            {fotoUrl ? "Cambiar portada" : "Subir portada"}
          </button>
          {fotoUrl && (
            <button
              type="button"
              onClick={() => setFotoUrl(null)}
              className="text-[0.72rem] text-rojo hover:underline text-left"
            >
              Quitar portada
            </button>
          )}
        </div>
      </div>

      {/* Campos */}
      <div className="space-y-3">
        <div>
          <label className="block text-[0.68rem] text-gris uppercase tracking-wider mb-1">
            Título *
          </label>
          <input
            type="text"
            value={titulo}
            onChange={handleTituloChange}
            required
            className={inputCls}
            placeholder="El título del artículo"
          />
        </div>

        <div>
          <label className="block text-[0.68rem] text-gris uppercase tracking-wider mb-1">
            Slug (URL) *
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            className={`${inputCls} font-mono text-[0.78rem]`}
            placeholder="url-del-articulo"
          />
          <p className="text-[0.68rem] text-negro/35 mt-1">
            URL: /blog/{slug || "url-del-articulo"}
          </p>
        </div>

        <div>
          <label className="block text-[0.68rem] text-gris uppercase tracking-wider mb-1">
            Resumen / extracto
          </label>
          <textarea
            value={resumen}
            onChange={(e) => setResumen(e.target.value)}
            rows={2}
            className={`${inputCls} resize-none`}
            placeholder="Breve descripción que aparece en la tarjeta…"
          />
        </div>

        <div>
          <label className="block text-[0.68rem] text-gris uppercase tracking-wider mb-1">
            Contenido
          </label>
          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            rows={8}
            className={`${inputCls} resize-y`}
            placeholder="Contenido completo del artículo. Separa párrafos con una línea en blanco."
          />
        </div>

        <div>
          <label className="block text-[0.68rem] text-gris uppercase tracking-wider mb-1">
            Autor
          </label>
          <input
            type="text"
            value={autor}
            onChange={(e) => setAutor(e.target.value)}
            className={inputCls}
            placeholder="Ej. Equipo El Encanto"
          />
        </div>
      </div>

      {error && <p className="text-[0.78rem] text-rojo">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 text-[0.8rem] text-gris border border-negro/15 rounded-lg hover:bg-negro/5"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending || uploading}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-dorado text-blanco text-[0.8rem] font-medium rounded-lg hover:bg-dorado/90 disabled:opacity-50"
        >
          {isPending && <Loader2 size={12} className="animate-spin" />}
          {isPending ? "Guardando…" : initial ? "Actualizar" : "Crear borrador"}
        </button>
      </div>
    </form>
  );
}

// ─── Manager ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function BlogManager({ posts: initial }: { posts: BlogPostRow[] }) {
  const [posts, setPosts] = useState<BlogPostRow[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreated(row: BlogPostRow) {
    setPosts((prev) => [row, ...prev]);
    setShowForm(false);
  }

  function handleUpdated(row: BlogPostRow) {
    setPosts((prev) => prev.map((p) => (p.id === row.id ? row : p)));
    setEditId(null);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteBlogPost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setConfirmDelete(null);
    });
  }

  function handleTogglePublish(id: string, isPublished: boolean) {
    startTransition(async () => {
      await togglePublish(id, isPublished);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, is_published: isPublished, published_at: isPublished ? new Date().toISOString() : null }
            : p,
        ),
      );
    });
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-[1.9rem] text-negro tracking-[-0.03em]">
            <span className="text-dorado">Blog</span>
          </h2>
          <p className="text-gris text-[0.88rem] mt-1">{posts.length} artículos</p>
        </div>
        {!showForm && !editId && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-dorado text-blanco text-[0.8rem] font-medium rounded-xl hover:bg-dorado/90 transition-colors"
          >
            <Plus size={15} /> Nuevo artículo
          </button>
        )}
      </div>

      {showForm && (
        <BlogPostForm onDone={handleCreated} onCancel={() => setShowForm(false)} />
      )}

      {/* Lista */}
      <div className="space-y-3">
        {posts.length === 0 && !showForm ? (
          <div className="bg-blanco rounded-2xl border border-negro/[0.07] p-10 text-center">
            <p className="text-gris text-[0.85rem]">Sin artículos. Crea el primero.</p>
          </div>
        ) : posts.map((post) => {
          if (editId === post.id) {
            return (
              <BlogPostForm
                key={post.id}
                initial={post}
                onDone={handleUpdated}
                onCancel={() => setEditId(null)}
              />
            );
          }
          return (
            <div
              key={post.id}
              className={`bg-blanco rounded-2xl border border-negro/[0.07] px-5 py-4 ${!post.is_published ? "opacity-60" : ""}`}
            >
              <div className="flex items-center gap-4">
                {/* Miniatura */}
                <div className="w-14 h-10 rounded-lg overflow-hidden bg-dorado/5 flex items-center justify-center shrink-0">
                  {post.foto_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.foto_url} alt={post.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen size={16} className="text-dorado/30" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[0.88rem] font-medium text-negro truncate">{post.titulo}</p>
                    <span
                      className={`shrink-0 text-[0.62rem] px-1.5 py-0.5 rounded border ${
                        post.is_published
                          ? "bg-verde-bosque/10 text-verde-bosque border-verde-bosque/20"
                          : "bg-negro/5 text-gris border-negro/10"
                      }`}
                    >
                      {post.is_published ? "Publicado" : "Borrador"}
                    </span>
                  </div>
                  <p className="text-[0.72rem] text-negro/40 font-mono">/blog/{post.slug}</p>
                  <p className="text-[0.72rem] text-negro/35 mt-0.5">
                    {post.autor && `${post.autor} · `}
                    {post.is_published ? formatDate(post.published_at) : `Creado ${formatDate(post.created_at)}`}
                  </p>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => handleTogglePublish(post.id, !post.is_published)}
                    disabled={isPending}
                    title={post.is_published ? "Despublicar" : "Publicar"}
                    className="p-1.5 text-negro/25 hover:text-negro hover:bg-negro/5 rounded-lg transition-colors disabled:opacity-40"
                  >
                    {post.is_published ? <EyeOff size={14} /> : <Globe size={14} />}
                  </button>
                  <button
                    onClick={() => setEditId(post.id)}
                    className="p-1.5 text-negro/25 hover:text-negro hover:bg-negro/5 rounded-lg transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  {confirmDelete === post.id ? (
                    <div className="flex items-center gap-1 text-[0.74rem] ml-1">
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={isPending}
                        className="text-rojo font-medium hover:underline disabled:opacity-50"
                      >
                        {isPending ? <Loader2 size={12} className="animate-spin" /> : "Sí"}
                      </button>
                      <span className="text-negro/20">/</span>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-gris hover:underline"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(post.id)}
                      className="p-1.5 text-negro/25 hover:text-rojo hover:bg-rojo/5 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[0.75rem] text-negro/35 pt-1">
        Las fotos se suben a{" "}
        <code className="bg-negro/5 px-1 py-0.5 rounded">contenido.jardindelencanto.com/galeria/blog/</code>
      </p>
    </div>
  );
}
