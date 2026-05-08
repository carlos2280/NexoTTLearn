// Clases prose tokenizadas para el bloque LECTURA del modo inmersivo. Se separa
// del componente para reusarse cuando otros tipos (TIP callout, EJEMPLO_CODIGO
// con explicacion) tambien rendericen HTML rich-text del autor.
//
// Densidad / tipografia: canvas-bloques.md §5.1 — body 15px line-height 1.7;
// h2 22px / h3 17px / h4 15px uppercase. Code inline ghost al 8 %.

export const proseInmersivo = [
  "text-[15px] leading-[1.7]",
  // Headings: jerarquia clara, sin uppercase decorativo (se reserva para chips).
  "[&>h2]:mt-7 [&>h2]:mb-3 [&>h2]:text-[22px] [&>h2]:font-bold [&>h2]:tracking-tight [&>h2]:text-text-primary",
  "[&>h3]:mt-5 [&>h3]:mb-2 [&>h3]:text-[17px] [&>h3]:font-semibold [&>h3]:text-text-primary",
  "[&>h4]:mt-4 [&>h4]:mb-1.5 [&>h4]:text-[13.5px] [&>h4]:font-semibold [&>h4]:uppercase [&>h4]:tracking-[0.06em] [&>h4]:text-text-secondary",
  // Parrafos.
  "[&>p]:my-3 [&>p]:text-text-primary",
  // Listas con gap pequeno entre items y sangria comoda.
  "[&>ul]:my-3 [&>ul]:list-disc [&>ul]:pl-6 [&>ul>li]:my-1",
  "[&>ol]:my-3 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol>li]:my-1",
  // Code inline: ghost background, monospace 13.5px.
  "[&_code]:rounded-[6px] [&_code]:border [&_code]:border-glass-border [&_code]:bg-glass-2 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13.5px] [&_code]:text-text-primary",
  // Strong / em.
  "[&_strong]:font-semibold [&_strong]:text-text-primary",
  "[&_em]:italic",
  // Blockquote sutil.
  "[&>blockquote]:my-4 [&>blockquote]:border-l-2 [&>blockquote]:border-brand-violet [&>blockquote]:pl-4 [&>blockquote]:text-text-secondary [&>blockquote]:italic",
  // Imagenes: max-width + radius + sombra ligera.
  "[&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:shadow-md",
  // Links: brand violet con underline al hover.
  "[&_a]:text-brand-violet-soft [&_a]:underline-offset-4 hover:[&_a]:underline",
].join(" ")
