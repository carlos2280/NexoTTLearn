// Catalogo completo de modulos pedagogicos del curso "Frontend para devs
// backend". Cada modulo define sus secciones; cada seccion define sus
// bloques reales (PARRAFO, TIP, CODIGO_ILUSTRATIVO, QUIZ, CODIGO_PREGUNTAS,
// CODIGO_TESTS, RECURSO). Si una seccion no define `bloques`, se genera un
// placeholder en tiempo de seed (PARRAFO + QUIZ).
//
// Para anadir o cambiar contenido pedagogico de un modulo, edita aqui.
// Si un modulo crece demasiado, considera moverlo a `m{N}-{slug}.ts` y
// reexportar el array desde este archivo.

import { type Prisma, TipoBloque } from "@prisma/client"

import {
  buildCodigoIlustrativo,
  buildCodigoPreguntas,
  buildCodigoTests,
  buildParrafo,
  buildQuiz,
  buildRecurso,
  buildTip,
} from "../_utils"
import {
  ID_M0_S2_PREG,
  ID_M0_S2_TEST,
  ID_M1_S2_PREG,
  ID_M1_S2_TEST,
  ID_M4_S2_PREG,
  ID_M4_S2_TEST,
  ID_M5_S2_PREG,
  ID_M5_S2_TEST,
  ID_M6_S2_PREG,
  ID_M6_S2_TEST,
  ID_M7_S2_PREG,
  ID_M7_S2_TEST,
  ID_M8_S2_PREG,
  ID_M8_S2_TEST,
  ID_M9_S2_PREG,
  ID_M9_S2_TEST,
} from "../catalogo"

// ============================================================================
// Tipos publicos de los modulos
// ============================================================================

export interface BloqueRealDef {
  readonly tipo: TipoBloque
  readonly esEvaluable: boolean
  readonly skill?: string
  readonly idForzado?: string
  readonly contenido: Prisma.InputJsonValue
}
export interface SeccionDef {
  readonly titulo: string
  readonly skill: string
  readonly temas: string
  /** Si se define, se usan estos bloques. Si no, fallback a placeholder. */
  readonly bloques?: readonly BloqueRealDef[]
}
export interface ModuloDef {
  readonly idx: number
  readonly titulo: string
  readonly descripcion: string
  readonly secciones: readonly SeccionDef[]
}

// ============================================================================
// MODULOS_FRONTEND — array canonico
// ============================================================================

