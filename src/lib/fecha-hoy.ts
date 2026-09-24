// Fecha de "hoy" en Colombia (America/Bogota) como "YYYY-MM-DD".
// Sirve en cliente y servidor: no depende de la zona horaria del equipo ni
// de la de Vercel (UTC), que después de las 7 p. m. ya estaría en "mañana".
export function hoyBogota(): string {
  // en-CA formatea como YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
