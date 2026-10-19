"use client";

import { useRef, useState, useTransition } from "react";
import {
  Plus, Pencil, Trash2, Loader2, Upload, User,
  ChevronUp, ChevronDown, Eye, EyeOff,
} from "lucide-react";
import {
  createStaffMember, updateStaffMember, deleteStaffMember,
  toggleStaffActive, moveStaffMember,
  type StaffData, type StaffRow,
} from "@/app/actions/editor/staff";
import { uploadToColombiaHosting } from "@/lib/uploads/colombia-hosting";

const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

const inputCls =
  "w-full border border-negro/10 bg-crema/20 px-3 py-2.5 text-[0.83rem] text-negro rounded-lg focus:outline-none focus:border-dorado/70 transition-colors";

const TIPOS = [
  {
    key: "interno",
    aliado: false,
    titulo: "Equipo interno",
    ayuda: "Planners, DJ, animadores… Aparecen en “Las personas detrás de cada evento”.",
    grupo: "Equipo interno",
    agregar: "Agregar al equipo",
  },
  {
    key: "aliado",
    aliado: true,
    titulo: "Aliado externo",
    ayuda: "Proveedores aliados (fotógrafo, etc.). Aparecen en “Con quienes confiamos tu momento especial”.",
    grupo: "Aliados externos",
    agregar: "Agregar aliado",
  },
] as const;

type TipoKey = (typeof TIPOS)[number]["key"];

// ─── Formulario ────────────────────────────────────────────────────────────────

