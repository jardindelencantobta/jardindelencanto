"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, Trash2, Loader2, ImageIcon } from "lucide-react";
import {
  requestSiteImageUpload,
  confirmSiteImageUpload,
  deleteSiteImage,
} from "@/app/actions/editor/imagenes-sitio";
import type { SiteImageKey } from "@/lib/uploads/config";
import { uploadToHosting } from "@/lib/uploads/client";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

function ImageSlot({
  label, imgKey, url, onUpdated,
}: {
  label: string;
  imgKey: SiteImageKey;
  url: string | null;
  onUpdated: (key: SiteImageKey, url: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_BYTES) { setError("El archivo supera 10 MB"); return; }
    if (!ALLOWED_MIME.includes(f.type)) { setError("Solo se aceptan JPG, PNG y WebP"); return; }

    setUploading(true);
    setError(null);

    try {
      const req = await requestSiteImageUpload({
        contentType: f.type, size: f.size, key: imgKey,
      });
      if (req.error || !req.uploadUrl || !req.token || !req.folder) {
        setError(req.error ?? "No se pudo iniciar la subida");
        return;
      }

      const up = await uploadToHosting(req.uploadUrl, req.token, req.folder, f);
      if (up.error || !up.url) { setError(up.error ?? "El servidor de archivos no devolvió la URL"); return; }

      const result = await confirmSiteImageUpload({ key: imgKey, url: up.url });
      if (result.error) { setError(result.error); return; }

      onUpdated(imgKey, result.url ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteSiteImage(imgKey);
      onUpdated(imgKey, null);
      setConfirmDel(false);
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-[0.8rem] font-medium text-negro">{label}</p>

      <div className="relative aspect-[4/3] rounded-xl overflow-hidden ring-1 ring-negro/10 bg-negro/5">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={28} className="text-negro/15" />
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-negro/55 flex items-center justify-center">
            <Loader2 size={22} className="animate-spin text-blanco" />
          </div>
        )}
      </div>

      <input
        ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
        className="hidden" onChange={handleFile}
      />

      <div className="flex gap-2">
        <button
          type="button" onClick={() => fileRef.current?.click()} disabled={uploading || isPending}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-negro/15
            rounded-lg text-[0.78rem] text-negro hover:bg-negro/5 disabled:opacity-40 transition-colors"
        >
          <Upload size={13} /> Cambiar imagen
        </button>
        {url && (
          <button
            type="button" onClick={() => setConfirmDel(true)} disabled={uploading || isPending}
            className="px-3 py-2 border border-rojo/20 rounded-lg text-rojo hover:bg-rojo/5 disabled:opacity-40 transition-colors"
            title="Eliminar imagen"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {confirmDel && (
        <div className="flex items-center gap-2 text-[0.74rem] text-gris bg-rojo/5 rounded-lg px-2.5 py-1.5">
          <span className="flex-1">¿Eliminar esta imagen?</span>
          <button type="button" onClick={handleDelete} disabled={isPending}
            className="text-rojo font-medium hover:underline disabled:opacity-40">
            Sí
          </button>
          <button type="button" onClick={() => setConfirmDel(false)} disabled={isPending}
            className="text-gris hover:underline disabled:opacity-40">
            No
          </button>
        </div>
      )}

      {error && <p className="text-[0.72rem] text-rojo">{error}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-blanco rounded-2xl border border-negro/[0.07] p-6 space-y-4">
      <h3 className="font-serif text-[1.05rem] text-negro tracking-[-0.01em]">{title}</h3>
      {children}
    </div>
  );
}

export function ImagenesSitioManager({
  initial,
}: {
  initial: Record<SiteImageKey, string | null>;
}) {
  const [images, setImages] = useState(initial);

  function handleUpdated(key: SiteImageKey, url: string | null) {
    setImages((prev) => ({ ...prev, [key]: url }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-[1.9rem] text-negro tracking-[-0.03em]">
          <span className="text-dorado">Imágenes</span> del sitio
        </h2>
        <p className="text-gris text-[0.88rem] mt-1">
          Los cambios se reflejan en el sitio público al instante.
        </p>
      </div>

      <Section title="Cards de eventos">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ImageSlot label="Bodas" imgKey="img_card_boda"
            url={images.img_card_boda} onUpdated={handleUpdated} />
          <ImageSlot label="Quince Años" imgKey="img_card_quince"
            url={images.img_card_quince} onUpdated={handleUpdated} />
          <ImageSlot label="Empresariales" imgKey="img_card_empresarial"
            url={images.img_card_empresarial} onUpdated={handleUpdated} />
          <ImageSlot label="Revelación de Género" imgKey="img_card_revelacion"
            url={images.img_card_revelacion} onUpdated={handleUpdated} />
        </div>
      </Section>

      <Section title="Imagen Nosotros">
        <p className="text-[0.78rem] text-gris -mt-2">
          Foto junto al texto &quot;Más que un lugar, una experiencia&quot;
        </p>
        <div className="max-w-[220px]">
          <ImageSlot label="Nosotros" imgKey="img_nosotros"
            url={images.img_nosotros} onUpdated={handleUpdated} />
        </div>
      </Section>

      <Section title="Cards de servicios">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ImageSlot label="Catering" imgKey="img_servicio_catering"
            url={images.img_servicio_catering} onUpdated={handleUpdated} />
          <ImageSlot label="Fotografía y Video" imgKey="img_servicio_fotografia"
            url={images.img_servicio_fotografia} onUpdated={handleUpdated} />
          <ImageSlot label="Decoración" imgKey="img_servicio_decoracion"
            url={images.img_servicio_decoracion} onUpdated={handleUpdated} />
        </div>
      </Section>
    </div>
  );
}
