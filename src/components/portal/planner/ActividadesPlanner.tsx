"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { createActivity, updateActivity, deleteActivity, type ActividadData } from "@/app/actions/actividades";

type Actividad = {
  id: string;
  title: string;
  activity_date: string;
  activity_time: string | null;
  location: string | null;
  notes: string | null;
};

const inputCls = "w-full border border-negro/10 bg-crema/20 px-3 py-2.5 text-[0.83rem] text-negro rounded-lg focus:outline-none focus:border-dorado/70 transition-colors placeholder:text-gris/35";

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-CO", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function formatTime(t: string | null) {
  if (!t) return null;
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "pm" : "am"}`;
}

// ─── Formulario inline ────────────────────────────────────────────────

function ActividadForm({
  bookingId,
  initial,
  onDone,
  onCancel,
}: {
  bookingId: string;
  initial?: Actividad;
  onDone: (actividad: Actividad) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.activity_date ?? "");
  const [time, setTime] = useState(initial?.activity_time ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: ActividadData = { title, activity_date: date, activity_time: time || undefined, location: location || undefined, notes: notes || undefined };
    startTransition(async () => {
      const res = initial
        ? await updateActivity(initial.id, data)
        : await createActivity(bookingId, data);
      if (res.error || !res.activity) { setError(res.error ?? "Error al guardar la actividad"); return; }
      onDone(res.activity);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-crema/40 border border-dorado/20 rounded-2xl p-5 space-y-3">
      <h4 className="font-serif text-[0.95rem] text-negro">
        {initial ? "Editar actividad" : "Nueva actividad"}
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-[0.68rem] text-gris uppercase tracking-wider mb-1">Título *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
            placeholder="Ej: Prueba de menú, Ensayo de ceremonia…" className={inputCls} />
        </div>
        <div>
          <label className="block text-[0.68rem] text-gris uppercase tracking-wider mb-1">Fecha *</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required className={inputCls} />
        </div>
        <div>
          <label className="block text-[0.68rem] text-gris uppercase tracking-wider mb-1">Hora</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[0.68rem] text-gris uppercase tracking-wider mb-1">Lugar</label>
          <input type="text" value={location} onChange={e => setLocation(e.target.value)}
            placeholder="Jardín El Encanto, lugar del proveedor…" className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[0.68rem] text-gris uppercase tracking-wider mb-1">Observaciones</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="Indicaciones importantes…" className={`${inputCls} resize-none`} />
        </div>
      </div>

      {error && <p className="text-[0.78rem] text-rojo">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} disabled={isPending}
          className="px-3 py-2 text-[0.8rem] text-gris border border-negro/15 rounded-lg hover:bg-negro/5 transition-colors disabled:opacity-50">
          Cancelar
        </button>
        <button type="submit" disabled={isPending}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-dorado text-blanco text-[0.8rem] font-medium rounded-lg hover:bg-dorado/90 transition-colors disabled:opacity-50">
          {isPending && <Loader2 size={12} className="animate-spin" />}
          {isPending ? "Guardando…" : initial ? "Guardar cambios" : "Agregar actividad"}
        </button>
      </div>
    </form>
  );
}

// ─── Botón eliminar ───────────────────────────────────────────────────

function DeleteBtn({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (confirm) {
    return (
      <div className="inline-flex items-center gap-1.5">
        <span className="text-[0.74rem] text-rojo">¿Eliminar?</span>
        <button
          onClick={() => startTransition(async () => {
            const res = await deleteActivity(id);
            if (!res.error) onDeleted();
          })}
          disabled={isPending}
          className="text-[0.74rem] text-rojo font-medium hover:underline disabled:opacity-50"
        >
          {isPending ? <Loader2 size={12} className="animate-spin" /> : "Sí"}
        </button>
        <button onClick={() => setConfirm(false)}
          className="text-[0.74rem] text-gris hover:underline">No</button>
      </div>
    );
  }
  return (
    <button onClick={() => setConfirm(true)}
      className="p-1.5 text-negro/25 hover:text-rojo hover:bg-rojo/5 rounded-lg transition-colors">
      <Trash2 size={14} />
    </button>
  );
}

// ─── Componente principal ─────────────────────────────────────────────

export function ActividadesPlanner({
  bookingId,
  initialActividades,
}: {
  bookingId: string;
  initialActividades: Actividad[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [actividades, setActividades] = useState(initialActividades);
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      {/* Botón agregar */}
      {!showForm && editId === null && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-dorado text-blanco text-[0.82rem] font-medium rounded-xl hover:bg-dorado/90 transition-colors"
        >
          <Plus size={15} />
          Agregar actividad
        </button>
      )}

      {/* Formulario nueva actividad */}
      {showForm && (
        <ActividadForm
          bookingId={bookingId}
          onDone={(nueva) => {
            setActividades((prev) => [nueva, ...prev]);
            setShowForm(false);
            router.refresh(); // sincroniza en background; la UI ya quedó actualizada arriba
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Lista */}
      {actividades.length === 0 && !showForm ? (
        <div className="bg-blanco rounded-2xl border border-negro/[0.07] p-8 text-center">
          <p className="text-gris text-[0.85rem]">
            Sin actividades programadas aún. Agrega la primera.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {actividades.map((act) => {
            const isPast = act.activity_date < today;
            return (
              <div key={act.id}>
                {editId === act.id ? (
                  <ActividadForm
                    bookingId={bookingId}
                    initial={act}
                    onDone={(actualizada) => {
                      setActividades((prev) => prev.map((a) => a.id === actualizada.id ? actualizada : a));
                      setEditId(null);
                      router.refresh();
                    }}
                    onCancel={() => setEditId(null)}
                  />
                ) : (
                  <div
                    className={[
                      "bg-blanco rounded-2xl border border-negro/[0.07] px-5 py-4 flex items-start justify-between gap-4",
                      isPast ? "opacity-50" : "",
                    ].join(" ")}
                  >
                    <div className="min-w-0">
                      <p className={["text-[0.88rem] font-medium text-negro", isPast ? "line-through decoration-negro/30" : ""].join(" ")}>
                        {act.title}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[0.76rem] text-gris">
                        <span>{formatDate(act.activity_date)}</span>
                        {act.activity_time && <span>{formatTime(act.activity_time)}</span>}
                        {act.location && <span>· {act.location}</span>}
                      </div>
                      {act.notes && (
                        <p className="text-[0.76rem] text-gris/70 mt-1">{act.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => setEditId(act.id)}
                        className="p-1.5 text-negro/25 hover:text-negro hover:bg-negro/5 rounded-lg transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <DeleteBtn
                        id={act.id}
                        onDeleted={() => {
                          setActividades((prev) => prev.filter((a) => a.id !== act.id));
                          router.refresh();
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