function StaffForm({
  initial,
  defaultAliado = false,
  onDone,
  onCancel,
}: {
  initial?: StaffRow;
  defaultAliado?: boolean;
  onDone: (row: StaffRow) => void;
  onCancel: () => void;
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [cargo, setCargo] = useState(initial?.cargo ?? "");
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "");
  const [frase, setFrase] = useState(initial?.frase ?? "");
  const [isAliado, setIsAliado] = useState(initial?.is_aliado_externo ?? defaultAliado);
  const [fotoUrl, setFotoUrl] = useState<string | null>(initial?.foto_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const photoRef = useRef<HTMLInputElement>(null);

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > PHOTO_MAX_BYTES) { setError("La foto supera 5 MB"); return; }
    if (!PHOTO_ALLOWED_MIME.includes(f.type)) { setError("Solo JPG, PNG o WebP"); return; }

    setUploading(true);
    setError(null);
    const result = await uploadToColombiaHosting(f, "galeria/staff");
    setUploading(false);
    if (result.error) { setError(result.error); return; }
    setFotoUrl(result.url!);
    if (photoRef.current) photoRef.current.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: StaffData = {
      nombre,
      cargo,
      descripcion: descripcion.trim() || null,
      foto_url: fotoUrl,
      is_aliado_externo: isAliado,
      frase: frase.trim() || null,
    };
    startTransition(async () => {
      const res = initial
        ? await updateStaffMember(initial.id, data)
        : await createStaffMember(data);
      if (res.error) { setError(res.error); return; }
      onDone(res.row!);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-crema/40 border border-dorado/20 rounded-2xl p-5 space-y-3"
    >
      <h4 className="font-serif text-[0.95rem] text-negro">
        {initial ? "Editar" : isAliado ? "Nuevo aliado externo" : "Nuevo miembro del equipo interno"}
      </h4>

      {/* Foto */}
      <div className="flex items-center gap-3">
        <div className="relative w-16 h-16 rounded-full overflow-hidden ring-1 ring-negro/10 bg-dorado/10 flex items-center justify-center shrink-0">
          {fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fotoUrl} alt="Foto" className="w-full h-full object-cover" />
          ) : (
            <User size={24} className="text-dorado/40" />
          )}
          {uploading && (
            <div className="absolute inset-0 bg-negro/55 flex items-center justify-center">
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
            {fotoUrl ? "Cambiar foto" : "Subir foto"}
          </button>
          {fotoUrl && (
            <button
              type="button"
              onClick={() => setFotoUrl(null)}
              className="text-[0.72rem] text-rojo hover:underline text-left"
            >
              Quitar foto
            </button>
          )}
        </div>
      </div>

      {/* Campos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[0.68rem] text-gris uppercase tracking-wider mb-1">
            Nombre *
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className={inputCls}
            placeholder="Ej. Jonny Delgado"
          />
        </div>
        <div>
          <label className="block text-[0.68rem] text-gris uppercase tracking-wider mb-1">
            Cargo *
          </label>
          <input
            type="text"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            required
            className={inputCls}
            placeholder="Ej. Wedding Planner"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[0.68rem] text-gris uppercase tracking-wider mb-1">
            Reseña
          </label>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className={inputCls}
            placeholder="Ej. Más de 10 años creando momentos únicos"
          />
        </div>

        {/* Tipo: equipo interno o aliado externo */}
        <div className="sm:col-span-2">
          <span className="block text-[0.68rem] text-gris uppercase tracking-wider mb-1">
            Tipo *
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo">
            {TIPOS.map((t) => {
              const selected = isAliado === t.aliado;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setIsAliado(t.aliado)}
                  className={[
                    "text-left rounded-lg border px-3 py-2.5 transition-colors",
                    selected ? "border-dorado bg-dorado/10" : "border-negro/10 bg-blanco hover:bg-negro/5",
                  ].join(" ")}
                >
                  <span className="block text-[0.82rem] font-medium text-negro">{t.titulo}</span>
                  <span className="block text-[0.72rem] text-gris mt-0.5">{t.ayuda}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Frase (solo para aliados) */}
        {isAliado && (
          <div className="sm:col-span-2">
            <label className="block text-[0.68rem] text-gris uppercase tracking-wider mb-1">
              Frase / Leyenda
            </label>
            <input
              type="text"
              value={frase}
              onChange={(e) => setFrase(e.target.value)}
              className={inputCls}
              placeholder="Ej. Cada instante merece ser eterno"
            />
          </div>
        )}
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
          {isPending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}

// ─── Manager ───────────────────────────────────────────────────────────────────

export function StaffManager({ members: initial }: { members: StaffRow[] }) {
  const [members, setMembers] = useState<StaffRow[]>(initial);
  const [nuevo, setNuevo] = useState<TipoKey | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreated(row: StaffRow) {
    setMembers((prev) => [...prev, row]);
    setNuevo(null);
  }

  function handleUpdated(row: StaffRow) {
    setMembers((prev) => prev.map((m) => (m.id === row.id ? row : m)));
    setEditId(null);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteStaffMember(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
      setConfirmDelete(null);
    });
  }

  function handleToggle(id: string, isActive: boolean) {
    startTransition(async () => {
      await toggleStaffActive(id, isActive);
      setMembers((prev) => prev.map((m) => m.id === id ? { ...m, is_active: isActive } : m));
    });
  }

  // Reordena dentro del mismo grupo (igual que moveStaffMember en el servidor).
  function handleMove(id: string, direction: "up" | "down") {
    startTransition(async () => {
      await moveStaffMember(id, direction);
      setMembers((prev) => {
        const me = prev.find((m) => m.id === id);
        if (!me) return prev;
        const grupo = prev
          .filter((m) => m.is_aliado_externo === me.is_aliado_externo)
          .sort((a, b) => a.sort_order - b.sort_order);
        const idx = grupo.findIndex((m) => m.id === id);
        const other = grupo[direction === "up" ? idx - 1 : idx + 1];
        if (!other) return prev;
        return prev.map((m) =>
          m.id === me.id ? { ...m, sort_order: other.sort_order }
          : m.id === other.id ? { ...m, sort_order: me.sort_order }
          : m,
        );
      });
    });
  }

  const formAbierto = nuevo !== null || editId !== null;
  const internos = members.filter((m) => !m.is_aliado_externo).length;

  function renderMiembro(m: StaffRow, idx: number, total: number) {
    if (editId === m.id) {
      return (
        <StaffForm
          key={m.id}
          initial={m}
          onDone={handleUpdated}
          onCancel={() => setEditId(null)}
        />
      );
    }
    return (
      <div
        key={m.id}
        className={`bg-blanco rounded-2xl border border-negro/[0.07] px-5 py-4 ${!m.is_active ? "opacity-50" : ""}`}
      >
        <div className="flex items-center gap-4">
          {/* Flechas de orden */}
          <div className="flex flex-col gap-0.5 shrink-0">
            <button
              onClick={() => handleMove(m.id, "up")}
              disabled={idx === 0 || isPending}
              title="Subir"
              className="p-0.5 text-negro/25 hover:text-negro disabled:opacity-20 transition-colors"
            >
              <ChevronUp size={16} />
            </button>
            <button
              onClick={() => handleMove(m.id, "down")}
              disabled={idx === total - 1 || isPending}
              title="Bajar"
              className="p-0.5 text-negro/25 hover:text-negro disabled:opacity-20 transition-colors"
            >
              <ChevronDown size={16} />
            </button>
          </div>

          {/* Foto */}
          <div className="w-11 h-11 rounded-full overflow-hidden ring-1 ring-negro/10 bg-dorado/10 flex items-center justify-center shrink-0">
            {m.foto_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.foto_url} alt={m.nombre} className="w-full h-full object-cover" />
            ) : (
              <User size={18} className="text-dorado/40" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[0.9rem] font-medium text-negro leading-tight">{m.nombre}</p>
            <p className="text-[0.78rem] mt-0.5" style={{ color: "#C9A84C" }}>{m.cargo}</p>
            {m.descripcion && (
              <p className="text-[0.75rem] text-negro/40 mt-0.5 truncate">{m.descripcion}</p>
            )}
            {m.frase && (
              <p className="text-[0.72rem] text-negro/30 mt-0.5 truncate italic">&ldquo;{m.frase}&rdquo;</p>
            )}
            {!m.foto_url && (
              <p className="text-[0.7rem] text-rojo/70 mt-0.5">Sin foto</p>
            )}
          </div>

          {/* Badges estado */}
          {!m.is_active && (
            <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-negro/5 text-gris border border-negro/10 shrink-0">
              Oculto
            </span>
          )}

          {/* Acciones */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => handleToggle(m.id, !m.is_active)}
              disabled={isPending}
              title={m.is_active ? "Ocultar del sitio" : "Mostrar en el sitio"}
              className="p-1.5 text-negro/25 hover:text-negro hover:bg-negro/5 rounded-lg transition-colors disabled:opacity-40"
            >
              {m.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              onClick={() => { setNuevo(null); setEditId(m.id); }}
              title="Editar"
              className="p-1.5 text-negro/25 hover:text-negro hover:bg-negro/5 rounded-lg transition-colors"
            >
              <Pencil size={14} />
            </button>
            {confirmDelete === m.id ? (
              <div className="flex items-center gap-1 text-[0.74rem] ml-1">
                <button
                  onClick={() => handleDelete(m.id)}
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
                onClick={() => setConfirmDelete(m.id)}
                title="Eliminar"
                className="p-1.5 text-negro/25 hover:text-rojo hover:bg-rojo/5 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h2 className="font-serif text-[1.9rem] text-negro tracking-[-0.03em]">
          <span className="text-dorado">Equipo</span>
        </h2>
        <p className="text-gris text-[0.88rem] mt-1">
          {internos} en el equipo interno · {members.length - internos}{" "}
          {members.length - internos === 1 ? "aliado externo" : "aliados externos"}.
          Para retirar a alguien sin borrarlo, usa el ojo (ocultar del sitio).
        </p>
      </div>

      {TIPOS.map((t) => {
        const grupo = members
          .filter((m) => m.is_aliado_externo === t.aliado)
          .sort((a, b) => a.sort_order - b.sort_order);
        return (
          <section key={t.key} className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="font-serif text-[1.15rem] text-negro">{t.grupo}</h3>
                <p className="text-[0.75rem] text-gris">{t.ayuda}</p>
              </div>
              {!formAbierto && (
                <button
                  onClick={() => setNuevo(t.key)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-dorado text-blanco text-[0.8rem] font-medium rounded-xl hover:bg-dorado/90 transition-colors shrink-0"
                >
                  <Plus size={15} /> {t.agregar}
                </button>
              )}
            </div>

            {nuevo === t.key && (
              <StaffForm
                defaultAliado={t.aliado}
                onDone={handleCreated}
                onCancel={() => setNuevo(null)}
              />
            )}

            {grupo.length === 0 && nuevo !== t.key ? (
              <div className="bg-blanco rounded-2xl border border-negro/[0.07] p-8 text-center">
                <p className="text-gris text-[0.85rem]">
                  Nadie registrado. Esta sección no se muestra en el sitio hasta que agregues a alguien.
                </p>
              </div>
            ) : (
              grupo.map((m, idx) => renderMiembro(m, idx, grupo.length))
            )}
          </section>
        );
      })}

      <p className="text-[0.75rem] text-negro/35 pt-1">
        Las fotos se suben a{" "}
        <code className="bg-negro/5 px-1 py-0.5 rounded">contenido.jardindelencanto.com/galeria/staff/</code>
      </p>
    </div>
  );
}
