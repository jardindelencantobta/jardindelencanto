import type { Metadata } from "next";
import { NavBar } from "@/components/home/NavBar";
import { Footer } from "@/components/home/Footer";
import { WhatsAppButton } from "@/components/home/WhatsAppButton";
import { BRAND, WHATSAPP, waLink } from "@/config/brand";

export const metadata: Metadata = {
  title: "Política de Tratamiento de Datos Personales | Jardín El Encanto",
  description:
    "Política de Tratamiento de Datos Personales de Hacienda El Encanto Bogotá S.A.S conforme a la Ley 1581 de 2012: datos recopilados, finalidad, derechos del titular y mecanismos de contacto.",
  alternates: { canonical: "/politica-de-privacidad" },
};

const EMAIL = BRAND.email;
const WHATSAPP_LABEL = WHATSAPP.display;
const WHATSAPP_HREF = waLink();
const ADDRESS = `${BRAND.address}, Cundinamarca`;

const linkCls =
  "text-rojo underline underline-offset-2 decoration-rojo/30 hover:decoration-rojo transition-colors";

const responsable: { label: string; value: React.ReactNode }[] = [
  { label: "Razón social", value: "Hacienda El Encanto Bogotá S.A.S" },
  { label: "NIT", value: "901860912-1" },
  { label: "Dirección", value: ADDRESS },
  { label: "Correo electrónico", value: <a href={`mailto:${EMAIL}`} className={linkCls}>{EMAIL}</a> },
  {
    label: "WhatsApp",
    value: (
      <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className={linkCls}>
        {WHATSAPP_LABEL}
      </a>
    ),
  },
  {
    label: "Sitio web",
    value: <a href={BRAND.url} className={linkCls}>{BRAND.website}</a>,
  },
];

const principios: { nombre: string; texto: string }[] = [
  { nombre: "Legalidad", texto: "El tratamiento se realiza conforme a la Ley 1581 de 2012." },
  { nombre: "Finalidad", texto: "Los datos se recopilan con propósitos legítimos e informados al titular." },
  { nombre: "Libertad", texto: "El tratamiento solo se realiza con autorización previa del titular." },
  { nombre: "Veracidad", texto: "La información debe ser exacta y actualizada." },
  { nombre: "Seguridad", texto: "Se adoptan medidas técnicas y administrativas para proteger los datos." },
  { nombre: "Confidencialidad", texto: "Los datos no serán divulgados a terceros no autorizados." },
];

const datosRecopilados = [
  "Nombre completo",
  "Número de WhatsApp",
  "Correo electrónico",
  "Tipo de evento de interés",
  "Fecha estimada del evento",
  "Número de invitados",
  "Imágenes y videos captados durante la realización de eventos en nuestras instalaciones",
];

const finalidades = [
  "Crear y mantener una base de datos de contactos y futuros clientes",
  "Gestionar la atención, cotización y seguimiento de solicitudes de eventos",
  "Enviar información relacionada con nuestros servicios y promociones",
  "Documentar fotográfica y audiovisualmente los eventos realizados en nuestras instalaciones para uso en material publicitario y redes sociales, salvo instrucción expresa en contrario del titular",
];

const derechos = [
  "Conocer, actualizar y rectificar sus datos personales",
  "Solicitar prueba de la autorización otorgada para el tratamiento",
  "Ser informado sobre el uso que se ha dado a sus datos",
  "Presentar quejas ante la Superintendencia de Industria y Comercio (SIC)",
  "Revocar la autorización y/o solicitar la supresión de sus datos cuando no se respeten los principios, derechos y garantías constitucionales y legales",
];

