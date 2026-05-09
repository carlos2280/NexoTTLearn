// Tokenized prose classes for the LECTURA block in immersive mode. Lives in
// its own file so it can be reused when other rich-content block types
// (callouts, code+explanation) need the same look.
//
// Density / typography: canvas-bloques.md §5.1 — body 15px line-height 1.7;
// h2 22px / h3 17px / h4 15px uppercase. Code inline ghost at 8 %.

export const proseInmersivo = [
  "text-[15px] leading-[1.7]",
  // Headings.
  "[&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-[28px] [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-text-primary",
  "[&_h2]:mt-7 [&_h2]:mb-3 [&_h2]:text-[22px] [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-text-primary",
  "[&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-[17px] [&_h3]:font-semibold [&_h3]:text-text-primary",
  "[&_h4]:mt-4 [&_h4]:mb-1.5 [&_h4]:text-[13.5px] [&_h4]:font-semibold [&_h4]:uppercase [&_h4]:tracking-[0.06em] [&_h4]:text-text-secondary",
  // Paragraphs.
  "[&_p]:my-3 [&_p]:text-text-primary",
  // Lists.
  "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul>li]:my-1",
  "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol>li]:my-1",
  // Inline code.
  "[&_:not(pre)>code]:rounded-[6px] [&_:not(pre)>code]:border [&_:not(pre)>code]:border-glass-border [&_:not(pre)>code]:bg-glass-2 [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[13.5px] [&_:not(pre)>code]:text-text-primary",
  // Strong / em / underline.
  "[&_strong]:font-semibold [&_strong]:text-text-primary",
  "[&_em]:italic",
  "[&_u]:underline [&_u]:underline-offset-2",
  // Blockquote.
  "[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-l-brand-violet/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-text-secondary",
  // Horizontal rule.
  "[&_hr]:my-8 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-glass-border",
  // Code block (CodeBlockLowlight wraps in <pre><code class="hljs ...">).
  // biome-ignore lint/nursery/noSecrets: tailwind class string, not a credential.
  "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-glass-border [&_pre]:bg-glass-1 [&_pre]:p-4",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:font-mono [&_pre_code]:text-[13.5px] [&_pre_code]:text-text-primary",
  // Lowlight token mapping to brand tokens.
  "[&_.hljs-keyword]:text-brand-violet-soft [&_.hljs-keyword]:font-semibold",
  "[&_.hljs-string]:text-brand-cyan",
  "[&_.hljs-number]:text-brand-cyan",
  "[&_.hljs-comment]:text-text-muted [&_.hljs-comment]:italic",
  "[&_.hljs-function]:text-brand-cyan-soft",
  "[&_.hljs-title]:text-brand-cyan-soft",
  "[&_.hljs-built_in]:text-brand-violet-soft",
  "[&_.hljs-literal]:text-brand-cyan",
  "[&_.hljs-attr]:text-brand-violet-soft",
  "[&_.hljs-tag]:text-brand-violet-soft",
  "[&_.hljs-variable]:text-text-primary",
  "[&_.hljs-name]:text-brand-violet-soft",
  // Task list.
  "[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0",
  "[&_ul[data-type=taskList]_li]:my-1 [&_ul[data-type=taskList]_li]:flex [&_ul[data-type=taskList]_li]:items-start [&_ul[data-type=taskList]_li]:gap-2",
  "[&_ul[data-type=taskList]_li>label]:flex-shrink-0 [&_ul[data-type=taskList]_li>label]:mt-1",
  "[&_ul[data-type=taskList]_li>label_input]:h-4 [&_ul[data-type=taskList]_li>label_input]:w-4 [&_ul[data-type=taskList]_li>label_input]:accent-brand-violet",
  "[&_ul[data-type=taskList]_li>div]:flex-1",
  "[&_ul[data-type=taskList]_li[data-checked=true]>div]:line-through [&_ul[data-type=taskList]_li[data-checked=true]>div]:text-text-muted",
  // Tables.
  "[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-lg [&_table]:border [&_table]:border-glass-border",
  "[&_th]:border [&_th]:border-glass-border [&_th]:bg-glass-2 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-[13.5px] [&_th]:font-semibold [&_th]:text-text-primary",
  "[&_td]:border [&_td]:border-glass-border [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_td]:text-text-primary",
  // Images.
  "[&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:shadow-md",
  // Links.
  "[&_a]:text-brand-cyan [&_a]:underline-offset-4 [&_a]:transition-colors hover:[&_a]:text-brand-cyan-soft hover:[&_a]:underline",
  // Sub / sup.
  "[&_sub]:align-sub [&_sub]:text-[0.75em]",
  "[&_sup]:align-super [&_sup]:text-[0.75em]",
].join(" ")