export const MODULOS_FRONTEND: readonly ModuloDef[] = [
  {
    idx: 1,
    titulo: "Modulo 0 — Git + oficio en equipo",
    descripcion:
      "Lo que separa un dev solo de un dev en equipo: ramas, conventional commits y reviews que aceleran en vez de frenar.",
    secciones: [
      {
        titulo: "Git no termina en `git push`",
        skill: "Git y oficio en equipo",
        temas:
          "rebase vs merge, cuando uno y cuando otro, workflow de feature branches, resolver conflictos sin perder cordura, stash y bisect basicos.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<h2>De dev solo a dev en equipo</h2><p>Cuando programas solo, Git es un boton de "guardar". Commiteas cuando quieres, pusheas cuando quieres, y la historia que dejas atras es problema tuyo si tienes que volver.</p><p>En equipo cambia todo. La historia que dejas es lo que el siguiente va a leer para entender el codigo que escribiste. Tus commits y tus PRs no son archivo personal: son <strong>documentacion viva</strong> que se consulta en cada code review, en cada bug del año que viene, en cada onboarding de alguien nuevo.</p><p>Este modulo no te enseña Git desde cero. Tu ya sabes <code>clone</code>, <code>commit</code>, <code>push</code>. Lo que vamos a atacar son los habitos que separan al dev que <em>guarda</em> del dev que <em>cuida la historia para los demas</em>.</p>`,
              "m0-s1-intro",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              "<p><strong>Regla del senior</strong>: si tienes que explicar tu PR por chat para que alguien lo apruebe, el commit message esta mal. Un buen commit explica el <em>por que</em>; el codigo explica el <em>que</em>. Si quien revisa necesita preguntarte por que hiciste algo, perdiste la oportunidad de dejarlo escrito.</p>",
              "m0-s1-tip",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "bash",
              `# Workflow A — siempre merge (lo que muchos hacen)
git checkout feature/login
git merge main         # genera "Merge branch 'main' into feature/login"
git push

# Historia resultante:
# *   Merge branch 'main' into feature/login
# |\\
# | * Otro feature mergeado a main
# * | Mi commit de feature
# |/
# *   Commit base

# Workflow B — rebase para integrar, merge solo al final del PR
git checkout feature/login
git fetch
git rebase origin/main         # reescribe tus commits encima de main
git push --force-with-lease    # seguro: aborta si alguien mas pusheo

# Historia resultante:
# * Mi commit de feature (reescrito sobre main actualizado)
# * Otro feature mergeado a main
# * Commit base`,
              "Las dos formas funcionan. La diferencia se ve cuando hay 50 features simultaneos: rebase mantiene la historia legible, merge la convierte en spaghetti.",
              "m0-s1-codigo",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "Git y oficio en equipo",
            contenido: buildQuiz(
              [
                {
                  id: "q1",
                  enunciado:
                    "<p>¿Que problema NO resuelve <code>git rebase main</code> sobre tu rama feature?</p>",
                  explicacion:
                    "rebase reescribe tus commits encima de main, pero los conflictos que existian siguen existiendo. La diferencia es que los enfrentas ahora, no al final del PR.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Integrar cambios recientes de main en tu trabajo",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto: "Dejar una historia linear sin merge commits",
                      esCorrecta: false,
                    },
                    {
                      id: "c",
                      texto: "Evitar tener que resolver conflictos de Git",
                      esCorrecta: true,
                    },
                    {
                      id: "d",
                      texto: "Reescribir tus commits sobre el HEAD actual de main",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q2",
                  enunciado:
                    "<p>¿Cuando es seguro usar <code>git push --force-with-lease</code>?</p>",
                  explicacion:
                    "force-with-lease aborta el push si alguien mas pusheo a la rama desde tu ultimo fetch. Es la version segura de --force: nunca pisa trabajo ajeno por accidente.",
                  opciones: [
                    { id: "a", texto: "Nunca, es destructivo y se debe evitar", esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        "Solo en tu rama personal tras rebase, cuando nadie mas trabaja en ella",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "En cualquier rama si tienes permisos de admin",
                      esCorrecta: false,
                    },
                    { id: "d", texto: "Solo despues de un merge resuelto", esCorrecta: false },
                  ],
                },
                {
                  id: "q3",
                  enunciado:
                    "<p>Estas en <code>feature/login</code> con 5 commits. <code>main</code> avanzo. Para integrar lo nuevo minimizando ruido, ¿que haces?</p>",
                  explicacion:
                    "fetch trae los cambios sin tocar tu rama; rebase los aplica como base. Resultado: tus 5 commits quedan encima de la version actual de main, sin merge commit.",
                  opciones: [
                    {
                      id: "a",
                      texto: "git pull origin main y resuelves conflictos",
                      esCorrecta: false,
                    },
                    { id: "b", texto: "git merge main y commiteas el merge", esCorrecta: false },
                    { id: "c", texto: "git fetch && git rebase origin/main", esCorrecta: true },
                    { id: "d", texto: "git push --force para reemplazar todo", esCorrecta: false },
                  ],
                },
                {
                  id: "q4",
                  tipo: "OPCION_MULTIPLE",
                  enunciado:
                    "<p>¿Cuales de los siguientes son <strong>habitos sanos</strong> al trabajar con Git en equipo? (marca todas las que apliquen)</p>",
                  explicacion:
                    "Rebase contra main antes del PR mantiene la historia limpia; commits pequenios facilitan el review; borrar la rama remota tras el merge evita ruido en el repo. Hacer --force sobre main es destructivo: sobrescribe trabajo de otros.",
                  puntuacionParcial: true,
                  opciones: [
                    {
                      id: "a",
                      texto: "Rebase de tu feature contra main antes de abrir PR",
                      esCorrecta: true,
                    },
                    {
                      id: "b",
                      texto: "git push --force directo a main para corregir un commit malo",
                      esCorrecta: false,
                    },
                    {
                      id: "c",
                      texto: "Commits pequeños con mensaje claro que comunica el por que",
                      esCorrecta: true,
                    },
                    {
                      id: "d",
                      texto: "Borrar la rama remota despues del merge a main",
                      esCorrecta: true,
                    },
                  ],
                },
                {
                  id: "q5",
                  tipo: "VERDADERO_FALSO",
                  enunciado:
                    "<p><code>git stash</code> funciona como una pila: <code>git stash pop</code> aplica primero el ultimo cambio guardado (<code>stash@{0}</code>).</p>",
                  explicacion:
                    "Cierto. stash es LIFO: el ultimo en entrar es el primero en salir. Si guardaste 3 stash y haces pop, te aplica stash@{0}, que es el mas reciente.",
                  correcta: true,
                },
                {
                  id: "q6",
                  tipo: "RESPUESTA_CORTA",
                  enunciado:
                    "<p>¿Que comando de Git te permite encontrar, por <strong>busqueda binaria</strong>, el commit exacto que introdujo un bug? (escribe solo el comando base, sin flags)</p>",
                  explicacion:
                    "git bisect te marca un commit bueno y uno malo, y va saltando por la mitad de la historia preguntando si el bug esta. En log(n) commits localizas al culpable.",
                  respuestasAceptadas: ["git bisect", "bisect", "git bisect start"],
                  normalizacion: {
                    trim: true,
                    ignorarMayusculas: true,
                    ignorarAcentos: true,
                    ignorarEspaciosDobles: true,
                  },
                },
              ],
              "m0-s1-quiz",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://git-scm.com/book/es/v2",
              "Pro Git (es-ES) — capitulos 3 y 7",
              "El libro de referencia de Git, en español. Capitulo 3: branching y workflows. Capitulo 7: herramientas avanzadas (rebase interactivo, bisect, stash).",
              "m0-s1-recurso",
            ),
          },
        ],
      },
      {
        titulo: "Conventional commits + code review productivo",
        skill: "Git y oficio en equipo",
        temas:
          "formato `tipo(scope): descripcion`, por que importa, ejemplos buenos vs malos, plantillas de PR, dar feedback que no humilla.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<h2>El commit es un mensaje al equipo</h2><p>Conventional Commits no es burocracia. Es un acuerdo del equipo sobre como escribir mensajes que sirven para tres cosas concretas:</p><ol><li><strong>Generar changelog automaticamente</strong> — herramientas como release-please leen los commits para decidir que va en la siguiente version.</li><li><strong>Filtrar la historia</strong> — <code>git log --grep="^fix"</code> te da todos los bugs arreglados en el ultimo mes.</li><li><strong>Comunicar la intencion</strong> — el revisor sabe en 2 segundos si es un feature, un fix o un refactor sin abrir el diff.</li></ol><p>El formato es: <code>tipo(scope): descripcion en imperativo</code>. Tipos validos: <code>feat</code>, <code>fix</code>, <code>refactor</code>, <code>chore</code>, <code>docs</code>, <code>test</code>, <code>ci</code>, <code>perf</code>.</p>`,
              "m0-s2-intro",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>Regla del senior</strong>: en code review, lee el diff antes de leer la descripcion. Si el codigo habla solo, la descripcion confirma. Si el codigo te confunde, la descripcion deberia desconfundirte; si no lo hace, el problema no es tu lectura — es el codigo o la descripcion. Pide que se arregle, no aceptes "ya esta hecho".</p>`,
              "m0-s2-tip",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "text",
              `# El mismo cambio, distintos commits

MAL — vago, no comunica intencion
  fix
  cambios
  wip
  arregla bug
  pequeños cambios

MAL — describe el "que", no el "por que"
  Cambia useState por useReducer en LoginForm

BIEN — Conventional + comunica el por que
  feat(auth): agrega bloqueo temporal tras 5 intentos fallidos
  fix(login): corrige race condition al cambiar email durante submit
  refactor(login): migra LoginForm a useReducer por complejidad de estado
  docs(readme): actualiza pasos de setup tras cambio a pnpm
  test(login): añade caso para bloqueo temporal post 5 intentos`,
              "El mismo cambio puede tener 3 mensajes distintos. El bueno comunica por que se hizo, no que se hizo.",
              "m0-s2-codigo",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "Git y oficio en equipo",
            contenido: buildQuiz(
              [
                {
                  id: "q1",
                  enunciado:
                    "<p>¿Cual es el tipo correcto para <em>'agrega soporte de login con Google'</em>?</p>",
                  explicacion: "feat indica una funcionalidad nueva visible al usuario.",
                  opciones: [
                    { id: "a", texto: "chore", esCorrecta: false },
                    { id: "b", texto: "feat", esCorrecta: true },
                    { id: "c", texto: "fix", esCorrecta: false },
                    { id: "d", texto: "refactor", esCorrecta: false },
                  ],
                },
                {
                  id: "q2",
                  enunciado:
                    "<p>¿Cual es el tipo correcto para <em>'renombra UserService a CustomerService sin cambiar comportamiento'</em>?</p>",
                  explicacion:
                    "refactor: cambia el codigo pero no su comportamiento visible. Si cambias comportamiento aunque sea poco, ya es feat o fix.",
                  opciones: [
                    { id: "a", texto: "feat", esCorrecta: false },
                    { id: "b", texto: "refactor", esCorrecta: true },
                    { id: "c", texto: "chore", esCorrecta: false },
                    { id: "d", texto: "fix", esCorrecta: false },
                  ],
                },
                {
                  id: "q3",
                  enunciado:
                    "<p>El commit dice <code>fix(auth): resuelve issue #123</code>. ¿Que le falta?</p>",
                  explicacion:
                    "El numero de issue es referencia, no descripcion. Quien lee el commit dentro de 6 meses no quiere abrir GitHub para entenderlo.",
                  opciones: [
                    { id: "a", texto: "Nada, esta bien", esCorrecta: false },
                    { id: "b", texto: "El tipo", esCorrecta: false },
                    {
                      id: "c",
                      texto: "Comunicar QUE resuelve, no solo el numero de issue",
                      esCorrecta: true,
                    },
                    { id: "d", texto: "Indicar el archivo cambiado", esCorrecta: false },
                  ],
                },
                {
                  id: "q4",
                  enunciado: "<p>¿Cuando esta bien usar tipo <code>chore</code>?</p>",
                  explicacion:
                    "chore es para mantenimiento que no afecta codigo de producto: actualizar deps, cambiar configs de build, mover archivos sin tocar logica.",
                  opciones: [
                    { id: "a", texto: "Para bugs que no son criticos", esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        "Para cambios que no afectan codigo de produccion (deps, configs, build)",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Para features pequeños que no merecen feat",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "Nunca, no es un tipo valido de Conventional Commits",
                      esCorrecta: false,
                    },
                  ],
                },
              ],
              "m0-s2-quiz",
            ),
          },
          {
            idForzado: ID_M0_S2_PREG,
            tipo: TipoBloque.CODIGO_PREGUNTAS,
            esEvaluable: true,
            skill: "Git y oficio en equipo",
            contenido: buildCodigoPreguntas(
              "javascript",
              `Escribe el mensaje de commit convencional para el siguiente cambio:

  Agregaste el campo 'telefono' al modelo Usuario en Prisma
  (afecta apps/api/prisma/schema.prisma y la migracion correspondiente).

Imprime SOLO la linea del commit (sin nada mas, sin punto final).
Formato esperado: tipo(scope): descripcion en imperativo, sin mayuscula inicial.`,
              `function main() {
  // Imprime el commit convencional en una sola linea.
  // Pista: tipo correcto, scope corto, descripcion clara en imperativo.
  console.log("...");
}
main();`,
              "m0-s2-cp",
            ),
          },
          {
            idForzado: ID_M0_S2_TEST,
            tipo: TipoBloque.CODIGO_TESTS,
            esEvaluable: false,
            contenido: buildCodigoTests(
              ID_M0_S2_PREG,
              `function main() {
  console.log("feat(usuarios): agrega campo telefono al modelo Usuario");
}
main();`,
              [
                {
                  id: "t1",
                  descripcion: "Formato Conventional Commits valido",
                  entrada: "",
                  salidaEsperada: "feat(usuarios): agrega campo telefono al modelo Usuario\n",
                  visible: true,
                },
                {
                  id: "t2",
                  descripcion: "Una sola linea no vacia",
                  entrada: "",
                  salidaEsperada: "feat(usuarios): agrega campo telefono al modelo Usuario\n",
                  visible: true,
                },
                {
                  id: "t3",
                  descripcion: "Tipo correcto (feat) y descripcion en imperativo",
                  entrada: "",
                  salidaEsperada: "feat(usuarios): agrega campo telefono al modelo Usuario\n",
                  visible: false,
                },
              ],
              "m0-s2-ct",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p class="font-serif italic text-aurora-violet" style="font-size: 1.5rem; line-height: 1.4;">"El commit lo lees tu dentro de 6 meses. Escribelo para el."</p><p>Antes de pasar al siguiente modulo, abre el ultimo PR que enviaste y leelo como si no fuera tuyo. ¿Los mensajes te dicen <em>por que</em>? ¿Lees el diff y sigues la intencion? Si no, hay trabajo. Y eso es buena señal — significa que estas afinando el oficio.</p>`,
              "m0-s2-cierre",
            ),
          },
        ],
      },
    ],
  },
  {
    idx: 2,
    titulo: "Modulo 1 — Uso eficiente de IA para devs",
    descripcion:
      "Cuando pedirle a la IA, como validar lo que devuelve, y por que codigo que no puedes explicar no es tuyo.",
    secciones: [
      {
        titulo: "Cuando SI, cuando NO + pedir bien",
        skill: "Uso eficiente de IA para devs",
        temas:
          "mapa de tareas (la IA gana / empata / pierde), patron rol-tarea-criterios-formato, por que el prompt vago produce codigo vago, ejemplos comparados.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<h2>La IA no es magia, es una herramienta con bordes</h2><p>Para un dev backend que entra a frontend, la IA es tentadora: te resuelve en 5 segundos lo que tu no sabes como abordar. El problema es que <strong>no todas las tareas le salen igual de bien</strong>, y aceptar lo que devuelve sin saber donde estan sus bordes es la receta para escribir codigo que no entiendes.</p><p>Hay tres zonas claras:</p><ul><li><strong>La IA gana</strong>: boilerplate (un formulario tipico, una funcion de validacion, un test de un patron conocido), traducir entre lenguajes que ya dominas (Python a JS si entiendes ambos), explicar un error que ya viste antes pero no recuerdas, generar regex, dar nombres mejores.</li><li><strong>La IA empata</strong>: refactor mecanico de un bloque pequeño con criterios claros, escribir documentacion de codigo que ya esta hecho, generar tipos a partir de un JSON.</li><li><strong>La IA pierde</strong>: decisiones de arquitectura, edge cases del dominio de tu proyecto, codigo que toca multiples archivos del repo, deuda futura, decisiones de "que NO hacer".</li></ul><p>La regla practica es: si tu, sin la IA, sabrias <em>como abordar</em> el problema aunque te tomaria mas tiempo, la IA acelera. Si <em>no sabrias por donde empezar</em>, la IA te va a llevar ella a ti — y vas a aceptar lo primero que parezca razonable.</p>`,
              "m1-s1-intro",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              "<p><strong>Regla del senior</strong>: pides bien a la IA lo que ya sabrias hacer mal sin ella. Solo puedes guiar a la IA en algo que entiendes lo suficiente para detectar cuando se desvia. Si no, no estas pidiendo ayuda — estas delegando el criterio. Y el criterio es lo unico que no puedes delegar.</p>",
              "m1-s1-tip",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "text",
              `# PROMPT VAGO — lo que muchos hacen
"hazme una funcion en ts que valide email"

# Resultado tipico: regex generica copy-pasteada, sin contexto de tu proyecto,
# acepta cosas raras o rechaza emails validos. La aceptas porque "compila".


# PROMPT BIEN DADO — patron rol / tarea / criterios / formato
"Actuas como dev TypeScript senior trabajando en NexoTT Learn,
una plataforma B2B interna de NTT Data.

Tarea: funcion validateEmail(input: string): boolean para el formulario
de registro de colaboradores corporativos.

Criterios:
- TS estricto, sin any.
- Rechaza emails sin dominio o con espacios.
- Acepta + y . en el local part (ej: john+tag@empresa.com).
- Sin regex de mas de 80 caracteres (mantenibilidad).
- Devuelve solo true / false, nunca throw.
- No usar librerias externas.

Formato: solo la funcion + un comentario corto con 2 ejemplos de uso
(uno valido, uno invalido)."

# La diferencia no es el tono, es el contexto.
# La IA no adivina tu proyecto: si no lo das, te da una respuesta generica.`,
              "El mismo objetivo, dos prompts. El vago produce codigo generico que toca arreglar. El bueno produce codigo que ya esta cerca de lo que necesitas porque diste rol, tarea, criterios y formato.",
              "m1-s1-codigo",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "Uso eficiente de IA para devs",
            contenido: buildQuiz(
              [
                {
                  id: "q1",
                  enunciado:
                    "<p>¿En cual de estas tareas es mas probable que la IA <strong>pierda</strong> contra un dev senior?</p>",
                  explicacion:
                    "Decidir que NO hacer es la zona donde la IA es mas debil: no conoce tu deuda tecnica, tus prioridades de equipo ni el contexto del cliente. Las otras tres son zonas donde la IA gana o empata.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Generar el esqueleto de un formulario tipico de login",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto: "Traducir una funcion conocida de Python a TypeScript",
                      esCorrecta: false,
                    },
                    {
                      id: "c",
                      texto: "Decidir si vale la pena refactorizar un modulo o dejarlo como esta",
                      esCorrecta: true,
                    },
                    {
                      id: "d",
                      texto: "Explicar un mensaje de error de TypeScript que ya viste antes",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q2",
                  enunciado:
                    "<p>Le pides a la IA: <em>'hazme una funcion para parsear fechas'</em>. ¿Cual es la causa mas probable de que el resultado te decepcione?</p>",
                  explicacion:
                    "Un prompt sin rol, sin formato esperado, sin restricciones del proyecto y sin ejemplos da una respuesta generica. La IA hace lo razonable en promedio — pero tu necesitas lo correcto en tu proyecto. La diferencia la marcas tu en el prompt.",
                  opciones: [
                    {
                      id: "a",
                      texto: "La IA tiene un mal dia y no entiende fechas",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Falto contexto: formato esperado, zona horaria, casos de error, libreria permitida",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Habria que usar un modelo mas grande", esCorrecta: false },
                    {
                      id: "d",
                      texto: "El problema esta en pedirle en español en vez de ingles",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q3",
                  enunciado:
                    "<p>¿Cual de estos es el mejor uso de IA para un dev backend que <strong>esta aprendiendo React</strong>?</p>",
                  explicacion:
                    "Pedir explicaciones de codigo que ya existe acelera tu aprendizaje y lo afianza. Pedir features sin saber React te entrega codigo que no puedes defender en code review ni mantener cuando rompa.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Pedirle que escriba la pagina entera de login y copiarla",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Pedirle que te explique linea por linea un componente existente del repo",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Pedirle que decida la arquitectura del nuevo modulo de cursos",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "Pedirle que escriba los tests sin que tu mires el codigo",
                      esCorrecta: false,
                    },
                  ],
                },
              ],
              "m1-s1-quiz",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview",
              "Anthropic — Guia de prompt engineering (oficial)",
              "Documento oficial de Anthropic sobre como estructurar prompts: ser claro y directo, usar ejemplos, dar contexto, pedir paso a paso. Vale para cualquier LLM, no solo Claude.",
              "m1-s1-recurso",
            ),
          },
        ],
      },
      {
        titulo: "Validar siempre + riesgos del oficio",
        skill: "Uso eficiente de IA para devs",
        temas:
          "leer critico, ejecutar, testear, detectar alucinaciones de APIs y deps inventadas, secretos en prompts, propiedad intelectual, dependencia cognitiva, REGLA: 'si no lo puedes explicar, no es tuyo'.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<h2>El codigo que aceptas, lo firmas</h2><p>Cuando un PR tuyo entra al repo, es <strong>tuyo</strong>. No del modelo que lo genero, no del autocomplete que lo sugirio. Tuyo. El equipo te va a preguntar por que decidiste asi, el bug del año que viene lo vas a debuggear tu, y en la entrevista con el cliente vas a defender tu trabajo — no el de la IA.</p><p>Por eso la validacion no es un paso opcional al final: es el contrato que hace que el codigo sea tuyo. Validar significa cuatro cosas concretas:</p><ol><li><strong>Leer critico</strong>: linea por linea, explicandote en voz alta que hace cada una. Si te encuentras diciendo "esto sera para...", ya estas en zona de riesgo.</li><li><strong>Ejecutar</strong>: con el caso feliz y al menos un caso borde. Compilar no es funcionar.</li><li><strong>Testear</strong>: un test minimo del comportamiento esperado, antes de aceptar el codigo en el repo.</li><li><strong>Buscar el API en docs reales</strong>: la IA alucina metodos, paquetes, firmas. Si no esta en la documentacion oficial, no existe.</li></ol><p>Los riesgos del oficio van mas alla del codigo: nunca pegues secretos ni codigo propietario del cliente en un prompt publico, no asumas que la salida es libre de propiedad intelectual, y cuida la <em>dependencia cognitiva</em>: si llevas tres semanas sin escribir codigo sin IA, has perdido musculo, no ganado tiempo.</p>`,
              "m1-s2-intro",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "warning",
              `<p><strong>Regla madre</strong>: si no lo puedes explicar, no es tuyo. Si no es tuyo, no puede entrar al repo. No importa si compila, si pasa los tests, si "parece correcto". El criterio que aplicamos al codigo escrito a mano se aplica igual al codigo asistido — porque para el equipo, el cliente y el bug futuro, no hay diferencia.</p>`,
              "m1-s2-tip",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `// La IA te genera esto para "cargar un usuario y manejar errores".
// Compila. Parece correcto. Tiene 2 bugs sutiles muy tipicos de output IA.

async function cargarUsuario(id) {
  try {
    const r = await fetch(\`/api/users/\${id}\`);
    const data = r.json();              // BUG 1: falta await — data es Promise
    return data;
  } catch (e) {
    console.log("Error: " + e);          // BUG 2: tragar el error es decision, no descuido
    return null;
  }
}


// VERSION VALIDADA — la que firma el dev
async function cargarUsuario(id: string): Promise<Usuario | null> {
  const r = await fetch(\`/api/users/\${id}\`);
  if (!r.ok) {
    if (r.status === 404) return null;   // 404 es decision: usuario no existe
    throw new ApiError(r.status, "No se pudo cargar el usuario");
  }
  return (await r.json()) as Usuario;
}
// Aqui no tragamos errores con catch silencioso: dejamos que el llamador
// (con Tanstack Query) los maneje. Y el 404 es una decision explicita.`,
              "Dos bugs que un dev backend ve enseguida y que la IA genera mucho: olvidar el await sobre r.json(), y tragar errores con un catch que solo loguea. El segundo es mas peligroso porque oculta el problema sin romper nada — el bug aparece dos semanas despues en produccion.",
              "m1-s2-codigo",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "Uso eficiente de IA para devs",
            contenido: buildQuiz(
              [
                {
                  id: "q1",
                  enunciado:
                    "<p>La IA te sugiere <code>import { debounce } from 'react-utils'</code>. ¿Cual es el primer paso correcto?</p>",
                  explicacion:
                    "Las alucinaciones de paquetes son uno de los riesgos mas comunes de la IA. El paquete 'react-utils' no existe en npm de forma confiable. Verificar en el registro oficial es obligatorio antes de instalar nada.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Instalarlo: si la IA lo importa, debe existir",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Verificar en npmjs.com / la documentacion oficial si existe y esta mantenido",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Pedirle a la IA que confirme que existe",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto:
                        "Buscar 'react-utils debounce' en Google y aceptar el primer resultado",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q2",
                  enunciado:
                    "<p>Tu compañero pide tu opinion sobre un PR que escribio con IA. Lees el codigo, no entiendes por que usa <code>useLayoutEffect</code> en vez de <code>useEffect</code>. ¿Que haces?</p>",
                  explicacion:
                    "El compañero firmo el PR — debe poder defender la decision. Aprobar sin entender es romper el contrato del code review. La pregunta no es agresiva: es la base del oficio en equipo.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Apruebo: si la IA lo hizo asi, sera por algo",
                      esCorrecta: false,
                    },
                    { id: "b", texto: "Apruebo y dejo un comentario opcional", esCorrecta: false },
                    {
                      id: "c",
                      texto:
                        "Pido al autor que explique por que useLayoutEffect — si no puede, el codigo se revisa",
                      esCorrecta: true,
                    },
                    { id: "d", texto: "Reescribo yo el PR para usar useEffect", esCorrecta: false },
                  ],
                },
                {
                  id: "q3",
                  enunciado:
                    "<p>¿Cual es un riesgo real de pegar codigo del cliente en un prompt de un LLM publico?</p>",
                  explicacion:
                    "Las politicas varian segun proveedor, pero como regla del oficio: codigo propietario del cliente no entra en prompts publicos sin permiso. El riesgo es legal y reputacional, no solo tecnico.",
                  opciones: [
                    { id: "a", texto: "Ninguno, los modelos no recuerdan nada", esCorrecta: false },
                    {
                      id: "b",
                      texto: "Solo si pegas mas de 100 lineas seguidas",
                      esCorrecta: false,
                    },
                    {
                      id: "c",
                      texto:
                        "Posible filtracion de propiedad intelectual y violacion del contrato con el cliente",
                      esCorrecta: true,
                    },
                    { id: "d", texto: "Que la IA te responda en otro idioma", esCorrecta: false },
                  ],
                },
                {
                  id: "q4",
                  enunciado:
                    "<p>Llevas un mes usando IA para todo el codigo y notas que sin ella te trabas en cosas que antes resolvias solo. ¿Que pasa?</p>",
                  explicacion:
                    "La dependencia cognitiva es un riesgo real y silencioso: ganas velocidad a corto plazo pero pierdes musculo. La solucion no es no usar IA, es alternar: dias en que escribes sin asistencia para mantener el oficio.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Es la curva normal de productividad, no hace falta hacer nada",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Dependencia cognitiva: hay que alternar dias sin IA para mantener el oficio",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Hay que usar IA aun mas para acelerar el reaprendizaje",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "Es señal de que ya no necesitas escribir codigo sin IA",
                      esCorrecta: false,
                    },
                  ],
                },
              ],
              "m1-s2-quiz",
            ),
          },
          {
            idForzado: ID_M1_S2_PREG,
            tipo: TipoBloque.CODIGO_PREGUNTAS,
            esEvaluable: true,
            skill: "Uso eficiente de IA para devs",
            contenido: buildCodigoPreguntas(
              "javascript",
              `La IA te genero el siguiente codigo para "encontrar el primer usuario activo
de una lista". Compila, no lanza errores, pero NO funciona como esperas.

Hay 1 bug sutil. Encuentralo, corrigelo, y deja el codigo de modo que imprima
exactamente "Marta" (el nombre del primer usuario realmente activo).

Pista: lee con cuidado la condicion del if. ¿Compara o asigna?`,
              `// La IA te dio esto. Hay 1 bug.
// Arreglalo para que imprima "Marta".
function primerUsuarioActivo(usuarios) {
  for (const u of usuarios) {
    if (u.activo = true) {
      return u;
    }
  }
  return null;
}

const lista = [
  { nombre: "Ana", activo: false },
  { nombre: "Luis", activo: false },
  { nombre: "Marta", activo: true },
];

console.log(primerUsuarioActivo(lista).nombre);`,
              "m1-s2-cp",
            ),
          },
          {
            idForzado: ID_M1_S2_TEST,
            tipo: TipoBloque.CODIGO_TESTS,
            esEvaluable: false,
            contenido: buildCodigoTests(
              ID_M1_S2_PREG,
              `function primerUsuarioActivo(usuarios) {
  for (const u of usuarios) {
    if (u.activo === true) {
      return u;
    }
  }
  return null;
}

const lista = [
  { nombre: "Ana", activo: false },
  { nombre: "Luis", activo: false },
  { nombre: "Marta", activo: true },
];

console.log(primerUsuarioActivo(lista).nombre);`,
              [
                {
                  id: "t1",
                  descripcion: "Imprime el nombre del primer usuario realmente activo",
                  entrada: "",
                  salidaEsperada: "Marta\n",
                  visible: true,
                },
                {
                  id: "t2",
                  descripcion: "No se queda con el primer usuario por bug de asignacion",
                  entrada: "",
                  salidaEsperada: "Marta\n",
                  visible: true,
                },
                {
                  id: "t3",
                  descripcion: "Comparacion estricta correcta (=== en vez de =)",
                  entrada: "",
                  salidaEsperada: "Marta\n",
                  visible: false,
                },
              ],
              "m1-s2-ct",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p class="font-serif italic text-aurora-violet" style="font-size: 1.5rem; line-height: 1.4;">"Si no lo puedes explicar, no es tuyo."</p><p>Esta regla aparece otra vez en Disciplina (Modulo 6) y en React calidad (Modulo 7), porque no es solo de IA: es del oficio. La IA solo la hace mas obvia y mas urgente. Antes de cerrar este modulo, abre el ultimo snippet que copiaste de un asistente y leelo en voz alta explicando que hace cada linea. Si te traba alguna, ya sabes que pendiente tienes.</p>`,
              "m1-s2-cierre",
            ),
          },
        ],
      },
    ],
  },
  {
    idx: 3,
    titulo: "Modulo 2 — HTML semantico que importa",
    descripcion:
      "Lo que un dev backend no sabe del DOM: por que `<div>` soup le pesa al equipo, al SEO y al lector de pantalla.",
    secciones: [
      {
        titulo: "Lo que un dev backend no sabe del DOM",
        skill: "HTML semantico",
        temas:
          "DOM como arbol vivo (no como string), tags semanticos (article, section, nav, main, aside), cuando cada uno, atributos ARIA basicos, accesibilidad como punto de partida.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<h2>El HTML no es decoracion, es una API</h2><p>Tu vienes del backend. Llevas años pensando en endpoints, modelos, queries. Cuando miras un HTML, lo lees como "lo que ve el usuario": una capa cosmetica que va al final, despues de lo importante.</p><p>Y eso es exactamente lo que te va a costar caro.</p><p>El HTML no es la capa de presentacion. Es la <strong>API que tu aplicacion le expone al navegador, al lector de pantalla, al bot de Google y al compañero del año que viene</strong>. Cada vez que pones un <code>&lt;div&gt;</code> donde iba <code>&lt;nav&gt;</code>, es como definir un endpoint <code>POST /cosa</code> en vez de <code>POST /usuarios/registro</code>: tecnicamente funciona, pero no comunica nada. Y como nadie te lo va a reportar — el navegador y el lector de pantalla se rinden en silencio — es muy facil hacerlo mal durante años sin enterarte.</p><p>La buena noticia: <strong>el DOM es una estructura, no magia</strong>. Es un arbol con nodos, jerarquia y tipos. Tu ya sabes leer un schema de base de datos; el DOM es lo mismo, solo que se lee con otra herramienta (las DevTools del navegador). Si lo piensas asi, deja de ser "lo cosmetico" y pasa a ser lo que es: <em>el contrato estructural de tu pagina</em>.</p>`,
              "m2-s1-intro",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>Regla del senior</strong>: si necesitas ARIA para hacer accesible algo, casi siempre es porque elegiste mal el tag. El HTML semantico bien usado deja el ARIA para los casos realmente excepcionales (widgets custom, estados dinamicos). No para parchar lo que tu <code>&lt;div&gt;</code> no comunica. Cuando elijas <code>&lt;nav&gt;</code> en vez de <code>&lt;div class="nav"&gt;</code>, el navegador te empieza a trabajar gratis: skip-to-content, anuncio del lector, navegacion por landmarks. Todo eso son features que dejas de tener que implementar.</p>`,
              "m2-s1-tip",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "html",
              `<!-- DIV SOUP — lo que escribe el dev backend en automatico -->
<div class="page">
  <div class="top">
    <div class="logo">NexoTT</div>
    <div class="links">
      <div class="link"><a href="/cursos">Cursos</a></div>
      <div class="link"><a href="/admin">Admin</a></div>
    </div>
  </div>
  <div class="content">
    <div class="title">Mis cursos</div>
    <div class="card">
      <div class="card-title">Frontend para devs backend</div>
      <div class="card-body">Modulo 2 en curso</div>
    </div>
  </div>
  <div class="bottom">© NexoTT Learn 2026</div>
</div>

<!-- VISUALMENTE: identico. SEMANTICAMENTE: invisible. -->
<!-- El lector de pantalla anuncia "agrupacion, agrupacion, agrupacion, link Cursos, link Admin..." -->
<!-- Reader Mode del navegador: no funciona. SEO: solo lee el texto plano. -->


<!-- HTML SEMANTICO — el mismo render, otra historia -->
<body>
  <header>
    <a href="/" class="logo">NexoTT</a>
    <nav aria-label="Principal">
      <a href="/cursos">Cursos</a>
      <a href="/admin">Admin</a>
    </nav>
  </header>
  <main>
    <h1>Mis cursos</h1>
    <article>
      <h2>Frontend para devs backend</h2>
      <p>Modulo 2 en curso</p>
    </article>
  </main>
  <footer>© NexoTT Learn 2026</footer>
</body>

<!-- El lector anuncia "banner, navegacion Principal, contenido principal, articulo Frontend..." -->
<!-- Reader Mode funciona. SEO entiende la jerarquia. Tab navigation respeta landmarks. -->
<!-- Y CSS / JS necesitan menos selectores ad-hoc: header, nav, main YA son targets. -->`,
              "El mismo render visual, dos arboles DOM completamente distintos. El segundo no añade trabajo — quita: menos clases ad-hoc, menos ARIA, menos JS para resolver lo que el navegador haria gratis con la etiqueta correcta.",
              "m2-s1-codigo",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "HTML semantico",
            contenido: buildQuiz(
              [
                {
                  id: "q1",
                  enunciado:
                    "<p>¿Cual es el rol principal del HTML semantico en una aplicacion?</p>",
                  explicacion:
                    "El HTML es la estructura que el navegador, el lector de pantalla, el SEO y el siguiente dev usan para entender tu pagina. El CSS y JS se montan encima de esa estructura — si la base no comunica, el resto compensa con parches.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Hacer que la pagina se vea bonita sin tanto CSS",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Comunicar la estructura y el significado del contenido al navegador, lectores de pantalla y bots",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Reducir el peso del archivo HTML", esCorrecta: false },
                    { id: "d", texto: "Permitir que React funcione mas rapido", esCorrecta: false },
                  ],
                },
                {
                  id: "q2",
                  enunciado:
                    "<p>Estas armando el menu principal de navegacion del sitio. ¿Cual es la etiqueta correcta?</p>",
                  explicacion:
                    "<nav> declara explicitamente que ese bloque es navegacion. Los lectores de pantalla la anuncian como landmark; el navegador permite saltar entre landmarks con teclado. Con <div role='navigation'> consigues lo mismo, pero ¿para que duplicar trabajo si la etiqueta ya existe?",
                  opciones: [
                    { id: "a", texto: '<div class="navigation">', esCorrecta: false },
                    { id: "b", texto: '<section class="menu">', esCorrecta: false },
                    { id: "c", texto: "<nav>", esCorrecta: true },
                    { id: "d", texto: "<aside>", esCorrecta: false },
                  ],
                },
                {
                  id: "q3",
                  enunciado:
                    '<p>Un compañero pone <code>role="button"</code> + <code>onClick</code> a un <code>&lt;div&gt;</code>. ¿Que problema tiene?</p>',
                  explicacion:
                    "Un <button> nativo trae gratis: foco con Tab, activacion con Enter y Espacio, anuncio como 'boton' al lector de pantalla, estados disabled. El <div role='button'> obliga a reimplementar todo eso a mano — y casi siempre se hace incompleto.",
                  opciones: [
                    { id: "a", texto: "Ningun problema si funciona el onClick", esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        "Pierde foco con Tab, activacion con teclado, estados nativos — todo lo que <button> da gratis",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Solo afecta al rendimiento", esCorrecta: false },
                    {
                      id: "d",
                      texto: "Es lo correcto en React, el <button> esta deprecated",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q4",
                  enunciado: "<p>¿Cuando es realmente apropiado añadir ARIA a un elemento?</p>",
                  explicacion:
                    "La primera regla de ARIA es: 'no uses ARIA si una etiqueta HTML semantica resuelve lo mismo'. ARIA es para widgets sin equivalente nativo (un combobox custom, un tab panel) o para estados dinamicos (aria-expanded, aria-live). Si lo estas usando para parchar tu <div>, casi siempre es señal de que el tag esta mal elegido.",
                  opciones: [
                    {
                      id: "a",
                      texto: "En todos los elementos por accesibilidad maxima",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Cuando no existe una etiqueta HTML nativa para lo que necesitas, o para describir estados dinamicos",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Solo en formularios", esCorrecta: false },
                    { id: "d", texto: "Cuando lo pide el cliente", esCorrecta: false },
                  ],
                },
              ],
              "m2-s1-quiz",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://developer.mozilla.org/es/docs/Learn/HTML/Introduction_to_HTML/Document_and_website_structure",
              "MDN — Estructura del documento y de un sitio web",
              "Guia oficial de MDN en español sobre como estructurar una pagina con HTML semantico: header, nav, main, article, section, aside, footer. Con ejemplos visuales y explicacion de cuando usar cada uno.",
              "m2-s1-recurso",
            ),
          },
        ],
      },
      {
        titulo: "Reestructurar un HTML feo en uno semantico",
        skill: "HTML semantico",
        temas:
          "heuristica del lector de pantalla, antes/despues con un layout real, validar con axe-core, queries DOM que enseñan que sale bien.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<h2>Refactorizar HTML es oficio, no estetica</h2><p>Una vez entiendes la teoria, viene la parte que duele: tomar un componente real escrito con divs y reescribirlo. Y aqui es donde se separa el dev que <em>sabe</em> HTML semantico del que <em>lo aplica</em>. No es lo mismo.</p><p>La heuristica que mejor funciona es la del <strong>lector de pantalla mental</strong>: lee tu HTML en voz alta, en orden, anunciando cada elemento como lo haria un screen reader. Si lo que escuchas se parece a la estructura que tienes en la cabeza, vas bien. Si suena a "agrupacion, agrupacion, link, agrupacion, link, agrupacion...", todavia no escribiste la pagina — apilaste cajas.</p><p>El segundo movimiento es validar con una herramienta real. <code>axe DevTools</code> (extension del navegador) escanea tu pagina en 5 segundos y te dice exactamente que falla: headings fuera de jerarquia, landmarks duplicados, contraste insuficiente, botones sin label accesible. No te ahorra pensar — te ahorra adivinar.</p><p>Esto no es trabajo extra. Es el mismo trabajo, hecho con criterio. Y la diferencia se nota en code review, en bugs futuros, y sobre todo en la persona que entra a tu pagina con un lector de pantalla — esa persona que nunca te va a escribir para reclamar, pero que decide en 3 segundos si tu app le sirve o si abandona.</p>`,
              "m2-s2-intro",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              "<p><strong>Regla del senior</strong>: abre tu pagina en las DevTools, pestaña <em>Accessibility</em>, y mira el arbol de landmarks. Si lo que ves se parece a la estructura que tienes en la cabeza (banner, navegacion, contenido principal, articulo, complementario, footer), vas bien. Si ves un arbol plano de 47 <code>generic</code> sin jerarquia, todavia no escribiste la pagina — solo apilaste cajas. Esa vista del navegador es la verdad: lo que tu compañero ve es CSS, lo que el lector de pantalla ve es esto.</p>",
              "m2-s2-tip",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "html",
              `<!-- ANTES — header tipico del dashboard heredado, todo divs y clases ad-hoc -->
<div class="dashboard-top">
  <div class="brand-container">
    <div class="brand-logo">
      <img src="/logo.svg" alt="NexoTT">
    </div>
  </div>
  <div class="middle-section">
    <div class="search-wrap">
      <div class="search-icon"></div>
      <div class="search-input">
        <input type="text" placeholder="Buscar...">
      </div>
    </div>
  </div>
  <div class="right-section">
    <div class="notif-wrap" onclick="abrirNotifs()">
      <div class="bell-icon"></div>
      <div class="badge">3</div>
    </div>
    <div class="profile-wrap">
      <div class="avatar"></div>
      <div class="profile-name">Martin Salazar</div>
    </div>
  </div>
</div>

<!-- Tab navigation: no funciona en .notif-wrap. Lector: "imagen, agrupacion, agrupacion, 3, agrupacion, Martin Salazar". -->


<!-- DESPUES — mismo header, escrito como contrato estructural -->
<header>
  <a href="/" aria-label="Inicio NexoTT Learn">
    <img src="/logo.svg" alt="">
  </a>

  <search>
    <label for="q" class="sr-only">Buscar en la plataforma</label>
    <input id="q" type="search" placeholder="Buscar...">
  </search>

  <nav aria-label="Acciones del usuario">
    <button type="button" aria-label="Notificaciones (3 nuevas)" aria-haspopup="menu">
      <span aria-hidden="true">🔔</span>
      <span aria-hidden="true">3</span>
    </button>
    <button type="button" aria-haspopup="menu">
      <img src="/avatar.jpg" alt="" aria-hidden="true">
      <span>Martin Salazar</span>
    </button>
  </nav>
</header>

<!-- Tab navigation: funciona perfecto. Lector: "banner, link Inicio NexoTT Learn, buscar, navegacion Acciones del usuario, boton Notificaciones 3 nuevas, boton Martin Salazar". -->`,
              "El refactor no añade complejidad — la quita. Menos divs, menos clases, mas etiquetas que ya hacen el trabajo. El header del 'despues' tiene 1/3 de los elementos del 'antes' y comunica el doble.",
              "m2-s2-codigo",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "HTML semantico",
            contenido: buildQuiz(
              [
                {
                  id: "q1",
                  enunciado:
                    "<p>Estas armando el bloque que muestra la <strong>KPI principal</strong> del dashboard: titulo, numero grande, delta vs mes anterior y mini-sparkline. ¿Cual es la etiqueta raiz mas apropiada?</p>",
                  explicacion:
                    "<article> es para contenido independiente y autocontenido. Una KPI con titulo, valor y delta cumple: la puedes copiar a otro lugar y sigue teniendo sentido. <section> tambien sirve pero requiere un heading propio para ser landmark. <div> funciona pero no comunica nada.",
                  opciones: [
                    { id: "a", texto: '<div class="kpi-card">', esCorrecta: false },
                    { id: "b", texto: "<article>", esCorrecta: true },
                    { id: "c", texto: "<aside>", esCorrecta: false },
                    { id: "d", texto: "<figure>", esCorrecta: false },
                  ],
                },
                {
                  id: "q2",
                  enunciado:
                    "<p>Tienes un <strong>breadcrumb</strong> (Cursos / Frontend para devs backend / Modulo 2). ¿Como lo marcas?</p>",
                  explicacion:
                    "Los breadcrumbs son navegacion secundaria. La convencion es <nav aria-label='Breadcrumb'> con un <ol> dentro (es lista ordenada, el orden importa). El aria-label distingue este <nav> del principal para los lectores de pantalla.",
                  opciones: [
                    {
                      id: "a",
                      texto: '<div class="breadcrumb">Cursos > Frontend...</div>',
                      esCorrecta: false,
                    },
                    { id: "b", texto: "<p>Cursos > Frontend...</p>", esCorrecta: false },
                    {
                      id: "c",
                      texto: '<nav aria-label="Breadcrumb"><ol>...</ol></nav>',
                      esCorrecta: true,
                    },
                    { id: "d", texto: "<header>Cursos > Frontend...</header>", esCorrecta: false },
                  ],
                },
                {
                  id: "q3",
                  enunciado:
                    "<p>Tienes un <strong>sidebar con filtros</strong> a la izquierda de una tabla de personas (estado, area, fecha). ¿Que etiqueta es la correcta?</p>",
                  explicacion:
                    "<aside> es para contenido tangencialmente relacionado al main: filtros laterales, widgets de 'tambien te puede interesar', publicidad. Los lectores de pantalla lo anuncian como 'complementario'. <section> requiere heading; <nav> es para navegacion entre paginas, no para filtros.",
                  opciones: [
                    { id: "a", texto: '<aside aria-label="Filtros">', esCorrecta: true },
                    { id: "b", texto: '<nav aria-label="Filtros">', esCorrecta: false },
                    { id: "c", texto: '<section class="filters">', esCorrecta: false },
                    { id: "d", texto: '<form class="sidebar">', esCorrecta: false },
                  ],
                },
                {
                  id: "q4",
                  enunciado:
                    "<p>El footer de una tabla tiene paginacion (botones &laquo; &lsaquo; 1 2 3 &rsaquo; &raquo;) e info de resultados ('Mostrando 1-20 de 87'). ¿Como lo marcas?</p>",
                  explicacion:
                    "La paginacion es navegacion contextual de la tabla: <nav aria-label='Paginacion'>. El texto de resultados va en un <p> hermano dentro del mismo <footer> de la seccion de la tabla. <footer> aqui se refiere al footer de esa seccion, no al de la pagina entera.",
                  opciones: [
                    { id: "a", texto: '<div class="pagination-wrap">...</div>', esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        '<footer><nav aria-label="Paginacion">...</nav><p>Mostrando 1-20 de 87</p></footer>',
                      esCorrecta: true,
                    },
                    { id: "c", texto: "<aside><ul>...</ul></aside>", esCorrecta: false },
                    {
                      id: "d",
                      texto: '<section role="pagination">...</section>',
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q5",
                  enunciado:
                    '<p>Estas convirtiendo este botón visual: <code>&lt;div class="btn-primary" onclick="guardar()"&gt;Guardar&lt;/div&gt;</code>. ¿Cual es la version correcta?</p>',
                  explicacion:
                    "<button type='button'> es la unica respuesta. Trae gratis: foco con Tab, activacion con Enter/Espacio, anuncio como 'boton' al lector, estados disabled. El type='button' es clave: sin el, dentro de un <form> el boton hace submit por defecto.",
                  opciones: [
                    {
                      id: "a",
                      texto: '<a href="#" onclick="guardar()">Guardar</a>',
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto: '<button type="button" onclick="guardar()">Guardar</button>',
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: '<div role="button" tabindex="0" onclick="guardar()">Guardar</div>',
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: '<span class="btn" onclick="guardar()">Guardar</span>',
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q6",
                  enunciado:
                    "<p>Estructuras la pagina de detalle de un curso: titulo del curso, descripcion, lista de modulos. ¿Cual es la jerarquia de headings correcta?</p>",
                  explicacion:
                    "Un solo <h1> por pagina (el titulo del curso). Los modulos son secciones dentro del curso: <h2>. Si dentro de cada modulo hay subsecciones, <h3>. Saltarse niveles (de h1 a h3) o tener varios h1 confunde a lectores de pantalla y al SEO.",
                  opciones: [
                    {
                      id: "a",
                      texto: "<h1>Curso</h1>, <h1>Modulo 1</h1>, <h1>Modulo 2</h1>",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto: "<h1>Curso</h1>, <h3>Modulo 1</h3>, <h3>Modulo 2</h3>",
                      esCorrecta: false,
                    },
                    {
                      id: "c",
                      texto: "<h1>Curso</h1>, <h2>Modulo 1</h2>, <h2>Modulo 2</h2>",
                      esCorrecta: true,
                    },
                    {
                      id: "d",
                      texto: "<h2>Curso</h2>, <h2>Modulo 1</h2>, <h2>Modulo 2</h2>",
                      esCorrecta: false,
                    },
                  ],
                },
              ],
              "m2-s2-quiz",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://www.a11yproject.com/patterns/",
              "The A11Y Project — Patterns",
              "Catalogo abierto y mantenido de patrones de accesibilidad: modales, dropdowns, tabs, formularios, breadcrumbs. Cada patron incluye HTML semantico correcto + ARIA cuando hace falta + tests con lector de pantalla. La referencia practica cuando dudas como marcar algo.",
              "m2-s2-recurso",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p class="font-serif italic text-aurora-violet" style="font-size: 1.5rem; line-height: 1.4;">"El HTML que escribes hoy lo va a leer alguien que no eres tu. Escribelo para esa persona."</p><p>Esa persona puede ser el compañero del año que viene buscando donde toca cambiar la nav. Puede ser el bot que decide si tu pagina sale en Google. Puede ser alguien que entra con un lector de pantalla y necesita en 3 segundos saber donde esta el contenido principal. Las tres ganan con el mismo gesto: usar la etiqueta correcta. Y tu ganas tambien — porque dejas de pelearte con CSS y ARIA para resolver lo que el navegador haria gratis.</p>`,
              "m2-s2-cierre",
            ),
          },
        ],
      },
    ],
  },
  {
    idx: 4,
    titulo: "Modulo 3 — CSS sin pelearse: layout moderno",
    descripcion:
      "Flexbox y Grid sin frameworks. Lo que un Bootstrap te oculto que ahora tienes que saber.",
    secciones: [
      {
        titulo: "Flexbox para layouts 1D",
        skill: "CSS layout moderno",
        temas:
          "mental model container/items, ejes principal y cruzado, justify y align, gap, casos: header con logo+nav+avatar, tarjetas alineadas.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              "<h2>El CSS no es magia, son dos mental models</h2><p>Para un dev backend, el CSS suele ser la parte que mas frustra del frontend. No porque sea dificil — porque parece <em>azaroso</em>. Cambias <code>margin-top: -8px</code>, añades <code>position: relative</code>, pruebas tres valores de <code>display</code>, y al final algo se ve bien sin que sepas exactamente por que. Y cada cambio rompe otra cosa. Trial and error es la norma.</p><p>La buena noticia es que el CSS moderno <strong>no es magia</strong>. Son <strong>dos mental models claros</strong> que resuelven el 90% de los layouts que vas a escribir en tu carrera: <strong>Flexbox</strong> para layouts de una dimension (una fila o una columna), <strong>Grid</strong> para dos dimensiones (filas y columnas a la vez). Aprenderlos te ahorra años de pelea. Saltartelos te condena al copy-paste eterno de Stack Overflow.</p><p>Hoy atacamos Flexbox. El mental model es simple: <strong>declaras un contenedor</strong> (<code>display: flex</code>) y a partir de ese momento sus hijos directos se convierten en <em>items flexibles</em> que se alinean en un eje. Hay dos ejes: el <strong>principal</strong> (horizontal por defecto) y el <strong>cruzado</strong> (perpendicular). Casi toda la API de Flexbox es controlar como se reparten los items en esos dos ejes. Una vez tienes ese modelo en la cabeza, propiedades como <code>justify-content</code> y <code>align-items</code> dejan de ser nombres aleatorios y se convierten en lo que son: <em>alinear en el principal</em> y <em>alinear en el cruzado</em>.</p>",
              "m3-s1-intro",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              "<p><strong>Regla del senior</strong>: si tu Flexbox necesita mas de 3 o 4 propiedades para alinear lo que quieres, probablemente deberia ser Grid. Flexbox brilla en lo simple (una toolbar, un formulario inline, una card horizontal). Cuando el layout tiene filas <em>y</em> columnas con relacion entre ellas, estas forzando una herramienta 1D a hacer trabajo 2D — y se nota: terminan apareciendo wrappers innecesarios, <code>flex-basis</code> magicos y media queries de parche. Cambia a Grid y el problema desaparece.</p>",
              "m3-s1-tip",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "css",
              `/* CASO 1 — header del dashboard: logo a la izquierda, acciones a la derecha */
.header {
  display: flex;
  justify-content: space-between;  /* eje principal: empuja extremos */
  align-items: center;              /* eje cruzado: centra vertical */
  padding: 1rem 1.5rem;
}
/*
<header class="header">
  <a class="logo">NexoTT</a>
  <nav>... acciones ...</nav>
</header>
*/


/* CASO 2 — formulario inline: label + input + boton alineados con espacio igual */
.form-inline {
  display: flex;
  align-items: center;
  gap: 0.75rem;                     /* gap moderno: olvidate de margenes entre items */
}
.form-inline input {
  flex: 1;                          /* el input se come el espacio sobrante */
}
/*
<div class="form-inline">
  <label>Buscar</label>
  <input type="search">
  <button type="submit">Ir</button>
</div>
*/


/* CASO 3 — card horizontal: imagen fija a la izquierda, contenido flexible a la derecha */
.card-horizontal {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}
.card-horizontal img {
  flex: 0 0 96px;                   /* no crece, no se encoge, ancho fijo */
}
.card-horizontal .body {
  flex: 1;                          /* ocupa todo el espacio que sobra */
}


/* ANTIPATRON — Flexbox forzado donde tocaba Grid */
.dashboard-malo {
  display: flex;
  flex-wrap: wrap;                  /* parche 1 */
}
.dashboard-malo > * {
  flex: 1 1 calc(33.333% - 1rem);    /* parche 2: matematica fragil */
  margin: 0.5rem;                    /* parche 3: porque gap rompe con calc */
}
/* Esto es Grid disfrazado. Cuando veas calc(% - x) + flex-wrap + margin
   sustituyendo a gap, estas en la zona equivocada. */`,
              "Tres usos correctos de Flexbox para layouts 1D del dashboard real + un antipatron tipico (forzar Flexbox a hacer un grid de 3 columnas). El antipatron lo reconoces por la firma: calc(% - x) + flex-wrap + margin negativo o ajustado.",
              "m3-s1-codigo",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "CSS layout moderno",
            contenido: buildQuiz(
              [
                {
                  id: "q1",
                  enunciado: "<p>¿Cuando es Flexbox la herramienta correcta y cuando Grid?</p>",
                  explicacion:
                    "Flexbox piensa en una dimension a la vez (fila O columna). Grid piensa en filas Y columnas simultaneamente. Si los items que estas alineando viven en una linea, Flexbox. Si necesitas controlar dos ejes con relacion entre items (un dashboard, una tabla, un layout de pagina), Grid.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Flexbox para todo, Grid solo para tablas",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Flexbox para layouts 1D (una fila o columna), Grid para layouts 2D (filas y columnas con relacion)",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Grid para todo, Flexbox solo para flex-wrap",
                      esCorrecta: false,
                    },
                    { id: "d", texto: "Da igual, los dos hacen lo mismo", esCorrecta: false },
                  ],
                },
                {
                  id: "q2",
                  enunciado:
                    "<p>Quieres un header con logo a la izquierda y un grupo de botones a la derecha, todos centrados verticalmente. ¿Que CSS usas?</p>",
                  explicacion:
                    "justify-content: space-between empuja al primer hijo al inicio del eje principal y al ultimo al final. align-items: center los centra en el eje cruzado (vertical, por defecto). Es el caso canonico de un header.",
                  opciones: [
                    {
                      id: "a",
                      texto: "display: flex; justify-content: space-between; align-items: center;",
                      esCorrecta: true,
                    },
                    { id: "b", texto: "display: block; text-align: justify;", esCorrecta: false },
                    { id: "c", texto: "display: flex; float: left/right;", esCorrecta: false },
                    { id: "d", texto: "position: absolute en cada elemento", esCorrecta: false },
                  ],
                },
                {
                  id: "q3",
                  enunciado:
                    "<p>En una toolbar con 4 botones, quieres <strong>16px de separacion entre cada uno</strong>. ¿Cual es la forma moderna y correcta?</p>",
                  explicacion:
                    "La propiedad gap funciona en Flexbox desde 2021 en todos los navegadores modernos. Es la forma correcta: declara la separacion una sola vez en el contenedor, no necesitas selectores adyacentes ni resetear el ultimo margin. Olvida los hacks de :not(:last-child).",
                  opciones: [
                    {
                      id: "a",
                      texto: "margin-right: 16px en cada boton + margin-right: 0 en el ultimo",
                      esCorrecta: false,
                    },
                    { id: "b", texto: "gap: 16px en el contenedor flex", esCorrecta: true },
                    { id: "c", texto: "padding: 16px en cada boton", esCorrecta: false },
                    {
                      id: "d",
                      texto: "margin: 0 8px en cada boton (margenes que colapsan)",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q4",
                  enunciado:
                    "<p>En un Flexbox horizontal (<code>flex-direction: row</code>), ¿que controla <code>align-items</code>?</p>",
                  explicacion:
                    "El eje principal en row es horizontal; el cruzado es vertical. justify-content alinea en el principal, align-items en el cruzado. Si cambias a flex-direction: column, los ejes se invierten — pero el principio sigue: justify = principal, align = cruzado.",
                  opciones: [
                    { id: "a", texto: "La alineacion horizontal de los items", esCorrecta: false },
                    {
                      id: "b",
                      texto: "La alineacion en el eje cruzado (vertical, en este caso)",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "El orden en que aparecen los items", esCorrecta: false },
                    { id: "d", texto: "El tamaño de cada item", esCorrecta: false },
                  ],
                },
              ],
              "m3-s1-quiz",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://css-tricks.com/snippets/css/a-guide-to-flexbox/",
              "CSS-Tricks — A Complete Guide to Flexbox",
              "La guia visual mas usada del mundo para Flexbox. Cada propiedad explicada con un diagrama interactivo. Si tienes dudas de que hace justify-content vs align-items o como funciona flex-grow, esta es la referencia que abres y resuelves en 30 segundos.",
              "m3-s1-recurso",
            ),
          },
        ],
      },
      {
        titulo: "Grid + responsive design",
        skill: "CSS layout moderno",
        temas:
          "grid-template-areas, fr unit, minmax, auto-fit/auto-fill, media queries vs container queries, dashboard como caso real.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<h2>Grid: el layout que se lee como un mapa</h2><p>Si Flexbox piensa en una dimension, <strong>Grid piensa en dos a la vez</strong>. Filas y columnas con relacion entre ellas. Y tiene una propiedad que cambia la experiencia de escribir CSS: <code>grid-template-areas</code>. Te deja <em>dibujar</em> el layout con palabras, como un mapa, y luego asignar cada elemento a su zona. El primer dia que lo usas, dices "esto deberia haber existido desde siempre".</p><p>El otro concepto fundamental es <code>fr</code> ("fraction"). No es "un tamaño", es "una parte del espacio que sobra". Cuando declaras <code>grid-template-columns: 240px 1fr</code>, le dices al navegador: "la primera columna mide 240px fijos; la segunda se come todo lo que sobre". Sin calc, sin porcentajes, sin media queries.</p><p>Y para responsive, hay un combo que resuelve el 80% de los casos sin escribir una sola media query: <code>repeat(auto-fit, minmax(250px, 1fr))</code>. Eso le dice al navegador: "haz tantas columnas como quepan, cada una de minimo 250px y maximo el espacio disponible". El grid se reorganiza solo cuando achicas la pantalla. Cero media queries para una grid responsive de tarjetas.</p><p>Las media queries siguen existiendo — pero las usas <strong>solo cuando el layout entero cambia de forma</strong>: cuando en mobile el sidebar pasa a ser un menu drawer, o cuando en desktop apareces una columna que en mobile no existe. Para "achicar elementos cuando hay menos espacio", el grid responsivo lo hace solo.</p><p>Y hay un nuevo nivel: <strong>container queries</strong>. En vez de preguntar "¿cuanto mide el viewport?", preguntan "¿cuanto mide mi contenedor?". Una card puede reorganizarse cuando vive en el sidebar (estrecho) vs cuando vive en el main (ancho), sin saber nada del viewport. Es la herramienta correcta para componentes reusables — y ya esta en todos los navegadores modernos.</p>`,
              "m3-s2-intro",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              "<p><strong>Regla del senior</strong>: diseña <em>mobile-first</em>. Empieza con el layout simple (una columna, todo apilado) y usa media queries <code>min-width</code> para añadir lo grande (sidebar, multi-columna, hero). Si empiezas con desktop y vas quitando con <code>max-width</code>, lo mas probable es que lo pensaste al reves: el resultado son layouts fragiles que se rompen en cada breakpoint. Mobile-first no es una moda — es que el caso mas restringido siempre es mejor base para crecer.</p>",
              "m3-s2-tip",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "css",
              `/* CASO 1 — layout del admin con grid-template-areas (se lee como un mapa) */
.admin-layout {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-columns: 240px 1fr;       /* sidebar fijo, main flexible */
  grid-template-rows: 64px 1fr 48px;       /* header y footer fijos, main flexible */
  min-height: 100vh;
}

.admin-layout > header  { grid-area: header; }
.admin-layout > aside   { grid-area: sidebar; }
.admin-layout > main    { grid-area: main; }
.admin-layout > footer  { grid-area: footer; }

/* En mobile: todo apilado, sin sidebar */
@media (max-width: 768px) {
  .admin-layout {
    grid-template-areas:
      "header"
      "main"
      "footer";
    grid-template-columns: 1fr;
  }
  .admin-layout > aside { display: none; }   /* o se convierte en drawer */
}


/* CASO 2 — grid responsive de KPI cards, SIN media queries */
.kpi-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  /*
    Traduccion: 'haz tantas columnas como quepan, cada una de minimo 250px,
    repartiendo el espacio sobrante con 1fr cada una.'

    Resultado:
      - >1000px → 4 columnas
      - 750-1000px → 3 columnas
      - 500-750px → 2 columnas
      - <500px → 1 columna

    Sin media queries. Sin breakpoints magicos. El grid se acomoda solo.
  */
}


/* CASO 3 — container query: la card se reorganiza segun su contenedor, no el viewport */
.kpi-card {
  container-type: inline-size;       /* declara este elemento como contenedor consultable */
}

@container (min-width: 320px) {
  .kpi-card .body {
    display: grid;
    grid-template-columns: 1fr auto;  /* numero a la izquierda, delta a la derecha */
  }
}
/* La MISMA card se reorganiza distinto si vive en el sidebar (estrecho)
   o en el main (ancho). Sin saber nada del viewport global. */`,
              "Tres patrones que cubren el 90% de los layouts de un admin real: layout principal con grid-template-areas como mapa, grid responsive sin media queries con auto-fit/minmax, y container queries para componentes que se adaptan a su entorno.",
              "m3-s2-codigo",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "CSS layout moderno",
            contenido: buildQuiz(
              [
                {
                  id: "q1",
                  enunciado:
                    "<p>Tienes 4 KPI cards que deben ocupar el ancho disponible: 4 en linea en desktop, 2 columnas en tablet, 1 en mobile. ¿Cual es la forma <strong>moderna</strong> de hacerlo?</p>",
                  explicacion:
                    "auto-fit + minmax resuelve los 3 breakpoints sin media queries. Le dices al navegador 'columnas de minimo 250px' y el solo decide cuantas caben. Las media queries explicitas siguen funcionando, pero para este caso son trabajo innecesario y fragil.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Tres media queries con grid-template-columns distinto en cada una",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto: "grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Flexbox con flex: 1 1 25% y flex-wrap", esCorrecta: false },
                    { id: "d", texto: "Bootstrap col-md-3 col-sm-6 col-xs-12", esCorrecta: false },
                  ],
                },
                {
                  id: "q2",
                  enunciado:
                    "<p>Layout: sidebar fijo de 240px a la izquierda + main que ocupa todo lo restante. ¿Que CSS lo expresa mejor?</p>",
                  explicacion:
                    "Grid con dos columnas (240px fijo + 1fr flexible) es la solucion directa: el navegador entiende exactamente la intencion. Flexbox tambien funciona, pero requiere flex-shrink: 0 en el sidebar y flex: 1 en el main; mas propiedades para decir lo mismo.",
                  opciones: [
                    {
                      id: "a",
                      texto: "display: grid; grid-template-columns: 240px 1fr;",
                      esCorrecta: true,
                    },
                    {
                      id: "b",
                      texto: "Sidebar con position: absolute y main con margin-left: 240px",
                      esCorrecta: false,
                    },
                    {
                      id: "c",
                      texto: "Sidebar y main con float: left y widths en %",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "Sidebar con width: 20% y main con width: 80%",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q3",
                  enunciado:
                    "<p>En <code>grid-template-columns: 200px 1fr auto</code>, ¿que significa cada valor?</p>",
                  explicacion:
                    "Cada palabra significa algo distinto en grid. 200px = ancho fijo. 1fr = una fraccion del espacio sobrante. auto = lo que el contenido necesite (encogido al maximo). Mezclarlos te da control fino sin matematica.",
                  opciones: [
                    {
                      id: "a",
                      texto:
                        "200px fijo, 1 fraccion del espacio que sobra, auto-ajuste al contenido",
                      esCorrecta: true,
                    },
                    { id: "b", texto: "200px, 100px, automatico", esCorrecta: false },
                    { id: "c", texto: "200px, 1% del ancho, todo el resto", esCorrecta: false },
                    { id: "d", texto: "200px de minimo, 1px de gap, auto-fill", esCorrecta: false },
                  ],
                },
                {
                  id: "q4",
                  enunciado:
                    "<p>¿Cuando deberias preferir <code>grid-template-areas</code> sobre declarar columnas/filas con numeros?</p>",
                  explicacion:
                    "areas brilla cuando el layout tiene una semantica clara (un mapa de zonas: header, sidebar, main, footer). Ves el layout en el codigo sin tener que mentalmente armarlo. Para grids dinamicos de N elementos identicos, no aporta — ahi auto-fit/minmax gana.",
                  opciones: [
                    { id: "a", texto: "Siempre, es la forma moderna", esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        "Cuando el layout tiene zonas con nombres claros (header, sidebar, main, footer): se lee como un mapa",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Solo en mobile", esCorrecta: false },
                    {
                      id: "d",
                      texto: "Cuando hay mas de 20 elementos en el grid",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q5",
                  enunciado:
                    "<p>Una card de KPI debe verse <strong>distinta</strong> cuando vive en el sidebar (estrecho) vs cuando vive en el main (ancho), sin saber del viewport. ¿Cual es la herramienta correcta?</p>",
                  explicacion:
                    "Container queries son la respuesta correcta. Las media queries miran el viewport global; los container queries miran el contenedor del componente. Para componentes reusables que viven en sitios de tamaño distinto, container queries son la unica forma honesta.",
                  opciones: [
                    { id: "a", texto: "Media queries con varios breakpoints", esCorrecta: false },
                    {
                      id: "b",
                      texto: "Container queries (container-type + @container)",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "JavaScript con ResizeObserver", esCorrecta: false },
                    {
                      id: "d",
                      texto: "Dos versiones del componente, una por contenedor",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q6",
                  enunciado:
                    "<p>Te encuentras un CSS con muchos <code>@media (max-width: 768px)</code> que <em>esconden</em> elementos del desktop. ¿Que sugiere esto?</p>",
                  explicacion:
                    "Quitar cosas con max-width significa que el diseño se penso para desktop y se va recortando para mobile. Mobile-first invierte el flujo: parte del caso mas restringido (mobile) y añade con min-width cuando hay mas espacio. Resultado: layouts mas robustos, menos código, mejor performance en mobile.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Que el dev domina muy bien el CSS responsive",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Que se diseñó desktop-first y se recorta para mobile — antipatron tipico",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Que las media queries estan deprecadas y hay que cambiarlas",
                      esCorrecta: false,
                    },
                    { id: "d", texto: "Que falta un meta viewport", esCorrecta: false },
                  ],
                },
              ],
              "m3-s2-quiz",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://css-tricks.com/snippets/css/complete-guide-grid/",
              "CSS-Tricks — A Complete Guide to CSS Grid",
              "La referencia visual de Grid. Cada propiedad con diagrama: template-areas, fr, minmax, auto-fit vs auto-fill, alineacion de items y de tracks. Cuando dudes sintaxis o quieras ver un patron, esta es la pestaña que abres.",
              "m3-s2-recurso",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p class="font-serif italic text-aurora-violet" style="font-size: 1.5rem; line-height: 1.4;">"El CSS moderno no se pelea: se entiende. Y cuando lo entiendes, deja de pelearse contigo."</p><p>Si llevas años evitando el CSS porque te parece azaroso, este modulo es el punto de inflexion. Flexbox y Grid no son trucos — son modelos. Una vez los tienes, los layouts que antes te llevaban horas se escriben en minutos, sin <code>!important</code>, sin <code>position: absolute</code> de relleno, sin Stack Overflow abierto en cinco pestañas. Y cuando alguien junior pelee con algo que ya dominaste, vas a verlo desde fuera y entender al fin por que el CSS tiene fama de dificil: porque casi nadie se sienta a aprender los modelos. Tu si lo hiciste.</p>`,
              "m3-s2-cierre",
            ),
          },
        ],
      },
    ],
  },
  {
    idx: 5,
    titulo: "Modulo 4 — JavaScript desde la perspectiva backend",
    descripcion:
      "Lo que asumes desde Java/Python y se rompe en JS: closures, this, event loop, modulos, async sin sorpresas.",
    secciones: [
      {
        titulo: "Closures, `this` y event loop",
        skill: "JavaScript moderno (perspectiva backend)",
        temas:
          "bug clasico for+setTimeout, scope de funcion vs bloque, this bind y arrow functions, microtask vs macrotask, debugging del orden de ejecucion.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<h2>Tus instintos son de otro lenguaje</h2><p>Tu ya sabes programar. Has escrito Java, Python, C# o algo equivalente durante años. Cuando llegas a JavaScript, la tentacion es leerlo como "Java con sintaxis distinta". Y casi todo funciona — hasta que de pronto un loop imprime "3, 3, 3" en vez de "0, 1, 2"; un metodo te devuelve <code>undefined</code> en <code>this</code>; un <code>setTimeout(_, 0)</code> se ejecuta despues de un <code>Promise.then</code> que parecia llegar mas tarde.</p><p>No es magia. Son <strong>tres puntos del lenguaje donde tus instintos te traicionan</strong>. Y la solucion no es "aprender JS" desde cero — es cambiar el modelo mental en esos tres puntos:</p><ol><li><strong>Scoping</strong>: en Java cada <code>for (int i ...)</code> da una <em>i</em> nueva por iteracion. En JS con <code>var</code>, no — son la misma. Por eso el bug clasico de <code>setTimeout</code> dentro de un <code>for</code> imprime el ultimo valor 3 veces.</li><li><strong><code>this</code></strong>: en Java es siempre "el objeto actual". En JS es <em>"quien decide quien me llama, en cada llamada"</em>. La misma funcion puede tener distintos <code>this</code> dependiendo de como la invoques.</li><li><strong>Event loop</strong>: en JS no hay threads. Hay un solo hilo y una cola con dos prioridades (microtasks y macrotasks). Aprender este modelo te explica el 90% de los "bugs raros de async" que un debugger no resuelve.</li></ol><p>Hoy atacamos los tres. Cuando termines, vas a leer un snippet de JS y vas a <em>saber</em> que va a hacer — no esperar a ejecutarlo a ver que pasa.</p>`,
              "m4-s1-intro",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>Regla del senior</strong>: si te encuentras escribiendo <code>setTimeout(fn, 0)</code> para "que algo espere", parate. No lo entendiste. <code>setTimeout(_, 0)</code> no es "ya" — es "al final de la cola de macrotasks, despues de que se resuelvan todas las microtasks pendientes". Si lo que quieres es ejecutar despues del render actual, usa <code>queueMicrotask</code> o <code>Promise.resolve().then(fn)</code>. Si solo quieres esperar algo, deberias estar <code>await</code>-eando una promesa real. <code>setTimeout(_, 0)</code> en codigo de producto es casi siempre un parche de algo que no entendiste.</p>`,
              "m4-s1-tip",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "javascript",
              `// INSTINTO 1 — scoping: el for clasico
//
// En Java:  for (int i = 0; i < 3; i++) → cada i tiene su scope de bloque
// En JS con var: TODOS los i son LA MISMA variable

for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Lo que tu instinto espera:  0  1  2
// Lo que realmente imprime:   3  3  3
//
// Por que: var tiene scope de FUNCION, no de bloque. Para cuando los
// setTimeouts se ejecutan (100ms despues), el for ya termino e i vale 3.
// Los 3 closures referencian la MISMA variable.

// FIX moderno: let (scope de bloque, como Java/Python)
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 0 1 2 ✓  — cada iteracion crea una i nueva.


// INSTINTO 2 — this: no es "el objeto actual"
//
// En Java: this es siempre la instancia donde estoy.
// En JS:   this depende de COMO se invoca la funcion.

const usuario = {
  nombre: "Martin",
  saludar: function () {
    console.log("Hola, " + this.nombre);
  },
};

usuario.saludar();              // "Hola, Martin"     ← this = usuario
const fn = usuario.saludar;
fn();                            // "Hola, undefined"  ← this = undefined (modo estricto)
//
// Mismisima funcion, dos llamadas, dos this distintos.
// El this no esta en la funcion — esta en COMO se llama.

// Arrow functions resuelven esto: NO tienen su propio this.
// Heredan el del scope donde se definen.
class Componente {
  constructor() {
    this.nombre = "Boton";
    setTimeout(function () {
      console.log(this.nombre);   // undefined — this aqui es global
    }, 100);

    setTimeout(() => {
      console.log(this.nombre);   // "Boton" — arrow hereda this del constructor
    }, 100);
  }
}


// INSTINTO 3 — event loop: lo que parece raro tiene reglas estrictas
console.log("a");
setTimeout(() => console.log("b"), 0);
Promise.resolve().then(() => console.log("c"));
console.log("d");

// Output:  a  d  c  b
//
// Por que:
//   1. Codigo sincrono primero  → "a", "d"
//   2. MICROTASKS (Promise.then) → "c"
//   3. MACROTASKS (setTimeout)  → "b"
//
// setTimeout(_, 0) NO es "ya". Es "despues de todo lo sincrono Y de todas
// las microtasks pendientes". Por eso "c" sale antes que "b" aunque
// setTimeout tenga delay 0 y la Promise no.`,
              "Los tres instintos que mas duelen al pasar de Java/Python a JS. Una vez ves estos tres ejemplos, dejas de sorprenderte con el resto.",
              "m4-s1-codigo",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "JavaScript moderno (perspectiva backend)",
            contenido: buildQuiz(
              [
                {
                  id: "q1",
                  enunciado:
                    "<p>¿Que imprime <code>for (var i = 0; i &lt; 3; i++) setTimeout(() =&gt; console.log(i), 100)</code>?</p>",
                  explicacion:
                    "var tiene scope de funcion, no de bloque. Los 3 closures referencian la MISMA i. Cuando los setTimeouts se ejecutan, el for ya termino e i vale 3. Por eso imprime 3, 3, 3. La forma moderna de evitarlo es usar let, que crea una nueva i por iteracion.",
                  opciones: [
                    { id: "a", texto: "0 1 2", esCorrecta: false },
                    { id: "b", texto: "3 3 3", esCorrecta: true },
                    { id: "c", texto: "undefined undefined undefined", esCorrecta: false },
                    { id: "d", texto: "Error en tiempo de compilacion", esCorrecta: false },
                  ],
                },
                {
                  id: "q2",
                  enunciado:
                    "<p>Tienes <code>const fn = usuario.saludar; fn();</code> donde <code>saludar</code> usa <code>this.nombre</code>. ¿Por que <code>this</code> es undefined?</p>",
                  explicacion:
                    "En JS, this depende de COMO se invoca la funcion, no de donde se definio. Al asignar usuario.saludar a fn y llamar fn(), no hay objeto a la izquierda del punto — entonces this es undefined (en modo estricto) o el objeto global (en modo no estricto). Para preservar el contexto, usa .bind(usuario) o una arrow function que herede el this lexico.",
                  opciones: [
                    { id: "a", texto: "Porque usuario fue garbage-collected", esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        "Porque this en JS depende de COMO se invoca la funcion, no de donde se definio",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Porque las funciones no pueden acceder a this",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "Porque hace falta declarar this al inicio del archivo",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q3",
                  enunciado:
                    "<p>¿Cual es la diferencia clave entre una <em>arrow function</em> y una <em>function declaration</em> respecto a <code>this</code>?</p>",
                  explicacion:
                    "Las arrow functions NO tienen su propio this — lo heredan del scope lexico (donde estan escritas). Por eso son ideales como callbacks dentro de metodos: te ahorras .bind(this) o asignar const self = this. Pero son malas como metodos directos de un objeto, porque this no apuntara al objeto sino al scope exterior.",
                  opciones: [
                    {
                      id: "a",
                      texto: "No hay diferencia, son la misma cosa con sintaxis distinta",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Las arrow functions NO tienen su propio this — heredan el del scope donde se definen",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Las arrow functions son mas rapidas", esCorrecta: false },
                    {
                      id: "d",
                      texto: "Las arrow functions no pueden usarse como callbacks",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q4",
                  enunciado:
                    "<p>¿Cual es el orden de salida de este codigo?<br><code>console.log('a'); setTimeout(() =&gt; console.log('b'), 0); Promise.resolve().then(() =&gt; console.log('c')); console.log('d');</code></p>",
                  explicacion:
                    "El event loop ejecuta primero TODO el codigo sincrono (a, d). Luego procesa todas las MICROTASKS pendientes (Promise.then → c). Solo despues va a por las MACROTASKS (setTimeout → b). Por eso setTimeout(_, 0) no es 'ya' sino 'al final de la cola de macrotasks, despues de todas las microtasks'.",
                  opciones: [
                    { id: "a", texto: "a b c d", esCorrecta: false },
                    { id: "b", texto: "a c d b", esCorrecta: false },
                    { id: "c", texto: "a d c b", esCorrecta: true },
                    { id: "d", texto: "a d b c", esCorrecta: false },
                  ],
                },
              ],
              "m4-s1-quiz",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://javascript.info/closure",
              "javascript.info — Variable scope, closure",
              "Explicacion progresiva de scope, closures y el modelo de ejecucion de JavaScript. Es la mejor referencia gratuita y mantenida para entender el lenguaje a fondo (no solo la sintaxis). Si te confunde el bug del var+setTimeout, este capitulo lo explica con diagramas paso a paso.",
              "m4-s1-recurso",
            ),
          },
        ],
      },
      {
        titulo: "Modulos, async/await, fetch con error handling real",
        skill: "JavaScript moderno (perspectiva backend)",
        temas:
          "ESM vs CommonJS, Promise.all vs allSettled, AbortController, fetch tipado con manejo de errores y retry, patron de cancelacion.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<h2>Async moderno: el oficio que el backend te ahorraba</h2><p>Si vienes de Java o de Python sincrono, casi nunca pensaste en <em>cancelar</em> una operacion. Empezabas, esperabas la respuesta, seguias. En frontend eso no funciona: el usuario cambia de pantalla, el componente se desmonta, la red se cae, y tu request sigue en vuelo apuntando a un componente que ya no existe. Sin manejo, eso son <strong>memory leaks y race conditions garantizados</strong>.</p><p>Hay tres herramientas que un dev backend moderno tiene que dominar al pasar a frontend:</p><ol><li><strong>async/await</strong> es azucar sobre promises — pero solo azucar. Sigues necesitando entender el modelo: <code>await</code> pausa la funcion actual, no el hilo (no hay hilo). Mientras esperas, el event loop sigue procesando otras cosas.</li><li><strong>Promise.all vs Promise.allSettled</strong> no es trivia: es una decision de UX. <code>all</code> rechaza si UNO falla (util cuando no puedes seguir sin todos); <code>allSettled</code> reporta cada uno por separado (util cuando puedes degradar gracefully).</li><li><strong>AbortController</strong> es el patron de cancelacion. Cada <code>useEffect</code> que dispara un fetch sin cancelar al desmontarse es una fuga. La regla: si lo arrancas, planifica como apagarlo.</li></ol><p>Tambien hay un detalle del ecosistema que conviene entender desde el primer dia: hay dos sistemas de modulos coexistiendo (<strong>ESM</strong> moderno con <code>import/export</code>, <strong>CommonJS</strong> antiguo con <code>require/module.exports</code>). Casi todo lo nuevo es ESM, pero te vas a encontrar libs antiguas que mezclan los dos — saber distinguirlos te ahorra horas de bug "no se por que no se importa".</p>`,
              "m4-s2-intro",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "warning",
              `<p><strong>Regla del senior</strong>: en backend cierras la conexion cuando terminas. En frontend cancelas la request cuando el usuario ya no la necesita. Es el mismo principio invertido. Un <code>useEffect</code> que arranca un fetch sin <code>AbortController</code> en el cleanup es una fuga garantizada: el dia que el usuario navega rapido entre paginas, vas a tener 8 requests en vuelo modificando estado de componentes desmontados. Y vas a pasar 4 horas debuggeando el "warning: can't perform a React state update on an unmounted component" sin entender que es el mismo bug repetido.</p>`,
              "m4-s2-tip",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "javascript",
              `// PROMISE.ALL vs PROMISE.ALLSETTLED — cuando cada uno

// Promise.all: uno falla → todos rechazan.
// Usar cuando NO PUEDES seguir si falta alguno.
try {
  const [usuario, permisos, prefs] = await Promise.all([
    fetch("/api/me").then(r => r.json()),
    fetch("/api/me/permisos").then(r => r.json()),
    fetch("/api/me/preferencias").then(r => r.json()),
  ]);
  // Si cualquiera de los 3 falla, no llegas aqui.
  // No tiene sentido renderizar la app sin permisos del usuario.
} catch (e) {
  mostrarError("No pudimos cargar tu sesion");
}

// Promise.allSettled: cada promesa reporta su resultado individual.
// Usar cuando PUEDES degradar gracefully.
const resultados = await Promise.allSettled([
  fetch("/api/notificaciones"),
  fetch("/api/feed-novedades"),
  fetch("/api/tips"),
]);

for (const r of resultados) {
  if (r.status === "fulfilled") renderizarBloque(await r.value.json());
  else                          renderizarPlaceholder();
}
// Aqui pintas lo que SI cargo y placeholder en lo que no.
// El usuario sigue viendo algo util en vez de pantalla blanca.


// ABORTCONTROLLER — el patron de cancelacion del frontend

function useUsuario(id) {
  useEffect(() => {
    const controller = new AbortController();

    fetch(\`/api/users/\${id}\`, { signal: controller.signal })
      .then(r => r.json())
      .then(setUsuario)
      .catch(e => {
        if (e.name === "AbortError") return;  // cancelacion intencional, no error
        mostrarError(e);
      });

    return () => controller.abort();  // CLEANUP: si el componente se desmonta
  }, [id]);                            // o el id cambia, cancela la request en vuelo
}

// Sin AbortController: el usuario cambia 5 veces de pantalla rapido, quedan
// 5 fetch en vuelo, todas terminan, todas intentan setUsuario en componentes
// que ya no existen. Resultado: warnings + posible race condition en cual
// "gana" (no es la ultima, es la mas rapida).`,
              "Los tres patrones que un dev backend tiene que dominar el primer mes en frontend: Promise.all vs allSettled como decision de UX, y AbortController como el cleanup obligatorio de cualquier request asincrona en un componente.",
              "m4-s2-codigo",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "JavaScript moderno (perspectiva backend)",
            contenido: buildQuiz(
              [
                {
                  id: "q1",
                  enunciado:
                    "<p>Vas a cargar usuario, permisos y preferencias para renderizar el dashboard. Si CUALQUIERA falla, no puedes seguir. ¿Cual usas?</p>",
                  explicacion:
                    "Promise.all es la herramienta correcta cuando los 3 son requisitos: si uno falla, todo rechaza y manejas el error en un solo catch. allSettled estaria mal aqui porque te obligaria a chequear estado de cada uno antes de poder usar el resultado conjunto.",
                  opciones: [
                    { id: "a", texto: "Promise.all([...])", esCorrecta: true },
                    { id: "b", texto: "Promise.allSettled([...])", esCorrecta: false },
                    { id: "c", texto: "Promise.race([...])", esCorrecta: false },
                    { id: "d", texto: "Tres await consecutivos en serie", esCorrecta: false },
                  ],
                },
                {
                  id: "q2",
                  enunciado:
                    "<p>Cargas 3 bloques opcionales del dashboard (notificaciones, novedades, tips). Si alguno falla, el resto deberia mostrarse igual. ¿Cual usas?</p>",
                  explicacion:
                    "allSettled es la respuesta: cada bloque reporta su resultado por separado. Lo que cargo se renderiza, lo que fallo muestra placeholder. Promise.all aqui seria un antipatron — si tips falla, pierdes notificaciones y novedades por una razon que no controla el usuario.",
                  opciones: [
                    { id: "a", texto: "Promise.all([...])", esCorrecta: false },
                    { id: "b", texto: "Promise.allSettled([...])", esCorrecta: true },
                    {
                      id: "c",
                      texto: "Try/catch alrededor de cada fetch en serie",
                      esCorrecta: false,
                    },
                    { id: "d", texto: "Fire-and-forget sin await", esCorrecta: false },
                  ],
                },
                {
                  id: "q3",
                  enunciado:
                    "<p>¿Que hace <code>AbortController</code> y cuando se usa en frontend?</p>",
                  explicacion:
                    "AbortController te da una señal (signal) que puedes pasar a fetch (u otras APIs compatibles). Al llamar abort(), la operacion se cancela y emite un AbortError. En frontend se usa en el cleanup de useEffect para que requests en vuelo no actualicen componentes desmontados. En backend casi nunca lo necesitas porque las requests son cortas y sincronas.",
                  opciones: [
                    { id: "a", texto: "Aborta todo el script si hay un error", esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        "Cancela una operacion async (como un fetch) cuando ya no se necesita el resultado",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Reemplaza try/catch en codigo async", esCorrecta: false },
                    {
                      id: "d",
                      texto: "Bloquea el event loop hasta que termine",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q4",
                  enunciado:
                    "<p>¿Que diferencia hay entre <code>await fetch(...)</code> y <code>fetch(...).then(...)</code>?</p>",
                  explicacion:
                    "Funcionalmente son equivalentes — await es azucar sintactico sobre .then. La diferencia es de legibilidad y manejo de errores: await deja el codigo lineal y permite try/catch normal; .then requiere encadenar .catch al final. Para flujos largos con varias dependencias, await es casi siempre mas legible.",
                  opciones: [
                    { id: "a", texto: "await es sincrono, .then es asincrono", esCorrecta: false },
                    { id: "b", texto: "await es mas rapido", esCorrecta: false },
                    {
                      id: "c",
                      texto:
                        "Funcionalmente son equivalentes — await es azucar sintactico sobre .then. Se usa por legibilidad",
                      esCorrecta: true,
                    },
                    {
                      id: "d",
                      texto: ".then esta deprecated en favor de await",
                      esCorrecta: false,
                    },
                  ],
                },
              ],
              "m4-s2-quiz",
            ),
          },
          {
            idForzado: ID_M4_S2_PREG,
            tipo: TipoBloque.CODIGO_PREGUNTAS,
            esEvaluable: true,
            skill: "JavaScript moderno (perspectiva backend)",
            contenido: buildCodigoPreguntas(
              "javascript",
              `La IA te genero el siguiente codigo. Imprime los nombres en el orden
en que estan declarados (Maria, Juan, Lucia) — pero el cliente queria
verlos en el orden CRONOLOGICO real (cuando cada uno termina su tarea).

Tu trabajo: arregla el codigo para que imprima:
  Juan
  Lucia
  Maria

(Juan termina primero porque es el mas rapido — 30ms. Luego Lucia — 60ms.
Y al final Maria — 90ms.)

Pista: Promise.all preserva el orden de ENTRADA en el array de resultados.
Si quieres reaccionar cuando CADA tarea termina, tienes que enganchar el
.then de cada una por separado.`,
              `const tareas = [
  () => new Promise((r) => setTimeout(() => r("Maria"), 90)),
  () => new Promise((r) => setTimeout(() => r("Juan"), 30)),
  () => new Promise((r) => setTimeout(() => r("Lucia"), 60)),
];

// La IA te dio esto. Imprime "Maria, Juan, Lucia" en ese orden — MAL.
// Arreglalo para que imprima cada nombre CUANDO TERMINE DE VERDAD.
async function correr() {
  const resultados = await Promise.all(tareas.map((t) => t()));
  resultados.forEach((r) => console.log(r));
}

correr();`,
              "m4-s2-cp",
            ),
          },
          {
            idForzado: ID_M4_S2_TEST,
            tipo: TipoBloque.CODIGO_TESTS,
            esEvaluable: false,
            contenido: buildCodigoTests(
              ID_M4_S2_PREG,
              `const tareas = [
  () => new Promise((r) => setTimeout(() => r("Maria"), 90)),
  () => new Promise((r) => setTimeout(() => r("Juan"), 30)),
  () => new Promise((r) => setTimeout(() => r("Lucia"), 60)),
];

tareas.forEach((t) => t().then((r) => console.log(r)));`,
              [
                {
                  id: "t1",
                  descripcion: "Imprime los nombres en orden cronologico de finalizacion",
                  entrada: "",
                  salidaEsperada: "Juan\nLucia\nMaria\n",
                  visible: true,
                },
                {
                  id: "t2",
                  descripcion: "Juan aparece primero (es la tarea mas rapida, 30ms)",
                  entrada: "",
                  salidaEsperada: "Juan\nLucia\nMaria\n",
                  visible: true,
                },
                {
                  id: "t3",
                  descripcion: "Maria aparece al final (es la tarea mas lenta, 90ms)",
                  entrada: "",
                  salidaEsperada: "Juan\nLucia\nMaria\n",
                  visible: false,
                },
              ],
              "m4-s2-ct",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://javascript.info/async",
              "javascript.info — Promises, async/await",
              "Capitulo completo sobre async en JS: promesas, async/await, Promise.all y allSettled, manejo de errores, microtasks. Con ejercicios al final de cada seccion. Si vienes de async de Python o de threads de Java, este capitulo te explica las diferencias importantes paso a paso.",
              "m4-s2-recurso",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p class="font-serif italic text-aurora-violet" style="font-size: 1.5rem; line-height: 1.4;">"Tus instintos de Java o Python no son malos — son de otro lenguaje. JS premia a quien lo aprende como lo que es, no como lo que le recuerda."</p><p>Hasta aqui has cambiado el modelo mental en los tres puntos que mas duelen: scoping, this, event loop. Y has aprendido el oficio del async moderno: Promise.all vs allSettled como decision de UX, AbortController como cleanup obligatorio. Lo que viene en los siguientes modulos (TypeScript, React, Tanstack Query) se monta sobre esto. Si dudas en algun momento "¿este this que es?" o "¿por que mi useEffect dispara dos veces?", vuelve aqui — la respuesta casi siempre esta en uno de los tres instintos que ya te cuesta menos pillar.</p>`,
              "m4-s2-cierre",
            ),
          },
        ],
      },
    ],
  },
  {
    idx: 6,
    titulo: "Modulo 5 — TypeScript como herramienta de diseño",
    descripcion:
      "TS no es Java con sintaxis distinta. Es tipos estructurales, narrowing y generics que modelan dominio.",
    secciones: [
      {
        titulo: "Types, narrowing y utility types",
        skill: "TypeScript estricto",
        temas:
          "tipos estructurales vs nominales, narrowing con typeof/in/discriminated unions, Partial/Pick/Omit/Record, never como senial de exhaustividad.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<h2>TS no es Java con tipos: es diseño del dominio</h2><p>Si vienes de Java, ya conoces "tipos". El instinto natural al llegar a TypeScript es tratarlo como un linter glorificado que evita typos. Eso es usar el 20% de TS. El otro 80% — el que cambia tu carrera — es <strong>modelar el dominio con tipos para que los bugs no puedan compilar</strong>.</p><p>Pensalo asi: en backend usas Pydantic, dataclasses o records para modelar tu dominio. Te ahorra validaciones manuales y deja claro qué forma tienen los datos. TS hace lo mismo en frontend, pero en <em>tiempo de compilación</em>: bien usado, el código que representa un estado imposible (por ejemplo "loading + data al mismo tiempo") <strong>ni siquiera compila</strong>.</p><p>Hay dos cambios de modelo que duelen al principio y desbloquean todo despues:</p><ol><li><strong>Tipos estructurales, no nominales</strong>. En Java, una clase <code>User</code> es distinta de cualquier otra clase aunque tenga los mismos campos. En TS, una <code>interface User { id: string }</code> matchea con CUALQUIER objeto que tenga <code>id: string</code>. Es "duck typing" tipado. Esto te asusta al principio pero es la base de lo que hace TS expresivo.</li><li><strong>Discriminated unions para estados</strong>. En vez de modelar "tengo un estado con loading + data + error opcionales", modelas "soy uno de estos tres estados, y solo uno". El tipo te garantiza que no puede haber "loading y data al mismo tiempo" porque el tipo no lo permite. Esto es lo que significa "diseñar con tipos" — y es lo que separa a un dev TS de un dev "Java con sintaxis distinta".</li></ol>`,
              "m5-s1-intro",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>Regla del senior</strong>: si necesitas un <code>as</code> para que tu codigo compile, casi siempre es señal de que tu tipo esta mal modelado. El cast no añade informacion — solo silencia al compilador. Antes de escribir <code>x as Foo</code>, parate y preguntate: "¿por que TS no puede inferir esto solo?". La respuesta casi siempre es "porque mi tipo de entrada esta demasiado abierto" — y la solucion es ajustar el tipo, no parchar con cast.</p>`,
              "m5-s1-tip",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `// 1) TIPOS ESTRUCTURALES — la duck-typing tipada que rompe al dev Java

interface Usuario { id: string; nombre: string; }

function saludar(u: Usuario): string {
  return "Hola, " + u.nombre;
}

// En Java esto fallaria (la clase no implementa Usuario).
// En TS funciona — la forma coincide, eso basta.
const obj = { id: "1", nombre: "Martin", edad: 30 };
saludar(obj);   // ✓ ok: obj tiene { id, nombre }, los campos extra no estorban


// 2) DISCRIMINATED UNION — modelar estados imposibles como imposibles

// MAL — campos opcionales, estados invalidos compilables
interface UsuarioStateMal {
  loading: boolean;
  data?: Usuario;
  error?: string;
}
// Esto permite { loading: true, data: u, error: "x" } simultaneamente — ¡incoherente!

// BIEN — discriminated union: solo uno de los 3 estados a la vez
type UsuarioState =
  | { status: "loading" }
  | { status: "success"; data: Usuario }
  | { status: "error"; error: string };

function renderizar(state: UsuarioState): string {
  // TS NARROW automaticamente segun status — sin casts, sin (state as ...)
  switch (state.status) {
    case "loading": return "Cargando...";
    case "success": return "Hola, " + state.data.nombre;   // aqui data esta garantizado
    case "error":   return "Error: " + state.error;
    default: {
      const _exhaustive: never = state;   // 3) NEVER = exhaustividad obligatoria
      return _exhaustive;
      // Si mañana añades { status: "idle" } al union sin manejarlo aqui,
      // TS te lanza un error: 'Type { status: "idle" } is not assignable to never'.
    }
  }
}


// 4) UTILITY TYPES — deriva tipos sin duplicar

interface CrearUsuarioInput {
  email: string;
  nombre: string;
  apellido: string;
  rol: "ADMIN" | "PARTICIPANTE";
  password: string;
}

// PUT /usuarios/:id — todos los campos opcionales para actualizar parcial
type ActualizarUsuarioInput = Partial<CrearUsuarioInput>;
// Equivale a: { email?: string; nombre?: string; ... }

// Respuesta al cliente: sin password
type UsuarioResponse = Omit<CrearUsuarioInput, "password"> & { id: string };

// Diccionario de usuarios por id
type UsuariosPorId = Record<string, UsuarioResponse>;

// Cuando renombres/añadas un campo a CrearUsuarioInput, los 3 tipos derivados
// se actualizan solos. Cero mantenimiento, cero duplicacion.`,
              "Los 4 conceptos que cambian el juego: tipos estructurales (duck typing tipado), discriminated unions (estados imposibles imposibles), never (exhaustividad obligatoria) y utility types (derivar sin duplicar). Una vez los tienes, dejas de escribir TS como 'JS con anotaciones'.",
              "m5-s1-codigo",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "TypeScript estricto",
            contenido: buildQuiz(
              [
                {
                  id: "q1",
                  enunciado:
                    "<p>¿Cual es la diferencia clave entre tipos <strong>nominales</strong> (Java/C#) y tipos <strong>estructurales</strong> (TS)?</p>",
                  explicacion:
                    "En Java, dos clases con los mismos campos son tipos distintos (nominal). En TS, dos interfaces con los mismos campos son intercambiables (estructural): basta con que la forma coincida. Es 'duck typing' tipado — si camina como pato y suena como pato, TS lo acepta como pato.",
                  opciones: [
                    { id: "a", texto: "TS es más rapido en runtime", esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        "En nominales importa la clase declarada; en estructurales importa solo la forma (los campos coinciden)",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "TS no soporta clases", esCorrecta: false },
                    { id: "d", texto: "Java permite herencia múltiple", esCorrecta: false },
                  ],
                },
                {
                  id: "q2",
                  enunciado:
                    "<p>Quieres modelar el estado de una consulta (cargando / éxito con datos / error con mensaje). ¿Cuál es el tipo correcto?</p>",
                  explicacion:
                    "Discriminated union: cada variante tiene un discriminador (status) y los campos asociados a ese estado. Hace imposibles los estados invalidos como 'loading: true, data: x'. La version con booleans + opcionales permite estados incoherentes compilables — es el origen de la mitad de los bugs de UI.",
                  opciones: [
                    {
                      id: "a",
                      texto: "{ loading: boolean; data?: T; error?: string }",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "{ status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: string }",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "{ state: string; value: any }", esCorrecta: false },
                    { id: "d", texto: "class Estado { loading; data; error; }", esCorrecta: false },
                  ],
                },
                {
                  id: "q3",
                  enunciado:
                    "<p>Tienes <code>type Curso = { id: string; titulo: string; descripcion: string; precio: number; }</code> y quieres un tipo para el formulario de creacion <strong>sin el id</strong>. ¿Cual es la forma idiomatica?</p>",
                  explicacion:
                    "Omit<Curso, 'id'> crea un nuevo tipo con todos los campos de Curso EXCEPTO id. Si mañana renombras un campo o añades uno nuevo a Curso, el tipo derivado se actualiza solo. Duplicar manualmente o redeclarar la interface es la receta para que se desincronicen.",
                  opciones: [
                    {
                      id: "a",
                      texto:
                        "type CursoForm = { titulo: string; descripcion: string; precio: number; }",
                      esCorrecta: false,
                    },
                    { id: "b", texto: "type CursoForm = Omit<Curso, 'id'>", esCorrecta: true },
                    { id: "c", texto: "type CursoForm = Partial<Curso>", esCorrecta: false },
                    {
                      id: "d",
                      texto: "type CursoForm = Curso & { id?: undefined }",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q4",
                  enunciado:
                    "<p>En el switch del estado, ¿para que sirve un default que asigna a una variable <code>: never</code>?</p>",
                  explicacion:
                    "never es 'el tipo que no puede tener valor'. Si TS llega al default con un valor real, significa que olvidaste manejar una variante del union — y TS te dice 'no puedo asignar X a never'. Es la forma de hacer la exhaustividad obligatoria en compile-time: el dia que añades un caso nuevo, TS te obliga a manejarlo.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Para indicar que el switch no devuelve nada",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Para forzar exhaustividad: si añades una variante nueva al union, TS rompera aqui obligandote a manejarla",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Para ocultar errores", esCorrecta: false },
                    { id: "d", texto: "Para mejorar el rendimiento", esCorrecta: false },
                  ],
                },
              ],
              "m5-s1-quiz",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://www.typescriptlang.org/docs/handbook/2/narrowing.html",
              "TS Handbook — Narrowing",
              "Capitulo oficial sobre como TS estrecha los tipos en base a checks: typeof, in, instanceof, discriminated unions, type predicates. Es la base para escribir TS sin 'as' casteos. Si lo lees una vez con calma, dejas de pelearte con el compilador.",
              "m5-s1-recurso",
            ),
          },
        ],
      },
      {
        titulo: "Generics, inferencia y por que no usas `any`",
        skill: "TypeScript estricto",
        temas:
          "constraints con extends, inferencia de retorno, unknown vs any, refactor de funcion con any a generica tipada, satisfies operator.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<h2>El oficio: generics, <code>unknown</code> y matar el <code>any</code></h2><p>El paso de "dev TS aceptable" a "dev TS profesional" pasa por tres herramientas que casi nadie usa bien al principio: <strong>generics</strong>, <strong><code>unknown</code></strong> y <strong><code>satisfies</code></strong>. Las tres atacan el mismo problema desde angulos distintos: como tipar lo flexible sin caer en <code>any</code>.</p><p><strong><code>unknown</code> vs <code>any</code></strong>: ambos aceptan cualquier valor — pero <code>any</code> se rinde (puedes hacer lo que quieras sin que TS proteste) mientras que <code>unknown</code> te obliga a narrow antes de usar (TS no te deja acceder a propiedades hasta que demuestres qué es). El default sano cuando entra input no confiable (respuesta de fetch, body de un form, mensaje de localStorage) es <code>unknown</code> — nunca <code>any</code>.</p><p><strong>Generics</strong>: el dev backend a menudo los evita porque "se ven complicados". En realidad son la herramienta que te permite escribir UNA funcion que tipa correctamente para muchos casos. Si te encuentras escribiendo <code>findById</code> 3 veces (una para User, una para Course, una para Module), te falta un generic. Y la inferencia hace que la mayoria ni siquiera tengas que declararlos — TS los deduce solo.</p><p><strong><code>satisfies</code></strong>: el operador moderno (TS 4.9+) que reemplaza los <code>as</code> en el 80% de los casos. Confirma que tu valor cumple un tipo SIN ampliar ni estrechar el tipo inferido. Es "validar sin perder informacion". Una vez lo usas, los <code>as</code> empiezan a oler mal.</p><p>Sobre <code>any</code>: cada <code>any</code> que escribes es una <em>promesa al equipo</em> de que ahi no merecia la pena tipar. Casi nunca es verdad. Y el codigo con <code>any</code> es el primer sospechoso cuando aparece un bug raro de produccion — porque TS no tuvo manera de protegerte.</p>`,
              "m5-s2-intro",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "warning",
              `<p><strong>Regla del senior</strong>: cada <code>any</code> que escribes es una promesa al equipo: <em>"aqui no vale la pena el tipo"</em>. Casi nunca es verdad. El default profesional cuando entra data no confiable (fetch, localStorage, body de un form) es <code>unknown</code> + narrow con Zod o con type guards. <code>any</code> queda solo para casos REALMENTE excepcionales — y siempre con un comentario explicando por que no se pudo tipar. Si tu PR tiene 4 <code>any</code> sin justificar, no es un PR de TS — es JS con anotaciones que estorban.</p>`,
              "m5-s2-tip",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `// 1) UNKNOWN vs ANY — la diferencia que te ahorra bugs

function procesarApi(respuesta: any) {
  return respuesta.usuario.email.toLowerCase();    // ✓ compila, ✗ explota en runtime si respuesta es null
}

function procesarApiBien(respuesta: unknown) {
  // TS no te deja acceder a .usuario sin demostrar que existe
  // respuesta.usuario.email     ← ERROR: 'respuesta' is of type 'unknown'

  if (
    typeof respuesta === "object" && respuesta !== null &&
    "usuario" in respuesta && typeof respuesta.usuario === "object" &&
    respuesta.usuario !== null && "email" in respuesta.usuario &&
    typeof respuesta.usuario.email === "string"
  ) {
    return respuesta.usuario.email.toLowerCase();   // ✓ aqui TS sabe que es seguro
  }
  return null;
}

// En la practica, en vez de narrowing manual: usar Zod para validar y tipar.
// Lo veremos en modulos posteriores.


// 2) GENERICS — una funcion, muchos tipos, cero duplicacion

// MAL — repites la funcion para cada tipo
function findUserById(items: Usuario[], id: string): Usuario | undefined {
  return items.find(item => item.id === id);
}
function findCourseById(items: Curso[], id: string): Curso | undefined {
  return items.find(item => item.id === id);
}

// BIEN — una sola funcion generica
function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

const u: Usuario | undefined = findById<Usuario>(usuarios, "u1");
const c: Curso   | undefined = findById(cursos, "c1");   // TS infiere T solo
// Notar: la mayoria de las veces no hace falta declarar <T> — la inferencia lo hace.


// 3) SATISFIES — validar el tipo sin perder la inferencia (TS 4.9+)

// CON 'as': pierdes la inferencia del literal — TS te devuelve el tipo amplio
const configMal = {
  api: "https://api.nexott.local",
  timeout: 5000,
  retry: { intentos: 3, backoffMs: 200 },
} as Record<string, unknown>;
// configMal.retry.intentos    ← ERROR: 'unknown' (perdiste la forma especifica)

// CON 'satisfies': TS valida que cumple la forma pero MANTIENE el tipo concreto
const configBien = {
  api: "https://api.nexott.local",
  timeout: 5000,
  retry: { intentos: 3, backoffMs: 200 },
} satisfies Record<string, unknown>;
configBien.retry.intentos;     // ✓ TS sabe que es number — informacion preservada


// 4) REFACTOR — funcion con 'any' que se vuelve generica y segura

// ANTES — any se rinde, bug silencioso
function primero(items: any[]): any {
  return items[0];
}
const p1: any = primero([1, 2, 3]);
p1.toUpperCase();   // ✓ compila, ✗ TypeError en runtime

// DESPUES — generic con inferencia, bug imposible
function primeroBien<T>(items: T[]): T | undefined {
  return items[0];
}
const p2 = primeroBien([1, 2, 3]);    // p2: number | undefined
// p2.toUpperCase();    ← ERROR: Property 'toUpperCase' does not exist on type 'number'.
const p3 = primeroBien(["a", "b"]);    // p3: string | undefined
p3?.toUpperCase();                      // ✓ aqui si compila`,
              "Los 4 movimientos que cambian tu TS: usar unknown + narrowing en vez de any, escribir generics con extends para una funcion que sirve para muchos tipos, satisfies en vez de as, y el refactor canonico any → generic.",
              "m5-s2-codigo",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "TypeScript estricto",
            contenido: buildQuiz(
              [
                {
                  id: "q1",
                  enunciado:
                    "<p>Estas parseando la respuesta de un endpoint externo. ¿Cual es el tipo correcto para la variable cruda antes de validarla?</p>",
                  explicacion:
                    "unknown es el default sano para input no confiable: TS te obliga a validar antes de usar. any se rinde y deja pasar todo, incluido acceder a propiedades que en runtime pueden no existir. La validacion la haces con Zod, un type guard o un narrowing manual — y solo despues tienes un tipo seguro para trabajar.",
                  opciones: [
                    { id: "a", texto: "any", esCorrecta: false },
                    { id: "b", texto: "unknown", esCorrecta: true },
                    { id: "c", texto: "object", esCorrecta: false },
                    { id: "d", texto: "Record<string, string>", esCorrecta: false },
                  ],
                },
                {
                  id: "q2",
                  enunciado:
                    "<p>Tienes que escribir 3 funciones que devuelven el primer elemento de un array (una para User, una para Course, una para Module). ¿Cual es la forma correcta en TS?</p>",
                  explicacion:
                    "Una sola funcion generica con <T> resuelve los 3 casos preservando el tipo. La inferencia hace que la mayoria de las llamadas ni siquiera necesiten declarar <T> — TS lo deduce del argumento. Triplicar la funcion duplica la deuda y nunca queda en sync cuando un caso cambia.",
                  opciones: [
                    { id: "a", texto: "Escribir las 3 funciones por separado", esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        "Una sola funcion generica: function primero<T>(items: T[]): T | undefined",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Una funcion que acepta any[] y devuelve any",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "Una funcion con union: items: User[] | Course[] | Module[]",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q3",
                  enunciado:
                    "<p>¿Cual es la diferencia entre <code>as</code> y <code>satisfies</code> al validar el tipo de un objeto?</p>",
                  explicacion:
                    "satisfies valida que el valor cumple un tipo pero PRESERVA el tipo inferido (literales, formas exactas). as fuerza el tipo amplio y pierdes la inferencia. Para configs, tablas de mapeos, datos que tienen una forma especifica que quieres preservar, satisfies es casi siempre la respuesta correcta.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Son sinonimos, satisfies es solo sintaxis moderna",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "satisfies valida la forma pero preserva el tipo concreto inferido; as fuerza el tipo amplio y pierde la inferencia",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "as es mas seguro en runtime", esCorrecta: false },
                    { id: "d", texto: "satisfies solo funciona con interfaces", esCorrecta: false },
                  ],
                },
                {
                  id: "q4",
                  enunciado:
                    "<p>Te encuentras esto en un PR: <code>const data = res as any;</code>. ¿Que comentario dejarias en code review?</p>",
                  explicacion:
                    "any silencia al compilador sin añadir informacion. Lo correcto es 'unknown' + validacion con Zod (o type guard) para narrow al tipo real. El any es el primer sospechoso cuando aparece un bug raro de produccion porque TS no tuvo manera de protegerte. Aprobar 'as any' sin pelearlo es romper el contrato de TS estricto.",
                  opciones: [
                    { id: "a", texto: "Nada, esta bien si funciona", esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        "Pediria cambiar a 'unknown' + validar con Zod o type guard para narrow al tipo real",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Pediria añadir un // @ts-ignore al lado",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "Pediria usar 'as never' que es mas estricto",
                      esCorrecta: false,
                    },
                  ],
                },
              ],
              "m5-s2-quiz",
            ),
          },
          {
            idForzado: ID_M5_S2_PREG,
            tipo: TipoBloque.CODIGO_PREGUNTAS,
            esEvaluable: true,
            skill: "TypeScript estricto",
            contenido: buildCodigoPreguntas(
              "typescript",
              `La IA te dio el siguiente codigo para sumar las edades de un array
de usuarios. Compila SIN errores (porque usa any[]), pero al ejecutarlo
imprime NaN en vez de la suma real.

Hay un typo en una property: "u.adge" en vez de "u.age". El any silencio
al compilador — con el tipo correcto, TS habria detectado el typo antes
de ejecutar.

Tu trabajo: arregla el codigo para que imprima la suma real (90).
Bonus pedagogico: cambia tambien el tipo del parametro de any[] a User[]
para que la proxima vez TS te proteja.`,
              `interface User {
  nombre: string;
  age: number;
}

const usuarios: User[] = [
  { nombre: "Ana", age: 30 },
  { nombre: "Luis", age: 25 },
  { nombre: "Marta", age: 35 },
];

// La IA te dio esto. Compila SIN errores (any silencia los typos), pero
// imprime NaN. Arreglalo para que imprima 90.
//
// Bonus: cambia 'any[]' a 'User[]' para que TS te proteja en el futuro.
function sumarEdades(items: any[]): number {
  return items.reduce((total, u) => total + u.adge, 0);
}

console.log(sumarEdades(usuarios));`,
              "m5-s2-cp",
            ),
          },
          {
            idForzado: ID_M5_S2_TEST,
            tipo: TipoBloque.CODIGO_TESTS,
            esEvaluable: false,
            contenido: buildCodigoTests(
              ID_M5_S2_PREG,
              `interface User {
  nombre: string;
  age: number;
}

const usuarios: User[] = [
  { nombre: "Ana", age: 30 },
  { nombre: "Luis", age: 25 },
  { nombre: "Marta", age: 35 },
];

function sumarEdades(items: User[]): number {
  return items.reduce((total, u) => total + u.age, 0);
}

console.log(sumarEdades(usuarios));`,
              [
                {
                  id: "t1",
                  descripcion: "Imprime la suma real de las edades (30 + 25 + 35 = 90)",
                  entrada: "",
                  salidaEsperada: "90\n",
                  visible: true,
                },
                {
                  id: "t2",
                  descripcion: "No imprime NaN — el typo 'adge' fue corregido a 'age'",
                  entrada: "",
                  salidaEsperada: "90\n",
                  visible: true,
                },
                {
                  id: "t3",
                  descripcion: "La suma es exacta (no es 89, no es 91)",
                  entrada: "",
                  salidaEsperada: "90\n",
                  visible: false,
                },
              ],
              "m5-s2-ct",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://www.typescriptlang.org/docs/handbook/2/generics.html",
              "TS Handbook — Generics",
              "Capitulo oficial sobre generics: constraints con extends, inferencia, generics en clases, utility types comunes. Es la lectura que separa al dev que evita generics del que los usa naturalmente. Una hora bien invertida.",
              "m5-s2-recurso",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p class="font-serif italic text-aurora-violet" style="font-size: 1.5rem; line-height: 1.4;">"TS no se usa para anotar el codigo. Se usa para diseñar el dominio. Cuando lo entiendes, dejas de pelear con el compilador — y empiezas a pedirle que te cuide."</p><p>Estos dos modulos (HTML semantico, TS estricto) son los que mas separan al dev frontend profesional del aficionado: ambos parecen "el detalle al lado del codigo real" y resultan ser el codigo real. Los siguientes modulos (Disciplina, React, Tanstack Query, Testing) montan sobre lo que aprendiste aqui. Si dudas en algun snippet "¿por que TS me deja hacer esto?" o "¿por que no infiere lo que quiero?", vuelve aqui — la respuesta casi siempre esta en uno de los modelos que ya empiezas a tener en la cabeza.</p>`,
              "m5-s2-cierre",
            ),
          },
        ],
      },
    ],
  },
  {
    idx: 7,
    titulo: "Modulo 6 — Disciplina del proyecto sano",
    descripcion:
      "Las herramientas y politicas que mantienen un repo limpio bajo presion: lo que separa un PR aceptable de uno que se devuelve.",
    secciones: [
      {
        titulo: "Herramientas: Biome, husky, lint-staged",
        skill: "Disciplina de proyecto sano",
        temas:
          "que problema resuelve cada uno, configuracion realista, hooks pre-commit y pre-push, ejecutar lint sobre solo archivos staged.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<h2>Las herramientas no son adorno: son la red de seguridad</h2><p>Cuando llegues a un repo frontend serio y veas <code>biome.json</code>, una carpeta <code>.husky/</code> y una entrada de <code>lint-staged</code> en el <code>package.json</code>, tu instinto puede ser: "más cosas que ralentizan". <strong>Es exactamente al reves</strong>. Esas tres piezas son lo que evita que el codigo basura llegue a develop, lo que mantiene los commits leibles, lo que asegura que un PR no rompa el build del compañero.</p><p>Pensalo en clave backend: las migraciones de Prisma no son burocracia, son lo que evita que un cambio de schema rompa produccion. Las herramientas de disciplina son lo mismo para el codigo: <strong>red de seguridad que protege a quien se compromete</strong>. Cuando las bypaseas (<code>git commit --no-verify</code>, <code>// biome-ignore</code> sin razón, "ya lo arreglo despues"), no te ahorras tiempo: trasladas el coste a quien viene detras.</p><p>Las tres piezas trabajan juntas:</p><ul><li><strong>Biome</strong>: lint + format en una sola herramienta moderna y rapida. Reemplaza el viejo combo Prettier + ESLint que peleaba consigo mismo. Es la fuente unica de verdad para "como se escribe codigo aqui".</li><li><strong>Husky</strong>: hooks de git versionados con el repo. La diferencia es enorme — sin husky, los hooks viven en <code>.git/hooks</code> (local, cada dev tiene los suyos); con husky, viven en <code>.husky/</code> (parte del repo, todos comparten exactamente las mismas validaciones).</li><li><strong>lint-staged</strong>: corre Biome solo sobre los archivos <strong>staged</strong>, no sobre todo el repo. Pre-commit que dura 200ms en vez de 8 segundos. La diferencia entre "el hook ayuda" y "el hook molesta tanto que lo bypaseas".</li></ul>`,
              "m6-s1-intro",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              "<p><strong>Regla del senior</strong>: si tu pre-push tarda mas de 30 segundos, vas a empezar a bypasearlo. Y cuando lo hagas tu, el resto del equipo lo hara despues. Optimiza el pipeline antes de que la gente pierda la confianza en el — porque el dia que se rompe la confianza no la recuperas. Ejecutar tests en paralelo, cachear builds, dividir validaciones rapidas (pre-commit) de lentas (pre-push o CI), son inversiones que pagan en habito del equipo, no solo en segundos ahorrados.</p>",
              "m6-s1-tip",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "json",
              `// 1) biome.json — config minima realista para un proyecto TS + React
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "error",
        "noConsoleLog": "error"
      },
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  }
}


// 2) package.json — entrada de lint-staged: solo archivos staged
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["biome format --write", "biome check --write"],
    "*.{json,md,yaml,yml}": ["biome format --write"]
  }
}


// 3) .husky/pre-commit — lint-staged sobre lo modificado (rapido)
// #!/bin/sh
// pnpm exec lint-staged


// 4) .husky/pre-push — validacion completa antes de pushear (mas lento, pero rara vez)
// #!/bin/sh
// make validate   # = typecheck + lint + test


// 5) .husky/commit-msg — commits siguen conventional commits
// #!/bin/sh
// pnpm exec commitlint --edit "$1"


// El combo deja al equipo con 4 garantias automaticas:
//   - Cada commit pasa lint sobre lo que cambio (pre-commit)
//   - Cada mensaje sigue el formato (commit-msg)
//   - Cada push pasa typecheck + lint + tests completos (pre-push)
//   - Y aun asi, CI corre todo otra vez antes de aceptar el merge (defensa en profundidad)`,
              "Config completa del blindaje en un proyecto frontend real: biome.json con reglas en error (no warning), lint-staged para que pre-commit sea rapido, y los 3 hooks de husky encadenados. Cada pieza cumple un trabajo distinto — el conjunto es la red de seguridad.",
              "m6-s1-codigo",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "Disciplina de proyecto sano",
            contenido: buildQuiz(
              [
                {
                  id: "q1",
                  enunciado:
                    "<p>¿Cual es la diferencia entre los hooks en <code>.git/hooks/</code> y los hooks gestionados por <code>husky</code> en <code>.husky/</code>?</p>",
                  explicacion:
                    ".git/ es ignorado por git (es donde git guarda su estado interno). Los hooks ahi son LOCALES — cada dev tiene los suyos y no se comparten. Husky los pone en .husky/ que SI se versiona: el equipo entero comparte exactamente las mismas validaciones, sin depender de que cada uno los configure a mano.",
                  opciones: [
                    { id: "a", texto: "Ninguna, son sinonimos", esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        ".git/hooks/ es local (no se versiona); .husky/ esta en el repo y se aplica a todo el equipo",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Husky es mas lento", esCorrecta: false },
                    { id: "d", texto: ".git/hooks/ solo funciona en Linux", esCorrecta: false },
                  ],
                },
                {
                  id: "q2",
                  enunciado:
                    "<p>¿Por que <code>lint-staged</code> corre el linter solo sobre los archivos <strong>staged</strong> y no sobre todo el repo?</p>",
                  explicacion:
                    "Correr lint sobre todo el repo en cada commit es lento (5-15 segundos en proyectos medianos). Con lint-staged, validas solo lo que cambio (200ms-1seg). La diferencia es entre 'el hook ayuda' y 'el hook molesta tanto que la gente lo bypasea'. La validacion completa se hace en pre-push o en CI, donde el coste se amortiza.",
                  opciones: [
                    {
                      id: "a",
                      texto:
                        "Para que sea rapido y no se sienta como un freno — la validacion completa se hace en pre-push o CI",
                      esCorrecta: true,
                    },
                    {
                      id: "b",
                      texto: "Porque Biome no puede leer archivos no staged",
                      esCorrecta: false,
                    },
                    { id: "c", texto: "Para reducir el tamaño del repositorio", esCorrecta: false },
                    {
                      id: "d",
                      texto: "Porque los archivos no staged no tienen errores",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q3",
                  enunciado:
                    "<p>En la jerarquia de hooks, ¿que es lo correcto poner en <strong>pre-commit</strong> vs <strong>pre-push</strong>?</p>",
                  explicacion:
                    "Pre-commit: rapido (lint-staged sobre lo modificado, ~1seg). Se ejecuta MUCHAS veces al dia, asi que tiene que ser instantaneo. Pre-push: completo (typecheck + lint + test, varios segundos). Se ejecuta pocas veces al dia, asi que puede ser mas pesado. Si invertis los dos, el equipo bypasea el pre-commit o trabaja con commits acumulados.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Pre-commit: typecheck + tests completos. Pre-push: nada",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Pre-commit: rapido (lint-staged sobre lo modificado). Pre-push: validacion completa (typecheck + lint + test)",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Ambos lo mismo, por defensa en profundidad",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "Pre-commit: solo formato. Pre-push: solo lint",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q4",
                  enunciado:
                    "<p>Tu pre-push tarda 90 segundos. Empiezas a bypasearlo con <code>--no-verify</code> 'solo una vez'. ¿Cual es el problema real?</p>",
                  explicacion:
                    "El bypass nunca es 'una vez'. Una vez lo haces tu, lo haces dos, lo haces cinco. Y cuando lo haces, el equipo lo ve y normaliza la practica. La confianza en el pipeline se rompe — y entonces el pipeline ya no protege. La solucion correcta es optimizar el pipeline (tests en paralelo, cache, dividir rapido/lento) para que vuelva a ser razonable. Bypassear silenciosamente es romper el contrato con el equipo.",
                  opciones: [
                    { id: "a", texto: "Ninguno, es solo una vez", esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        "Que rompes la confianza del equipo en el pipeline y normalizas la practica — la solucion es optimizar el pipeline, no bypasearlo",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Que git lo registra como commit invalido",
                      esCorrecta: false,
                    },
                    { id: "d", texto: "Que GitHub te suspende la cuenta", esCorrecta: false },
                  ],
                },
              ],
              "m6-s1-quiz",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://biomejs.dev/guides/getting-started/",
              "Biome — Getting started",
              "Guia oficial de Biome. Setup en proyectos TS/React, configuracion de reglas, integracion con editores (VS Code, JetBrains). Es la referencia para entender cada regla del linter y para configurarla correctamente segun el proyecto.",
              "m6-s1-recurso",
            ),
          },
        ],
      },
      {
        titulo: "Politicas: 0 any, 0 unused, 0 warnings + CI minimo",
        skill: "Disciplina de proyecto sano",
        temas:
          "por que un warning es un bug latente, workflow GitHub Actions minimo (typecheck + lint + test), reto: repo con 15 problemas, arreglar todo y hacer que CI pase.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<h2>0 warnings es un contrato, no una metrica</h2><p>Hay una teoria de criminologia llamada "<em>broken windows</em>" (ventanas rotas): un edificio con una ventana rota se llena rapido de mas ventanas rotas. Si nadie arregla la primera, nadie va a respetar el resto. Si la primera se arregla en 24 horas, el edificio se mantiene cuidado durante años.</p><p>El codigo funciona igual. Un warning en un repo con 0 warnings te <em>duele</em> — lo arreglas en 30 segundos. Un warning en un repo con 47 ya no se ve: lo añades y nadie lo nota. Y dentro de 6 meses tu repo tiene 200 warnings y nadie sabe cuales eran reales y cuales basura acumulada.</p><p>Por eso las politicas de disciplina son <strong>contratos no-negociables</strong>, no metricas que se monitorean. Tres de las mas importantes:</p><ol><li><strong>0 <code>any</code> explicito</strong>: cada <code>any</code> es una promesa al equipo de que ahi no merecia la pena tipar. Casi nunca es verdad. <code>unknown</code> + narrow es el default profesional.</li><li><strong>0 unused</strong>: variables, imports y parametros muertos son codigo que el equipo mantiene sin razon. El lint los marca; tu los borras. No "ya lo arreglo despues".</li><li><strong>0 warnings</strong>: <em>todas</em> las reglas en severidad <code>error</code>, ninguna en <code>warn</code>. <code>warn</code> es "luego lo arreglo" — y "luego" no llega nunca. Severidad <code>error</code> bloquea el merge — entonces si llega.</li></ol><p>Y el otro 50% del contrato: <strong>CI minimo en GitHub Actions</strong> (typecheck + lint + test). Sin esto, todo lo anterior depende de la buena voluntad — con esto, es <em>fisica</em>. El PR no puede mergearse si CI no pasa. Y CI no pasa si rompiste algo. No hay debate, no hay "pero funciona en mi maquina".</p>`,
              "m6-s2-intro",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "warning",
              "<p><strong>Regla del senior</strong>: <code>--no-verify</code> no es un atajo — es romper el contrato con el equipo. Si un hook bloquea trabajo legitimo, tienes dos opciones honestas: arreglar el codigo (lo mas comun) o ajustar la regla en consenso con el equipo (cuando la regla esta mal calibrada). Lo que NO es opcion: bypasear en silencio. Cuando alguien revisa tu PR y ve que el lint local fallo pero pasaste el commit, pierde la confianza en el blindaje — y ahi se rompe todo el sistema.</p>",
              "m6-s2-tip",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "yaml",
              `# .github/workflows/ci.yml — CI minimo realista para un proyecto frontend
name: CI

on:
  pull_request:
    branches: [develop, main]
  push:
    branches: [develop, main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint            # Biome con TODAS las reglas en error

      - name: Test
        run: pnpm test            # Vitest + Jest, suite completa

      # Si cualquier paso falla, el PR no puede mergearse.
      # No hay 'pero funciona en mi maquina'. CI es la verdad.


# REPO TIPICO SIN ESTE CONTRATO — el "ya lo arreglare":
#
#   warning: 'usuario' is defined but never used
#   warning: prefer-const detected
#   warning: 'any' used in function signature
#   warning: console.log left in code
#   ... 47 warnings mas que nadie recuerda cuando se introdujeron
#
# Cuando entra un PR con 3 nuevos warnings, nadie los ve.
# Cuando hay 200 warnings, el lint deja de ser señal — es ruido.
# Y un dia descubres que el bug de produccion era uno de esos
# warnings que ignoraste hace 3 meses.


# REPO CON EL CONTRATO — el "0 warnings = 0 errores":
#
#   ✓ Lint passed
#   ✓ Typecheck passed
#   ✓ 234 tests passed
#
# Cuando aparece UN warning, todo el mundo lo ve. Se arregla en el
# mismo commit. El repo no acumula deuda silenciosa.`,
              "Workflow de CI minimo (typecheck + lint + test) que ejecuta el contrato del equipo. Sin este gate, la disciplina depende de la buena voluntad — con este gate, es fisica: el PR no se mergea si CI no pasa.",
              "m6-s2-codigo",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "Disciplina de proyecto sano",
            contenido: buildQuiz(
              [
                {
                  id: "q1",
                  enunciado:
                    "<p>¿Por que el equipo deberia configurar todas las reglas de lint en severidad <code>error</code> y NO en <code>warn</code>?</p>",
                  explicacion:
                    "warn no bloquea el build, asi que la gente lo ignora. 'Ya lo arreglo despues' = nunca. Severidad error bloquea el merge — entonces se arregla en el mismo PR. La diferencia es entre 'metrica monitoreada' (warn) y 'contrato cumplido' (error). 0 warnings solo se mantiene si literalmente no hay warning posible: todo es error o nada.",
                  opciones: [
                    { id: "a", texto: "Porque error es mas rapido de procesar", esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        "Porque warn no bloquea nada — y lo que no bloquea, se ignora hasta acumular deuda silenciosa",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Porque GitHub solo soporta severidad error",
                      esCorrecta: false,
                    },
                    { id: "d", texto: "Porque warn esta deprecated en Biome", esCorrecta: false },
                  ],
                },
                {
                  id: "q2",
                  enunciado: "<p>¿Que es el 'efecto ventanas rotas' aplicado a un repositorio?</p>",
                  explicacion:
                    "El primer warning ignorado abre la puerta al segundo, al tercero, al cuadragesimo. Cuando un repo tiene 0 warnings, uno nuevo destaca y se arregla. Cuando tiene 47, el numero 48 no se nota. La unica forma de mantener 0 warnings es decidir que es un contrato — y bloquear merges con cualquier warning.",
                  opciones: [
                    { id: "a", texto: "Los repos con CSS roto atraen bugs", esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        "Un warning ignorado normaliza ignorar mas warnings — la deuda se acumula silenciosamente",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Cuando un test falla, todos los tests dejan de pasar",
                      esCorrecta: false,
                    },
                    { id: "d", texto: "Es un anti-patron de Tailwind", esCorrecta: false },
                  ],
                },
                {
                  id: "q3",
                  enunciado:
                    "<p>¿Cual es la mision del CI (typecheck + lint + test en GitHub Actions) en este contrato?</p>",
                  explicacion:
                    "Sin CI, todo el blindaje depende de que cada dev corra los hooks bien y no los bypasee. Es buena voluntad. Con CI, es fisica: el PR no se mergea si CI no pasa, independiente de lo que pase en cada maquina. Es la defensa en profundidad — los hooks ayudan al dev, CI protege al equipo.",
                  opciones: [
                    { id: "a", texto: "Reemplazar a los hooks de husky", esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        "Ser la verdad final: defensa en profundidad que bloquea merges aunque alguien bypasee los hooks locales",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Generar el changelog automaticamente", esCorrecta: false },
                    { id: "d", texto: "Decorar el badge en el README", esCorrecta: false },
                  ],
                },
                {
                  id: "q4",
                  enunciado:
                    "<p>Tienes una regla de Biome que bloquea trabajo legitimo en UN caso muy puntual. ¿Cual es la accion correcta?</p>",
                  explicacion:
                    "Bypasear silenciosamente con --no-verify rompe la confianza del equipo. Desactivar la regla globalmente baja el contrato. La opcion correcta es // biome-ignore localizado con un comentario que explique el por que — y solo despues de validar con el equipo que la excepcion tiene sentido. Documentar las excepciones es lo que mantiene el contrato vivo.",
                  opciones: [
                    { id: "a", texto: "git commit --no-verify y sigues", esCorrecta: false },
                    {
                      id: "b",
                      texto: "Desactivar la regla globalmente en biome.json",
                      esCorrecta: false,
                    },
                    {
                      id: "c",
                      texto:
                        "Añadir // biome-ignore <regla>: <razon concreta> localizado y validar la excepcion con el equipo",
                      esCorrecta: true,
                    },
                    {
                      id: "d",
                      texto: "Cambiar la severidad de la regla a warn",
                      esCorrecta: false,
                    },
                  ],
                },
              ],
              "m6-s2-quiz",
            ),
          },
          {
            idForzado: ID_M6_S2_PREG,
            tipo: TipoBloque.CODIGO_PREGUNTAS,
            esEvaluable: true,
            skill: "Disciplina de proyecto sano",
            contenido: buildCodigoPreguntas(
              "typescript",
              `La IA te dio el siguiente codigo. Funciona, compila, ordena el array
correctamente — pero tiene 3 "olores" tipicos que el lint marcaria:
  1. console.log de debug (suspicious/noConsoleLog)
  2. variable declarada y nunca usada (correctness/noUnusedVariables)
  3. any en el parametro y retorno (suspicious/noExplicitAny)

Tu trabajo: limpia el codigo para que la salida sea SOLO el resultado
real esperado (los numeros ordenados separados por coma):

  9,6,5,4,3,2,1,1

Sin logs de debug, sin variables muertas.

Bonus pedagogico (no validado por tests pero esperado de un dev senior):
cambia el tipo any[] a number[] para que TS te proteja contra futuros bugs.`,
              `function ordenarDescendente(numeros: any[]): any[] {
  console.log("DEBUG: entrando", numeros);
  const copia = [...numeros];
  const noUsado = "esto no se usa para nada";
  copia.sort((a, b) => b - a);
  console.log("DEBUG: ordenado", copia);
  return copia;
}

const resultado = ordenarDescendente([3, 1, 4, 1, 5, 9, 2, 6]);
console.log(resultado.join(","));`,
              "m6-s2-cp",
            ),
          },
          {
            idForzado: ID_M6_S2_TEST,
            tipo: TipoBloque.CODIGO_TESTS,
            esEvaluable: false,
            contenido: buildCodigoTests(
              ID_M6_S2_PREG,
              `function ordenarDescendente(numeros: number[]): number[] {
  return [...numeros].sort((a, b) => b - a);
}

const resultado = ordenarDescendente([3, 1, 4, 1, 5, 9, 2, 6]);
console.log(resultado.join(","));`,
              [
                {
                  id: "t1",
                  descripcion: "Salida limpia: solo los numeros ordenados, sin logs de debug",
                  entrada: "",
                  salidaEsperada: "9,6,5,4,3,2,1,1\n",
                  visible: true,
                },
                {
                  id: "t2",
                  descripcion: "No aparecen los logs DEBUG en la salida",
                  entrada: "",
                  salidaEsperada: "9,6,5,4,3,2,1,1\n",
                  visible: true,
                },
                {
                  id: "t3",
                  descripcion: "Orden estricto descendente con duplicados preservados",
                  entrada: "",
                  salidaEsperada: "9,6,5,4,3,2,1,1\n",
                  visible: false,
                },
              ],
              "m6-s2-ct",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs",
              "GitHub Actions — Building and testing Node.js",
              "Guia oficial de GitHub Actions para proyectos Node.js. Workflows de typecheck + lint + test con cache de dependencias, matriz de versiones, integracion con PR. Es la referencia para montar tu primer CI minimo en menos de 30 minutos.",
              "m6-s2-recurso",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p class="font-serif italic text-aurora-violet" style="font-size: 1.5rem; line-height: 1.4;">"Las ventanas rotas se rompen una a una. El primer warning ignorado abre la puerta a los demas. La disciplina no es disciplinarse — es respetar al que viene detras."</p><p>La calidad de un repo no se mide en la primera semana — se mide en el año seis, cuando el equipo cambio dos veces y nadie recuerda por que las cosas estan como estan. El repo bien cuidado se reconoce en ese momento: el lint sigue pasando, los tests siguen verdes, los hooks siguen activos, y un dev nuevo puede entender el codigo sin tener que preguntar. Eso no pasa por suerte — pasa porque alguien decidio el primer mes que las herramientas eran red de seguridad, no adorno. Y porque cada vez que un hook fallo, lo arreglo en vez de bypasearlo.</p>`,
              "m6-s2-cierre",
            ),
          },
        ],
      },
    ],
  },
  {
    idx: 8,
    titulo: "Modulo 7 — React: el mental model + calidad",
    descripcion:
      "React no es magia. Es una funcion del estado que devuelve UI. Todo el resto son consecuencias.",
    secciones: [
      {
        titulo: "Render, JSX, hooks",
        skill: "React fundamentos y mental model",
        temas:
          "render como funcion pura, JSX como objeto, orden estable de hooks, useState basico, debugging del re-render.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<h2>React es una funcion del estado, todo lo demas son consecuencias</h2><p>Cuando llegas a React desde el backend, el instinto es leerlo como un templating engine — algo tipo Jinja, JSP o Twig pero en JavaScript. Es la trampa mas comun y la que mas tiempo te cuesta despues. <strong>React no es un templating engine</strong>. Es un modelo radicalmente distinto, y una vez lo entiendes, todo lo demas se explica solo.</p><p>El modelo en una frase: <strong>UI = f(state)</strong>. Tu componente es una <em>funcion pura</em> que recibe props y estado, y devuelve una descripcion de la UI. Misma entrada → misma salida. Cero efectos durante el render. React se encarga del resto: comparar lo que devolviste antes con lo que devuelves ahora, y actualizar el DOM solo donde hay diferencia.</p><p>Tres consecuencias inmediatas que rompen el instinto del dev backend:</p><ul><li><strong>JSX es un objeto</strong>, no un template. <code>&lt;div&gt;hola&lt;/div&gt;</code> es azucar para <code>React.createElement("div", null, "hola")</code>. Devuelve un objeto plano. Por eso puedes asignarlo a una variable, pasarlo como prop, devolverlo de una funcion. No es magia — es JS.</li><li><strong>Los hooks tienen orden estable</strong>. React identifica a cada hook por su posicion, no por su nombre. Por eso no puedes meterlos dentro de un <code>if</code>: si en un render hay 3 y en el siguiente hay 2, React pierde la pista del estado.</li><li><strong>Re-renderizar no es malo</strong>. Es como respira React. Cuando algo "se re-renderiza mucho", el problema casi nunca es el re-render — es que tu mental model de cuando ocurre esta incompleto. Y la solucion casi nunca es <code>memo</code> ni <code>useMemo</code>: es entender por que ocurre.</li></ul><p>Hoy atacamos esos tres puntos. Cuando termines, vas a leer un componente y vas a <em>saber</em> que va a renderizar y cuando — no esperar a ver que pasa en el browser.</p>`,
              "m7-s1-intro",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>Regla del senior</strong>: si tu componente tiene un bug raro de render, casi nunca es bug de React. Es que tu mental model de cuando re-renderiza esta incompleto. Antes de pegar <code>memo</code>, <code>useMemo</code> o <code>useCallback</code> para "arreglarlo", abre las React DevTools (pestaña Profiler), graba un render, y mira que disparo el ciclo. El 90% de las veces vas a descubrir que el problema era otro: una referencia nueva en cada render, un estado en el lugar equivocado, una prop que cambia mas de lo que deberia.</p>`,
              "m7-s1-tip",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "tsx",
              `// 1) JSX ES UN OBJETO — no es template

// Esto:
const elemento = <h1 className="titulo">Hola</h1>;

// Es exactamente equivalente a:
const elementoEquivalente = React.createElement(
  "h1",
  { className: "titulo" },
  "Hola",
);

// Por eso JSX se puede asignar, pasar como prop, devolver de una funcion:
const titulo = <h1>NexoTT Learn</h1>;
const layout = (
  <Header>
    {titulo}                       {/* JSX como hijo */}
    <Card titulo={titulo} />        {/* JSX como prop */}
  </Header>
);


// 2) RENDER COMO FUNCION PURA — misma entrada, misma salida

interface SaludoProps { nombre: string; }

// ✓ BIEN: funcion pura
function Saludo({ nombre }: SaludoProps) {
  return <p>Hola, {nombre}</p>;
}

// ✗ MAL: efecto secundario durante el render
function SaludoMal({ nombre }: SaludoProps) {
  document.title = "Hola " + nombre;   // mutacion durante render = bug latente
  fetch("/api/visita");                 // request durante render = N requests por re-render
  return <p>Hola, {nombre}</p>;
}
// Por que es mal: el render se puede ejecutar 2, 3, 10 veces sin que cambie nada
// visible — React lo usa para reconciliar. Cada efecto secundario se ejecutaria
// cada vez. Los efectos van en useEffect, no en el cuerpo del componente.


// 3) ORDEN ESTABLE DE HOOKS — la regla que mas duele al principio

function ComponenteMal({ habilitado }: { habilitado: boolean }) {
  if (habilitado) {
    const [valor, setValor] = useState(0);   // ✗ hook DENTRO de un if
    return <span>{valor}</span>;
  }
  return null;
}
// Por que falla: React identifica los hooks por POSICION, no por nombre.
// Si en un render hay 1 useState y en el siguiente hay 0, React pierde
// la pista del estado de TODOS los hooks posteriores. Por eso ESLint te
// prohibe esto con la regla react-hooks/rules-of-hooks.

function ComponenteBien({ habilitado }: { habilitado: boolean }) {
  const [valor, setValor] = useState(0);     // ✓ hook SIEMPRE al top level
  if (!habilitado) return null;
  return <span>{valor}</span>;
}


// 4) POR QUE RE-RENDERIZA UN COMPONENTE — solo 3 razones

// a) Su state cambio (setState con valor distinto)
// b) Sus props cambiaron (su parent paso un valor distinto)
// c) Su parent re-renderizo (incluso si tus props son las mismas, los hijos re-renderizan)
//
// Memo, useMemo, useCallback solo importan en el caso (c) — y casi nunca son
// la primera solucion. Casi siempre el problema real es que el componente
// esta en el lugar equivocado del arbol, o que el state esta demasiado arriba.`,
              "Los 4 puntos del mental model fundamental: JSX como objeto JS, render como funcion pura sin efectos, orden estable de hooks (los if/for prohibidos), y las 3 unicas razones por las que un componente re-renderiza.",
              "m7-s1-codigo",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "React fundamentos y mental model",
            contenido: buildQuiz(
              [
                {
                  id: "q1",
                  enunciado: "<p>¿Que es JSX en realidad, debajo del azucar sintactico?</p>",
                  explicacion:
                    "JSX es azucar para React.createElement(...). El resultado es un objeto plano (un descriptor del elemento, no DOM real). Por eso puedes asignarlo a variables, pasarlo como prop, devolverlo de funciones. No es magia ni HTML: es JS que devuelve objetos.",
                  opciones: [
                    { id: "a", texto: "HTML embebido en JS", esCorrecta: false },
                    {
                      id: "b",
                      texto: "Un template string especial procesado por React",
                      esCorrecta: false,
                    },
                    {
                      id: "c",
                      texto:
                        "Azucar sintactico para React.createElement(...) que devuelve un objeto plano",
                      esCorrecta: true,
                    },
                    { id: "d", texto: "Una extension del DOM", esCorrecta: false },
                  ],
                },
                {
                  id: "q2",
                  enunciado:
                    "<p>¿Por que esta MAL meter <code>useState</code> dentro de un <code>if</code>?</p>",
                  explicacion:
                    "React identifica los hooks por POSICION en la lista de hooks del componente, no por nombre. Si en un render hay 3 hooks y en el siguiente hay 2 (porque un if dejo fuera uno), React asocia mal el estado a los hooks restantes. La regla 'hooks siempre al top level' no es estetica — es como funciona la libreria.",
                  opciones: [
                    { id: "a", texto: "No esta mal, es opcional", esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        "Porque React identifica los hooks por POSICION; si cambia el numero de hooks entre renders, React pierde la pista del estado",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Porque useState es lento", esCorrecta: false },
                    {
                      id: "d",
                      texto: "Porque ESLint lo prohibe arbitrariamente",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q3",
                  enunciado:
                    "<p>Un componente hijo se re-renderiza aunque sus props no cambiaron. ¿Cual es la razon mas probable?</p>",
                  explicacion:
                    "Cuando un componente padre re-renderiza, TODOS sus hijos re-renderizan por defecto — aunque las props sean las mismas. memo solo evita esto cuando las props son referencialmente iguales (objetos/arrays/funciones tienden a ser nuevos en cada render). Por eso memo es casi siempre la SEGUNDA respuesta — la primera es entender por que el padre re-renderiza tanto.",
                  opciones: [
                    { id: "a", texto: "Bug de React", esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        "Su parent re-renderizo — los hijos re-renderizan por defecto incluso si las props son las mismas",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "El estado interno del hijo se corrompio",
                      esCorrecta: false,
                    },
                    { id: "d", texto: "Falta useEffect", esCorrecta: false },
                  ],
                },
                {
                  id: "q4",
                  enunciado:
                    "<p>¿Esta bien hacer <code>document.title = 'Hola'</code> directamente en el cuerpo de un componente?</p>",
                  explicacion:
                    "El render se puede ejecutar 2, 3, 10 veces sin que cambie nada visible — React lo usa para reconciliar. Cualquier efecto secundario (mutar DOM, hacer fetch, escribir en localStorage, llamar APIs externas) en el render se ejecutaria cada una de esas veces. Los efectos secundarios van en useEffect, donde React garantiza que solo se ejecutan cuando toca.",
                  opciones: [
                    { id: "a", texto: "Si, es lo mismo que useEffect", esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        "No: el render se ejecuta varias veces sin que cambie nada visible — efectos secundarios van en useEffect",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Si, mientras pongas document.title", esCorrecta: false },
                    { id: "d", texto: "Solo en modo desarrollo", esCorrecta: false },
                  ],
                },
              ],
              "m7-s1-quiz",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://react.dev/learn/describing-the-ui",
              "React Docs — Describing the UI",
              "Capitulo oficial de la documentacion nueva de React. Explica el modelo desde cero: componentes como funciones, JSX, render condicional, listas. La nueva documentacion es excepcional — claridad, ejemplos vivos, sin jerga. Si vienes de tutoriales viejos, leela: el React de hace 5 años no es el de hoy.",
              "m7-s1-recurso",
            ),
          },
        ],
      },
      {
        titulo: "Composicion, estado derivado, cuando NO useEffect",
        skill: "React fundamentos y mental model",
        temas:
          "estado derivado se calcula no se guarda, useEffect es para sincronizar con sistemas externos, antipatron de fetch en useEffect, composicion con children y props.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<h2>Aplica el modelo, no luches contra el</h2><p>Una vez tienes el modelo "UI = f(state)" en la cabeza, las decisiones del dia a dia se aclaran. Cada vez que dudes "¿uso <code>useState</code> aqui?" o "¿pongo esto en <code>useEffect</code>?", la respuesta esta en el modelo — no en buscar el patron en Stack Overflow.</p><p>Tres aplicaciones concretas que separan al dev que <em>entendio</em> React del que solo lo <em>usa</em>:</p><ol><li><strong>Estado derivado se calcula, no se guarda</strong>. Si tienes <code>items</code> y necesitas <code>filtrados</code>, eso es una <em>variable local</em> dentro del render: <code>const filtrados = items.filter(...)</code>. No es un <code>useState</code> con un <code>useEffect</code> que sincroniza. Guardar lo derivado te obliga a mantener el sync manualmente — y el dia que olvidas un sync, tienes un bug de datos obsoletos.</li><li><strong><code>useEffect</code> es para sincronizar con sistemas externos</strong>. Externos al React: DOM directo, suscripciones, timers, animaciones. <em>No</em> es para fetch (eso es Tanstack Query). <em>No</em> es para reaccionar a un click (eso es un handler). <em>No</em> es para calcular estado derivado. La pregunta correcta antes de escribir un <code>useEffect</code> es: ¿estoy sincronizando con algo fuera de React, o estoy parchando un mental model equivocado?</li><li><strong>Composicion con <code>children</code> y props</strong>. Cuando un componente empieza a tener 10 props (titulo, subtitulo, mostrarIcono, iconoColor, accion, accionTexto, accionTipo, ...), no es un componente complejo — es varios componentes pegados con celo. La salida es composicion: <code>&lt;Card&gt;&lt;Card.Header /&gt;&lt;Card.Body /&gt;&lt;Card.Footer /&gt;&lt;/Card&gt;</code>. Mas flexible, menos codigo, menos props que mantener.</li></ol>`,
              "m7-s2-intro",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "warning",
              `<p><strong>Regla del senior</strong>: <code>useEffect</code> casi nunca es la respuesta correcta. Antes de escribir uno, hazte la pregunta: <em>¿estoy sincronizando con algo externo a React, o estoy compensando un mental model equivocado?</em> Si la respuesta es "lo segundo" (que casi siempre lo es), refactor. Los casos legitimos son contados: sincronizar con DOM directo, suscribirse a un evento externo, manejar un timer. Para fetch hay Tanstack Query; para reaccionar a un click hay handlers; para estado derivado hay calculo en el render.</p>`,
              "m7-s2-tip",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "tsx",
              `// 1) ESTADO DERIVADO — calcular vs guardar

// ✗ MAL — estado derivado en useState + useEffect que sincroniza
function ListaCursosMal({ cursos, busqueda }: Props) {
  const [filtrados, setFiltrados] = useState<Curso[]>([]);

  useEffect(() => {
    setFiltrados(cursos.filter(c => c.titulo.includes(busqueda)));
  }, [cursos, busqueda]);
  // El dia que olvidas la dependencia 'busqueda' en el array,
  // tienes datos obsoletos en pantalla. Bug silencioso clasico.

  return <ListaUI items={filtrados} />;
}

// ✓ BIEN — calcular durante el render, variable local
function ListaCursosBien({ cursos, busqueda }: Props) {
  const filtrados = cursos.filter(c => c.titulo.includes(busqueda));
  return <ListaUI items={filtrados} />;
}

// ✓ Si el calculo es costoso (datasets grandes), useMemo:
function ListaCursosBienMemo({ cursos, busqueda }: Props) {
  const filtrados = useMemo(
    () => cursos.filter(c => c.titulo.includes(busqueda)),
    [cursos, busqueda],
  );
  return <ListaUI items={filtrados} />;
}


// 2) USEEFFECT — el antipatron del fetch

// ✗ MAL — fetch en useEffect con todo a mano
function PerfilMal() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/usuario")
      .then(r => r.json())
      .then(setUsuario)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  // ... ahora maneja a mano: cancelacion, refetch on focus, race conditions,
  // deduplicacion entre componentes, cache, invalidacion. Todo a mano.
  // Esto es reescribir Tanstack Query peor.

  if (loading) return <Spinner />;
  if (error)   return <Error error={error} />;
  if (!usuario) return null;
  return <UsuarioCard usuario={usuario} />;
}

// ✓ BIEN — Tanstack Query maneja todo lo anterior
function PerfilBien() {
  const { data: usuario, isLoading, error } = useUsuarioActual();
  if (isLoading) return <Spinner />;
  if (error)     return <Error error={error} />;
  if (!usuario)  return null;
  return <UsuarioCard usuario={usuario} />;
}


// 3) COMPOSICION — children y subcomponentes en vez de props-dios

// ✗ MAL — 14 props que tratan de cubrir todos los casos
interface CardProps {
  titulo: string;
  subtitulo?: string;
  imagen?: string;
  cta?: { texto: string; onClick: () => void };
  iconoCabecera?: ReactNode;
  badge?: { texto: string; color: string };
  // ... 8 props mas
}

// ✓ BIEN — composicion, cada zona es un subcomponente
<Card>
  <Card.Header>
    <IconoEstrella />
    <Card.Title>Frontend para devs backend</Card.Title>
    <Badge variant="aurora">Nuevo</Badge>
  </Card.Header>
  <Card.Body>Modulo 7 en curso</Card.Body>
  <Card.Footer>
    <Button variant="primary" onClick={inscribirse}>Inscribirme</Button>
  </Card.Footer>
</Card>
// Mas flexible, menos props que mantener, mas legible en el sitio donde se usa.`,
              "Las 3 aplicaciones del modelo: estado derivado se calcula (no se guarda con useState+useEffect), useEffect no es para fetch (Tanstack Query lo es), composicion con children en vez de props-dios.",
              "m7-s2-codigo",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "React fundamentos y mental model",
            contenido: buildQuiz(
              [
                {
                  id: "q1",
                  enunciado:
                    "<p>Tienes <code>cursos</code> en props y quieres mostrar <code>cursosActivos</code> (filtrados). ¿Como lo modelas?</p>",
                  explicacion:
                    "Estado derivado se calcula durante el render: const activos = cursos.filter(c => c.activo). Es una variable local, no necesita useState. Guardarlo en state te obliga a sincronizar manualmente con un useEffect — y el dia que olvidas una dependencia, tienes datos obsoletos. La regla: si se puede calcular, se calcula.",
                  opciones: [
                    {
                      id: "a",
                      texto: "useState + useEffect que filtra cuando cursos cambia",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto: "Variable local en el render: const activos = cursos.filter(...)",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Otro componente padre que lo recibe ya filtrado",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "Context global que se actualiza al cambiar cursos",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q2",
                  enunciado: "<p>¿Cual de estos es un uso LEGITIMO de <code>useEffect</code>?</p>",
                  explicacion:
                    "useEffect es para sincronizar con sistemas EXTERNOS a React: DOM directo, suscripciones, timers, eventos del window. Sincronizar con localStorage entra en esa categoria (es un sistema externo). Fetch va con Tanstack Query, click va con handler, estado derivado va con calculo en el render — esos NO son sistemas externos, son comportamiento dentro de React.",
                  opciones: [
                    { id: "a", texto: "Hacer fetch al montar el componente", esCorrecta: false },
                    {
                      id: "b",
                      texto: "Calcular un valor derivado de las props",
                      esCorrecta: false,
                    },
                    {
                      id: "c",
                      texto: "Sincronizar el estado con localStorage cuando cambia",
                      esCorrecta: true,
                    },
                    { id: "d", texto: "Reaccionar a un click en un boton", esCorrecta: false },
                  ],
                },
                {
                  id: "q3",
                  enunciado:
                    "<p>Una Card tiene 12 props (titulo, subtitulo, imagen, cta, iconoColor, badge, ...). ¿Que sugiere esto?</p>",
                  explicacion:
                    "Una props-dios casi siempre indica varios componentes pegados con celo. La solucion no es añadir mas props — es composicion: Card.Header, Card.Body, Card.Footer como subcomponentes. El consumidor compone lo que necesita, sin props innecesarias. Es mas flexible, mas legible y mas mantenible.",
                  opciones: [
                    { id: "a", texto: "Que la Card es compleja por naturaleza", esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        "Que conviene refactor a composicion: Card.Header, Card.Body, Card.Footer",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Que falta usar memo", esCorrecta: false },
                    {
                      id: "d",
                      texto: "Que esta correcto, las props son baratas",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q4",
                  enunciado:
                    "<p>¿Por que el patron de <code>fetch</code> en <code>useEffect</code> es un antipatron?</p>",
                  explicacion:
                    "Reescribir cancelacion, refetch, race conditions, cache, deduplicacion y invalidacion a mano es reescribir Tanstack Query peor. Tanstack Query resuelve todo eso de forma probada, con UX consistente, y deja el componente con 1 linea (useQuery) en vez de 4 (useState x3 + useEffect). El antipatron no es 'fetch en JS' — es 'reimplementar lo que ya existe bien hecho'.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Porque fetch no funciona dentro de React",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Porque reescribes a mano (peor) lo que Tanstack Query resuelve: cancelacion, refetch, race conditions, cache, invalidacion",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Porque useEffect esta deprecated", esCorrecta: false },
                    {
                      id: "d",
                      texto: "Porque solo deberias hacer fetch en handlers",
                      esCorrecta: false,
                    },
                  ],
                },
              ],
              "m7-s2-quiz",
            ),
          },
          {
            idForzado: ID_M7_S2_PREG,
            tipo: TipoBloque.CODIGO_PREGUNTAS,
            esEvaluable: true,
            skill: "React fundamentos y mental model",
            contenido: buildCodigoPreguntas(
              "typescript",
              `La siguiente funcion es la METAFORA de un antipatron de React:
guardar estado derivado en una variable persistente en vez de calcularlo
cada vez que se necesita.

Mira el codigo: usa una variable global "totalCacheado" para guardar el
resultado de la primera llamada. En llamadas siguientes devuelve el viejo
sin recalcular — exactamente el bug que tendrias con estado derivado en
useState que no se sincroniza cuando cambian las dependencias.

Salida actual:        Salida esperada:
  6                    6
  6  ← BUG             60
  6  ← BUG             100

Tu trabajo: refactoriza para calcular el total CADA VEZ (no cachear).
Asi el bug desaparece y queda la version "calcular en el render" del
mental model de React.`,
              `// Esto simula un "componente" que guarda estado derivado.
// Hay un BUG: el cache queda obsoleto cuando los datos cambian.

let totalCacheado = 0;

function calcularTotal(items: number[]): number {
  // ✗ MAL: guarda el resultado y nunca recalcula
  if (totalCacheado > 0) return totalCacheado;
  totalCacheado = items.reduce((a, b) => a + b, 0);
  return totalCacheado;
}

console.log(calcularTotal([1, 2, 3]));
console.log(calcularTotal([10, 20, 30]));
console.log(calcularTotal([100]));`,
              "m7-s2-cp",
            ),
          },
          {
            idForzado: ID_M7_S2_TEST,
            tipo: TipoBloque.CODIGO_TESTS,
            esEvaluable: false,
            contenido: buildCodigoTests(
              ID_M7_S2_PREG,
              `function calcularTotal(items: number[]): number {
  return items.reduce((a, b) => a + b, 0);
}

console.log(calcularTotal([1, 2, 3]));
console.log(calcularTotal([10, 20, 30]));
console.log(calcularTotal([100]));`,
              [
                {
                  id: "t1",
                  descripcion: "Primera llamada con [1,2,3] → 6",
                  entrada: "",
                  salidaEsperada: "6\n60\n100\n",
                  visible: true,
                },
                {
                  id: "t2",
                  descripcion: "Segunda llamada con [10,20,30] → 60 (no 6)",
                  entrada: "",
                  salidaEsperada: "6\n60\n100\n",
                  visible: true,
                },
                {
                  id: "t3",
                  descripcion: "Tercera llamada con [100] → 100 (no 6, no 60)",
                  entrada: "",
                  salidaEsperada: "6\n60\n100\n",
                  visible: false,
                },
              ],
              "m7-s2-ct",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://react.dev/learn/you-might-not-need-an-effect",
              "React Docs — You Might Not Need an Effect",
              "Capitulo oficial de React.dev que ataca exactamente este modulo: cuando NO usar useEffect, con patrones reales de refactor. Es lectura obligatoria para cualquier dev que vea muchos useEffect en codigo del equipo — la mayoria se pueden eliminar aplicando los patrones aqui.",
              "m7-s2-recurso",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              "<p>Hasta aqui tienes el modelo (S1) y sus aplicaciones (S2). La siguiente seccion cierra el modulo con la parte que separa al dev que <em>usa</em> React del que <em>cuida</em> el codigo React que escribe: convenciones, limites de tamaño, refactor de componentes que crecen. Es el oficio que distingue un PR aceptable de uno que el equipo devuelve.</p>",
              "m7-s2-puente",
            ),
          },
        ],
      },
      {
        titulo: "Calidad: convenciones, componentes <=150 lineas, refactor",
        skill: "React fundamentos y mental model",
        temas:
          "por que el limite no es estetico, signos de componente que crece (props dios, JSX repetido, muchos useState relacionados), extraer subcomponente vs custom hook, naming que comunica.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<h2>Un componente que crece no es complejo — son varios pegados con celo</h2><p>La regla del proyecto es clara: <strong>componentes ≤ 150 lineas, hooks ≤ 80</strong>. La cifra exacta no es magica — lo que importa es el principio: <em>si no entra en una pantalla, no lo lees como una unidad</em>. Y si no lo lees como unidad, no lo entiendes; y si no lo entiendes, no lo mantienes.</p><p>Cuando un componente pasa de 150 lineas, casi nunca es porque "hace algo complicado". Es porque son <strong>varios componentes pegados con celo</strong>: un wizard con 4 pasos en el mismo archivo, una card con header + body + footer + acciones, una pagina con plan + recompensas + historial + filtros. Cada uno es un componente. Pegados, son un monstruo.</p><p>Las señales de que toca refactor son siempre las mismas:</p><ol><li><strong>Props-dios</strong> (10+ props): el componente trata de cubrir 5 casos distintos. Solucion: composicion (<code>&lt;Card&gt;&lt;Card.Header /&gt;...&lt;/Card&gt;</code>).</li><li><strong>JSX repetido</strong>: el mismo bloque aparece 2-3 veces con pequeñas variaciones. Solucion: extraer subcomponente, parametrizar con props.</li><li><strong>Muchos <code>useState</code> relacionados</strong>: 6 <code>useState</code> que cambian juntos casi siempre son un <code>useReducer</code> o un objeto.</li><li><strong>Logica de fetch + transformacion + handlers en el mismo archivo</strong>: extraer un custom hook. El componente queda solo con renderizado, el hook con la logica.</li></ol><p>La pregunta clave para decidir entre <strong>subcomponente</strong> y <strong>hook</strong> es: ¿lo que repito es JSX (visual) o logica (estado/efectos)? Si es JSX, subcomponente. Si es logica, hook. Si es ambos, primero hook, luego subcomponente.</p><p>Y el naming: el nombre del hook o componente debe comunicar <em>que hace</em>, no <em>que devuelve</em>. <code>useLoginForm</code> (qué hace) gana a <code>useLogin</code> (ambiguo: ¿devuelve el usuario? ¿la mutacion? ¿el form?). <code>BotonInscripcion</code> gana a <code>SmartButton</code>. El siguiente dev del equipo lee el nombre y sabe.</p>`,
              "m7-s3-intro",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>Regla del senior</strong>: un componente que crece no es complejo — son varios componentes pegados con celo. Romper el celo es trabajo de senior; aceptar el celo es deuda que el equipo paga. Cuando veas un <code>.tsx</code> de 350 lineas en code review, no apruebes con "esta largo pero funciona". Pide refactor y muestra como. La proxima persona que lo toque (probablemente tu) te lo va a agradecer.</p>`,
              "m7-s3-tip",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "tsx",
              `// ANTES — componente de 200+ lineas con todo dentro (extracto)

export function BandejaPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filtroPendientes, setFiltroPendientes] = useState<"todos" | "urgentes">("todos");

  useEffect(() => {
    Promise.all([fetch("/api/me"), fetch("/api/pendientes"), fetch("/api/novedades")])
      .then(([u, p, n]) => Promise.all([u.json(), p.json(), n.json()]))
      .then(([u, p, n]) => { setUsuario(u); setPendientes(p); setNovedades(n); })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorBanner error={error} />;
  if (!usuario) return null;

  const pendientesFiltrados = filtroPendientes === "todos"
    ? pendientes
    : pendientes.filter(p => p.urgente);

  return (
    <main>
      <h1>Hola, {usuario.nombre}</h1>

      {/* 80 lineas de JSX para "Tu siguiente paso" */}
      <section>...</section>

      {/* 60 lineas de JSX para "Pendientes" con filtros */}
      <section>
        <h2>Pendientes</h2>
        <div>
          <button onClick={() => setFiltroPendientes("todos")}>Todos</button>
          <button onClick={() => setFiltroPendientes("urgentes")}>Urgentes</button>
        </div>
        {pendientesFiltrados.map(p => <PendienteCard key={p.id} pendiente={p} />)}
      </section>

      {/* 50 lineas de JSX para "Novedades" */}
      <section>...</section>
    </main>
  );
}


// DESPUES — el mismo componente refactorizado (~60 lineas)

export function BandejaPage() {
  const usuario = useUsuarioActual();             // hook: fetch + cache + cancelacion
  const datos = useBandejaDatos();                 // hook: agrega pendientes + novedades
  const { filtro, setFiltro, pendientesFiltrados } = useFiltroPendientes(datos.pendientes);

  if (usuario.isLoading || datos.isLoading) return <Spinner />;
  if (usuario.error || datos.error) return <ErrorBanner error={usuario.error ?? datos.error} />;
  if (!usuario.data) return null;

  return (
    <main>
      <h1>Hola, {usuario.data.nombre}</h1>
      <TuSiguientePaso siguiente={datos.siguiente} />               {/* subcomponente */}
      <StreamPendientes
        pendientes={pendientesFiltrados}
        filtro={filtro}
        onFiltroChange={setFiltro}
      />
      <StreamNovedades novedades={datos.novedades} />               {/* subcomponente */}
    </main>
  );
}

// Lo que se gano:
//   - 200 lineas → 60 (cada subcomponente y hook viven en su archivo)
//   - El render es legible de un vistazo
//   - Cada pieza se testea por separado
//   - El fetch ya no es a mano (useUsuarioActual = Tanstack Query)
//   - El filtro es reusable en otra pagina si hace falta`,
              "Antes y despues de un componente real. La diferencia no es estilistica: la version refactorizada se lee de un vistazo, se testea por separado, y cada pieza tiene una responsabilidad clara. El monolito de 200 lineas no era complejo — eran 5 componentes pegados.",
              "m7-s3-codigo",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "React fundamentos y mental model",
            contenido: buildQuiz(
              [
                {
                  id: "q1",
                  enunciado:
                    "<p>Tu componente <code>BandejaPage.tsx</code> tiene 280 lineas. ¿Cual es la primera señal a buscar?</p>",
                  explicacion:
                    "El primer movimiento es identificar SUBZONAS visuales claras (header / contenido / sidebar / footer, o 'pendientes / novedades / proximos pasos'). Cada subzona es candidata a subcomponente. Despues vas por hooks (logica de fetch o filtrado), y al final por useReducer si hay estado complejo relacionado.",
                  opciones: [
                    { id: "a", texto: "Si memo solucionaria el problema", esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        "Identificar subzonas visuales claras que son candidatos a subcomponentes",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Mover todo a Context global", esCorrecta: false },
                    {
                      id: "d",
                      texto: "Dividir el archivo en 5 sin reorganizar el codigo",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q2",
                  enunciado:
                    "<p>Tienes 6 <code>useState</code> que cambian juntos: <code>email</code>, <code>password</code>, <code>error</code>, <code>loading</code>, <code>showPassword</code>, <code>intentos</code>. ¿Que sugiere esto?</p>",
                  explicacion:
                    "6 useState que cambian juntos casi siempre son un useReducer con un solo estado de tipo objeto, o un custom hook (useLoginForm) que encapsula toda esa logica. El componente queda con 1 hook en vez de 6, mas legible y mas testeable. useState multiples brillan cuando son INDEPENDIENTES — no cuando bailan juntos.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Que el componente es naturalmente complejo",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Que conviene useReducer o un custom hook (useLoginForm) que encapsule el estado relacionado",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Que falta memo", esCorrecta: false },
                    { id: "d", texto: "Que conviene Context para los 6", esCorrecta: false },
                  ],
                },
                {
                  id: "q3",
                  enunciado:
                    "<p>Estas decidiendo entre extraer un <strong>subcomponente</strong> o un <strong>custom hook</strong>. ¿Cual es la pregunta clave?</p>",
                  explicacion:
                    "Subcomponente cuando lo que se repite es JSX (visual). Hook cuando lo que se repite es logica (estado, efectos, fetch). Si es ambos, primero hook (extrae la logica), luego subcomponente (usa el hook). La pregunta correcta separa los dos movimientos limpiamente.",
                  opciones: [
                    { id: "a", texto: "¿Tengo tiempo para escribir tests?", esCorrecta: false },
                    {
                      id: "b",
                      texto: "¿Lo que repito es JSX (visual) o es logica (estado/efectos)?",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "¿Lo voy a usar en mas de una pagina?", esCorrecta: false },
                    { id: "d", texto: "¿El equipo aprobaria el cambio?", esCorrecta: false },
                  ],
                },
                {
                  id: "q4",
                  enunciado:
                    "<p>¿Cual es mejor nombre para el hook que maneja el formulario de login (validacion + submit + estado)?</p>",
                  explicacion:
                    "El nombre del hook debe comunicar QUE HACE, no QUE DEVUELVE. useLoginForm es claro: maneja el formulario de login. useLogin es ambiguo (¿devuelve el usuario? ¿la mutacion?). useForm es generico (no especifica que form). useAuth es de otra cosa (sesion, no formulario). El naming es lo primero que ve el siguiente dev del equipo.",
                  opciones: [
                    { id: "a", texto: "useLogin", esCorrecta: false },
                    { id: "b", texto: "useLoginForm", esCorrecta: true },
                    { id: "c", texto: "useForm", esCorrecta: false },
                    { id: "d", texto: "useAuth", esCorrecta: false },
                  ],
                },
                {
                  id: "q5",
                  enunciado:
                    "<p>Apruebas un PR en code review. El componente tiene 320 lineas, funciona correctamente, los tests pasan. ¿Que haces?</p>",
                  explicacion:
                    "Aprobar 'porque funciona y los tests pasan' es ignorar el contrato del equipo. El limite ≤150 lineas no es estetico — es lo que separa codigo mantenible del que se vuelve intocable. La devolucion correcta es senalar el problema, proponer la descomposicion (subcomponentes y hooks candidatos), y dejar que el autor refactorice. Es trabajo de senior, no escalada al jefe ni aprobacion pasiva.",
                  opciones: [
                    { id: "a", texto: "Apruebo: funciona y los tests pasan", esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        "Pido refactor a ≤150 lineas, propongo subcomponentes y hooks candidatos para guiar al autor",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Lo escalo al lead", esCorrecta: false },
                    {
                      id: "d",
                      texto: "Apruebo con 'TODO: refactorizar despues'",
                      esCorrecta: false,
                    },
                  ],
                },
              ],
              "m7-s3-quiz",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p class="font-serif italic text-aurora-violet" style="font-size: 1.5rem; line-height: 1.4;">"React no es magia ni truco. Es una funcion del estado que devuelve UI. Aprende el modelo y deja de pelear con la libreria — empieza a usarla como herramienta."</p><p>Este modulo es el corazon del curso. Si entendiste el modelo (S1), aprendiste a aplicarlo en vez de pelearlo (S2), y empezaste a cuidar el codigo que escribes con el (S3), tienes mas que el 80% de los devs frontend que se autodenominan "React developer". Lo que viene (Tanstack Query, Testing) se monta sobre esto — son consecuencias del mismo modelo. Si dudas en algun momento "¿esto deberia ser useState o calculo?", "¿deberia ser useEffect o handler?", "¿este componente es complejo o son varios pegados?", vuelve aqui. Las respuestas estan en el modelo, no en la libreria.</p>`,
              "m7-s3-cierre",
            ),
          },
        ],
      },
    ],
  },
  {
    idx: 9,
    titulo: "Modulo 8 — Server state con Tanstack Query",
    descripcion:
      "El cliente no es el dueño del estado del servidor. Tanstack Query es la herramienta correcta para tratarlo asi.",
    secciones: [
      {
        titulo: "Queries, mutations, cache",
        skill: "Server state con Tanstack Query",
        temas:
          "queryKey con jerarquia, staleTime vs gcTime, mutations + invalidacion, refetch on focus/reconnect, anti-patron de fetch en useEffect, sembrar cache con setQueryData.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<h2>El cliente no es dueño del estado del servidor — solo lo cachea</h2><p>Hay un cambio de modelo que separa al dev backend que <em>usa</em> React del que <em>entiende</em> el frontend moderno: <strong>hay dos tipos de estado, y se tratan distinto</strong>.</p><ul><li><strong>Estado del cliente</strong>: lo que vive solo en el browser. Filtros de una tabla, si el sidebar esta abierto, el valor de un input antes de guardarlo. Tu lo creas, tu lo controlas, tu decides cuando borrarlo. <code>useState</code>, Context, Zustand son las herramientas correctas.</li><li><strong>Estado del servidor</strong>: lo que vive en la BD del backend y el cliente solo VE. Lista de usuarios, perfil del usuario actual, cursos disponibles. El cliente <em>nunca</em> es dueño: solo tiene una caché que puede estar desactualizada en cualquier momento — porque otro usuario, otro tab, o un cron del servidor pudo cambiar la verdad sin avisar.</li></ul><p>Cuando los tratas igual (con <code>useState</code> + <code>useEffect</code> para fetchear), reinventas a mano y peor lo que Tanstack Query resuelve probadamente: cancelacion, refetch on focus, deduplicacion entre componentes, cache compartido, invalidacion selectiva, manejo de race conditions. Es construir Tanstack Query desde cero — sin tests, sin documentacion, sin la experiencia de millones de proyectos que ya lo afinaron.</p><p>Tanstack Query no es "una libreria mas". Es la <strong>herramienta que reconoce que el server state es distinto y le da el tratamiento correcto</strong>. Una vez la usas con el modelo en la cabeza, los componentes pierden 80% del codigo de fetch que normalmente se escribe a mano.</p>`,
              "m8-s1-intro",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>Regla del senior</strong>: si te encuentras llamando <code>queryClient.setQueryData</code> tras cada <code>mutation</code> para "arreglar el cache a mano", estas trabajando contra Tanstack Query, no con el. La forma correcta casi siempre es <code>invalidateQueries</code> con la queryKey afectada — y dejar que la libreria refetchee sola con los datos frescos del servidor. <code>setQueryData</code> es para casos puntuales (sembrar cache despues de un login con el usuario que vino en la respuesta, o aplicar un optimistic update con rollback). Para "se acaba de crear un curso, refresca la lista", es <code>invalidateQueries(["cursos"])</code> — una linea, sin sync manual fragil.</p>`,
              "m8-s1-tip",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "tsx",
              `// 1) USEQUERY — lectura con cache automatica
import { useQuery } from "@tanstack/react-query";

// queryKey JERARQUICA — clave para la invalidacion selectiva
export const CURSOS_KEYS = {
  all: ["cursos"] as const,
  listar: (filtros?: ListarFiltros) => ["cursos", "listar", filtros] as const,
  detalle: (id: string) => ["cursos", "detalle", id] as const,
};

function useListarCursos(filtros?: ListarFiltros) {
  return useQuery({
    queryKey: CURSOS_KEYS.listar(filtros),
    queryFn: () => listarCursos(filtros),
    staleTime: 60_000,    // 1 min: fresh, no refetch automatico
    // gcTime: 5 * 60_000 (default): tras 5 min sin usar, se libera de memoria
  });
}

// staleTime vs gcTime — dos conceptos ortogonales que casi todos confunden:
//   - staleTime: cuanto tiempo los datos siguen "frescos" (sin refetch automatico)
//   - gcTime:    cuanto tiempo viven en memoria despues de que nadie los use
// Stale != borrado. Stale solo significa "puede pedirse de nuevo si toca".


// 2) USEMUTATION — escritura + invalidacion
import { useMutation, useQueryClient } from "@tanstack/react-query";

function useCrearCurso() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: crearCurso,
    onSuccess: () => {
      // ✓ BIEN: invalida y deja que TQ refetchee solo
      queryClient.invalidateQueries({ queryKey: CURSOS_KEYS.all });
    },
  });
}

// ✗ MAL: sync manual fragil
//   onSuccess: (nuevoCurso) => {
//     const cursosActuales = queryClient.getQueryData(CURSOS_KEYS.listar(undefined));
//     queryClient.setQueryData(CURSOS_KEYS.listar(undefined), [...cursosActuales, nuevoCurso]);
//     // ¿y la queryKey con filtro? ¿y la del detalle? ¿y el conteo del header?
//     // Cada query relacionada hay que actualizarla a mano. Una se olvida → bug silencioso.
//   }


// 3) QUERYKEY JERARQUICA — invalidacion selectiva

// Invalidar TODO lo de cursos (listas + detalles + lo que sea)
queryClient.invalidateQueries({ queryKey: CURSOS_KEYS.all });

// Invalidar solo los listados (no los detalles)
queryClient.invalidateQueries({ queryKey: ["cursos", "listar"] });

// Invalidar solo un detalle especifico
queryClient.invalidateQueries({ queryKey: CURSOS_KEYS.detalle(cursoId) });

// La invalidacion matchea por PREFIX POSICIONAL:
//   ["cursos"]            matchea ["cursos", "listar", X] y ["cursos", "detalle", Y]
//   ["cursos", "listar"]  matchea ["cursos", "listar", X] pero NO ["cursos", "detalle", Y]
// Por eso las queryKeys se diseñan en arbol — el arbol decide cuanto invalidas.


// 4) ANTIPATRON CLASICO — fetch en useEffect (lo que ya cazamos en M7)
function PerfilMal() {
  const [usuario, setUsuario] = useState(null);
  useEffect(() => { fetch("/api/me").then(r => r.json()).then(setUsuario); }, []);
  // sin cache, sin cancelacion, sin refetch, sin nada. Reinventar TQ peor.
}

function PerfilBien() {
  const { data: usuario } = useQuery({
    queryKey: ["usuario", "actual"],
    queryFn: obtenerUsuarioActual,
    staleTime: 5 * 60_000,
  });
  // cache compartido, dedup, refetch on focus, cancelacion: gratis.
}`,
              "Las 4 piezas centrales: useQuery con queryKey jerarquica, useMutation con invalidateQueries selectivo (en vez de setQueryData manual), entendimiento de staleTime vs gcTime, y por que fetch en useEffect es reinventar TQ peor.",
              "m8-s1-codigo",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "Server state con Tanstack Query",
            contenido: buildQuiz(
              [
                {
                  id: "q1",
                  enunciado:
                    "<p>¿Cual es la diferencia clave entre <strong>client state</strong> y <strong>server state</strong>?</p>",
                  explicacion:
                    "Client state vive solo en el browser (filtros, sidebar abierto, valor de un input): el cliente es dueño. Server state vive en la BD del backend; el cliente solo tiene una CACHE que puede estar desactualizada porque otro usuario, otro tab o un cron pudo cambiar la verdad sin avisar. Tratarlos igual con useState es el bug raiz que Tanstack Query resuelve.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Son lo mismo, son nombres distintos para useState",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Client state vive en el browser y el cliente es dueño; server state vive en la BD del backend y el cliente solo tiene una cache que puede estar desactualizada",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Client state es para mobile, server state para web",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "Client state es sincrono, server state es asincrono",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q2",
                  enunciado:
                    "<p>Tu queryKey es <code>['cursos', 'listar', { activos: true }]</code>. ¿Que invalida <code>invalidateQueries(['cursos'])</code>?</p>",
                  explicacion:
                    "La invalidacion de Tanstack Query matchea por PREFIX POSICIONAL: ['cursos'] matchea cualquier queryKey que empieza con 'cursos' — listados con cualquier filtro, detalles, lo que sea. Por eso las queryKeys se diseñan jerarquicas: te dan control fino sobre el alcance de cada invalidacion.",
                  opciones: [
                    { id: "a", texto: "Nada, no coincide exactamente", esCorrecta: false },
                    {
                      id: "b",
                      texto: "Solo la query exacta ['cursos', 'listar', { activos: true }]",
                      esCorrecta: false,
                    },
                    {
                      id: "c",
                      texto:
                        "Todas las queries cuyo queryKey empieza con 'cursos' — listados con cualquier filtro, detalles, etc.",
                      esCorrecta: true,
                    },
                    { id: "d", texto: "Solo los detalles de cursos", esCorrecta: false },
                  ],
                },
                {
                  id: "q3",
                  enunciado:
                    "<p>¿Cual es la diferencia entre <code>staleTime</code> y <code>gcTime</code>?</p>",
                  explicacion:
                    "staleTime: cuanto tiempo los datos siguen 'frescos' antes de que TQ los considere staleable (puede refetchear automatico si las condiciones se dan). gcTime: cuanto tiempo viven los datos en memoria despues de que NADIE los este usando — pasado eso, se borran. Son ortogonales: stale no significa borrado; significa 'puede pedirse de nuevo si toca'.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Son sinonimos, gcTime es el nombre nuevo",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "staleTime: cuanto tiempo los datos siguen frescos (sin refetch). gcTime: cuanto viven en memoria sin uso antes de borrarse. Ortogonales",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "staleTime es para queries, gcTime para mutations",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "staleTime borra los datos, gcTime los marca para refetch",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q4",
                  enunciado:
                    "<p>Acabas de crear un curso con una mutation. ¿Cual es la forma <strong>correcta</strong> de actualizar la lista en pantalla?</p>",
                  explicacion:
                    "invalidateQueries marca las queries afectadas como stale y TQ refetchea sola con los datos frescos del servidor — sincronizacion automatica, sin sync manual fragil. setQueryData es para casos puntuales (sembrar cache tras login, optimistic updates). Para 'algo cambio, refresca lo afectado', invalidate es la herramienta correcta.",
                  opciones: [
                    {
                      id: "a",
                      texto:
                        "queryClient.setQueryData(['cursos'], [...actuales, nuevo]) — sync manual",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "queryClient.invalidateQueries({ queryKey: ['cursos'] }) — TQ refetchea solo",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "window.location.reload()", esCorrecta: false },
                    {
                      id: "d",
                      texto: "Esperar al staleTime y que se actualice solo",
                      esCorrecta: false,
                    },
                  ],
                },
              ],
              "m8-s1-quiz",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults",
              "Tanstack Query — Important Defaults",
              "Los defaults de Tanstack Query (staleTime: 0, gcTime: 5 min, refetchOnWindowFocus: true, etc.) explicados. Esta pagina es la que evita 80% de la confusion del primer mes: 'por que refetchea cuando vuelvo a la pestaña', 'por que esta haciendo fetch de nuevo'. Leela una vez y la mayoria de los 'comportamientos raros' se aclaran.",
              "m8-s1-recurso",
            ),
          },
        ],
      },
      {
        titulo: "Optimistic updates y patrones de produccion",
        skill: "Server state con Tanstack Query",
        temas:
          "optimistic update con rollback, dependencies entre queries, prefetch, paginated y infinite queries, error boundaries con query.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<h2>El oficio que separa al usuario que <em>siente</em> la app rapida</h2><p>Con las primitivas claras (queries, mutations, cache, invalidacion), llega el oficio: las herramientas que llevan la app de "funciona correctamente" a "se siente como un producto premium". Tres patrones que un dev frontend senior maneja con naturalidad:</p><ol><li><strong>Optimistic updates con rollback</strong>: la mutacion se aplica al UI <em>inmediatamente</em>, antes de que el servidor responda. Si el servidor confirma, todo bien. Si falla, rollback automatico. El usuario percibe la app instantanea sin sacrificar correctitud.</li><li><strong>Dependencies entre queries</strong>: una query que solo deberia dispararse cuando otra dio resultado. <code>useQuery({ enabled: !!userId })</code>. Sin esto, terminas con queries que disparan con <code>undefined</code> y rompen el backend.</li><li><strong>Paginacion e infinite scroll</strong>: <code>useInfiniteQuery</code> resuelve "cargar mas" sin que tu acumules state manualmente. Cache por pagina, deduplicacion, prefetch del siguiente — todo automatico.</li></ol><p>Y un patron de produccion que casi nadie aprende a tiempo: <strong>delegar errores al ErrorBoundary</strong> con <code>useQuery({ throwOnError: true })</code>. En vez de chequear <code>if (error) return ...</code> en cada componente, configuras un boundary y centralizas el manejo. El componente queda con renderizado limpio y los errores se gestionan en un solo lugar.</p>`,
              "m8-s2-intro",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "warning",
              `<p><strong>Regla del senior</strong>: optimistic update es UX premium, pero tambien es deuda. Si el servidor rechaza el cambio y tienes que hacer rollback en el segundo 3, el usuario ve un parpadeo y se pregunta "¿se guardo o no?". Usalo solo donde la operacion rara vez falla (toggle de favorito, like a un post, marcar tarea como hecha). NO lo uses en cosas criticas (pagar, borrar definitivamente, enviar email). Para esas, mejor un loading honesto durante 800ms que un parpadeo de "lo hice, no, perdon, lo desfago".</p>`,
              "m8-s2-tip",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "tsx",
              `// 1) OPTIMISTIC UPDATE CON ROLLBACK — UX inmediato + correctitud

function useToggleFavorito() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cursoId, favorito }) => toggleFavorito(cursoId, favorito),

    // 1. ANTES de enviar al servidor: aplica el cambio al cache
    onMutate: async ({ cursoId, favorito }) => {
      const key = CURSOS_KEYS.detalle(cursoId);
      await queryClient.cancelQueries({ queryKey: key });

      const previo = queryClient.getQueryData<Curso>(key);
      queryClient.setQueryData<Curso>(key, (old) =>
        old ? { ...old, favorito } : old
      );

      return { previo };   // contexto para rollback si falla
    },

    // 2. Si el servidor falla: rollback al valor previo
    onError: (_err, _vars, context) => {
      if (context?.previo) {
        queryClient.setQueryData(CURSOS_KEYS.detalle(_vars.cursoId), context.previo);
      }
    },

    // 3. Al final (exito o fallo): sincronizar con el servidor
    onSettled: (_data, _err, { cursoId }) => {
      queryClient.invalidateQueries({ queryKey: CURSOS_KEYS.detalle(cursoId) });
    },
  });
}


// 2) DEPENDENCIES ENTRE QUERIES — enabled

function PerfilDelUsuario({ userId }: { userId?: string }) {
  // Query 1: usuario actual (siempre activa)
  const { data: usuario } = useQuery({
    queryKey: ["usuario", "actual"],
    queryFn: obtenerUsuarioActual,
  });

  // Query 2: solo se dispara cuando tenemos el id del usuario
  const { data: cursos } = useQuery({
    queryKey: ["cursos", "del-usuario", usuario?.id],
    queryFn: () => listarCursosDelUsuario(usuario!.id),
    enabled: !!usuario?.id,    // KEY: no se dispara con undefined
  });

  if (!usuario) return <Spinner />;
  return <ListaCursos cursos={cursos ?? []} />;
}


// 3) USEINFINITEQUERY — scroll infinito sin state manual

function FeedNovedades() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["novedades", "feed"],
    queryFn: ({ pageParam }) => obtenerNovedades({ cursor: pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
  });

  const items = data?.pages.flatMap(p => p.items) ?? [];

  return (
    <>
      {items.map(n => <NovedadCard key={n.id} novedad={n} />)}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? "Cargando..." : "Cargar mas"}
        </button>
      )}
    </>
  );
}


// 4) THROWONERROR — delegar errores al ErrorBoundary

function VistaCurso({ cursoId }: { cursoId: string }) {
  const { data: curso } = useQuery({
    queryKey: CURSOS_KEYS.detalle(cursoId),
    queryFn: () => obtenerCurso(cursoId),
    throwOnError: true,    // si falla, el ErrorBoundary lo recoge
  });

  if (!curso) return <Spinner />;     // solo loading, no error
  return <CursoDetalle curso={curso} />;
}
// El ErrorBoundary padre se encarga del error con UX consistente.`,
              "Los 4 patrones que llevan la app de 'funciona' a 'se siente premium': optimistic update con rollback automatico, queries dependientes con enabled, infinite scroll sin state manual, y delegar errores al ErrorBoundary para centralizar manejo.",
              "m8-s2-codigo",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "Server state con Tanstack Query",
            contenido: buildQuiz(
              [
                {
                  id: "q1",
                  enunciado: "<p>¿En cual de estos casos NO conviene usar optimistic update?</p>",
                  explicacion:
                    "Optimistic update es UX premium pero deuda si falla: si el servidor rechaza la operacion, tienes que rollback y el usuario ve parpadeo. Para operaciones criticas (pagar, borrar definitivamente, enviar email) el coste de un parpadeo es alto — mejor un loading honesto. Para operaciones que rara vez fallan (toggle favorito, like, marcar tarea) el optimistic update es la opcion correcta.",
                  opciones: [
                    { id: "a", texto: "Toggle de favorito en un curso", esCorrecta: false },
                    { id: "b", texto: "Marcar una tarea como completada", esCorrecta: false },
                    { id: "c", texto: "Procesar un pago de tarjeta", esCorrecta: true },
                    { id: "d", texto: "Like en un comentario", esCorrecta: false },
                  ],
                },
                {
                  id: "q2",
                  enunciado:
                    "<p>Tienes una query que necesita el id del usuario, que viene de otra query. ¿Como evitas que se dispare con <code>undefined</code>?</p>",
                  explicacion:
                    "enabled es la opcion correcta: TQ no dispara la query hasta que el predicado es true. Asi evitas requests con undefined que rompen el backend o devuelven 404. Lo otro (try/catch en queryFn, esperar con setTimeout, etc.) son parches inferiores a la herramienta nativa.",
                  opciones: [
                    { id: "a", texto: "Try/catch dentro de queryFn", esCorrecta: false },
                    { id: "b", texto: "useQuery({ enabled: !!userId, ... })", esCorrecta: true },
                    {
                      id: "c",
                      texto: "setTimeout para esperar a la primera query",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "Lanzar la query siempre y filtrar en el componente",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q3",
                  enunciado:
                    "<p>Necesitas scroll infinito (lista paginada con 'cargar mas'). ¿Cual es la herramienta correcta?</p>",
                  explicacion:
                    "useInfiniteQuery resuelve scroll infinito sin que acumules state manualmente: cada pagina se cachea, hay deduplicacion automatica, la API te da fetchNextPage / hasNextPage / isFetchingNextPage. Acumular paginas con useState + useEffect es reinventar peor lo que ya existe hecho.",
                  opciones: [
                    {
                      id: "a",
                      texto: "useQuery + useState para acumular paginas a mano",
                      esCorrecta: false,
                    },
                    { id: "b", texto: "useInfiniteQuery con getNextPageParam", esCorrecta: true },
                    {
                      id: "c",
                      texto: "useEffect que llama fetch en cada scroll",
                      esCorrecta: false,
                    },
                    { id: "d", texto: "Cargar todo de una vez al montar", esCorrecta: false },
                  ],
                },
                {
                  id: "q4",
                  enunciado:
                    "<p>Ya tienes un ErrorBoundary en la app que muestra UX consistente para errores. ¿Como conviene manejar los errores de queries para no duplicar <code>if (error) return ...</code> en cada componente?</p>",
                  explicacion:
                    "throwOnError: true delega los errores de la query al ErrorBoundary mas cercano del arbol. El componente queda con renderizado limpio (solo maneja loading + data) y los errores se centralizan. Es el patron equivalente a no atrapar excepciones en cada funcion y dejar que suban al manejador comun.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Copiar el chequeo if (error) en cada componente",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "useQuery({ throwOnError: true }) para que el ErrorBoundary los maneje",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Atrapar en queryFn y devolver null", esCorrecta: false },
                    { id: "d", texto: "Usar window.onerror", esCorrecta: false },
                  ],
                },
              ],
              "m8-s2-quiz",
            ),
          },
          {
            idForzado: ID_M8_S2_PREG,
            tipo: TipoBloque.CODIGO_PREGUNTAS,
            esEvaluable: true,
            skill: "Server state con Tanstack Query",
            contenido: buildCodigoPreguntas(
              "javascript",
              `Tanstack Query invalida queries matcheando por PREFIX POSICIONAL en
el queryKey. invalidar(["cursos"]) debe matchear ["cursos", "listar", X]
y ["cursos", "detalle", Y], pero no ["usuarios", ...].

La IA escribio una version de invalidar() pero usa .includes() en vez
de comparar por posicion. Bug: invalidar(keys, ["cursos", "listar"])
devuelve 4 keys (todas las que contienen "cursos") cuando deberia
devolver solo 2 (las que EMPIEZAN con ["cursos", "listar"]).

Tu trabajo: arregla la funcion para que matchee el prefix de forma
posicional. Imprime la longitud del resultado.

Salida esperada: 2`,
              `const keys = [
  ["cursos", "listar", "todos"],
  ["cursos", "listar", "activos"],
  ["cursos", "detalle", "c1"],
  ["cursos", "detalle", "c2"],
  ["usuarios", "actual"],
  ["usuarios", "listar"],
];

// La IA escribio esto. invalidar(keys, ["cursos", "listar"])
// devuelve 4 (todas las que contienen "cursos") — deberia ser 2.
function invalidar(keys, prefix) {
  return keys.filter((k) => prefix.every((p) => k.includes(p)));
}

const resultado = invalidar(keys, ["cursos", "listar"]);
console.log(resultado.length);`,
              "m8-s2-cp",
            ),
          },
          {
            idForzado: ID_M8_S2_TEST,
            tipo: TipoBloque.CODIGO_TESTS,
            esEvaluable: false,
            contenido: buildCodigoTests(
              ID_M8_S2_PREG,
              `const keys = [
  ["cursos", "listar", "todos"],
  ["cursos", "listar", "activos"],
  ["cursos", "detalle", "c1"],
  ["cursos", "detalle", "c2"],
  ["usuarios", "actual"],
  ["usuarios", "listar"],
];

function invalidar(keys, prefix) {
  return keys.filter((k) => {
    if (k.length < prefix.length) return false;
    for (let i = 0; i < prefix.length; i++) {
      if (k[i] !== prefix[i]) return false;
    }
    return true;
  });
}

const resultado = invalidar(keys, ["cursos", "listar"]);
console.log(resultado.length);`,
              [
                {
                  id: "t1",
                  descripcion:
                    "invalidar con prefix ['cursos', 'listar'] devuelve solo las 2 keys que matchean por posicion",
                  entrada: "",
                  salidaEsperada: "2\n",
                  visible: true,
                },
                {
                  id: "t2",
                  descripcion:
                    "No incluye keys que solo CONTIENEN 'cursos' sin matchear posicionalmente",
                  entrada: "",
                  salidaEsperada: "2\n",
                  visible: true,
                },
                {
                  id: "t3",
                  descripcion:
                    "Las dos keys matcheadas son ['cursos', 'listar', 'todos'] y ['cursos', 'listar', 'activos']",
                  entrada: "",
                  salidaEsperada: "2\n",
                  visible: false,
                },
              ],
              "m8-s2-ct",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://tkdodo.eu/blog/practical-react-query",
              "TkDodo — Practical React Query",
              "Blog del mantenedor de Tanstack Query. Articulos cortos y practicos sobre patrones reales: queryKey design, mutations + invalidation, optimistic updates, error handling, testing. Si vas a usar Tanstack Query en serio, esta serie es lectura obligatoria — te ahorra meses de tropiezos.",
              "m8-s2-recurso",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p class="font-serif italic text-aurora-violet" style="font-size: 1.5rem; line-height: 1.4;">"El cliente no es el dueño del estado del servidor. Es solo una vista. Tratarlo asi te ahorra reescribir — mucho peor — el sistema de cache que ya existe hecho en Tanstack Query."</p><p>Lo que aprendiste aqui se nota en cada componente que escribas a partir de ahora: cero <code>useEffect</code> para fetch, cero <code>useState</code> guardando datos del servidor, mutaciones que confian en <code>invalidateQueries</code> en vez de sync manual. El resultado no es solo menos codigo — es menos bugs, mejor UX, y componentes que se leen en 30 segundos en vez de 5 minutos. El siguiente modulo (Testing) cierra el curso enseñandote a probar que todo esto sigue funcionando cuando el codigo evoluciona.</p>`,
              "m8-s2-cierre",
            ),
          },
        ],
      },
    ],
  },
  {
    idx: 10,
    titulo: "Modulo 9 — Testing: unit + integracion + E2E",
    descripcion:
      "Probamos comportamiento del usuario, no detalles de implementacion. Lo que importa, no lo que es trivial.",
    secciones: [
      {
        titulo: "Unitarios y de componentes (Vitest + RTL)",
        skill: "Testing frontend (unit + integracion + E2E)",
        temas:
          "queries accesibles primero (getByRole, getByLabelText), userEvent vs fireEvent, findBy para async, anti-patron del snapshot completo, cuando memo y cuando no.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<h2>Probamos como un usuario, no como un linter</h2><p>Tu ya escribes tests en backend: funciones puras, misma entrada, misma salida, asserts limpios. Esa intuicion es <em>correcta</em> para <code>shared/lib/</code> y para funciones de dominio puras. Pero al testear componentes React, el reflejo de "probar la implementacion" produce tests que se rompen en cada refactor <strong>aunque el usuario siga viendo lo mismo</strong>.</p><p>Un test que verifica que un <code>useState</code> se llama se rompe el dia que lo cambias a <code>useReducer</code> — sin que cambie nada para el usuario. Un snapshot de UI completa se rompe al cambiar una clase de Tailwind. Tests que mockean React o tus propios hooks no prueban nada util. Todo eso es <em>ruido fragil</em>: tests que se vuelven el problema en vez de la solucion.</p><p>El cambio de modelo es claro: <strong>probamos como un usuario</strong>. El usuario no sabe si usaste <code>useState</code> o <code>useReducer</code>. Sabe que al hacer click en "Iniciar sesion" con credenciales validas, va al dashboard. Eso es lo que se prueba. Las herramientas que hacen esto natural:</p><ul><li><strong>Queries accesibles primero</strong>: <code>getByRole</code>, <code>getByLabelText</code>, <code>getByText</code>. Si tu test usa <code>getByTestId</code> o <code>container.querySelector</code>, casi siempre es señal de que estas probando algo equivocado.</li><li><strong><code>userEvent</code> sobre <code>fireEvent</code>: </strong> <code>userEvent</code> simula interaccion real (focus, eventos en cascada). <code>fireEvent</code> es bajo nivel y casi siempre incompleto.</li><li><strong><code>findBy</code> para async</strong>: en vez de <code>setTimeout</code> + <code>getBy</code>, usar <code>await findByX</code> que espera hasta que aparezca el elemento.</li></ul>`,
              "m9-s1-intro",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>Regla del senior</strong>: si tu test usa <code>getByTestId</code> o accede a <code>container.querySelector</code>, parate. Casi siempre es señal de que estas probando algo equivocado. Las queries accesibles fuerzan a que el test refleje lo que el usuario ve — y eso es justo lo que queremos probar. Bonus: un test escrito con <code>getByRole('button', { name: /iniciar/i })</code> verifica de paso que la accesibilidad basica del boton funciona. Dos pajaros, una piedra — sin esfuerzo extra.</p>`,
              "m9-s1-tip",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `// ✗ MAL — test que prueba IMPLEMENTACION
import { render } from "@testing-library/react";
import { useState } from "react";
import * as React from "react";

it("usa useState para el contador", () => {
  const useStateSpy = vi.spyOn(React, "useState");
  render(<Contador />);
  expect(useStateSpy).toHaveBeenCalled();
});
// El dia que cambies useState por useReducer, este test se rompe.
// Pero el USUARIO sigue viendo lo mismo — el test es ruido fragil.


// ✓ BIEN — test que prueba COMPORTAMIENTO del usuario
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

it("incrementa el contador al hacer click en +", async () => {
  render(<Contador />);

  expect(screen.getByText("Total: 0")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "+" }));
  await userEvent.click(screen.getByRole("button", { name: "+" }));

  expect(screen.getByText("Total: 2")).toBeInTheDocument();
});
// Pruebas lo que el usuario ve y hace. Cambias la implementacion
// (useState → useReducer → Zustand → lo que sea) y el test sigue
// pasando — porque el comportamiento no cambio.


// QUERIES ACCESIBLES — orden de preferencia

screen.getByRole("button", { name: /iniciar sesion/i });   // ✓ MEJOR — accesible
screen.getByLabelText("Email");                              // ✓ MUY BIEN — formularios
screen.getByText(/credenciales invalidas/i);                 // ✓ BIEN — contenido visible
screen.getByPlaceholderText("nombre@empresa.com");           // OK
screen.getByDisplayValue("ana@nexott.local");                // OK — valor actual
screen.getByAltText("Logo NexoTT");                          // OK — imagenes
screen.getByTitle("Cerrar");                                 // OK pero raro
screen.getByTestId("login-button");                          // ✗ ULTIMO RECURSO


// FINDBY PARA ASYNC — esperar elementos que aparecen

it("muestra error con credenciales invalidas", async () => {
  render(<LoginForm />);

  await userEvent.type(screen.getByLabelText(/email/i), "ana@nexott.local");
  await userEvent.type(screen.getByLabelText(/contraseña/i), "wrong");
  await userEvent.click(screen.getByRole("button", { name: /iniciar/i }));

  // ✓ findBy* espera hasta que aparezca el elemento (con timeout)
  expect(await screen.findByText(/credenciales invalidas/i)).toBeInTheDocument();

  // ✗ NUNCA: setTimeout + getBy es race condition garantizada
  // await new Promise(r => setTimeout(r, 500));
  // expect(screen.getByText(/credenciales invalidas/i)).toBeInTheDocument();
});`,
              "Tres principios en accion: probar comportamiento (no implementacion), queries accesibles en orden de preferencia, findBy para async (no setTimeout). Si los aplicas, tus tests sobreviven a los refactors y de paso verifican la accesibilidad basica gratis.",
              "m9-s1-codigo",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "Testing frontend (unit + integracion + E2E)",
            contenido: buildQuiz(
              [
                {
                  id: "q1",
                  enunciado: "<p>¿Cual es el principio madre del testing de componentes?</p>",
                  explicacion:
                    "Tests que prueban implementacion se rompen en cada refactor — aunque el comportamiento siga igual. Tests que prueban comportamiento (lo que el usuario ve y hace) sobreviven a los refactors y sirven de documentacion viva de lo que la app hace. La regla la formulo Kent C. Dodds y es la base de Testing Library.",
                  opciones: [
                    { id: "a", texto: "Probar todo, 100% coverage es la meta", esCorrecta: false },
                    {
                      id: "b",
                      texto: "Probar comportamiento del usuario, no detalles de implementacion",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Probar cada hook con renderHook", esCorrecta: false },
                    { id: "d", texto: "Snapshot tests para cada componente", esCorrecta: false },
                  ],
                },
                {
                  id: "q2",
                  enunciado:
                    "<p>Tu test usa <code>container.querySelector('.btn-primary')</code>. ¿Que sugiere esto?</p>",
                  explicacion:
                    "querySelector accede al DOM por selectores CSS — eso prueba implementacion (clases CSS), no comportamiento. Si cambias la clase a 'button-primary', el test se rompe sin que cambie nada para el usuario. Las queries accesibles (getByRole con name) reflejan lo que el usuario ve y son robustas a refactors visuales.",
                  opciones: [
                    { id: "a", texto: "Que el test esta bien y es robusto", esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        "Que el test esta probando algo equivocado (estilo en vez de comportamiento) — deberia ser getByRole",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Que falta importar @testing-library/react",
                      esCorrecta: false,
                    },
                    { id: "d", texto: "Que el boton no existe", esCorrecta: false },
                  ],
                },
                {
                  id: "q3",
                  enunciado:
                    "<p>¿Cual es la diferencia entre <code>userEvent.click</code> y <code>fireEvent.click</code>?</p>",
                  explicacion:
                    "fireEvent dispara UN evento, sin contexto. Un click real en un button dispara focus, mousedown, mouseup, click — userEvent simula todo eso. Por eso userEvent reproduce mejor lo que hace un usuario real, y atrapa bugs que fireEvent no detecta (ej: un componente que solo reacciona en focus + click).",
                  opciones: [
                    { id: "a", texto: "Son sinonimos", esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        "userEvent simula interaccion completa (focus, mousedown, mouseup, click); fireEvent solo dispara UN evento puntual",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "userEvent es sincrono, fireEvent es asincrono",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "fireEvent es mas moderno y reemplaza a userEvent",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q4",
                  enunciado:
                    "<p>Tu test espera que aparezca un mensaje DESPUES de un click async. ¿Cual es la forma correcta?</p>",
                  explicacion:
                    "findBy* espera hasta que el elemento aparece (con timeout, default 1000ms). Reemplaza el patron 'setTimeout + getBy' que es race condition garantizada. Si pones setTimeout(500) y el render real toma 600ms, el test falla; si toma 100ms, el test pasa pero introduce latencia innecesaria. findBy es la herramienta correcta.",
                  opciones: [
                    {
                      id: "a",
                      texto: "await new Promise(r => setTimeout(r, 500)) + getBy",
                      esCorrecta: false,
                    },
                    { id: "b", texto: "await screen.findByText(/mensaje/i)", esCorrecta: true },
                    { id: "c", texto: "screen.getByText(/mensaje/i) sin await", esCorrecta: false },
                    { id: "d", texto: "waitFor + setTimeout combinados", esCorrecta: false },
                  ],
                },
              ],
              "m9-s1-quiz",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://testing-library.com/docs/guiding-principles/",
              "Testing Library — Guiding Principles",
              "Los principios que guian Testing Library: 'cuanto mas se parezcan tus tests a como se usa el software, mas confianza te dan'. Este texto es la base filosofica del testing moderno de frontend. Leerlo te ahorra años de tests fragiles.",
              "m9-s1-recurso",
            ),
          },
        ],
      },
      {
        titulo: "Mocking HTTP con MSW + integracion",
        skill: "Testing frontend (unit + integracion + E2E)",
        temas:
          "mock the boundary not the unit, MSW handlers globales y por test, configurar onUnhandledRequest:'error', test de integracion completo de una pagina con queries reales mockeadas.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<h2>Mock the boundary, not the unit</h2><p>Hay una regla que separa al dev que escribe tests utiles del que escribe tests por compromiso: <strong>mockea las fronteras, no tu propio codigo</strong>. La frontera de una app frontend es: la red, el localStorage, el clock, las APIs del navegador. Todo eso es <em>externo</em> a tu app — puedes mockearlo. El resto (tus hooks, tus componentes, tu logica de dominio) corre <strong>real</strong> en el test.</p><p>Cada vez que mockees un hook tuyo o un componente tuyo, parate. Casi siempre es señal de que el test esta mal pensado: estas probando "que el hook se llamo" en vez de "que el usuario ve lo correcto". Y el dia que refactorizas el hook, el test se rompe sin que el comportamiento haya cambiado.</p><p><strong>MSW (Mock Service Worker)</strong> es la herramienta correcta para mockear la red. En vez de monkey-patchear <code>fetch</code>, MSW intercepta las requests a nivel de red — el codigo de tu app <em>no sabe</em> que esta siendo testeado. Funciona exactamente igual que en produccion, solo que el servidor es controlado por el test. Eso te permite escribir tests de integracion honestos: una pagina entera renderizada, queries reales corriendo, interaccion con <code>userEvent</code>, y el resultado verificado con queries accesibles.</p><p>Un detalle del setup que evita muchos bugs sutiles: configurar <code>onUnhandledRequest: 'error'</code>. Asi, si un test hace un request que no mockeaste, el test FALLA en vez de pasar silenciosamente. Protege contra fugas a APIs reales y contra tests que pasan por suerte.</p>`,
              "m9-s2-intro",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "warning",
              `<p><strong>Regla del senior</strong>: cada vez que escribas <code>vi.mock("./mi-hook")</code> o <code>vi.spyOn</code> sobre tu propio codigo, parate. Casi siempre el test esta mal pensado. Lo correcto es: mockea la frontera (HTTP con MSW, localStorage, clock con <code>vi.useFakeTimers</code>) y deja que tu codigo corra real. Si tu test depende de mockear tu propio hook para "no llamar al fetch real", el problema es que el hook hace fetch sin pasar por MSW. Reordena el setup, no añadas un mock mas.</p>`,
              "m9-s2-tip",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `// 1) SETUP DE MSW — servidor compartido entre tests

// shared/testing/msw-server.ts
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const handlersBase = [
  http.get("/api/usuario/actual", () =>
    HttpResponse.json({ id: "u1", nombre: "Ana", rol: "PARTICIPANTE" })
  ),
];

export const server = setupServer(...handlersBase);


// shared/testing/setup.ts (cargado en vitest config)
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./msw-server";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());   // limpia overrides de cada test
afterAll(() => server.close());

// onUnhandledRequest: "error" → si haces un request que no mockeaste,
// el test FALLA. Protege contra fugas a APIs reales y tests que pasan por suerte.


// 2) TEST DE INTEGRACION — una pagina entera con MSW + userEvent

import { renderConProviders } from "@/shared/testing/render-con-providers";
import { server } from "@/shared/testing/msw-server";
import { http, HttpResponse } from "msw";
import { LoginPage } from "./login.page";

describe("LoginPage", () => {
  it("redirige a bandeja despues de login exitoso", async () => {
    // Override del handler solo para este test
    server.use(
      http.post("/api/auth/login", () =>
        HttpResponse.json({
          usuario: { id: "u1", nombre: "Ana", rol: "PARTICIPANTE" },
        })
      )
    );

    const { navigateMock } = renderConProviders(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), "ana@nexott.local");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "Password123");
    await userEvent.click(screen.getByRole("button", { name: /iniciar sesion/i }));

    // Tras el login exitoso, navegacion a /bandeja
    expect(navigateMock).toHaveBeenCalledWith("/bandeja", { replace: true });
  });

  it("muestra error con credenciales invalidas", async () => {
    server.use(
      http.post("/api/auth/login", () =>
        HttpResponse.json({ message: "Credenciales invalidas" }, { status: 401 })
      )
    );

    renderConProviders(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), "ana@nexott.local");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "wrong");
    await userEvent.click(screen.getByRole("button", { name: /iniciar/i }));

    expect(await screen.findByText(/credenciales invalidas/i)).toBeInTheDocument();
  });
});

// Notar:
//   - Nada de vi.mock('./use-login') o similar. La pagina, el hook, el
//     cliente HTTP — TODO corre real en el test.
//   - Solo se mockea la red (MSW). El resto es realidad.
//   - El test cubre el flujo completo: render → input → click → asersion.
//   - Si mañana refactorizas el hook o el cliente HTTP, este test sigue pasando.`,
              "Setup completo de MSW + un test de integracion real. La clave: nada se mockea excepto la red. La pagina, los hooks y el cliente HTTP corren reales — el test cubre el flujo end-to-end del usuario sin necesidad de E2E.",
              "m9-s2-codigo",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "Testing frontend (unit + integracion + E2E)",
            contenido: buildQuiz(
              [
                {
                  id: "q1",
                  enunciado:
                    "<p>¿Que significa 'mock the boundary, not the unit' en tests de frontend?</p>",
                  explicacion:
                    "Mockea lo EXTERNO a tu app: la red, localStorage, clock, APIs del navegador. NO mockees tu propio codigo: hooks, componentes, logica. Cuando mockeas tu codigo, pruebas que las funciones se llamaron — no que el usuario ve lo correcto. La consecuencia es tests fragiles que se rompen en cada refactor sin que cambie el comportamiento.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Mockear todo para que los tests sean rapidos",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Mockear las fronteras (red, storage, clock) y dejar que tu codigo (hooks, componentes, logica) corra real",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Mockear solo los hooks", esCorrecta: false },
                    { id: "d", texto: "No mockear nada nunca", esCorrecta: false },
                  ],
                },
                {
                  id: "q2",
                  enunciado:
                    "<p>¿Por que MSW es preferible a hacer <code>vi.spyOn(globalThis, 'fetch')</code>?</p>",
                  explicacion:
                    "MSW intercepta a nivel de red — el codigo de tu app NO sabe que esta siendo testeado y se comporta igual que en produccion. spyOn sobre fetch reemplaza la funcion, lo que puede afectar otras cosas (libs internas, manejo de errores). Ademas, MSW soporta REST, GraphQL, intercepcion completa, y los handlers son declarativos y reusables entre tests.",
                  opciones: [
                    { id: "a", texto: "Son equivalentes", esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        "MSW intercepta a nivel de red sin que tu codigo lo note; spyOn reemplaza la funcion fetch globalmente, con efectos colaterales",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "MSW es mas lento pero mas correcto", esCorrecta: false },
                    { id: "d", texto: "spyOn no funciona con TypeScript", esCorrecta: false },
                  ],
                },
                {
                  id: "q3",
                  enunciado:
                    "<p>Configuras MSW con <code>onUnhandledRequest: 'error'</code>. ¿Que ganas?</p>",
                  explicacion:
                    "Si un test hace un request a un endpoint que no mockeaste, el test FALLA en vez de pasar silenciosamente (con 'warn' o 'bypass'). Eso protege contra: fugas a APIs reales en CI, tests que pasan por suerte (porque el endpoint devuelve algo aceptable), y bugs de tests que dejan de cubrir lo que crees. Es la configuracion correcta para CI.",
                  opciones: [
                    { id: "a", texto: "Nada relevante", esCorrecta: false },
                    {
                      id: "b",
                      texto:
                        "Si un test hace un request no mockeado, el test FALLA — protege contra fugas a APIs reales y tests que pasan por suerte",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Hace los tests mas rapidos", esCorrecta: false },
                    { id: "d", texto: "Ejecuta los handlers en paralelo", esCorrecta: false },
                  ],
                },
                {
                  id: "q4",
                  enunciado:
                    "<p>En tu test de integracion de LoginPage, escribes <code>vi.mock('./hooks/use-login')</code>. ¿Que problema tiene?</p>",
                  explicacion:
                    "Mockear tu propio hook significa probar que el hook se llamo, no que el usuario ve lo correcto. Si refactorizas el hook (ej: lo divides en useLoginForm + useNavigateAfterLogin), el test se rompe sin que cambie el comportamiento. La forma correcta: mockear solo la red (MSW intercepta el POST /api/auth/login) y dejar que el hook corra real.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Ninguno, es la forma correcta de aislar el componente",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Estas probando implementacion (que el hook se llamo) en vez de comportamiento — el test se rompera al refactor sin cambio de comportamiento",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Es lento", esCorrecta: false },
                    { id: "d", texto: "vi.mock no funciona en Vitest", esCorrecta: false },
                  ],
                },
              ],
              "m9-s2-quiz",
            ),
          },
          {
            idForzado: ID_M9_S2_PREG,
            tipo: TipoBloque.CODIGO_PREGUNTAS,
            esEvaluable: true,
            skill: "Testing frontend (unit + integracion + E2E)",
            contenido: buildCodigoPreguntas(
              "javascript",
              `Tienes una funcion esEmailValido() y una suite minima de tests que la
ejercita con 5 casos. La IA escribio una implementacion ingenua:
"basta con que incluya @". Solo pasa 1 de los 5 casos.

Tu trabajo: arregla la funcion para que pase los 5 casos y la salida sea
"OK". Lo que aprendes aqui es la regla madre del testing: el test detecto
el bug ANTES de que entrara a produccion. Sin el, los emails invalidos
hubieran pasado.

Salida actual:    FAIL: 1/5
Salida esperada:  OK

Pista: necesitas chequear que haya local part (algo antes del @),
dominio (algo despues del @) y un punto en el dominio.`,
              `// La IA escribio esto. Pasa solo 1/5 casos.
function esEmailValido(email) {
  return email.includes("@");
}

// Suite minima inline (estilo TDD lite)
const casos = [
  ["ana@nexott.local", true],
  ["sin-arroba.com",   false],
  ["a@b",              false],   // dominio sin punto
  ["@nexott.local",    false],   // sin local part
  ["ana@",             false],   // sin dominio
];

let pasaron = 0;
for (const [email, esperado] of casos) {
  if (esEmailValido(email) === esperado) pasaron++;
}

console.log(pasaron === casos.length ? "OK" : "FAIL: " + pasaron + "/5");`,
              "m9-s2-cp",
            ),
          },
          {
            idForzado: ID_M9_S2_TEST,
            tipo: TipoBloque.CODIGO_TESTS,
            esEvaluable: false,
            contenido: buildCodigoTests(
              ID_M9_S2_PREG,
              `function esEmailValido(email) {
  if (typeof email !== "string") return false;
  const partes = email.split("@");
  if (partes.length !== 2) return false;
  const [local, dominio] = partes;
  if (local.length === 0) return false;
  if (dominio.length === 0) return false;
  if (!dominio.includes(".")) return false;
  return true;
}

const casos = [
  ["ana@nexott.local", true],
  ["sin-arroba.com",   false],
  ["a@b",              false],
  ["@nexott.local",    false],
  ["ana@",             false],
];

let pasaron = 0;
for (const [email, esperado] of casos) {
  if (esEmailValido(email) === esperado) pasaron++;
}

console.log(pasaron === casos.length ? "OK" : "FAIL: " + pasaron + "/5");`,
              [
                {
                  id: "t1",
                  descripcion: "Los 5 casos pasan: imprime OK",
                  entrada: "",
                  salidaEsperada: "OK\n",
                  visible: true,
                },
                {
                  id: "t2",
                  descripcion:
                    "Rechaza correctamente emails sin arroba, sin dominio, sin local part",
                  entrada: "",
                  salidaEsperada: "OK\n",
                  visible: true,
                },
                {
                  id: "t3",
                  descripcion: "Acepta emails validos con dominio con punto",
                  entrada: "",
                  salidaEsperada: "OK\n",
                  visible: false,
                },
              ],
              "m9-s2-ct",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://mswjs.io/docs/getting-started",
              "MSW — Getting Started",
              "Documentacion oficial de Mock Service Worker. Setup en Node (Vitest/Jest) y en browser, handlers REST y GraphQL, override por test, configuracion de onUnhandledRequest. La referencia para escribir tests de integracion honestos en frontend.",
              "m9-s2-recurso",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              "<p>Hasta aqui tienes los dos primeros niveles: <strong>unit + componentes</strong> (S1) y <strong>integracion con MSW</strong> (S2). La siguiente seccion cierra el modulo — y el curso entero — con el tercer nivel: E2E con Playwright. Y, mas importante: <em>que NO testear</em>. Porque saber donde NO invertir esfuerzo es tan importante como saber donde si.</p>",
              "m9-s2-puente",
            ),
          },
        ],
      },
      {
        titulo: "E2E con Playwright + que NO testear",
        skill: "Testing frontend (unit + integracion + E2E)",
        temas:
          "1 E2E por ruta critica no por cada boton, page.getByRole sobre selectores CSS, fixtures de login compartidas, trace viewer para debugging, evitar tests fragiles por timing.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<h2>E2E con cabeza: pocos, criticos, verdes</h2><p>El E2E es la cima de la piramide de testing — el que prueba el flujo completo en un navegador real, con todos los servicios reales (o casi). Y es, de lejos, <strong>el mas caro</strong>: lento de ejecutar (segundos por test), lento de escribir, fragil ante cambios visuales, y costoso de mantener. Por eso la regla es contundente: <strong>pocos E2E, los criticos, verdes</strong>.</p><p>Un dev junior escribe un E2E por cada boton. Un senior escribe 5-10 E2E para una app entera: login, primer onboarding, checkout, registro, recuperar password. Cada uno cubre una ruta donde un bug significa <em>perdida real</em> (usuario que no puede entrar, transaccion que falla). El resto se cubre con unit + integracion — que son ~100x mas rapidos y mas faciles de mantener.</p><p>Cuatro reglas del oficio:</p><ol><li><strong><code>page.getByRole</code> sobre selectores CSS</strong>: misma regla que en S1. Accesible primero, fragil ultimo.</li><li><strong>Fixtures de login compartidas</strong>: no repitas el flujo de login en cada test. Una fixture que devuelve una sesion autenticada lo resuelve — todos los tests parten de "usuario logueado".</li><li><strong>Trace viewer</strong>: cuando un E2E falla en CI, el trace de Playwright te muestra cada paso, cada request, cada DOM state. Sin trace viewer, el E2E es "falla a veces, nadie sabe por que" — y se desactiva.</li><li><strong>Evita waits arbitrarios</strong>: nada de <code>page.waitForTimeout(2000)</code>. Usa <code>page.waitForResponse</code> o <code>expect(locator).toBeVisible()</code> que ya tiene retry automatico.</li></ol><p>Y la lista de <strong>lo que NO se testea</strong> (igual o mas importante que lo que si):</p><ul><li>Snapshots de UI completa — fragiles y nadie los lee.</li><li>Libs externas (react-router, Tanstack Query, Zod) — ya estan probadas por sus equipos.</li><li>Componentes triviales (un wrapper de un Button de nexott-ui sin logica) — no aportan.</li><li>Tipos — TypeScript ya los chequea, no necesitan test.</li></ul>`,
              "m9-s3-intro",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "warning",
              `<p><strong>Regla del senior</strong>: el primer E2E de un proyecto vale por mil tests unitarios. El numero 50 vale menos que el primero. Cada E2E que añades sube el coste de cambiar el codigo — y la probabilidad de que alguien lo desactive cuando "falla aleatoriamente". Añade pocos, los criticos, y mantenelos verdes. Si tu suite de E2E esta roja desde hace 2 semanas, el problema no es el codigo: es que tienes demasiados E2E para mantenerlos todos verdes. Bajalos, no los muevas a "skip".</p>`,
              "m9-s3-tip",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `// 1) FIXTURE DE LOGIN COMPARTIDA — no repitas el flujo en cada test

// tests/fixtures/usuario-logueado.ts
import { test as base, expect } from "@playwright/test";

export const test = base.extend<{ usuarioLogueado: void }>({
  usuarioLogueado: async ({ page }, use) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("ana@nexott.local");
    await page.getByLabel(/contraseña/i).fill("Password123");
    await page.getByRole("button", { name: /iniciar sesion/i }).click();
    await expect(page).toHaveURL("/bandeja");

    await use();   // los tests corren aqui ya autenticados

    // Cleanup opcional: logout
  },
});

export { expect };


// 2) E2E DE RUTA CRITICA — un solo flujo, completo, claro

import { test, expect } from "./fixtures/usuario-logueado";

test("usuario abre un curso y completa la primera seccion", async ({
  page,
  usuarioLogueado,    // ← ya esta logueado gracias a la fixture
}) => {
  await page.goto("/bandeja");

  // Abrir el curso
  await page.getByRole("link", { name: /frontend para devs backend/i }).click();
  await expect(page).toHaveURL(/\/cursos\//);

  // Entrar al primer modulo
  await page.getByRole("link", { name: /modulo 0/i }).click();

  // Responder el quiz de la primera seccion
  await page.getByRole("radio", { name: /rebase reescribe/i }).check();
  await page.getByRole("radio", { name: /solo en tu rama personal/i }).check();
  await page.getByRole("radio", { name: /git fetch && git rebase/i }).check();

  await page.getByRole("button", { name: /enviar/i }).click();

  // Verificacion final: la seccion queda marcada como completada
  await expect(page.getByText(/completado/i)).toBeVisible();
});


// 3) DEBUGGING — trace viewer cuando falla en CI

// playwright.config.ts
export default {
  use: {
    trace: "on-first-retry",   // genera trace solo si el test fallo
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  retries: process.env.CI ? 2 : 0,
};

// Al fallar en CI, el trace se sube como artefacto.
// Localmente: npx playwright show-trace trace.zip
// Te muestra cada paso, cada request, cada DOM state en una timeline.
// Sin esto, los E2E que fallan en CI son magicos — y se desactivan.


// 4) WAITS — nunca arbitrarios

// ✗ MAL — race condition garantizada
await page.click("button");
await page.waitForTimeout(2000);
await expect(page.getByText("OK")).toBeVisible();

// ✓ BIEN — espera explicita a lo que tiene que pasar
await page.click("button");
await expect(page.getByText("OK")).toBeVisible();   // retry automatico, sin timer fijo

// O esperar a la respuesta del backend si necesitas mas control
await Promise.all([
  page.waitForResponse(r => r.url().includes("/api/guardar")),
  page.click("button"),
]);`,
              "Los 4 patrones canonicos: fixture compartida para no repetir login, E2E completo de una ruta critica con queries accesibles, trace viewer configurado para debugging real, y waits explicitos en vez de timeouts arbitrarios.",
              "m9-s3-codigo",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "Testing frontend (unit + integracion + E2E)",
            contenido: buildQuiz(
              [
                {
                  id: "q1",
                  enunciado:
                    "<p>Quieres probar que la validacion de email rechaza correctamente entradas invalidas. ¿Que nivel de test es el correcto?</p>",
                  explicacion:
                    "Validacion de una funcion pura → test unitario (rapido, barato, infinito de variantes). Test de componente probaria que el form muestra el error al render — distinto objetivo. Integracion probaria el flujo completo del form — sobredimensionado para validar una funcion. E2E seria carisimo. La regla: el nivel mas bajo que cubre el comportamiento.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Unit test sobre la funcion esEmailValido",
                      esCorrecta: true,
                    },
                    {
                      id: "b",
                      texto: "Integracion con MSW de la pagina de registro",
                      esCorrecta: false,
                    },
                    {
                      id: "c",
                      texto: "E2E con Playwright en la pagina de registro",
                      esCorrecta: false,
                    },
                    { id: "d", texto: "Snapshot test del formulario completo", esCorrecta: false },
                  ],
                },
                {
                  id: "q2",
                  enunciado:
                    "<p>Quieres probar que el flujo COMPLETO de login funciona: input → click → request al backend → navegacion al dashboard. ¿Que nivel es correcto?</p>",
                  explicacion:
                    "Test de integracion con MSW: cubre desde el render hasta la navegacion, con la request mockeada por MSW. Es ~100x mas rapido que un E2E y cubre el mismo flujo desde el punto de vista del usuario. E2E se reserva para casos donde de verdad necesitas el navegador real + servicios reales (auth con un proveedor externo, integracion con pasarela de pago).",
                  opciones: [
                    { id: "a", texto: "Unit test de useLogin", esCorrecta: false },
                    {
                      id: "b",
                      texto: "Test de integracion de LoginPage con MSW",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Snapshot test del LoginForm", esCorrecta: false },
                    {
                      id: "d",
                      texto: "Tres E2E con Playwright para los 3 casos",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q3",
                  enunciado:
                    "<p>Vas a añadir E2E con Playwright a tu app. ¿Cuantos deberian ser, segun el criterio senior?</p>",
                  explicacion:
                    "Pocos E2E, los CRITICOS, verdes. 5-10 para una app entera, cubriendo flujos donde un bug significa perdida real (login, checkout, primer onboarding, registro, recuperar password). Cada E2E añadido sube el coste de cambiar el codigo. Si tu suite de E2E esta roja desde hace 2 semanas, el problema es que tienes demasiados — bajalos, no los muevas a skip.",
                  opciones: [
                    { id: "a", texto: "Uno por cada boton de la app", esCorrecta: false },
                    { id: "b", texto: "Uno por cada componente", esCorrecta: false },
                    {
                      id: "c",
                      texto:
                        "5-10 para una app entera, cubriendo solo las rutas criticas (login, checkout, onboarding, etc.)",
                      esCorrecta: true,
                    },
                    {
                      id: "d",
                      texto: "100% coverage de E2E, como con unit tests",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "q4",
                  enunciado:
                    "<p>Tu E2E hace <code>page.waitForTimeout(2000)</code> entre un click y la asersion. ¿Cual es el problema?</p>",
                  explicacion:
                    "waitForTimeout(2000) es race condition: si la accion tarda mas de 2 segundos, el test falla; si tarda 100ms, el test pasa pero introduce latencia inutil. La forma correcta es esperar al evento real: expect(locator).toBeVisible() tiene retry automatico, o page.waitForResponse() si necesitas esperar a una request especifica. Los timeouts fijos son la causa #1 de E2E 'falla a veces, nadie sabe por que'.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Ninguno, esperar 2s es suficiente para cualquier accion",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Race condition: si tarda mas falla, si tarda menos introduce latencia inutil. La forma correcta es expect(...).toBeVisible() o waitForResponse",
                      esCorrecta: true,
                    },
                    { id: "c", texto: "Que 2000ms es muy poco", esCorrecta: false },
                    { id: "d", texto: "Playwright no soporta waitForTimeout", esCorrecta: false },
                  ],
                },
                {
                  id: "q5",
                  enunciado:
                    "<p>¿Cual de estos NO se debe testear (segun el criterio del modulo)?</p>",
                  explicacion:
                    "react-router ya esta probado por su equipo — testearlo es desperdiciar esfuerzo. El componente trivial (wrapper sin logica) tampoco aporta. Los tipos los chequea TypeScript en build. Lo que SI se testea es comportamiento del usuario en codigo TUYO con logica real: validacion, flujos de pagina, manejo de errores, etc.",
                  opciones: [
                    { id: "a", texto: "Una funcion de validacion de email", esCorrecta: false },
                    {
                      id: "b",
                      texto: "El flujo de login (input → request → navegacion)",
                      esCorrecta: false,
                    },
                    {
                      id: "c",
                      texto:
                        "Que react-router navega correctamente (la libreria) — ya esta probada por su equipo",
                      esCorrecta: true,
                    },
                    {
                      id: "d",
                      texto: "El componente que muestra el error de credenciales invalidas",
                      esCorrecta: false,
                    },
                  ],
                },
              ],
              "m9-s3-quiz",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p class="font-serif italic text-aurora-violet" style="font-size: 1.5rem; line-height: 1.4;">"No te hicimos frontend developer en 6 semanas. Te dimos las herramientas para serlo los proximos 6 años — si decides cuidar lo que escribes, para el usuario, para el equipo, para ti mismo dentro de seis meses."</p><p>Llegaste al final del curso. Pasaste por Git, IA, HTML, CSS, JS, TS, Disciplina, React, Tanstack Query y Testing. Cada modulo ataco un gap real del dev backend entrando a frontend — no para enseñarte la sintaxis, sino para cambiarte el modelo mental donde hacia falta.</p><p>Lo que viene depende de ti. La entrevista con el cliente, el proyecto transversal, la ficha de skills que vas construyendo — todo eso es la consecuencia natural de lo que aprendiste aqui si lo cuidas. Cada PR que firmes, cada review que des, cada componente que escribas: ahi se nota.</p><p>Y si en algun momento dudas — sobre que tag usar, si necesitas <code>useEffect</code>, si tu codigo deberia ser una variante o un fork — vuelve a estos modulos. Las respuestas estan en los modelos, no en buscar el patron en Stack Overflow. Eso es lo que separa al dev que <em>aprende un framework</em> del que <em>aprende un oficio</em>.</p><p>Bienvenido al oficio.</p>`,
              "m9-s3-cierre",
            ),
          },
        ],
      },
    ],
  },
]