function Section({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="py-8 border-t border-negro/10 first:border-t-0 first:pt-0">
      <h2 className="text-[11px] tracking-[3px] uppercase text-dorado font-medium mb-4">
        {titulo}
      </h2>
      <div className="space-y-4 text-[0.95rem] leading-[1.8] text-gris">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden="true" className="mt-[0.7em] h-1 w-1 shrink-0 rounded-full bg-dorado" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PoliticaPrivacidadPage() {
  return (
    <>
      <NavBar />
      <main className="pt-[72px] bg-crema font-sans">
        {/* Encabezado */}
        <header className="px-6 pt-16 pb-12 text-center">
          <p className="text-[11px] tracking-[4px] uppercase text-dorado font-medium mb-4">
            Hacienda El Encanto Bogotá S.A.S · Ley 1581 de 2012
          </p>
          <h1 className="font-serif text-[2.2rem] md:text-[3rem] font-light tracking-[-0.02em] leading-[1.15] text-negro max-w-[760px] mx-auto">
            Política de Tratamiento de <em className="text-rojo not-italic">Datos Personales</em>
          </h1>
          <div className="w-[50px] h-px bg-dorado mx-auto mt-6" />
        </header>

        {/* Contenido */}
        <div className="px-4 sm:px-6 pb-20">
          <article className="max-w-[820px] mx-auto bg-blanco rounded-2xl border border-negro/[0.06] px-6 py-10 sm:px-12 sm:py-12">
            <Section titulo="Identificación del responsable">
              <dl className="grid grid-cols-1 sm:grid-cols-[170px_1fr] gap-x-6 gap-y-2">
                {responsable.map((r) => (
                  <div key={r.label} className="contents">
                    <dt className="text-negro font-medium">{r.label}</dt>
                    <dd>{r.value}</dd>
                  </div>
                ))}
              </dl>
            </Section>

            <Section titulo="Marco legal">
              <p>
                La presente política se rige por la Ley 1581 de 2012, el Decreto 1377 de 2013, el
                Decreto Único Reglamentario 1074 de 2015 y la Circular Única de la Superintendencia
                de Industria y Comercio (SIC) de 2022.
              </p>
            </Section>

            <Section titulo="Principios rectores">
              <ul className="space-y-2">
                {principios.map((p) => (
                  <li key={p.nombre} className="flex gap-3">
                    <span aria-hidden="true" className="mt-[0.7em] h-1 w-1 shrink-0 rounded-full bg-dorado" />
                    <span>
                      <strong className="font-medium text-negro">{p.nombre}:</strong> {p.texto}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section titulo="Datos personales recopilados">
              <p>Jardín El Encanto recopila los siguientes datos:</p>
              <BulletList items={datosRecopilados} />
            </Section>

            <Section titulo="Finalidad del tratamiento">
              <p>Los datos recopilados se utilizan exclusivamente para:</p>
              <BulletList items={finalidades} />
            </Section>

            <Section titulo="Confidencialidad y no transferencia">
              <p>
                Hacienda El Encanto Bogotá S.A.S no comparte, vende, cede ni transfiere sus datos
                personales a ninguna empresa o tercero bajo ninguna circunstancia.
              </p>
            </Section>

            <Section titulo="Derechos del titular">
              <p>
                De conformidad con la Ley 1581 de 2012, usted como titular tiene derecho a:
              </p>
              <BulletList items={derechos} />
            </Section>

            <Section titulo="Mecanismo para ejercer sus derechos">
              <p>
                Para ejercer cualquiera de sus derechos como titular, puede comunicarse con
                nosotros a través de:
              </p>
              <ul className="space-y-2">
                <li className="flex gap-3">
                  <span aria-hidden="true" className="mt-[0.7em] h-1 w-1 shrink-0 rounded-full bg-dorado" />
                  <span>
                    <strong className="font-medium text-negro">Correo electrónico:</strong>{" "}
                    <a href={`mailto:${EMAIL}`} className={linkCls}>{EMAIL}</a>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span aria-hidden="true" className="mt-[0.7em] h-1 w-1 shrink-0 rounded-full bg-dorado" />
                  <span>
                    <strong className="font-medium text-negro">WhatsApp:</strong>{" "}
                    <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className={linkCls}>
                      {WHATSAPP_LABEL}
                    </a>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span aria-hidden="true" className="mt-[0.7em] h-1 w-1 shrink-0 rounded-full bg-dorado" />
                  <span>
                    <strong className="font-medium text-negro">Dirección:</strong> {ADDRESS}
                  </span>
                </li>
              </ul>
              <p>Atenderemos su solicitud en un plazo máximo de diez (10) días hábiles.</p>
            </Section>

            <Section titulo="Vigencia y conservación">
              <p>
                Los datos personales serán conservados por el tiempo que determinen las normas del
                Archivo General de la Nación de Colombia y la legislación vigente aplicable. Una
                vez cumplida la finalidad del tratamiento y los plazos legales, los datos serán
                eliminados de forma segura.
              </p>
            </Section>

            <Section titulo="Modificaciones">
              <p>
                Jardín El Encanto se reserva el derecho de modificar esta política en cualquier
                momento. Los cambios serán publicados en {BRAND.website}
              </p>
            </Section>

            <p className="pt-8 border-t border-negro/10 text-[0.8rem] text-gris-claro italic">
              Última actualización: septiembre de 2026
            </p>
          </article>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
