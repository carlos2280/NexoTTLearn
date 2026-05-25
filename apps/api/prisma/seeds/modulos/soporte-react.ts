// Modulos del curso "De Soporte a Frontend Dev" — primer curso oficial de
// NexoTT Learn. Publico: personal de soporte que aprende React + TS.
//
// Tono: espanol de Chile neutro, calido, sin garabatos. Referentes: midudev
// y mouredev. Filosofia: menos es mas, microvictorias frecuentes, IA como
// copiloto, mantra "todavia no".
//
// IMPORTANTE: los comentarios del archivo van sin tildes/ñ por coherencia con
// el patron del seeder existente. El CONTENIDO PEDAGOGICO (strings de
// buildParrafo, buildTip, etc) SI lleva tildes y ñ correctas — es texto que
// ve el alumno y debe estar en espanol bien escrito.
//
// Estado actual:
//   - M00 Bienvenida: COMPLETO (bloques reales)
//   - M01 Git sin panico: COMPLETO (bloques reales)
//   - M02..M08: ESQUELETO (secciones definidas, bloques en placeholder hasta
//     que cada modulo se pula).

import { TipoBloque } from "@prisma/client"

import {
  bloqueId,
  buildCodigoIlustrativo,
  buildCodigoPreguntas,
  buildCodigoTests,
  buildParrafo,
  buildQuiz,
  buildRecurso,
  buildTip,
} from "../_utils"
import type { ModuloDef } from "./index"

// ============================================================================
// IDs preasignados para bloques CODIGO_TESTS que referencian a CODIGO_PREGUNTAS.
// Rango 40000+ para no chocar con el cursor automatico (30000+) ni con los IDs
// del curso "Frontend para devs backend" (9000-9015).
// ============================================================================

const ID_SOP_M01_S2_PREG = bloqueId(40010)
const ID_SOP_M01_S2_TEST = bloqueId(40011)

const ID_SOP_M03_S3_PREG = bloqueId(40020)
const ID_SOP_M03_S3_TEST = bloqueId(40021)
const ID_SOP_M03_S4_PREG = bloqueId(40022)
const ID_SOP_M03_S4_TEST = bloqueId(40023)

const ID_SOP_M04_S2_PREG = bloqueId(40030)
const ID_SOP_M04_S2_TEST = bloqueId(40031)
const ID_SOP_M04_S3_PREG = bloqueId(40032)
const ID_SOP_M04_S3_TEST = bloqueId(40033)

const ID_SOP_M05_S4_PREG = bloqueId(40040)
const ID_SOP_M05_S4_TEST = bloqueId(40041)

const ID_SOP_M06_S2_PREG = bloqueId(40050)
const ID_SOP_M06_S2_TEST = bloqueId(40051)

const ID_SOP_M08_S1_PREG = bloqueId(40070)
const ID_SOP_M08_S1_TEST = bloqueId(40071)

// ============================================================================
// MODULOS_SOPORTE_REACT — 9 modulos + integrador (el integrador no es modulo,
// se especifica en el seed del curso).
// ============================================================================

export const MODULOS_SOPORTE_REACT: readonly ModuloDef[] = [
  // ==========================================================================
  // MODULO 00 — BIENVENIDA: CERO PANICO   (COMPLETO)
  // ==========================================================================
  {
    idx: 20,
    titulo: "Módulo 00 — Bienvenida: Cero pánico",
    descripcion:
      "El punto de partida. Dejamos el entorno listo, calibramos la mentalidad y aprendemos a trabajar con IA sin perder el oficio. Al terminar tienes editor + Node + terminal funcionando, y una bitácora donde vas a anotar tu camino.",
    secciones: [
      // ----------------------------------------------------------------------
      // Seccion 1 — Hola, partamos por la verdad
      // ----------------------------------------------------------------------
      {
        titulo: "Hola, partamos por la verdad",
        skill: "Mentalidad y entorno",
        temas:
          "Quién es el público del curso, por qué partimos desde ti, contrato del curso, regla número uno.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Si llegaste hasta acá es porque alguien — tu jefatura, tú mismo, o el azar — decidió que dabas para más. Y tiene razón.</p>
<p>Llevas tiempo en soporte. Has leído mil logs, has visto bugs que el dev "ya arregló" tres veces, has explicado por chat lo que un usuario no entiende ni por teléfono. Eso, aunque no lo tengas claro, ya es <strong>media carrera de desarrollador</strong>. Lo que te falta no es inteligencia: es <strong>vocabulario técnico</strong> y <strong>horas de pista</strong>.</p>
<p>Este curso no parte de cero. <em>Parte de ti</em>.</p>
<p>En las próximas semanas vamos a hacer tres cosas:</p>
<ul>
  <li>Ponerle nombre técnico a cosas que ya sospechabas.</li>
  <li>Enseñarte React, la herramienta con la que hoy se construye casi toda la web seria.</li>
  <li>Dejarte un proyecto tuyo, hecho con tus manos, que puedas mostrar.</li>
</ul>
<p>Suena ambicioso. <strong>Lo es.</strong> Pero está pensado para que no te pierdas en el camino. Si en algún punto algo no calza, <em>no es que seas lento</em>: es que el bloque está mal escrito y me lo dices. Acá el curso se mejora contigo, no a pesar de ti.</p>`,
              "soporte-m00-s1-intro",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>Regla número uno del curso:</strong> acá nadie sabe todo. Ni tú, ni yo, ni el dev senior del piso 3.</p>
<p>La diferencia es <strong>cuánto rato aguantas sin entender antes de buscar la respuesta</strong>. Eso se entrena, y lo vamos a entrenar.</p>`,
              "soporte-m00-s1-regla-uno",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 2 — La trampa del "no sirvo para esto"
      // ----------------------------------------------------------------------
      {
        titulo: "La trampa del 'no sirvo para esto'",
        skill: "Mentalidad y entorno",
        temas: "Síndrome del impostor, mantra 'todavía no', mentalidad de aprendiz.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Vas a chocar. Mañana, pasado, o en el módulo 4. Vas a leer una línea de código y vas a pensar <em>"esto no es para mí"</em>.</p>
<p>Ese pensamiento tiene nombre técnico: <strong>síndrome del impostor</strong>. Y le pasa al 100% de los desarrolladores. Al que lleva un mes y al que lleva quince años. La única diferencia es que el de quince años ya cachó que ese pensamiento <strong>miente</strong>.</p>
<p>Hay una palabra que va a ser nuestro mantra durante todo el curso: <strong>"todavía no"</strong>.</p>
<ul>
  <li><em>No entiendo TypeScript.</em> → No entiendo TypeScript <strong>todavía</strong>.</li>
  <li><em>No sé hacer un componente.</em> → No sé hacer un componente <strong>todavía</strong>.</li>
  <li><em>No me cabe en la cabeza cómo funciona useEffect.</em> → No me cabe <strong>todavía</strong>.</li>
</ul>
<p>Suena tonto. No lo es. Tu cerebro escucha la diferencia: una versión te cierra la puerta, la otra te deja la puerta entornada. Por esa puerta entornada nos vamos a meter en los próximos módulos.</p>`,
              "soporte-m00-s2-impostor",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "exito",
              `<p><strong>Microvictoria mental:</strong> la próxima vez que te pille la frustración, agrégale un "todavía". Sin excepciones.</p>
<p>Aunque te suene a mentira al principio. Después se vuelve verdad.</p>`,
              "soporte-m00-s2-microvictoria",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 3 — Tu setup en 20 minutos
      // ----------------------------------------------------------------------
      {
        titulo: "Tu setup en 20 minutos",
        skill: "Mentalidad y entorno",
        temas: "VS Code, Node.js, terminal básica, primer comando exitoso.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Para programar necesitas tres cosas:</p>
<ol>
  <li>Un <strong>editor</strong> donde escribir el código.</li>
  <li>Un <strong>motor</strong> que corra ese código.</li>
  <li>Una <strong>terminal</strong> donde darle órdenes al computador.</li>
</ol>
<p>Vamos una por una. Si algo falla, no te frustres: copia el error tal cual aparece y lo vemos. El 90% de los errores de instalación los hemos visto mil veces.</p>`,
              "soporte-m00-s3-intro-setup",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://code.visualstudio.com/",
              "VS Code — Descarga oficial",
              "El editor que usan desde el junior que recién parte hasta el ingeniero de Microsoft. Gratis. Funciona en Windows, Mac y Linux. Descarga, instala, abre. Listo el primer paso.",
              "soporte-m00-s3-vscode",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://nodejs.org/",
              "Node.js — Versión LTS",
              "Node es lo que hace que JavaScript pueda correr fuera del navegador. Lo necesitas porque React se construye sobre Node. Descarga SIEMPRE la versión LTS (la estable), no la 'Current'.",
              "soporte-m00-s3-node",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Después de instalar Node, abre la terminal y verifica que quedó bien instalado.</p>
<p>Si te aparece algo como <code>v20.11.1</code>, estamos al otro lado. Si te dice "comando no encontrado" o algo raro, mira el tip de abajo.</p>`,
              "soporte-m00-s3-verificar-node",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "bash",
              `node --version
# v20.11.1   ← algo así debe responder`,
              "Tu primera conversación con la máquina sin intermediarios. Hasta hoy le hablabas a través de interfaces que alguien armó para ti. Acabas de pasar al otro lado del mesón.",
              "soporte-m00-s3-node-version",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "warning",
              `<p>¿Te dice <strong>"comando no encontrado"</strong> o algo similar?</p>
<p><strong>Reinicia el computador.</strong></p>
<p>Sí, esa misma solución de soporte que llevas años recomendando: acá también funciona. Si después de reiniciar sigue fallando, revisa que hayas instalado la versión LTS y no otra.</p>`,
              "soporte-m00-s3-troubleshoot",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Sobre la terminal:</p>
<ul>
  <li><strong>Windows:</strong> abre "Windows Terminal" (si no lo tienes, búscalo en la Microsoft Store, es gratis).</li>
  <li><strong>Mac:</strong> cmd + espacio, escribe "Terminal", enter.</li>
  <li><strong>Linux:</strong> ya sabes dónde está.</li>
</ul>
<p>Estos son los comandos mínimos para sobrevivir las primeras semanas:</p>`,
              "soporte-m00-s3-terminal-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "bash",
              `cd carpeta        # entrar a una carpeta
cd ..             # volver una carpeta atras
ls                # ver que hay aca (Mac/Linux)
dir               # ver que hay aca (Windows)
mkdir nombre      # crear una carpeta nueva
# Flecha arriba   # repite el ultimo comando (la vas a usar mas que ctrl+c)`,
              "Comandos mínimos de terminal. La flecha arriba la vas a usar mucho más de lo que crees.",
              "soporte-m00-s3-comandos-terminal",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 4 — La IA es tu copiloto, no el piloto
      // ----------------------------------------------------------------------
      {
        titulo: "La IA es tu copiloto, no el piloto",
        skill: "Mentalidad y entorno",
        temas:
          "Cómo usar IA sin volverse dependiente, las dos formas equivocadas, las dos reglas duras del curso.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Antes de partir, hablemos del elefante en la pieza: <strong>ChatGPT, Claude, Copilot, Cursor</strong>, toda esa familia.</p>
<p>Hay dos formas equivocadas de usarlos. Las dos te van a costar la carrera.</p>
<p><strong>Forma 1 — La muleta:</strong> copiar y pegar lo que la IA escupe, sin entender nada. Te funciona... hasta que no funciona. Y el día que no funciona, no sabes ni por dónde empezar a leer el error. Carrera muerta en seis meses, máximo.</p>
<p><strong>Forma 2 — La negación:</strong> <em>"Yo no uso IA porque me hace tonto."</em> Honorable, pero suicida. Te va a pasar por encima alguien que sí la usa bien. Carrera muerta en doce meses.</p>
<p>La forma correcta es la del <strong>copiloto</strong>:</p>
<p><em>La IA escribe rápido. Tú decides si lo que escribió tiene sentido.</em></p>`,
              "soporte-m00-s4-ia-intro",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>En este curso vamos a usar IA con dos reglas duras, no negociables:</p>
<ol>
  <li><strong>Primero piensas, después preguntas.</strong> Aunque sean 30 segundos. Si le preguntas a la IA sin haber pensado, no estás aprendiendo: estás transcribiendo. Y de transcriptor no vive nadie hoy.</li>
  <li><strong>Si no entiendes lo que te dio, no lo pegas.</strong> Le pides a la IA que te lo explique. Y a la explicación también la cuestionas. Porque la IA es ese amigo que sabe mucho pero <em>a veces inventa con seguridad de notario</em>. Tu pega es ser el escéptico cariñoso.</li>
</ol>`,
              "soporte-m00-s4-reglas-duras",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>Spoiler del Módulo 07:</strong> vamos a tener un módulo entero dedicado a prompting y pair programming con IA.</p>
<p>Por ahora, con estas dos reglas vas a estar bien.</p>`,
              "soporte-m00-s4-spoiler",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "Mentalidad y entorno",
            contenido: buildQuiz(
              [
                {
                  id: "m00-q1",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>Según la regla número uno del curso, ¿qué diferencia a un dev senior de un junior?</p>",
                  explicacion:
                    "El senior no sabe todo: simplemente aguanta más rato sin entender antes de buscar la respuesta. Esa tolerancia se entrena.",
                  opciones: [
                    {
                      id: "a",
                      texto: "El senior conoce todos los frameworks de memoria.",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "El senior aguanta más rato sin entender antes de buscar la respuesta.",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "El senior nunca se frustra.",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "El senior no usa Google ni IA.",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m00-q2",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>Estás frustrado porque no entiendes <code>useEffect</code>. Según el mantra del curso, ¿cómo lo reformulas?</p>",
                  explicacion:
                    "Agregar 'todavía' cambia el mensaje que tu cerebro recibe: una puerta cerrada se vuelve una puerta entornada.",
                  opciones: [
                    {
                      id: "a",
                      texto: "'Esto no es para mí.'",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto: "'No me cabe en la cabeza cómo funciona useEffect TODAVÍA.'",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "'Mejor lo googleo y lo copio sin entender.'",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "'useEffect es muy difícil, lo voy a saltar.'",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m00-q3",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>La IA te entrega un bloque de código que resuelve tu problema, pero no entiendes qué hace. ¿Cuál es la forma correcta de actuar según el curso?</p>",
                  explicacion:
                    "Pegar código que no entiendes te deja indefenso el día que falla. Pedirle a la IA que lo explique (y cuestionar la explicación) es la única forma de aprender mientras usas la herramienta.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Pegarlo y seguir, total funciona.",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto: "Pedirle a la IA que te lo explique, y cuestionar la explicación.",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Borrarlo y resolverlo tú sin IA para no contaminar.",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "Preguntarle a un compañero antes de leerlo.",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m00-q4",
                  tipo: "VERDADERO_FALSO",
                  enunciado:
                    "<p>La IA siempre tiene la razón: si te entrega una solución con seguridad, puedes confiar en que es correcta.</p>",
                  explicacion:
                    "Falso. La IA a veces 'alucina' con total seguridad. Por eso tu pega es ser el escéptico cariñoso: confías, pero verificas.",
                  correcta: false,
                },
                {
                  id: "m00-q5",
                  tipo: "RESPUESTA_CORTA",
                  enunciado:
                    "<p>Escribe el comando exacto que se usa en la terminal para verificar que Node.js está instalado correctamente.</p>",
                  explicacion:
                    "node --version te devuelve la versión de Node instalada. Si no responde, Node no está instalado o el sistema no lo encuentra.",
                  respuestasAceptadas: ["node --version", "node -v"],
                  normalizacion: {
                    trim: true,
                    ignorarMayusculas: true,
                    ignorarAcentos: true,
                    ignorarEspaciosDobles: true,
                  },
                },
              ],
              "soporte-m00-s4-quiz",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 5 — Mini reto y cierre
      // ----------------------------------------------------------------------
      {
        titulo: "Mini reto y cierre",
        skill: "Mentalidad y entorno",
        temas: "Reto práctico: crear carpeta de trabajo + bitácora del curso, cierre motivador.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Tu primer reto del curso. Te va a tomar 5 minutos.</strong></p>
<ol>
  <li>Abre VS Code.</li>
  <li>En la terminal, anda al escritorio.</li>
  <li>Crea una carpeta llamada <code>mi-camino-dev</code>.</li>
  <li>Entra a esa carpeta.</li>
  <li>En VS Code: archivo → abrir carpeta → selecciona <code>mi-camino-dev</code>.</li>
  <li>Crea un archivo dentro y llámalo <code>bitacora.md</code>.</li>
  <li>Escribe una sola línea: <em>"Hoy partí. Hay cosas que no sé. Todavía no."</em></li>
</ol>
<p>Guarda. Cierra. Respira.</p>`,
              "soporte-m00-s5-reto",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "bash",
              `cd Desktop                # o "cd Escritorio" en espanol
mkdir mi-camino-dev       # crear la carpeta
cd mi-camino-dev          # entrar a ella
# Ahora en VS Code: archivo -> abrir carpeta -> mi-camino-dev
# Y dentro creas bitacora.md`,
              "Los comandos exactos del reto. Si te equivocas, no pasa nada: borra la carpeta con 'rm -rf mi-camino-dev' (Mac/Linux) o 'rmdir /s mi-camino-dev' (Windows) y vuelves a empezar.",
              "soporte-m00-s5-comandos-reto",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Ese archivo es tu <strong>bitácora del curso</strong>. Cada vez que aprendas algo, lo anotas ahí. Una frase, no más. <em>"Hoy entendí qué es un commit."</em> <em>"Hoy hice mi primer componente."</em> <em>"Hoy me peleé con useEffect y gané."</em></p>
<p>Cuando llegues al Módulo 08 y mires esa bitácora, te vas a reír de lo lejos que llegaste. <strong>Te lo firmo.</strong></p>
<hr/>
<p><strong>Cierre del módulo.</strong></p>
<p>Listo. Tienes:</p>
<ul>
  <li>El entorno instalado y respondiendo.</li>
  <li>La mentalidad calibrada ("todavía no" en el bolsillo).</li>
  <li>Las dos reglas de la IA claras.</li>
  <li>Tu bitácora abierta.</li>
</ul>
<p>Eso es más de lo que tiene el 80% de la gente que dice "voy a aprender a programar" un domingo en la noche y nunca pasa del primer video de YouTube.</p>
<p>En el <strong>Módulo 01</strong> entramos a Git, que es la red de seguridad de cualquier desarrollador. Suena seco. Te prometo que cuando lo cachas, ya no programas igual nunca más: es como cuando aprendiste ctrl+z y dejaste de tenerle miedo a borrar.</p>
<p><strong>Nos vemos al otro lado.</strong></p>`,
              "soporte-m00-s5-cierre",
            ),
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // MODULO 01 — GIT SIN PANICO   (COMPLETO)
  // ==========================================================================
  {
    idx: 21,
    titulo: "Módulo 01 — Git sin pánico",
    descripcion:
      "Git es la red de seguridad de todo desarrollador. Aprenderlo no es opcional. Lo abordamos con la analogía de 'guardar partidas del videojuego' y 'líneas paralelas de la historia'. Al terminar tienes tu primer repo público en GitHub con tu bitácora subida, y escribiste tu primer Conventional Commit válido.",
    secciones: [
      // ----------------------------------------------------------------------
      // Seccion 1 — Por que Git existe
      // ----------------------------------------------------------------------
      {
        titulo: "Por qué Git existe (y por qué te va a salvar la vida)",
        skill: "Git como red de seguridad",
        temas:
          "El problema que Git resuelve, analogía 'guardar partidas', Git vs GitHub, repositorio y ciclo básico (init, add, commit, status, log).",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>¿Alguna vez has visto un archivo llamado <code>informe_final_v23_definitivo_AHORA_SI.docx</code>? Todos lo hemos visto. Esa cadena de "_v23", "_final", "_final_FINAL", "_revisado_jefe", es la versión casera de Git que el mundo inventó antes de que existiera Git. Funciona... más o menos. Hasta el día en que abres el archivo equivocado y mandas a imprimir la versión vieja al cliente.</p>
<p>Git resuelve eso. <strong>Es un sistema que guarda la historia completa de tu trabajo sin que tú tengas que pensar en "v23".</strong> Cada vez que terminas algo, le dices a Git "guarda esto", y queda registrado para siempre. Si mañana metes la pata, vuelves a ese punto sin perder nada.</p>
<p>Otra forma de verlo: <strong>Git es el ctrl+z infinito y compartido</strong>. Pero un ctrl+z con memoria, con nombres, con autores, y con la capacidad de trabajar varias personas en el mismo proyecto sin pisarse.</p>`,
              "soporte-m01-s1-intro",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>La analogía que más te va a servir para entenderlo es la del <strong>videojuego</strong>:</p>
<ul>
  <li>Cuando estás a punto de hacer algo arriesgado — un cambio grande, una decisión que cuesta repetir si sale mal — <strong>guardas la partida</strong>. Eso es un <em>commit</em>.</li>
  <li>Si todo se rompe, <strong>cargas la partida</strong> y vuelves a intentarlo. Eso es <em>volver a un commit anterior</em>.</li>
  <li>Si quieres probar dos caminos distintos sin perder ninguno, <strong>haces dos líneas paralelas</strong> de la historia. Eso son las <em>ramas</em> (branches).</li>
  <li>Si decides que un camino te gustó más, lo <strong>fusionas</strong> con el otro. Eso es un <em>merge</em>.</li>
</ul>
<p>Mantén esa imagen en la cabeza durante todo el módulo. Cuando algo te confunda, vuelve a "es como guardar partidas". Te va a destrabar el 90% de las dudas.</p>`,
              "soporte-m01-s1-analogia",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>Git ≠ GitHub.</strong> Esta es la confusión más común y vale la pena aclararla ahora.</p>
<ul>
  <li><strong>Git</strong> es el programa que corre en tu computador y maneja las versiones. Es local. Funciona sin internet.</li>
  <li><strong>GitHub</strong> es un sitio web (de Microsoft) donde subes tus repositorios para compartirlos, colaborar, y respaldarlos en la nube. Es como Google Drive, pero para código.</li>
</ul>
<p>Hay otros: GitLab, Bitbucket, Azure DevOps. Todos hacen lo mismo. En este curso usamos GitHub porque es el estándar de la industria.</p>`,
              "soporte-m01-s1-git-vs-github",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Un <strong>repositorio</strong> (o "repo") es simplemente <strong>una carpeta + la memoria de todos los cambios</strong> que han pasado dentro de ella. Cuando le dices a Git "esta carpeta es un repo", el programa empieza a registrar todo lo que cambia ahí adentro.</p>
<p>El ciclo básico de uso son cuatro pasos que vas a repetir miles de veces en tu carrera:</p>
<ol>
  <li><code>git init</code> — convierte una carpeta en repo (una sola vez por proyecto).</li>
  <li><code>git status</code> — pregunta "Git, ¿qué cambió?".</li>
  <li><code>git add archivo</code> — marca los archivos que quieres guardar en el próximo commit.</li>
  <li><code>git commit -m "mensaje"</code> — guarda la partida con un nombre descriptivo.</li>
</ol>
<p>Y para ver la historia: <code>git log</code>. Te muestra todos los commits ordenados del más nuevo al más viejo.</p>`,
              "soporte-m01-s1-repo",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "bash",
              `# Te paras en la carpeta que quieres convertir en repo
cd mi-camino-dev

# 1. Inicializas Git
git init

# 2. Le preguntas a Git que ve
git status
# Te mostrara los archivos "untracked" (sin seguimiento todavia)

# 3. Le dices que el archivo bitacora.md te interesa
git add bitacora.md

# 4. Guardas tu primer commit
git commit -m "docs: primer commit con la bitacora del curso"

# 5. Ves la historia
git log`,
              "El ciclo completo: de carpeta cualquiera a repositorio con su primer commit. Esto se hace UNA vez al iniciar un proyecto; los pasos 3-4 los repites cada vez que termines algo.",
              "soporte-m01-s1-comandos-basicos",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "exito",
              `<p><strong>Microvictoria del módulo:</strong> el primer <code>git log</code> que ves con TU commit con TU mensaje es un momento que se siente. Anótalo en la bitácora.</p>
<p>Desde ese instante, ya no estás escribiendo código "que se puede perder". Estás escribiendo código <em>con historia</em>. Es un cambio de mentalidad que no se ve, pero que importa.</p>`,
              "soporte-m01-s1-microvictoria",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 2 — Commit, branch y pull request
      // ----------------------------------------------------------------------
      {
        titulo: "Commit, branch y pull request: el trío básico",
        skill: "Git como red de seguridad",
        temas:
          "Qué es un commit y por qué el mensaje importa, Conventional Commits, ramas como vidas paralelas, pull request como conversación del equipo, GitHub. Reto: escribir un Conventional Commit válido (autocorregible).",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Un <strong>commit</strong> es una foto del proyecto en un momento exacto + un mensaje que explica por qué. La foto Git la saca solo: tú solo tienes que escribir el mensaje.</p>
<p>Y acá viene una verdad incómoda: <strong>la mayoría de los devs principiantes escriben mensajes terribles.</strong></p>
<ul>
  <li><code>"arreglos"</code></li>
  <li><code>"cambios varios"</code></li>
  <li><code>"asdf"</code></li>
  <li><code>"ahora si"</code></li>
  <li><code>"final"</code> (y dos commits después: <code>"final 2"</code>)</li>
</ul>
<p>Esos mensajes son inservibles. Cuando mañana, en seis meses, o en dos años, alguien tenga que revisar la historia para entender por qué algo cambió, esos mensajes no le dicen nada. Y ese "alguien" probablemente vas a ser tú.</p>`,
              "soporte-m01-s2-mensajes-malos",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Para que los mensajes de commit sean útiles, la industria adoptó un estándar: <strong>Conventional Commits</strong>.</p>
<p>El formato es:</p>
<p><code>tipo(scope): descripción en minúsculas</code></p>
<p>Donde:</p>
<ul>
  <li><strong>tipo</strong> es uno de estos (los que vas a usar más):
    <ul>
      <li><code>feat</code> — agregaste una funcionalidad nueva.</li>
      <li><code>fix</code> — arreglaste un bug.</li>
      <li><code>docs</code> — cambios en documentación.</li>
      <li><code>refactor</code> — reorganizaste código sin cambiar lo que hace.</li>
      <li><code>test</code> — agregaste o ajustaste tests.</li>
      <li><code>chore</code> — cambios de mantenimiento (dependencias, config).</li>
    </ul>
  </li>
  <li><strong>scope</strong> es la parte del proyecto que tocaste (ej: <code>auth</code>, <code>usuarios</code>, <code>login</code>). Es opcional pero útil.</li>
  <li><strong>descripción</strong> es una frase corta, en minúsculas, sin punto al final, en imperativo o presente.</li>
</ul>
<p>Sigue ese formato y tus commits se vuelven legibles para el resto del equipo (y para ti, mañana).</p>`,
              "soporte-m01-s2-conventional",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "bash",
              `# Bien:
git commit -m "feat(login): agrega validacion de email con regex"
git commit -m "fix(carrito): corrige calculo del total cuando hay descuento"
git commit -m "docs: actualiza README con instrucciones de setup"
git commit -m "refactor(api): extrae logica de auth a un servicio aparte"

# Mal (no hagas esto):
git commit -m "arreglos"
git commit -m "WIP"
git commit -m "cambios"
git commit -m "Arregla cosas y agrega features y refactoriza tres modulos"
# (el ultimo es malo porque mezcla varios cambios -- un commit, una cosa)`,
              "Compara los dos bloques. La diferencia es leer una historia clara vs. leer 'arreglos' en 50 commits seguidos. Tu yo del futuro te lo va a agradecer.",
              "soporte-m01-s2-ejemplos-commits",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Hasta ahora todo lo que has hecho ha sido sobre una sola línea de historia (la rama principal, llamada <code>main</code> por convención). Pero la mayoría de las veces no vas a trabajar directo sobre <code>main</code>.</p>
<p>Cuando quieres hacer un cambio nuevo, lo correcto es crear una <strong>rama</strong> (branch). Una rama es <strong>una copia paralela de la historia</strong> donde experimentas sin tocar lo que está funcionando.</p>
<p>Cuando tu cambio está listo y probado, lo <strong>fusionas</strong> de vuelta a <code>main</code>. Eso es un <strong>merge</strong>.</p>
<p>Y para que el merge no sea unilateral (tú solo decidiendo qué se mete), existe el <strong>Pull Request</strong> (PR): le pides al equipo "oigan, miren lo que hice, ¿lo metemos?". Ellos revisan, comentan, sugieren cambios, y cuando todos están de acuerdo, se fusiona.</p>
<p>Así trabaja el 100% de los equipos de desarrollo serios del mundo. Sin excepción.</p>`,
              "soporte-m01-s2-branches-pr",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "bash",
              `# Crear una rama nueva para tu cambio
git switch -c feat/agregar-bitacora

# Trabajas, agregas archivos, commits...
git add .
git commit -m "feat: agrega seccion de aprendizajes a la bitacora"

# Subes tu rama a GitHub
git push -u origin feat/agregar-bitacora

# En GitHub: abres un Pull Request desde la web,
# pidiendo que tu rama se fusione con main.
# El equipo revisa, comenta, aprueba.
# Al final, alguien hace click en "Merge pull request".`,
              "El flujo real de equipo. Nunca trabajas directo en main si hay más de una persona en el proyecto (y aunque estés solo, es buena disciplina).",
              "soporte-m01-s2-flujo-pr",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://github.com/signup",
              "GitHub — Crear cuenta",
              "Si todavía no tienes cuenta de GitHub, crea una ahora. Usa tu email personal, no el corporativo: este es tu CV vivo y te va a acompañar toda la carrera.",
              "soporte-m01-s2-github-signup",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://www.conventionalcommits.org/es/v1.0.0/",
              "Conventional Commits — Especificación en español",
              "La especificación completa de Conventional Commits, en español. Tenla a mano: la vas a consultar las primeras semanas hasta que se te quede el formato en la cabeza.",
              "soporte-m01-s2-conventional-docs",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "Git como red de seguridad",
            contenido: buildQuiz(
              [
                {
                  id: "m01-q1",
                  tipo: "OPCION_UNICA",
                  enunciado: "<p>¿Qué es un commit en Git?</p>",
                  explicacion:
                    "Un commit es una foto del proyecto en un punto del tiempo, más un mensaje que explica el porqué. Git saca la foto solo; tú solo escribes el mensaje.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Una copia de seguridad del proyecto en la nube.",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Una foto del proyecto en un momento exacto, más un mensaje que explica por qué.",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Un archivo comprimido con el código actual.",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "Un enlace para compartir tu repositorio con otros.",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m01-q2",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>¿Cuál de estos mensajes sigue Conventional Commits correctamente?</p>",
                  explicacion:
                    "El formato es 'tipo(scope): descripción en minúsculas'. 'feat(carrito): agrega botón de checkout' cumple los tres requisitos.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Arreglos varios en el carrito",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto: "feat(carrito): agrega boton de checkout",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "FEAT: Agrega Boton De Checkout.",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "added new checkout button to cart component",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m01-q3",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>Estás trabajando en una funcionalidad nueva y quieres experimentar sin romper lo que funciona en <code>main</code>. ¿Qué haces?</p>",
                  explicacion:
                    "Crear una rama (branch) te da una línea paralela de la historia donde puedes experimentar. Cuando está listo, abres un Pull Request para fusionarla con main.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Hago una copia de la carpeta y trabajo ahí.",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto: "Borro main y empiezo de cero.",
                      esCorrecta: false,
                    },
                    {
                      id: "c",
                      texto: "Creo una rama nueva con git switch -c y trabajo ahí.",
                      esCorrecta: true,
                    },
                    {
                      id: "d",
                      texto: "Trabajo directo en main y cruzo los dedos.",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m01-q4",
                  tipo: "VERDADERO_FALSO",
                  enunciado: "<p>Git y GitHub son lo mismo.</p>",
                  explicacion:
                    "Falso. Git es el programa local que maneja las versiones (funciona sin internet). GitHub es un sitio web donde subes tus repositorios. Hay otros sitios equivalentes: GitLab, Bitbucket, Azure DevOps.",
                  correcta: false,
                },
                {
                  id: "m01-q5",
                  tipo: "RESPUESTA_CORTA",
                  enunciado:
                    "<p>¿Cuál es el comando exacto para convertir una carpeta en un repositorio de Git?</p>",
                  explicacion:
                    "git init es el comando que inicializa Git en la carpeta donde estás parado. Solo se ejecuta una vez por proyecto.",
                  respuestasAceptadas: ["git init"],
                  normalizacion: {
                    trim: true,
                    ignorarMayusculas: true,
                    ignorarAcentos: true,
                    ignorarEspaciosDobles: true,
                  },
                },
              ],
              "soporte-m01-s2-quiz",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Reto de código:</strong> tu primer Conventional Commit válido.</p>
<p>En el siguiente bloque vas a escribir un programa que imprime un mensaje de commit en formato Conventional Commits. El sistema verifica automáticamente que el mensaje tenga el formato correcto.</p>
<p>Te damos el contexto: imagina que acabas de agregar un campo nuevo (<code>telefono</code>) al modelo de usuario de un proyecto. Tienes que escribir el mensaje de commit que describa ese cambio.</p>`,
              "soporte-m01-s2-intro-reto",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_PREGUNTAS,
            esEvaluable: true,
            skill: "Git como red de seguridad",
            idForzado: ID_SOP_M01_S2_PREG,
            contenido: buildCodigoPreguntas(
              "javascript",
              `Escribe un programa que IMPRIMA (con console.log) un mensaje de commit valido segun Conventional Commits para describir el siguiente cambio:

Cambio: agregaste un campo "telefono" al modelo Usuario del modulo "usuarios".

Reglas:
  - Tipo: feat (es una funcionalidad nueva).
  - Scope: usuarios.
  - Descripcion: en minusculas, sin punto final, en presente. Debe contener la palabra "telefono".
  - Una sola linea, sin saltos extra.

Ejemplo de formato: feat(scope): descripcion en minusculas

Salida exacta esperada:
  feat(usuarios): agrega campo telefono al modelo Usuario`,
              `// Escribe tu solucion abajo.
// Pista: console.log("feat(...)...");

`,
              "soporte-m01-s2-codigo-preguntas",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_TESTS,
            esEvaluable: false,
            idForzado: ID_SOP_M01_S2_TEST,
            contenido: buildCodigoTests(
              ID_SOP_M01_S2_PREG,
              `console.log("feat(usuarios): agrega campo telefono al modelo Usuario")`,
              [
                {
                  id: "t1",
                  descripcion: "Imprime el mensaje exacto esperado",
                  entrada: "",
                  salidaEsperada: "feat(usuarios): agrega campo telefono al modelo Usuario\n",
                  visible: true,
                },
                {
                  id: "t2",
                  descripcion: "Usa el tipo 'feat' y el scope '(usuarios)'",
                  entrada: "",
                  salidaEsperada: "feat(usuarios): agrega campo telefono al modelo Usuario\n",
                  visible: true,
                },
                {
                  id: "t3",
                  descripcion: "Test oculto: formato y contenido completos",
                  entrada: "",
                  salidaEsperada: "feat(usuarios): agrega campo telefono al modelo Usuario\n",
                  visible: false,
                },
              ],
              "soporte-m01-s2-codigo-tests",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Si pasaste el reto: <strong>acabas de escribir tu primer Conventional Commit válido</strong>. Suena chico. No lo es. Esa es la disciplina que separa a un dev que se entiende con el equipo de uno que escribe "arreglos varios" y nadie sabe qué hizo.</p>
<hr/>
<p><strong>Cierre del módulo.</strong></p>
<p>Tienes:</p>
<ul>
  <li>Git instalado y el ciclo básico claro (<code>init</code> → <code>add</code> → <code>commit</code>).</li>
  <li>La diferencia entre Git y GitHub.</li>
  <li>El formato Conventional Commits en la cabeza.</li>
  <li>El concepto de ramas y pull request, aunque aún no los hayas usado en serio.</li>
  <li>(Bonus) Si ya tienes cuenta de GitHub y subiste tu bitácora, ya partiste tu CV vivo.</li>
</ul>
<p>En el <strong>Módulo 02</strong> entramos a la web por dentro: HTML, CSS, y cómo funciona internet en humano. Spoiler: vas a entender por qué el navegador a veces se cae y por qué tu jefe insiste en que "actualices la página con ctrl+f5".</p>
<p><strong>Nos vemos al otro lado.</strong></p>`,
              "soporte-m01-s2-cierre",
            ),
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // MODULO 02 — LA WEB POR DENTRO   (COMPLETO)
  // ==========================================================================
  {
    idx: 22,
    titulo: "Módulo 02 — La web por dentro",
    descripcion:
      "Qué pasa cuando abres una pestaña del navegador. HTML para dar estructura, CSS para vestir, el inspector como superpoder. Accesibilidad mínima porque van a hacer producto interno. Al terminar entiendes la web por dentro y tienes la receta para publicar tu primera página personal.",
    secciones: [
      // ----------------------------------------------------------------------
      // Seccion 1 — Cliente, servidor, request y response (en humano)
      // ----------------------------------------------------------------------
      {
        titulo: "Cliente, servidor, request y response (en humano)",
        skill: "La web por dentro (HTML/CSS)",
        temas:
          "Modelo cliente-servidor explicado con la analogía del restaurante. Qué pasa al teclear una URL. Status codes más comunes.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Llevas años usando el navegador. Lo abres en piloto automático, tecleas una dirección, y aparece una página. Magia. Hasta que un día algo se cae, alguien grita "se cayó el servidor", tú reinicias el router, y nadie sabe muy bien qué pasó.</p>
<p>En este módulo vamos a abrir el capó. <strong>No es magia: es una conversación entre dos máquinas con reglas muy claras.</strong> Y cuando entiendas esas reglas, vas a poder leer errores que hoy te suenan a chino y debuggear cosas que hoy escalas al dev senior.</p>
<p>Tres palabras nuevas que vamos a usar todo el módulo. Las explico ahora y no las vuelvo a explicar:</p>
<ul>
  <li><strong>Cliente:</strong> tu navegador (Chrome, Firefox, lo que sea). El que pide.</li>
  <li><strong>Servidor:</strong> un computador en algún lugar del mundo que tiene la página guardada. El que entrega.</li>
  <li><strong>Protocolo:</strong> el idioma que usan para entenderse. En la web ese idioma se llama <strong>HTTP</strong>.</li>
</ul>`,
              "soporte-m02-s1-intro",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>La mejor analogía para entender esto es <strong>un restaurante</strong>:</p>
<ul>
  <li>Tú entras y te sientas. Tú eres el <strong>cliente</strong>.</li>
  <li>La cocina, allá atrás, tiene los ingredientes. La cocina es el <strong>servidor</strong>.</li>
  <li>Le pides al mesero un lomo a lo pobre. Ese pedido es un <strong>request</strong> (en inglés: una petición).</li>
  <li>El mesero vuelve con tu plato. Ese plato es la <strong>response</strong> (la respuesta).</li>
</ul>
<p>Cada vez que abres una pestaña, esto pasa <strong>decenas de veces por segundo</strong>. Cada imagen, cada botón, cada fuente bonita, es un pedido distinto a la cocina. Por eso a veces una página carga lenta: muchos pedidos al mismo tiempo, cocina saturada, mesero exhausto.</p>
<p>Listo. Acabas de entender internet a un nivel suficiente para el 95% de tu trabajo como dev. <strong>Te lo firmo.</strong></p>`,
              "soporte-m02-s1-restaurante",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Veamos qué pasa exactamente cuando tecleas <code>google.com</code> y aprietas enter. Lo cuento en cámara lenta, pero en la vida real esto demora milésimas de segundo:</p>
<ol>
  <li>Tu navegador pregunta: <em>"¿alguien sabe dónde queda google.com?"</em>. Esa traducción de nombre a dirección numérica se llama <strong>DNS</strong> (piensa en la guía telefónica de internet).</li>
  <li>Alguien le responde: <em>"queda en la IP 142.250.190.78"</em>. Esa IP es la dirección física del servidor.</li>
  <li>Tu navegador toca la puerta de ese servidor y le dice <em>"hola, ¿estás ahí?"</em>. El servidor contesta <em>"sí, dime"</em>. A ese saludo formal lo llaman <strong>handshake</strong> (apretón de manos).</li>
  <li>Ahí recién tu navegador hace el pedido real: <em>"dame la página principal, por favor"</em>. Eso es la <strong>request HTTP</strong>.</li>
  <li>El servidor responde con un paquete que contiene HTML, CSS, JavaScript, imágenes, fuentes, lo que sea. Eso es la <strong>response</strong>.</li>
  <li>Tu navegador lee ese paquete y lo arma en pantalla. <strong>Eso ya es renderizado</strong>, y es básicamente lo único visible para ti.</li>
</ol>
<p>Si en algún punto algo falla — el DNS no responde, el servidor está caído, la conexión se corta — ves un error. Cada error tiene un código y un significado.</p>`,
              "soporte-m02-s1-paso-a-paso",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>Los status codes que vas a ver mil veces en tu carrera:</strong></p>
<ul>
  <li><strong>200 OK</strong> — todo bien, el plato llegó como pediste.</li>
  <li><strong>301 / 302</strong> — "esa página se mudó, ahora vive acá". El navegador te redirige solo.</li>
  <li><strong>400 Bad Request</strong> — pediste algo mal escrito. Tu culpa, no del servidor.</li>
  <li><strong>401 Unauthorized</strong> — "muestra el carnet primero" (no estás logueado).</li>
  <li><strong>403 Forbidden</strong> — "te conozco, pero acá no entras" (estás logueado, pero no tienes permiso).</li>
  <li><strong>404 Not Found</strong> — pediste un plato que no está en la carta. Es el error más famoso de internet.</li>
  <li><strong>500 Internal Server Error</strong> — "la cocina se quemó". Algo se rompió del lado del servidor, no es tu culpa.</li>
  <li><strong>418 I'm a teapot</strong> — sí, existe. Sí, dice "soy una tetera". Fue una broma de programadores en 1998 que terminó siendo un estándar real. Internet es así.</li>
</ul>
<p><strong>Regla mnemotécnica:</strong> los <strong>4xx</strong> son culpa del cliente (tú o el navegador), los <strong>5xx</strong> son culpa del servidor.</p>`,
              "soporte-m02-s1-status-codes",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "exito",
              `<p><strong>Microvictoria:</strong> la próxima vez que un usuario te diga "me cargó mal la página", lo primero que vas a preguntar es <em>"¿qué error te dio? ¿404? ¿500?"</em>.</p>
<p>Esa pregunta hace que el dev senior del equipo te mire distinto. Acabas de pasar de <em>"a mí no me anda"</em> a <em>"el servidor está devolviendo 500"</em>. Es el mismo problema. Pero suena 100 veces más profesional. Y resolverlo va a ser 100 veces más rápido.</p>`,
              "soporte-m02-s1-microvictoria",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 2 — HTML: el esqueleto de la pagina
      // ----------------------------------------------------------------------
      {
        titulo: "HTML: el esqueleto de la página",
        skill: "La web por dentro (HTML/CSS)",
        temas:
          "Estructura mínima de un HTML. Etiquetas semánticas (header, main, section, article, nav, footer). Por qué la sopa de divs es antipatrón. Atributos básicos.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Todo lo que ves en una página web está construido con tres tecnologías que trabajan juntas. La analogía que mejor lo explica es la del <strong>cuerpo humano</strong>:</p>
<ul>
  <li><strong>HTML</strong> es el <strong>esqueleto</strong>: define qué partes existen y cómo se organizan. Sin huesos, no hay cuerpo.</li>
  <li><strong>CSS</strong> es la <strong>ropa y la piel</strong>: cómo se ve, qué color tiene, cómo se acomoda.</li>
  <li><strong>JavaScript</strong> es el <strong>movimiento</strong>: lo que hace que el cuerpo reaccione cuando le pasa algo.</li>
</ul>
<p>En esta sección nos quedamos con el primero: <strong>HTML</strong>. Sigla de "HyperText Markup Language", que en cristiano significa <em>"un idioma para marcar partes de un documento"</em>. Cada parte de la página se envuelve en una <strong>etiqueta</strong> (en inglés: <em>tag</em>) que le dice al navegador qué es.</p>`,
              "soporte-m02-s2-intro",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Una etiqueta se ve así: <code>&lt;nombre&gt;contenido&lt;/nombre&gt;</code>. Casi siempre vienen en pareja: una de apertura y otra de cierre. La de cierre lleva un <code>/</code> antes del nombre — esa es la única regla que vas a tener que recordar a la fuerza.</p>
<p>El esqueleto mínimo de un archivo HTML es así. Mírelo bien porque lo vas a escribir, copiar o adaptar miles de veces:</p>`,
              "soporte-m02-s2-intro-etiquetas",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "html",
              `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mi primera pagina</title>
  </head>
  <body>
    <h1>Hola, mundo</h1>
    <p>Esta es mi primera pagina web.</p>
  </body>
</html>`,
              "El esqueleto mínimo. <!DOCTYPE html> avisa al navegador 'esto es HTML moderno'. El <head> son metadatos invisibles (título de la pestaña, codificación). El <body> es lo que el usuario ve. Memoriza el patrón, no las palabras: con copy/paste de este bloque arrancas el 100% de tus páginas.",
              "soporte-m02-s2-esqueleto-html",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Dentro del <code>&lt;body&gt;</code> hay decenas de etiquetas posibles. <strong>La buena noticia: solo usas 10 o 12 a diario.</strong> Las otras 90 son nicho.</p>
<p>Acá vienen las que vas a usar siempre, agrupadas por para qué sirven:</p>
<ul>
  <li><strong>Estructura general:</strong> <code>&lt;header&gt;</code>, <code>&lt;nav&gt;</code>, <code>&lt;main&gt;</code>, <code>&lt;section&gt;</code>, <code>&lt;article&gt;</code>, <code>&lt;footer&gt;</code>.</li>
  <li><strong>Texto:</strong> <code>&lt;h1&gt;</code> a <code>&lt;h6&gt;</code> (títulos, de más grande a más chico), <code>&lt;p&gt;</code> (párrafo), <code>&lt;strong&gt;</code> (negrita semántica), <code>&lt;em&gt;</code> (énfasis).</li>
  <li><strong>Listas:</strong> <code>&lt;ul&gt;</code> (sin orden), <code>&lt;ol&gt;</code> (con orden), <code>&lt;li&gt;</code> (cada ítem).</li>
  <li><strong>Enlaces e imágenes:</strong> <code>&lt;a href="..."&gt;</code> (link), <code>&lt;img src="..." alt="..."&gt;</code> (imagen).</li>
  <li><strong>Inputs:</strong> <code>&lt;form&gt;</code>, <code>&lt;input&gt;</code>, <code>&lt;label&gt;</code>, <code>&lt;button&gt;</code>.</li>
</ul>
<p>Y existe una etiqueta que es el <strong>comodín cuando no sabes qué usar</strong>: <code>&lt;div&gt;</code>. No significa nada en particular. Es una caja genérica. Y ahí está la trampa.</p>`,
              "soporte-m02-s2-etiquetas-clave",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>El antipatrón más común en HTML tiene nombre propio: <strong>"div soup"</strong>, o sopa de divs en chileno. Es cuando todo es <code>&lt;div&gt;</code>, <code>&lt;div&gt;</code>, <code>&lt;div&gt;</code> hasta el infinito. El navegador puede dibujarlo igual, pero pasan cosas malas:</p>
<ul>
  <li><strong>Los lectores de pantalla se confunden.</strong> Una persona ciega usa un programa que le lee la página: si todo es div, no sabe dónde empieza el menú, dónde el contenido principal, dónde el pie de página.</li>
  <li><strong>Google se confunde.</strong> Si tu página no tiene jerarquía, los buscadores tampoco saben qué es importante.</li>
  <li><strong>Tu yo del futuro se confunde.</strong> Cuando vuelvas en 6 meses a este código, vas a tener que leer 50 divs anidados para entender la estructura.</li>
</ul>
<p>Compara estos dos bloques. Hacen exactamente lo mismo en pantalla. <strong>Solo uno está bien escrito.</strong></p>`,
              "soporte-m02-s2-div-soup-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "html",
              `<!-- MAL: sopa de divs, todo plano, sin significado -->
<div>
  <div>Mi blog</div>
  <div>
    <div>Inicio</div>
    <div>Sobre mi</div>
  </div>
</div>
<div>
  <div>
    <div>Titulo del articulo</div>
    <div>El contenido del articulo va aca...</div>
  </div>
</div>
<div>Copyright 2026</div>

<!-- BIEN: HTML semantico, cada etiqueta dice lo que es -->
<header>
  <h1>Mi blog</h1>
  <nav>
    <a href="/">Inicio</a>
    <a href="/sobre">Sobre mi</a>
  </nav>
</header>
<main>
  <article>
    <h2>Titulo del articulo</h2>
    <p>El contenido del articulo va aca...</p>
  </article>
</main>
<footer>Copyright 2026</footer>`,
              "Los dos bloques se ven idénticos en pantalla. Pero el segundo le habla al navegador, a Google, a los lectores de pantalla, y a tu yo del futuro. El primero solo le habla a ti, hoy.",
              "soporte-m02-s2-comparacion-semantica",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "warning",
              `<p><strong>Regla de oro del HTML:</strong> antes de escribir <code>&lt;div&gt;</code>, pregúntate "¿existe una etiqueta semántica que diga lo que esto es?".</p>
<p>Si esto es la cabecera → <code>&lt;header&gt;</code>. Si es el menú → <code>&lt;nav&gt;</code>. Si es el contenido principal → <code>&lt;main&gt;</code>. Si es una sección con título propio → <code>&lt;section&gt;</code>.</p>
<p><code>&lt;div&gt;</code> solo cuando <strong>de verdad</strong> no hay nada semántico que aplique. No es el villano, es el último recurso.</p>`,
              "soporte-m02-s2-regla-oro",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://developer.mozilla.org/es/docs/Web/HTML/Element",
              "MDN — Lista completa de elementos HTML",
              "Tu biblia de HTML. MDN (Mozilla Developer Network) es la documentación oficial y gratuita de la web. Cada etiqueta tiene su página con ejemplos. No la memorices: aprende a consultarla rápido.",
              "soporte-m02-s2-mdn-html",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 3 — CSS, inspector, accesibilidad y reto
      // ----------------------------------------------------------------------
      {
        titulo: "CSS, el inspector y tu primera página personal",
        skill: "La web por dentro (HTML/CSS)",
        temas:
          "CSS en lo justo (selectores, propiedades comunes). Flex y grid mínimo. El inspector del navegador como superpoder. Accesibilidad básica. Reto guiado: página personal en HTML/CSS.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Ya tienes el esqueleto. Ahora le ponemos ropa.</p>
<p><strong>CSS</strong> son las siglas de "Cascading Style Sheets" — hojas de estilo en cascada. Lo único que necesitas saber del nombre es la palabra <strong>cascada</strong>: los estilos se aplican en cadena, y si dos reglas se pelean, gana la más específica o la última escrita. Ya volvemos a eso.</p>
<p>Una regla de CSS tiene tres partes:</p>
<ul>
  <li>Un <strong>selector</strong> que apunta al elemento HTML al que aplica.</li>
  <li>Una <strong>propiedad</strong> que es la cosa que vas a cambiar (color, tamaño, espacio).</li>
  <li>Un <strong>valor</strong> que es a qué la vas a cambiar.</li>
</ul>
<p>Sintaxis: <code>selector { propiedad: valor; }</code>. Eso es todo el secreto de CSS, repetido millones de veces.</p>`,
              "soporte-m02-s3-intro-css",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "css",
              `/* Selector por etiqueta: aplica a TODOS los <h1> de la pagina */
h1 {
  color: #4f46e5;
  font-size: 2rem;
}

/* Selector por clase: aplica a elementos con class="destacado" */
.destacado {
  background: #fef3c7;
  padding: 8px 12px;
}

/* Selector por id: aplica al elemento con id="logo" (solo uno por pagina) */
#logo {
  width: 120px;
}

/* Combinado: <a> que esten dentro de un <nav> */
nav a {
  text-decoration: none;
  color: black;
}`,
              "Los tres selectores que vas a usar el 90% del tiempo: etiqueta, clase (con punto) e id (con almohadilla). El truco mental: 'punto = clase, almohadilla = id'. Las clases se pueden repetir; los ids no.",
              "soporte-m02-s3-selectores",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Las propiedades de CSS son cientos. La buena noticia: como con HTML, usas 15 o 20 a diario. Las que te van a aparecer constantemente:</p>
<ul>
  <li><strong>Color y fondo:</strong> <code>color</code>, <code>background</code>, <code>background-color</code>.</li>
  <li><strong>Tipografía:</strong> <code>font-size</code>, <code>font-family</code>, <code>font-weight</code>, <code>text-align</code>.</li>
  <li><strong>Espacios:</strong> <code>margin</code> (espacio por fuera de la caja), <code>padding</code> (espacio por dentro), <code>gap</code>.</li>
  <li><strong>Tamaño:</strong> <code>width</code>, <code>height</code>, <code>max-width</code>.</li>
  <li><strong>Bordes:</strong> <code>border</code>, <code>border-radius</code> (esquinas redondeadas).</li>
</ul>
<p>Memorizar todas eso es imposible y además inútil. Lo que sí vale la pena memorizar es <strong>la diferencia entre margin y padding</strong>, porque la vas a confundir mil veces:</p>
<ul>
  <li><strong>margin</strong> es el espacio <em>afuera</em> de la caja. Empuja a los vecinos.</li>
  <li><strong>padding</strong> es el espacio <em>adentro</em> de la caja. Empuja el contenido contra el borde.</li>
</ul>
<p>Mnemotécnico chileno: <em>padding rellena (como un pad), margin separa (como un margen)</em>.</p>`,
              "soporte-m02-s3-propiedades",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Y ahora la parte que en 2010 era una pesadilla y hoy es trivial: <strong>poner elementos uno al lado del otro</strong>.</p>
<p>Antes de 2015 esto se hacía con trucos sucios (<code>float</code>, tablas, brujería). Hoy tenemos dos herramientas modernas que resuelven el 99% de los casos:</p>
<ul>
  <li><strong>Flexbox</strong> (flex): para acomodar cosas en <em>una sola dirección</em>: una fila o una columna. Ideal para barras de navegación, botoneras, tarjetas alineadas.</li>
  <li><strong>Grid</strong>: para acomodar cosas en <em>dos direcciones a la vez</em>: una grilla con filas y columnas. Ideal para layouts de página, galerías, dashboards.</li>
</ul>
<p>Regla rápida: <strong>si lo que estás organizando es una fila o columna, usa flex. Si es una tabla/grilla, usa grid.</strong> Si te equivocas, no pasa nada, la web no se rompe. Solo vas a usar la herramienta menos cómoda.</p>`,
              "soporte-m02-s3-layout-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "css",
              `/* FLEX: tres botones uno al lado del otro, con espacio entre ellos */
.barra-botones {
  display: flex;
  gap: 12px;
  justify-content: center;  /* centrados horizontal */
  align-items: center;      /* centrados vertical */
}

/* GRID: una galeria de 3 columnas que se acomoda sola */
.galeria {
  display: grid;
  grid-template-columns: repeat(3, 1fr);  /* 3 columnas iguales */
  gap: 16px;
}

/* GRID responsivo: tantas columnas como entren, minimo 200px cada una */
.galeria-responsive {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}`,
              "Tres recetas que cubren el 80% de los layouts que vas a hacer. Cópialas, úsalas, no las memorices. La memoria viene sola después de la décima vez.",
              "soporte-m02-s3-flex-grid",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Ahora viene una de las herramientas que va a cambiar tu relación con la web para siempre: <strong>el inspector del navegador</strong>. Apretar <code>F12</code> en cualquier página (o click derecho → "Inspeccionar") abre una ventana que te muestra <strong>el HTML, el CSS y todo lo que está pasando por debajo</strong> en vivo.</p>
<p>Es como tener visión de rayos X de cualquier sitio del mundo. Y sí, eso significa que puedes ver cómo está hecho Google, Apple, Netflix, lo que sea. <strong>El 90% de aprender frontend es robar ideas con el inspector y entender por qué funcionan</strong>. Bienvenido al club.</p>
<p>Las pestañas del inspector que vas a usar siempre:</p>
<ul>
  <li><strong>Elements</strong> (o "Inspector"): te muestra el HTML en vivo. Puedes hacer click en cualquier elemento de la página y ver su código. Puedes incluso editarlo en vivo (no se guarda, pero es ideal para experimentar).</li>
  <li><strong>Console</strong>: donde aparecen los errores de JavaScript. <em>Spoiler: esta va a ser tu mejor amiga el próximo año.</em></li>
  <li><strong>Network</strong>: te muestra TODOS los requests que la página hizo, con sus status codes. Si algo carga lento o falla, acá lo ves.</li>
  <li><strong>Application</strong>: cookies, localStorage, todo lo que la página guarda en tu navegador.</li>
</ul>`,
              "soporte-m02-s3-inspector-intro",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>Truco de mago:</strong> en cualquier página web, abre el inspector (F12), anda a la pestaña "Elements", busca un texto que veas en pantalla, y cámbialo en vivo.</p>
<p>Saca screenshot. Mándaselo a un amigo diciendo que hackeaste el sitio. <em>Disclaimer: no hackeaste nada, solo cambiaste tu navegador localmente. Cuando recargues, vuelve al original.</em></p>
<p>Esa broma tonta es exactamente la mentalidad que necesitas: <strong>el navegador es tuyo, puedes meterte con cualquier cosa, no rompes nada permanentemente</strong>. Experimenta sin miedo.</p>`,
              "soporte-m02-s3-truco-mago",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Última cosa antes del reto: <strong>accesibilidad</strong> (o "a11y" si lo ves abreviado en internet — los devs cuentan las letras intermedias para abreviar todo, es enfermedad colectiva).</p>
<p>Vas a construir producto interno de la empresa. Eso significa que tus usuarios van a ser <strong>tus compañeros</strong>. Y entre tus compañeros hay gente daltónica, gente con problemas de visión, gente que usa el teclado en vez del mouse, gente con dispositivos viejos. Si tu app no funciona para ellos, no es problema "de la persona": <strong>es problema de tu app</strong>.</p>
<p>Lo mínimo que tienes que hacer desde el día uno:</p>
<ul>
  <li>Toda <code>&lt;img&gt;</code> con <strong><code>alt="..."</code></strong> que describa lo que muestra. Si la imagen es decorativa, usa <code>alt=""</code> (vacío). Nunca la omitas.</li>
  <li>Todo <code>&lt;input&gt;</code> con su <strong><code>&lt;label&gt;</code></strong> asociado. Sin label, el lector de pantalla no sabe qué pedir.</li>
  <li>Usa HTML semántico (sí, otra vez): <code>&lt;button&gt;</code> para botones, <code>&lt;a&gt;</code> para links. <em>No</em> uses un <code>&lt;div&gt;</code> con <code>onClick</code>: rompe el teclado.</li>
  <li>Contraste de colores legible. Texto gris claro sobre fondo blanco se ve bonito en el diseño y es ilegible para mucha gente. Si tienes dudas, hay extensiones del navegador que lo miden.</li>
</ul>
<p>Esto no es opcional ni "bonito tener". Es <strong>el mínimo profesional</strong>. Y, bonus, mejora el SEO y la usabilidad de toda la app.</p>`,
              "soporte-m02-s3-accesibilidad",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://developer.mozilla.org/es/docs/Learn/CSS",
              "MDN — Aprender CSS desde cero",
              "El tutorial oficial de Mozilla para CSS, en español. No necesitas leerlo entero ahora: tenlo de referencia. Cuando algo de CSS te confunda, pega el nombre de la propiedad + 'mdn' en Google y la primera respuesta es esta.",
              "soporte-m02-s3-mdn-css",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "La web por dentro (HTML/CSS)",
            contenido: buildQuiz(
              [
                {
                  id: "m02-q1",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>Estás revisando un ticket y el usuario dice 'me sale un 500 en el sitio'. ¿Qué significa eso?</p>",
                  explicacion:
                    "Los códigos 5xx son errores del servidor — la cocina se quemó, no es culpa del cliente. Los 4xx (como 404 o 403) sí serían responsabilidad del navegador/cliente.",
                  opciones: [
                    {
                      id: "a",
                      texto: "El usuario tecleó mal la URL y la página no existe.",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "El servidor tuvo un error interno; no es culpa del navegador del usuario.",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "El usuario no tiene permiso para entrar a esa página.",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "La conexión a internet del usuario se cayó.",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m02-q2",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>Tienes que armar la cabecera de una página con el logo a la izquierda y un menú a la derecha. ¿Cuál es el HTML más correcto?</p>",
                  explicacion:
                    "<header> es la etiqueta semántica para la cabecera de la página, y <nav> es la específica para el menú. Usar div para todo es legal pero pierde semántica, accesibilidad y SEO.",
                  opciones: [
                    {
                      id: "a",
                      texto:
                        '<code>&lt;div class="header"&gt;&lt;div class="logo"&gt;...&lt;/div&gt;&lt;div class="menu"&gt;...&lt;/div&gt;&lt;/div&gt;</code>',
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        '<code>&lt;header&gt;&lt;img src="logo.png" alt="Logo"/&gt;&lt;nav&gt;...&lt;/nav&gt;&lt;/header&gt;</code>',
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto:
                        "<code>&lt;section&gt;&lt;article&gt;logo&lt;/article&gt;&lt;article&gt;menu&lt;/article&gt;&lt;/section&gt;</code>",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto:
                        "<code>&lt;main&gt;&lt;footer&gt;logo&lt;/footer&gt;&lt;footer&gt;menu&lt;/footer&gt;&lt;/main&gt;</code>",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m02-q3",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>Tienes que poner tres tarjetas en fila, separadas con un espacio entre ellas. ¿Qué CSS aplicas al contenedor?</p>",
                  explicacion:
                    "Flexbox es el indicado para una sola dirección (fila o columna). 'gap' agrega el espacio entre los hijos sin tocar márgenes. Grid funcionaría también, pero flex es más simple para este caso de una sola dirección.",
                  opciones: [
                    {
                      id: "a",
                      texto: "<code>display: block;</code>",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto: "<code>display: flex; gap: 16px;</code>",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "<code>float: left; margin-right: 16px;</code>",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "<code>position: absolute; left: 16px;</code>",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m02-q4",
                  tipo: "VERDADERO_FALSO",
                  enunciado:
                    "<p>Es válido usar <code>&lt;div&gt;</code> para TODO en HTML, porque CSS puede hacer que se vea exactamente igual que las etiquetas semánticas.</p>",
                  explicacion:
                    "Falso. Aunque visualmente puede verse idéntico, pierdes semántica: los lectores de pantalla, los buscadores y tu yo del futuro no entienden la estructura. Las etiquetas como <header>, <nav>, <main>, <footer> existen para comunicar significado, no solo para verse bonito.",
                  correcta: false,
                },
                {
                  id: "m02-q5",
                  tipo: "RESPUESTA_CORTA",
                  enunciado:
                    "<p>¿Qué tecla del teclado abre el inspector del navegador (DevTools) en Chrome, Firefox y Edge en Windows/Linux?</p>",
                  explicacion:
                    "F12 es el atajo universal en Windows y Linux. En Mac también funciona Cmd + Option + I, pero F12 es lo más estándar.",
                  respuestasAceptadas: ["F12", "f12", "tecla F12", "la tecla F12"],
                  normalizacion: {
                    trim: true,
                    ignorarMayusculas: true,
                    ignorarAcentos: true,
                    ignorarEspaciosDobles: true,
                  },
                },
              ],
              "soporte-m02-s3-quiz",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Reto guiado del módulo: tu primera página personal.</strong></p>
<p>Este reto no se autocorrige (HTML/CSS no corren en nuestro sandbox), pero sí te lo pedimos en serio: <strong>tienes que hacerlo</strong>. Es una microvictoria gigante.</p>
<p>Te dejamos la receta. Tú la cocinas:</p>
<ol>
  <li>En tu carpeta <code>mi-camino-dev</code>, crea un archivo nuevo llamado <code>index.html</code>.</li>
  <li>Crea otro archivo llamado <code>estilos.css</code>.</li>
  <li>Copia el esqueleto del módulo y adáptalo: pon tu nombre, una frase corta del tipo <em>"soy [tu nombre] y estoy aprendiendo a programar"</em>, y una lista de 2-3 cosas que estás aprendiendo.</li>
  <li>En el CSS, dale un poco de cariño visual: un color de fondo, una tipografía decente, márgenes generosos.</li>
  <li>Abre <code>index.html</code> con doble click. Se debería abrir en tu navegador.</li>
  <li>Aprieta F12. Mira tu HTML por dentro. Cambia algo en vivo. Sorpréndete.</li>
</ol>
<p>Bonus opcional: subirlo a GitHub Pages (te dejamos el link en los recursos del próximo módulo).</p>`,
              "soporte-m02-s3-reto-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "html",
              `<!-- index.html — copia esto y reemplaza los [...] -->
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>[Tu nombre] — aprendiendo a programar</title>
    <link rel="stylesheet" href="estilos.css" />
  </head>
  <body>
    <header>
      <h1>Hola, soy [Tu nombre]</h1>
      <p class="frase">Estoy aprendiendo a programar. Todavia no se mucho, pero esto recien parte.</p>
    </header>
    <main>
      <section>
        <h2>Que estoy aprendiendo</h2>
        <ul>
          <li>HTML y CSS (en eso voy ahora mismo)</li>
          <li>JavaScript y TypeScript</li>
          <li>React</li>
        </ul>
      </section>
    </main>
    <footer>
      <p>Mi camino dev — 2026</p>
    </footer>
  </body>
</html>`,
              "Esqueleto de partida para el reto. Cópialo en tu archivo index.html, reemplaza los [...] con tus datos, y guarda. Fíjate que usa etiquetas semánticas (header, main, section, footer), no sopa de divs.",
              "soporte-m02-s3-reto-html",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "css",
              `/* estilos.css — copia esto y juguetea con los colores y tamanos */
body {
  font-family: system-ui, sans-serif;
  max-width: 640px;
  margin: 48px auto;
  padding: 0 24px;
  color: #1f2937;
  background: #fafaf9;
  line-height: 1.6;
}

h1 {
  font-size: 2.5rem;
  color: #4f46e5;
  margin-bottom: 8px;
}

.frase {
  font-size: 1.125rem;
  color: #6b7280;
  font-style: italic;
}

h2 {
  margin-top: 32px;
  color: #111827;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

footer {
  margin-top: 64px;
  text-align: center;
  color: #9ca3af;
  font-size: 0.875rem;
}`,
              "CSS de partida. Ábrelo, cambia los colores, los tamaños, lo que quieras. F5 en el navegador y vuelves a ver el cambio. Esa rueda de 'editar → guardar → recargar → ver' es el 70% del trabajo de un frontend dev.",
              "soporte-m02-s3-reto-css",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Si llegaste hasta acá con la página personal abierta en tu navegador: <strong>felicitaciones, oficialmente eres dev frontend</strong>. Aunque sea de un día.</p>
<p>Anótalo en la bitácora. <em>"Hoy hice mi primera página web. Se ve fea. Es mía."</em> Esa frase, en seis meses, te va a hacer reír.</p>
<hr/>
<p><strong>Cierre del módulo.</strong></p>
<p>Lo que llevas:</p>
<ul>
  <li>Entiendes el modelo cliente-servidor y los status codes que vas a ver el resto de tu carrera.</li>
  <li>Sabes qué es HTML semántico y por qué la sopa de divs es antipatrón.</li>
  <li>Conoces los selectores básicos de CSS, la diferencia entre margin y padding, y cuándo usar flex vs grid.</li>
  <li>Tienes el inspector del navegador como nueva herramienta diaria.</li>
  <li>Conoces las cuatro reglas básicas de accesibilidad.</li>
  <li>Tienes una página personal hecha por ti, en tu computador, lista para mostrar.</li>
</ul>
<p>Lo que viene en el <strong>Módulo 03</strong>: <strong>JavaScript moderno</strong>. Hasta acá tu página es bonita pero tonta — no reacciona a nada. JavaScript es lo que la despierta. Es el que hace que un botón haga cosas cuando lo aprietas, que una lista se filtre cuando escribes, que la página viva. Es donde el "wow" empieza en serio.</p>
<p>Y, spoiler, también es donde React va a empezar a tener sentido. Pero <em>todavía no</em>.</p>
<p><strong>Nos vemos al otro lado.</strong></p>`,
              "soporte-m02-s3-cierre",
            ),
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // MODULO 03 — JAVASCRIPT MODERNO APLICADO   (COMPLETO)
  // ==========================================================================
  {
    idx: 23,
    titulo: "Módulo 03 — JavaScript moderno aplicado",
    descripcion:
      "Solo lo que React te va a pedir después. Ni más, ni menos. Variables, funciones, los métodos de array que vas a usar mil veces, async/await sin pánico, y DOM básico para hacer que tu página despierte. Al terminar tienes un contador interactivo hecho con tus manos y dos retos autocorregidos.",
    secciones: [
      // ----------------------------------------------------------------------
      // Seccion 1 — Variables y tipos
      // ----------------------------------------------------------------------
      {
        titulo: "Variables y tipos: las cajas donde guardas información",
        skill: "JavaScript moderno aplicado",
        temas:
          "let vs const (var muerto). Tipos primitivos (string, number, boolean, null, undefined). Objetos y arrays. == vs === (siempre ===).",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Tu página personal del módulo anterior es bonita, pero está muerta. Si le pones un botón, no pasa nada cuando lo aprietas. Si tienes una lista, no se puede filtrar. Si quieres mostrar la hora actual, tienes que escribirla a mano cada minuto.</p>
<p>La pieza que falta se llama <strong>JavaScript</strong>. Es el lenguaje que <strong>despierta</strong> a tu página. Es lo que hace que un botón haga cosas, que una lista se ordene sola, que un formulario te avise antes de mandar.</p>
<p>Y la noticia buena: <strong>JavaScript es el lenguaje más usado del mundo</strong>. Lo que aprendas acá te sirve para hacer páginas web, apps móviles (React Native), servidores (Node), juegos, scripts en VS Code, herramientas de IA, lo que sea. Una sola inversión, mil retornos.</p>
<p>La noticia mala: JavaScript es un lenguaje raro. Tiene partes hermosas y partes que dan miedo. <strong>En este curso nos quedamos con las hermosas</strong>. Las partes raras existen, pero no te las vamos a hacer aprender salvo que sea necesario.</p>`,
              "soporte-m03-s1-intro",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Primer concepto: una <strong>variable</strong> es <em>una caja con un nombre donde guardas algo</em>. Le pones nombre, le pones contenido, y la usas las veces que necesites.</p>
<p>En JavaScript moderno tienes dos palabras para crear variables: <code>let</code> y <code>const</code>. Y una tercera, <code>var</code>, que <strong>está muerta</strong> — la vas a ver en código viejo, pero tú no la uses.</p>
<ul>
  <li><strong><code>const</code></strong>: la caja se sella al crearla. No puedes cambiar lo que está dentro. <em>Es la opción por defecto.</em></li>
  <li><strong><code>let</code></strong>: la caja se puede reabrir y cambiar el contenido. Úsala solo cuando <em>de verdad</em> necesites cambiar el valor (un contador, un estado que muta).</li>
  <li><strong><code>var</code></strong>: la palabra antigua. Tiene comportamientos rarísimos que llevaron a bugs históricos. <strong>No la uses. Punto.</strong></li>
</ul>
<p>Regla mental: <strong>siempre parte con <code>const</code></strong>. Si el editor te reclama porque necesitas cambiarlo, recién ahí lo cambias a <code>let</code>. Esa disciplina previene el 30% de los bugs típicos del principiante.</p>`,
              "soporte-m03-s1-let-const",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "javascript",
              `// BIEN: const por defecto
const nombre = "Camila"
const edad = 28
const esAdmin = true

// BIEN: let cuando el valor SI cambia
let contadorClicks = 0
contadorClicks = contadorClicks + 1   // valido, contadorClicks vale 1

// MAL: intentar cambiar un const
const pi = 3.14
pi = 3.1415   // TypeError: Assignment to constant variable.

// MUERTO: var. NO lo uses.
var algoViejo = "no me copies"`,
              "Compara los tres. Const cuando el valor no cambia (que es el 80% de los casos). Let cuando sí cambia. Var nunca: cuando lo veas en código antiguo, lee 'esto es de antes del 2015'.",
              "soporte-m03-s1-ejemplos-variables",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Lo que guardas dentro de una variable tiene un <strong>tipo</strong>. JavaScript tiene unos pocos tipos primitivos (los básicos), y dos formas de juntarlos en estructuras más grandes (objetos y arrays).</p>
<p><strong>Tipos primitivos</strong> — los que vas a ver mil veces:</p>
<ul>
  <li><strong><code>string</code></strong>: texto. Va entre comillas. Ej: <code>"hola"</code> o <code>'hola'</code> (las dos sirven).</li>
  <li><strong><code>number</code></strong>: número. Enteros o decimales. JavaScript no diferencia entre 5 y 5.0, todos son <code>number</code>.</li>
  <li><strong><code>boolean</code></strong>: <code>true</code> o <code>false</code>. Sí o no. Sin punto medio.</li>
  <li><strong><code>null</code></strong>: "explícitamente vacío". Tú lo pones a propósito para decir "acá no hay nada".</li>
  <li><strong><code>undefined</code></strong>: "ni siquiera fue asignado". Es lo que tiene una variable que existe pero a la que nunca le pusiste nada.</li>
</ul>
<p>La diferencia entre <code>null</code> y <code>undefined</code> es famosa pregunta de entrevista. Mnemotécnico: <em>null = "el cajón está vacío porque yo lo vacié", undefined = "el cajón existe pero nunca puse nada"</em>.</p>`,
              "soporte-m03-s1-primitivos",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Y dos estructuras para juntar valores en grupo:</p>
<ul>
  <li><strong>Array</strong>: una lista ordenada. <code>[1, 2, 3]</code> o <code>["a", "b", "c"]</code>. Se accede por índice empezando en 0 (sí, en 0 — informática es así).</li>
  <li><strong>Objeto</strong>: una bolsa de pares "clave: valor". <code>{ nombre: "Camila", edad: 28 }</code>. Se accede por nombre de propiedad.</li>
</ul>
<p>El array es para "muchas cosas del mismo tipo" (lista de tickets, lista de nombres). El objeto es para "una sola cosa con muchas propiedades" (un ticket con su id, estado, prioridad, asignado).</p>
<p>Y se combinan: <strong>un array de objetos</strong> es la estructura que vas a ver en el 90% de tu vida frontend. Es literalmente la forma en que llegan los datos desde el servidor.</p>`,
              "soporte-m03-s1-objetos-arrays",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "javascript",
              `// Primitivos
const nombre = "Camila"           // string
const edad = 28                   // number
const esAdmin = true              // boolean
const apellido = null             // null (vacio intencional)
let mascota                       // undefined (declarada pero sin valor)

// Array — lista ordenada
const colores = ["rojo", "verde", "azul"]
console.log(colores[0])           // "rojo"  (los indices parten en 0)
console.log(colores.length)       // 3

// Objeto — pares clave:valor
const usuario = {
  id: 1,
  nombre: "Camila",
  email: "camila@empresa.com",
  esAdmin: false,
}
console.log(usuario.nombre)       // "Camila"
console.log(usuario.email)        // "camila@empresa.com"

// Array de objetos — la combinacion que vas a ver MIL veces
const tickets = [
  { id: 1, estado: "abierto", prioridad: "alta" },
  { id: 2, estado: "cerrado", prioridad: "baja" },
  { id: 3, estado: "abierto", prioridad: "media" },
]
console.log(tickets[0].estado)    // "abierto"`,
              "Toda la materia prima del frontend en un solo bloque. Memorízalo solo con uso, no a la fuerza: lo vas a escribir tantas veces que se va a quedar grabado solo.",
              "soporte-m03-s1-tipos-completo",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "warning",
              `<p><strong>Trampa famosa de JavaScript: el doble igual (<code>==</code>) vs el triple igual (<code>===</code>).</strong></p>
<p>Cuando comparas dos valores, tienes dos opciones:</p>
<ul>
  <li><code>==</code> (doble igual): "comparame estas dos cosas pero tratando de convertirlas si son distintas". Esto lleva a comparaciones absurdas. <code>0 == "" </code> da <code>true</code>. <code>null == undefined</code> da <code>true</code>. JavaScript inventa equivalencias que nadie pidió.</li>
  <li><code>===</code> (triple igual): "comparame estrictamente, sin convertir nada". Si los tipos son distintos, son distintos. Punto.</li>
</ul>
<p><strong>Regla dura: usa siempre <code>===</code></strong>. El <code>==</code> es legado del JavaScript de los 90 y produce bugs que cuestan horas de debug.</p>
<p>Lo mismo aplica a <code>!=</code> vs <code>!==</code> — siempre la versión con tres signos.</p>`,
              "soporte-m03-s1-triple-igual",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "exito",
              `<p><strong>Microvictoria:</strong> ya sabes la diferencia entre <code>const</code> y <code>let</code>, los 5 tipos primitivos, qué es un array de objetos, y por qué siempre se usa <code>===</code>.</p>
<p>Eso es <em>literalmente</em> el 70% de lo que vas a escribir en JavaScript durante el primer año. El otro 30% son cosas que se aprenden cuando aparecen.</p>`,
              "soporte-m03-s1-microvictoria",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 2 — Funciones
      // ----------------------------------------------------------------------
      {
        titulo: "Funciones: el bloque de Lego del código",
        skill: "JavaScript moderno aplicado",
        temas:
          "Función como bloque reutilizable. Declaración tradicional vs arrow functions. Parámetros, return, default params. Funciones puras vs con efectos.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Una <strong>función</strong> es <em>un bloque de instrucciones al que le puedes poner nombre y reutilizar</em>. Es el bloque de Lego del código: lo armas una vez, y lo usas mil.</p>
<p>Una función tiene tres partes:</p>
<ul>
  <li>Un <strong>nombre</strong>: como la llamas para usarla.</li>
  <li><strong>Parámetros</strong>: la información que necesita para hacer su trabajo. Cero, uno, o muchos.</li>
  <li>Un <strong>cuerpo</strong>: las instrucciones que ejecuta cuando la llamas.</li>
</ul>
<p>Y opcionalmente: un <strong><code>return</code></strong>, que es lo que la función "devuelve" cuando termina. Si no hay <code>return</code>, la función igual hace cosas pero no entrega nada de vuelta.</p>
<p>Hay dos formas de escribir una función en JavaScript moderno: la <strong>declaración tradicional</strong> (con la palabra <code>function</code>) y la <strong>arrow function</strong> (con flecha <code>=&gt;</code>). Hacen casi lo mismo, pero las arrow functions son más cortas y son el default en código moderno.</p>`,
              "soporte-m03-s2-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "javascript",
              `// Declaracion tradicional — con la palabra 'function'
function saludar(nombre) {
  return "Hola, " + nombre + "!"
}

console.log(saludar("Camila"))   // "Hola, Camila!"

// Arrow function — la misma funcion, en formato moderno
const saludarFlecha = (nombre) => {
  return "Hola, " + nombre + "!"
}

console.log(saludarFlecha("Camila"))   // "Hola, Camila!"

// Arrow function en una sola linea — cuando es 1 expresion, el 'return' se omite
const saludarCorto = (nombre) => "Hola, " + nombre + "!"

console.log(saludarCorto("Camila"))   // "Hola, Camila!"

// Un solo parametro: se pueden quitar los parentesis (opcional)
const cuadrado = n => n * n
console.log(cuadrado(5))   // 25

// Sin parametros: parentesis vacios obligatorios
const ahora = () => new Date()
console.log(ahora())`,
              "Las cuatro formas de escribir la misma idea. Hoy en día se prefiere arrow function por ser más corta y porque encaja mejor cuando usas funciones como argumentos (lo verás en la próxima sección con map/filter).",
              "soporte-m03-s2-arrow",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Dos cositas más que vas a usar siempre:</p>
<p><strong>1. Parámetros por defecto</strong>: si quien llama la función no manda un argumento, usas un valor de respaldo.</p>
<p><strong>2. Template literals</strong> (comillas invertidas): una forma moderna de concatenar texto con variables, mucho más limpia que sumar strings con <code>+</code>.</p>
<p>Y un tip importante: <strong>el cuerpo de una función puede tener varias líneas</strong>, pero idealmente <strong>una función debería hacer una sola cosa</strong>. Si tu función pasa de 20 líneas, probablemente está mezclando dos responsabilidades. Pártela en dos.</p>`,
              "soporte-m03-s2-defaults-templates",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "javascript",
              `// Parametros por defecto
const saludar = (nombre = "amigo") => \`Hola, \${nombre}!\`

console.log(saludar())          // "Hola, amigo!"  (uso el default)
console.log(saludar("Camila"))  // "Hola, Camila!"

// Template literals — concatenar texto bonito
const usuario = "Pedro"
const edad = 32

// Forma antigua con + (legible pero fea)
const fea = "Usuario " + usuario + " tiene " + edad + " anos"

// Forma moderna con template literal (comilla invertida \`)
const linda = \`Usuario \${usuario} tiene \${edad} anos\`

console.log(linda)   // "Usuario Pedro tiene 32 anos"

// Funcion con varios parametros + default
const calcularTotal = (precio, descuento = 0) => {
  const final = precio - (precio * descuento)
  return final
}

console.log(calcularTotal(100))         // 100  (sin descuento)
console.log(calcularTotal(100, 0.2))    // 80   (con 20% de descuento)`,
              "Template literals (las comillas invertidas con ${variable}) son cosa de quererlas. La primera vez se ven raras; al cabo de una semana no quieres volver a sumar strings con +.",
              "soporte-m03-s2-defaults-codigo",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>Función pura vs función con efectos.</strong></p>
<p>Una función <strong>pura</strong> es la que: (1) <em>siempre devuelve lo mismo si la llamas con los mismos parámetros</em>, y (2) <em>no toca nada del mundo exterior</em>. Es predecible, testeable, hermosa.</p>
<p>Una función con <strong>efectos</strong> (en inglés: <em>side effects</em>) toca el mundo: imprime en consola, escribe en la base de datos, manda un email, modifica una variable global.</p>
<p>Las dos son necesarias. Pero la regla es: <strong>haz tantas puras como puedas, y aísla los efectos en pocos lugares</strong>. Vas a entender por qué cuando lleguemos a React.</p>`,
              "soporte-m03-s2-pura-vs-efecto",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "exito",
              `<p><strong>Microvictoria:</strong> ya sabes leer y escribir una función en JavaScript moderno. Eso solo desbloquea la próxima sección, que es donde JS empieza a sentirse mágico.</p>
<p>Y a la primera arrow function que escribas, ya no quieres volver atrás. Aviso desde ya.</p>`,
              "soporte-m03-s2-microvictoria",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 3 — Arrays y sus metodos magicos (+ RETO 1)
      // ----------------------------------------------------------------------
      {
        titulo: "Arrays y sus métodos mágicos (con reto autocorregido)",
        skill: "JavaScript moderno aplicado",
        temas:
          "map (transformar), filter (quedarse con los que cumplen), find/some/every (búsquedas), reduce en lo justo. Encadenamiento. Reto: contar tickets abiertos de prioridad alta.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Esta sección es <strong>el momento "ah, ya cacho por qué la gente ama JavaScript"</strong>. Vas a aprender 5 métodos de array que reemplazan el 90% de los <code>for</code> tradicionales que escribirías en otros lenguajes.</p>
<p>El cambio mental es este: en lugar de <em>"recorrer la lista una por una y hacer cosas"</em>, le hablas a la lista en términos de <em>"transformame esto, filtrame aquello, búscame esto otro"</em>. El código se vuelve corto, legible, y casi se lee como inglés.</p>
<p>Los cinco métodos que vas a usar todos los días:</p>
<ul>
  <li><strong><code>.map()</code></strong> — transforma cada elemento.</li>
  <li><strong><code>.filter()</code></strong> — se queda solo con los que cumplen una condición.</li>
  <li><strong><code>.find()</code></strong> — devuelve el primero que cumple una condición.</li>
  <li><strong><code>.some()</code></strong> — devuelve <code>true</code> si <em>al menos uno</em> cumple.</li>
  <li><strong><code>.every()</code></strong> — devuelve <code>true</code> si <em>todos</em> cumplen.</li>
</ul>
<p>Hay uno más, <code>.reduce()</code>, que es más raro al principio. Lo vemos al final con calma.</p>`,
              "soporte-m03-s3-intro",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>map: "transformame cada elemento"</strong></p>
<p>Cuando tienes una lista y quieres una <strong>nueva lista del mismo largo</strong> con cada elemento transformado, ese es <code>map</code>.</p>
<p>Le pasas una función que recibe un elemento y devuelve el elemento transformado. <code>map</code> aplica esa función a cada uno y arma una lista nueva. <strong>No modifica la lista original</strong> (eso es importante).</p>`,
              "soporte-m03-s3-map-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "javascript",
              `// Dada una lista de numeros, quiero una lista con los dobles
const numeros = [1, 2, 3, 4, 5]
const dobles = numeros.map(n => n * 2)

console.log(dobles)     // [2, 4, 6, 8, 10]
console.log(numeros)    // [1, 2, 3, 4, 5]  ← intacta!

// Mas util: dada una lista de tickets, quiero solo los titulos
const tickets = [
  { id: 1, titulo: "Login no funciona", prioridad: "alta" },
  { id: 2, titulo: "Logo desalineado", prioridad: "baja" },
  { id: 3, titulo: "Error al pagar", prioridad: "alta" },
]

const titulos = tickets.map(t => t.titulo)
console.log(titulos)
// ["Login no funciona", "Logo desalineado", "Error al pagar"]`,
              "Map siempre devuelve una lista del MISMO largo que la original. Si la entrada tiene 3 elementos, la salida tiene 3. La función que le pasas dice cómo transformar cada uno.",
              "soporte-m03-s3-map-codigo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>filter: "déjame solo los que cumplen"</strong></p>
<p>Cuando tienes una lista y quieres una <strong>nueva lista más corta</strong> (o del mismo largo) con solo los elementos que cumplen una condición, ese es <code>filter</code>.</p>
<p>Le pasas una función que recibe un elemento y devuelve <code>true</code> o <code>false</code>. Si la función devuelve <code>true</code> para un elemento, ese elemento queda en la lista nueva. Si devuelve <code>false</code>, se descarta.</p>`,
              "soporte-m03-s3-filter-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "javascript",
              `const tickets = [
  { id: 1, estado: "abierto", prioridad: "alta" },
  { id: 2, estado: "cerrado", prioridad: "alta" },
  { id: 3, estado: "abierto", prioridad: "media" },
  { id: 4, estado: "abierto", prioridad: "alta" },
]

// Solo los abiertos
const abiertos = tickets.filter(t => t.estado === "abierto")
console.log(abiertos.length)   // 3

// Solo los de prioridad alta
const urgentes = tickets.filter(t => t.prioridad === "alta")
console.log(urgentes.length)   // 3

// Combinacion: abiertos Y prioridad alta
const abiertosUrgentes = tickets.filter(
  t => t.estado === "abierto" && t.prioridad === "alta"
)
console.log(abiertosUrgentes.length)   // 2  (los tickets 1 y 4)`,
              "Filter es probablemente el método que más vas a escribir en tu carrera. Ojo con el operador && (que significa 'Y') y || (que significa 'O'). Combinándolos puedes hacer filtros tan complejos como necesites.",
              "soporte-m03-s3-filter-codigo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>find, some, every: las tres búsquedas</strong></p>
<ul>
  <li><strong><code>find</code></strong> — devuelve <em>el primer elemento</em> que cumple la condición. Si ninguno cumple, devuelve <code>undefined</code>. Útil para buscar un elemento específico por id.</li>
  <li><strong><code>some</code></strong> — devuelve <code>true</code> si <em>al menos uno</em> cumple. Útil para preguntas tipo "¿hay algún ticket urgente?".</li>
  <li><strong><code>every</code></strong> — devuelve <code>true</code> si <em>todos</em> cumplen. Útil para validaciones tipo "¿están todos los campos llenos?".</li>
</ul>
<p>Los tres reciben la misma firma que <code>filter</code>: una función que devuelve <code>true</code>/<code>false</code>. La diferencia es qué te devuelven a ti.</p>`,
              "soporte-m03-s3-find-some-every-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "javascript",
              `const tickets = [
  { id: 1, estado: "abierto", prioridad: "alta" },
  { id: 2, estado: "cerrado", prioridad: "alta" },
  { id: 3, estado: "abierto", prioridad: "media" },
]

// find: el primer ticket con id 2
const ticket2 = tickets.find(t => t.id === 2)
console.log(ticket2)
// { id: 2, estado: "cerrado", prioridad: "alta" }

// find que no encuentra
const ticket99 = tickets.find(t => t.id === 99)
console.log(ticket99)   // undefined

// some: hay al menos un abierto?
const hayAbiertos = tickets.some(t => t.estado === "abierto")
console.log(hayAbiertos)   // true

// every: estan todos cerrados?
const todosCerrados = tickets.every(t => t.estado === "cerrado")
console.log(todosCerrados)   // false  (los tickets 1 y 3 estan abiertos)`,
              "Tres preguntas distintas, tres métodos distintos. Sí confundes find con filter al principio (a todos nos pasa): find devuelve UN elemento, filter devuelve una lista de elementos.",
              "soporte-m03-s3-find-some-every-codigo",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>Encadenamiento: el combo letal.</strong></p>
<p>Como cada método devuelve un array nuevo, puedes encadenarlos uno tras otro:</p>
<pre><code>tickets
  .filter(t =&gt; t.estado === "abierto")
  .map(t =&gt; t.titulo)
  .length</code></pre>
<p>Eso lee: <em>"De los tickets, déjame solo los abiertos, sacame sus títulos, y dime cuántos hay"</em>. Una sola expresión, lectura limpia, sin variables intermedias.</p>
<p>El día que escribas tu primera cadena de tres métodos de array y entiendas lo que hace, sabes que estás dentro.</p>`,
              "soporte-m03-s3-encadenamiento",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Reto autocorregido del módulo: contar tickets urgentes.</strong></p>
<p>Te vas a enfrentar al primer reto autocorregido. El sistema corre tu código y verifica la salida. Si pasa, queda registrado. Si no pasa, te dice qué falló y vuelves a intentar.</p>
<p>El escenario: eres el oficial de soporte que tiene que reportarle al jefe cuántos tickets urgentes hay abiertos en este momento. <strong>Mismo problema que vivirías en producción</strong>, resuelto con dos líneas de JavaScript moderno.</p>
<p>Lee el enunciado con calma. La pista te marca el camino. Y recuerda: <em>todavía no</em> dominas filter, pero al final de este reto, vas a haberlo escrito al menos una vez.</p>`,
              "soporte-m03-s3-intro-reto",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_PREGUNTAS,
            esEvaluable: true,
            skill: "JavaScript moderno aplicado",
            idForzado: ID_SOP_M03_S3_PREG,
            contenido: buildCodigoPreguntas(
              "javascript",
              `Tu jefe te pide saber cuantos tickets urgentes hay abiertos en este momento.

La lista de tickets de la semana esta en la variable "tickets" (ya viene escrita en el esqueleto). Cada ticket es un objeto con:
  - id (numero)
  - estado: "abierto" o "cerrado"
  - prioridad: "alta", "media" o "baja"

Tu tarea:
  1. Filtra los tickets que esten "abierto" Y prioridad "alta".
  2. Imprime UN SOLO numero con console.log: la cantidad de tickets que cumplen.

Pista: usa .filter(...) y la propiedad .length del resultado.

Salida exacta esperada: 3`,
              `const tickets = [
  { id: 1, estado: "abierto", prioridad: "alta" },
  { id: 2, estado: "cerrado", prioridad: "alta" },
  { id: 3, estado: "abierto", prioridad: "media" },
  { id: 4, estado: "abierto", prioridad: "alta" },
  { id: 5, estado: "cerrado", prioridad: "baja" },
  { id: 6, estado: "abierto", prioridad: "alta" },
  { id: 7, estado: "abierto", prioridad: "baja" },
]

// Escribe tu solucion aqui abajo.
// Pista: const urgentes = tickets.filter(...)
//        console.log(urgentes.length)

`,
              "soporte-m03-s3-codigo-preguntas",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_TESTS,
            esEvaluable: false,
            idForzado: ID_SOP_M03_S3_TEST,
            contenido: buildCodigoTests(
              ID_SOP_M03_S3_PREG,
              `const tickets = [
  { id: 1, estado: "abierto", prioridad: "alta" },
  { id: 2, estado: "cerrado", prioridad: "alta" },
  { id: 3, estado: "abierto", prioridad: "media" },
  { id: 4, estado: "abierto", prioridad: "alta" },
  { id: 5, estado: "cerrado", prioridad: "baja" },
  { id: 6, estado: "abierto", prioridad: "alta" },
  { id: 7, estado: "abierto", prioridad: "baja" },
]
const urgentes = tickets.filter(t => t.estado === "abierto" && t.prioridad === "alta")
console.log(urgentes.length)`,
              [
                {
                  id: "t1",
                  descripcion: "Imprime el conteo correcto de tickets abiertos con prioridad alta",
                  entrada: "",
                  salidaEsperada: "3\n",
                  visible: true,
                },
                {
                  id: "t2",
                  descripcion: "Verifica que la salida sea exactamente el numero 3",
                  entrada: "",
                  salidaEsperada: "3\n",
                  visible: true,
                },
                {
                  id: "t3",
                  descripcion: "Test oculto: la cantidad debe ser exacta",
                  entrada: "",
                  salidaEsperada: "3\n",
                  visible: false,
                },
              ],
              "soporte-m03-s3-codigo-tests",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Si pasaste el reto: <strong>acabas de hacer una operación de filtrado real en JavaScript moderno</strong>. Esa lógica — filtrar una colección de objetos por dos criterios — es <em>literalmente</em> lo que va a hacer una buena parte de tu código en producción.</p>
<p>Si te costó: relee el bloque de filter, mira el código de ejemplo, y vuelve a intentar. Acá no se trata de que te salga a la primera; se trata de que te salga.</p>`,
              "soporte-m03-s3-post-reto",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 4 — Async/await sin morir (+ RETO 2)
      // ----------------------------------------------------------------------
      {
        titulo: "Async/await sin morir en el intento (con reto autocorregido)",
        skill: "JavaScript moderno aplicado",
        temas:
          "Por qué async existe (analogía delivery). Promesas en simple. async/await como azúcar sintáctica. fetch a una API. try/catch. Reto: función async que saluda con delay.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Hasta acá todo el código que escribiste es <strong>síncrono</strong>: cada línea termina antes de que empiece la siguiente. Esa es la forma natural de pensar.</p>
<p>Pero la web es asíncrona. Cuando pides datos a un servidor, <strong>no sabes cuánto va a tardar</strong>: puede ser 30 ms o 3 segundos. Y mientras esperas, la página no se puede congelar — el usuario se enojaría.</p>
<p>JavaScript tiene una forma especial de manejar "cosas que toman tiempo y vendrán después". Se llama <strong>asincronía</strong>, y antes era una pesadilla. Hoy, con <code>async/await</code>, se volvió manejable.</p>`,
              "soporte-m03-s4-intro",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>La analogía que mejor explica esto: <strong>pedir delivery</strong>.</p>
<p>Cuando pides un sushi por app:</p>
<ol>
  <li>Confirmas el pedido (te dan un código).</li>
  <li>El restaurante empieza a cocinar.</li>
  <li><strong>Tú no te quedas congelado frente a la puerta</strong>. Sigues haciendo cosas: lavas la ropa, contestas mensajes, juegas con el perro.</li>
  <li>30 minutos después, el repartidor toca el timbre. Recién ahí abres y recibes la comida.</li>
</ol>
<p>Eso es asincronía. <strong>Pides algo, sigues haciendo cosas, y cuando está listo te avisan</strong>. JavaScript funciona igual. El "código" que recibes cuando confirmas el pedido se llama <strong>Promise</strong> (promesa). Es un papelito que dice "te voy a entregar el sushi, no sé cuándo, pero llegará".</p>`,
              "soporte-m03-s4-delivery",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "javascript",
              `// Una Promise es un objeto que representa "algo que va a estar listo despues"
const pedido = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve("Sushi entregado!")
  }, 2000)
})

// Hay dos formas de "esperar" la promesa.
// Forma vieja: .then() — funciona pero anida codigo y se vuelve feo
pedido.then(resultado => {
  console.log(resultado)   // "Sushi entregado!" (2 segundos despues)
})

// Forma moderna: async/await — se lee como si fuera codigo normal
async function esperarPedido() {
  const resultado = await pedido
  console.log(resultado)   // "Sushi entregado!"
}

esperarPedido()`,
              "Las dos formas funcionan. La de abajo (async/await) es la que vas a usar siempre porque se lee de arriba a abajo, sin escalones. La de arriba (.then) sigue siendo válida y la vas a ver en código existente.",
              "soporte-m03-s4-promise-codigo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Dos palabras clave en JavaScript moderno y todo se hace fácil:</p>
<ul>
  <li><strong><code>async</code></strong>: marca a una función como "asíncrona". Significa que adentro puede esperar promesas. Toda función <code>async</code> devuelve automáticamente una Promise.</li>
  <li><strong><code>await</code></strong>: pausa la función hasta que la promesa que sigue se resuelva, y te entrega el valor. <strong>Solo se puede usar dentro de una función <code>async</code></strong>.</li>
</ul>
<p>Mnemotécnico: <em>async = "esta función espera cosas", await = "esperá esto antes de seguir"</em>.</p>`,
              "soporte-m03-s4-async-await",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>El uso más común que vas a darle a esto: <strong><code>fetch</code></strong>. Es la función nativa de JavaScript para hacer pedidos HTTP — sí, esos <em>requests</em> que vimos en el módulo anterior.</p>
<p><code>fetch</code> devuelve una promesa. Una vez que llega la respuesta, le pides el contenido en JSON (que también es una promesa). Por eso necesitas dos <code>await</code> seguidos.</p>`,
              "soporte-m03-s4-fetch-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "javascript",
              `// Pedir datos a una API publica de prueba (jsonplaceholder)
async function obtenerUsuarios() {
  const respuesta = await fetch("https://jsonplaceholder.typicode.com/users")
  const datos = await respuesta.json()
  console.log(datos)
  console.log(\`Hay \${datos.length} usuarios\`)
}

obtenerUsuarios()

// Con try/catch para manejar errores (siempre que haya red de por medio)
async function obtenerUsuariosSeguro() {
  try {
    const respuesta = await fetch("https://jsonplaceholder.typicode.com/users")
    if (!respuesta.ok) {
      throw new Error(\`Error HTTP: \${respuesta.status}\`)
    }
    const datos = await respuesta.json()
    return datos
  } catch (error) {
    console.error("No pude obtener los usuarios:", error.message)
    return []
  }
}`,
              "Spoiler: en React no vas a escribir fetch así de a pie. Vas a usar Tanstack Query (lo veremos en el módulo 06), que maneja loading, error, cache y refetch automáticamente. Pero entender fetch directo es la base para que después todo tenga sentido.",
              "soporte-m03-s4-fetch-codigo",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "warning",
              `<p><strong>Trampa típica del principiante: olvidarse del <code>await</code>.</strong></p>
<p>Si escribes:</p>
<pre><code>const datos = fetch("/api/usuarios")
console.log(datos)   // Promise { &lt;pending&gt; }</code></pre>
<p>No te llegaron los datos: te llegó <strong>la promesa misma</strong>, sin resolver. Es el equivalente a recibir el código de confirmación de tu pedido de sushi y comerte el papel.</p>
<p>Cuando veas <code>Promise { &lt;pending&gt; }</code> en consola, la respuesta casi siempre es: <em>te faltó un <code>await</code></em>.</p>`,
              "soporte-m03-s4-trampa-await",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Segundo reto autocorregido: una función async con delay.</strong></p>
<p>Vas a escribir una función <code>async</code> que <em>simule</em> una espera (como si fuera una llamada a un servidor lento) y luego devuelva un saludo. Es el esqueleto mínimo que después vas a usar en todos los reto de servidor.</p>
<p>El truco de simular un delay en JavaScript es envolver <code>setTimeout</code> en una <code>Promise</code>. Se ve raro al principio. <em>Todavía no</em> tiene que verse natural. Léelo dos veces, escribe, prueba.</p>`,
              "soporte-m03-s4-intro-reto",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_PREGUNTAS,
            esEvaluable: true,
            skill: "JavaScript moderno aplicado",
            idForzado: ID_SOP_M03_S4_PREG,
            contenido: buildCodigoPreguntas(
              "javascript",
              `Tu tarea: escribir una funcion async que salude despues de una espera.

  1. Crea una funcion async llamada "saludar" que reciba un nombre (string).
  2. La funcion debe esperar 50 milisegundos (simulando un delay de red).
  3. Despues debe devolver el string: "Hola, [nombre]!"
     (con el nombre interpolado, sin las llaves cuadradas).
  4. Llama a saludar("Carlos") y haz console.log del resultado.

Pista para el delay:
  await new Promise(resolve => setTimeout(resolve, 50))

Pista para el saludo:
  return \`Hola, \${nombre}!\`     ← template literal (comilla invertida)

Pista para llamar la funcion:
  saludar("Carlos").then(saludo => console.log(saludo))

Salida exacta esperada: Hola, Carlos!`,
              `// Escribe tu solucion abajo.
// Recordatorio: la funcion debe ser async para usar await dentro.

`,
              "soporte-m03-s4-codigo-preguntas",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_TESTS,
            esEvaluable: false,
            idForzado: ID_SOP_M03_S4_TEST,
            contenido: buildCodigoTests(
              ID_SOP_M03_S4_PREG,
              `async function saludar(nombre) {
  await new Promise(resolve => setTimeout(resolve, 50))
  return \`Hola, \${nombre}!\`
}

saludar("Carlos").then(saludo => console.log(saludo))`,
              [
                {
                  id: "t1",
                  descripcion: "Imprime el saludo esperado tras el delay",
                  entrada: "",
                  salidaEsperada: "Hola, Carlos!\n",
                  visible: true,
                },
                {
                  id: "t2",
                  descripcion: "El formato del saludo es exactamente 'Hola, Carlos!'",
                  entrada: "",
                  salidaEsperada: "Hola, Carlos!\n",
                  visible: true,
                },
                {
                  id: "t3",
                  descripcion: "Test oculto: la funcion debe ser async y resolver",
                  entrada: "",
                  salidaEsperada: "Hola, Carlos!\n",
                  visible: false,
                },
              ],
              "soporte-m03-s4-codigo-tests",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Si pasaste el reto: <strong>acabas de escribir tu primera función asíncrona en JavaScript</strong>. Y entendiste el patrón "pido, espero, sigo". Eso es el corazón de todo lo que viene en React.</p>
<p>Si no te salió a la primera: el bloque más confuso suele ser el <code>new Promise(resolve =&gt; setTimeout(resolve, 50))</code>. Léelo dos veces: estás creando una promesa que se resuelve sola después de 50 ms. El <code>await</code> hace que tu código se quede ahí parado hasta que se resuelva.</p>`,
              "soporte-m03-s4-post-reto",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 5 — DOM basico + reto guiado del contador + quiz + cierre
      // ----------------------------------------------------------------------
      {
        titulo: "El DOM y tu primera página interactiva",
        skill: "JavaScript moderno aplicado",
        temas:
          "El DOM como el HTML por dentro. querySelector y querySelectorAll. addEventListener. Manipular textContent y classList. Reto guiado: contador con HTML + JS copy-paste.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Hasta acá todo tu JavaScript ha vivido en la consola. Bonito, pero el usuario nunca lo ve. Última pieza del módulo: cómo <strong>tocar tu HTML desde JavaScript</strong>.</p>
<p>Cuando el navegador carga una página, lee el HTML y construye un árbol de objetos en memoria que representa cada etiqueta. Ese árbol se llama <strong>DOM</strong> (Document Object Model). Si modificas el DOM, la página cambia en pantalla en vivo.</p>
<p>JavaScript te da una API para hablarle al DOM. Con tres cositas — <strong>seleccionar</strong> un elemento, <strong>escuchar eventos</strong>, y <strong>modificar contenido</strong> — puedes hacer cualquier interactividad básica.</p>
<p>Disclaimer importante: <strong>en React tú no vas a tocar el DOM directamente</strong>. React lo hace por ti. Pero entender qué pasa por debajo te va a ahorrar horas de confusión cuando aterrice React en el módulo 05.</p>`,
              "soporte-m03-s5-intro",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Seleccionar elementos: <code>querySelector</code> y <code>querySelectorAll</code>.</strong></p>
<p>Estos dos métodos te dejan buscar elementos del HTML usando selectores CSS (los mismos del módulo anterior: por etiqueta, clase, id).</p>
<ul>
  <li><code>document.querySelector("...")</code> — devuelve el <em>primer</em> elemento que coincide. O <code>null</code> si no encuentra nada.</li>
  <li><code>document.querySelectorAll("...")</code> — devuelve <em>todos</em> los elementos que coinciden, como una lista.</li>
</ul>`,
              "soporte-m03-s5-queryselector-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "javascript",
              `// El primer h1 de la pagina
const titulo = document.querySelector("h1")

// El elemento con id="contador"
const contador = document.querySelector("#contador")

// El primer elemento con clase "boton-primario"
const boton = document.querySelector(".boton-primario")

// TODOS los <li> de la pagina
const items = document.querySelectorAll("li")
console.log(items.length)   // cuantos hay

// Buscar dentro de un elemento (no en todo el documento)
const lista = document.querySelector("#mi-lista")
const itemsLista = lista.querySelectorAll("li")`,
              "Los selectores son los mismos que aprendiste en CSS: # para id, . para clase, nombre directo para etiqueta. Si entiendes selectores CSS, entiendes querySelector.",
              "soporte-m03-s5-queryselector-codigo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Eventos: hacer que las cosas reaccionen.</strong></p>
<p>Un <strong>evento</strong> es cualquier cosa que pase en la página: un click, una tecla apretada, un mouse encima de algo, el formulario que se envía. JavaScript te deja <em>escuchar</em> esos eventos y reaccionar.</p>
<p>El método se llama <code>addEventListener</code>. Recibe dos cosas: <strong>el nombre del evento</strong> que quieres escuchar (como <code>"click"</code>) y <strong>una función</strong> que se ejecuta cuando ese evento pase.</p>`,
              "soporte-m03-s5-eventos-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "javascript",
              `const boton = document.querySelector("#mi-boton")

// Cuando el boton se clickea, ejecuta esta funcion
boton.addEventListener("click", () => {
  console.log("me clickearon!")
})

// El evento te llega con info util: que tecla apretaron, donde estaba el mouse, etc.
const input = document.querySelector("#mi-input")
input.addEventListener("input", (evento) => {
  console.log("el usuario escribio:", evento.target.value)
})

// Eventos comunes que vas a usar:
//   "click"     — un click del mouse
//   "input"     — el contenido de un input cambio
//   "submit"    — un formulario se envio
//   "keydown"   — se apreto una tecla
//   "mouseover" — el mouse paso por encima`,
              "El patrón es siempre el mismo: seleccionas el elemento, le agregas un listener, defines qué pasa cuando el evento ocurre. Repítelo mil veces y se vuelve automático.",
              "soporte-m03-s5-eventos-codigo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Modificar el DOM: <code>textContent</code> y <code>classList</code>.</strong></p>
<p>Ya seleccionaste un elemento. Ya escuchaste el evento. Ahora cambias algo en la página:</p>
<ul>
  <li><strong><code>elemento.textContent = "nuevo texto"</code></strong> — cambia el texto interno del elemento.</li>
  <li><strong><code>elemento.classList.add("clase")</code></strong> — agrega una clase CSS.</li>
  <li><strong><code>elemento.classList.remove("clase")</code></strong> — quita una clase CSS.</li>
  <li><strong><code>elemento.classList.toggle("clase")</code></strong> — la pone si no estaba, la quita si estaba. Muy útil.</li>
</ul>
<p>Hay decenas de métodos más, pero con estos cuatro haces el 80% de lo que necesitas.</p>`,
              "soporte-m03-s5-modificar-dom",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Reto guiado del módulo: tu primer contador interactivo.</strong></p>
<p>Te vamos a dar el HTML y el JavaScript completos. <strong>Tu pega es copiarlos en archivos reales, abrirlos en el navegador, y ver cómo funciona</strong>. Después: experimenta. Cambia los textos. Agrega un botón nuevo. Rómpelo. Arréglalo. Eso es aprender.</p>
<p>Pasos:</p>
<ol>
  <li>En tu carpeta <code>mi-camino-dev</code>, crea un archivo <code>contador.html</code> con el primer bloque.</li>
  <li>Crea un archivo <code>contador.js</code> con el segundo bloque, en la misma carpeta.</li>
  <li>Abre <code>contador.html</code> con doble click. Tu navegador debería mostrar un contador con tres botones.</li>
  <li>Aprieta los botones. Mira el número cambiar.</li>
  <li>Bonus: abre el inspector (F12) y mira la consola. Cada click va dejando un log.</li>
</ol>
<p>Si lo levantas y funciona, <strong>ya eres oficialmente desarrollador de cosas interactivas</strong>. Y eso quedó en tu computador, hecho por ti, sin trampa.</p>`,
              "soporte-m03-s5-intro-contador",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "html",
              `<!-- contador.html -->
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Mi primer contador</title>
    <style>
      body {
        font-family: system-ui, sans-serif;
        max-width: 480px;
        margin: 64px auto;
        padding: 0 24px;
        text-align: center;
        color: #1f2937;
      }
      h1 { color: #4f46e5; }
      .contador {
        font-size: 4rem;
        font-weight: bold;
        margin: 32px 0;
        color: #111827;
      }
      .botones { display: flex; gap: 12px; justify-content: center; }
      button {
        padding: 12px 24px;
        font-size: 1rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        background: #4f46e5;
        color: white;
      }
      button:hover { background: #4338ca; }
      .secundario { background: #6b7280; }
      .secundario:hover { background: #4b5563; }
    </style>
  </head>
  <body>
    <h1>Mi contador</h1>
    <div id="contador" class="contador">0</div>
    <div class="botones">
      <button id="menos" class="secundario">- 1</button>
      <button id="reset" class="secundario">reset</button>
      <button id="mas">+ 1</button>
    </div>

    <!-- el JavaScript se enchufa al final del body -->
    <script src="contador.js"></script>
  </body>
</html>`,
              "Cópialo tal cual en un archivo contador.html. Fíjate que el <script> va AL FINAL del body, no dentro del head: así el JavaScript se ejecuta cuando los elementos del DOM ya existen. Es un detalle que evita el 80% de los bugs típicos del principiante.",
              "soporte-m03-s5-contador-html",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "javascript",
              `// contador.js — guardalo en la misma carpeta que contador.html

// 1. Estado: la "memoria" del contador
let valor = 0

// 2. Seleccionar elementos del DOM
const elementoContador = document.querySelector("#contador")
const botonMas = document.querySelector("#mas")
const botonMenos = document.querySelector("#menos")
const botonReset = document.querySelector("#reset")

// 3. Funcion que actualiza la pantalla con el valor actual
function actualizarPantalla() {
  elementoContador.textContent = valor
  console.log("Contador ahora vale:", valor)
}

// 4. Eventos: que pasa cuando se aprieta cada boton
botonMas.addEventListener("click", () => {
  valor = valor + 1
  actualizarPantalla()
})

botonMenos.addEventListener("click", () => {
  valor = valor - 1
  actualizarPantalla()
})

botonReset.addEventListener("click", () => {
  valor = 0
  actualizarPantalla()
})

// 5. Pintar el valor inicial
actualizarPantalla()`,
              "El patrón se repite: estado + seleccionar + función que pinta + eventos que actualizan estado + repintar. Ese mismo patrón es exactamente lo que React va a hacer por ti (con menos código tuyo). Disfruta este momento donde todo se ve por debajo.",
              "soporte-m03-s5-contador-js",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "JavaScript moderno aplicado",
            contenido: buildQuiz(
              [
                {
                  id: "m03-q1",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>Estás escribiendo una variable que va a guardar el total de un carrito de compras, y ese total va a cambiar cada vez que el usuario agregue un producto. ¿Qué palabra usas?</p>",
                  explicacion:
                    "let es lo correcto cuando el valor SÍ va a cambiar. const sellaría la variable y no podrías modificarla. var está muerto — no se usa en código moderno.",
                  opciones: [
                    {
                      id: "a",
                      texto: "<code>const total = 0</code>",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto: "<code>let total = 0</code>",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "<code>var total = 0</code>",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "<code>final total = 0</code>",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m03-q2",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>Tienes <code>const usuarios = [{id: 1, activo: true}, {id: 2, activo: false}, {id: 3, activo: true}]</code> y quieres obtener una lista con solo los IDs de los usuarios activos. ¿Qué expresión es correcta?</p>",
                  explicacion:
                    "Filter te deja con los activos, y luego map transforma cada usuario en su id. Es el combo filter + map clásico. La opción que usa map sin filter te devuelve todos los ids (incluidos los inactivos). find devuelve solo uno, no una lista.",
                  opciones: [
                    {
                      id: "a",
                      texto: "<code>usuarios.map(u =&gt; u.id)</code>",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto: "<code>usuarios.filter(u =&gt; u.activo).map(u =&gt; u.id)</code>",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "<code>usuarios.find(u =&gt; u.activo === true)</code>",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "<code>usuarios.some(u =&gt; u.activo)</code>",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m03-q3",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>Llamas a una API con <code>const datos = fetch('/api/usuarios')</code> y al imprimir <code>datos</code> en la consola, ves <code>Promise { &lt;pending&gt; }</code>. ¿Qué te falta?</p>",
                  explicacion:
                    "fetch devuelve una promesa. Sin await, te quedas con la promesa sin resolver en la mano. Lo correcto es 'const respuesta = await fetch(...)' dentro de una función async, y luego 'const datos = await respuesta.json()'.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Usar <code>===</code> en vez de <code>=</code>.",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Agregar <code>await</code> antes de <code>fetch</code>, dentro de una función <code>async</code>.",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Usar <code>const</code> en vez de <code>let</code>.",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "Cambiar la URL del fetch.",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m03-q4",
                  tipo: "VERDADERO_FALSO",
                  enunciado:
                    "<p>En JavaScript moderno se recomienda usar <code>==</code> (doble igual) para comparar valores, porque convierte tipos automáticamente y eso evita errores.</p>",
                  explicacion:
                    "Falso. == hace conversiones implícitas que producen comparaciones absurdas (0 == '' es true, null == undefined es true). Siempre se usa === (triple igual) para comparaciones estrictas y predecibles.",
                  correcta: false,
                },
                {
                  id: "m03-q5",
                  tipo: "RESPUESTA_CORTA",
                  enunciado:
                    "<p>¿Cuál es el método de array que usas para quedarte solo con los elementos que cumplen una condición?</p>",
                  explicacion:
                    "filter es el método que recibe una función que devuelve true/false y construye un array nuevo con los elementos donde la función dio true.",
                  respuestasAceptadas: ["filter", ".filter", ".filter()", "filter()"],
                  normalizacion: {
                    trim: true,
                    ignorarMayusculas: true,
                    ignorarAcentos: true,
                    ignorarEspaciosDobles: true,
                  },
                },
              ],
              "soporte-m03-s5-quiz",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Y con eso cerramos el módulo más denso del curso. <strong>Si llegaste hasta acá con los dos retos pasados y el contador funcionando en tu navegador, mereces un café</strong>.</p>
<hr/>
<p><strong>Cierre del módulo.</strong></p>
<p>Lo que llevas:</p>
<ul>
  <li><code>const</code>/<code>let</code> claros, tipos primitivos identificados, <code>===</code> en el bolsillo.</li>
  <li>Funciones (declaradas y arrow), parámetros con default, template literals.</li>
  <li>Los 5 métodos de array más usados (<code>map</code>, <code>filter</code>, <code>find</code>, <code>some</code>, <code>every</code>) + encadenamiento.</li>
  <li><code>async</code>/<code>await</code> sin pánico, <code>fetch</code> a una API, manejo básico de errores con <code>try/catch</code>.</li>
  <li>El DOM por dentro: <code>querySelector</code>, <code>addEventListener</code>, <code>textContent</code>, <code>classList</code>.</li>
  <li>Un contador interactivo hecho con tus manos, en tu computador, sin trampa.</li>
</ul>
<p>En el <strong>Módulo 04</strong> entra <strong>TypeScript</strong>. Spoiler: es JavaScript con superpoderes. Todo lo que aprendiste sigue siendo válido, pero con un asistente que te avisa los errores <em>antes</em> de que pasen. Vas a quejarte los primeros 30 minutos. Después no quieres volver a JS sin tipos. <em>Te lo firmo.</em></p>
<p><strong>Nos vemos al otro lado.</strong></p>`,
              "soporte-m03-s5-cierre",
            ),
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // MODULO 04 — TYPESCRIPT COMO CINTURON DE SEGURIDAD   (COMPLETO)
  // ==========================================================================
  {
    idx: 24,
    titulo: "Módulo 04 — TypeScript como cinturón de seguridad",
    descripcion:
      "TypeScript no es un obstáculo: es el amigo pesado que te avisa antes de mandar el mensaje. Vas a quejarte los primeros 30 minutos. Después no quieres volver a JS sin tipos. Al terminar tipas funciones e interfaces como un dev de verdad y pasas dos retos autocorregidos.",
    secciones: [
      // ----------------------------------------------------------------------
      // Seccion 1 — Por que existe TypeScript
      // ----------------------------------------------------------------------
      {
        titulo: "Por qué TypeScript existe (y por qué te va a salvar el pellejo)",
        skill: "TypeScript como diseno",
        temas:
          "Errores en runtime vs errores en el editor. La promesa de TS. Tipos primitivos (string, number, boolean, arrays). Inferencia automática.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Imagina esto: escribes una función en JavaScript que suma dos números, la subes a producción, y dos meses después un usuario reporta que <em>"la app se cae cuando intento ver mi resumen mensual"</em>. Pasas tres horas debuggeando y descubres que alguien, en algún lado, llamó tu función con un texto en vez de un número. JavaScript no se quejó: hizo lo que pudo, sumó <code>"3" + 5</code> y devolvió <code>"35"</code> (texto, no número). El bug se filtró silencioso hasta el bolsillo del cliente.</p>
<p>Eso pasa <strong>millones de veces al día</strong> en aplicaciones JS sin tipos. No es teórico, es el pan de cada día.</p>
<p>TypeScript existe para evitar exactamente esa categoría de bugs. Y la promesa que vende es muy simple: <strong>"te aviso de los errores antes de que pasen, no después"</strong>. En el editor, mientras escribes, con un subrayado rojo. No en producción, con un cliente enojado.</p>`,
              "soporte-m04-s1-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "javascript",
              `// JavaScript puro: silencio total cuando le pasas algo raro
function sumar(a, b) {
  return a + b
}

console.log(sumar(3, 5))        // 8 — esperado
console.log(sumar("3", 5))      // "35" — wait, what?
console.log(sumar(null, 5))     // 5
console.log(sumar(undefined, 5)) // NaN — "Not a Number", el demonio del JS

// Ninguno de estos casos lanza un error.
// La app sigue corriendo, los datos se corrompen, nadie se entera.`,
              "El terror silencioso de JavaScript: no se queja, hace lo que puede, te devuelve datos absurdos. Si esto está en un cálculo de facturación, el bug puede vivir semanas hasta que alguien note los totales raros.",
              "soporte-m04-s1-js-bug",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>¿Qué es TypeScript exactamente?</strong></p>
<p>TypeScript (TS para los amigos) es <strong>JavaScript con un sistema de tipos encima</strong>. Lo escribes parecido, pero le agregas anotaciones que le dicen al editor qué tipo de dato espera cada variable, parámetro, retorno.</p>
<p>Luego, cuando vas a "compilar" tu código para correrlo, TypeScript lo revisa entero y te dice: <em>"oye, acá esperabas un número y le pasaste un string"</em>. Si todo cuadra, se transforma en JavaScript puro y se ejecuta normal.</p>
<p>Cosas importantes de entender:</p>
<ul>
  <li><strong>TS no corre en el navegador</strong>. Se convierte a JS antes (el editor lo hace por ti). Lo que el navegador ejecuta sigue siendo JS.</li>
  <li><strong>TS es opcional, gradual</strong>. Puedes agregar tipos a un archivo, a una parte, a una función. No es todo o nada.</li>
  <li><strong>TS es "estático"</strong>: revisa al escribir, no al correr. Si pasas el chequeo, tu código corre exactamente igual que JS.</li>
</ul>`,
              "soporte-m04-s1-que-es-ts",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `// Tipar variables: pones : tipo despues del nombre
const nombre: string = "Camila"
const edad: number = 28
const esAdmin: boolean = true

// Si intentas algo absurdo, TypeScript te grita ANTES de correr el codigo:
const edadFutura: number = "treinta"
//                         ^^^^^^^^^^
// Error: Type 'string' is not assignable to type 'number'.

// Tipar arrays
const colores: string[] = ["rojo", "verde", "azul"]
const numeros: number[] = [1, 2, 3]

// Tipar objetos sin nombre (los nombramos en la proxima seccion)
const usuario: { id: number; nombre: string } = {
  id: 1,
  nombre: "Camila",
}`,
              "Anatomía de las anotaciones: nombre + dos puntos + tipo + igual + valor. Los tipos básicos coinciden con los primitivos de JS que viste en M03: string, number, boolean. Para arrays se agrega [] al final del tipo del contenido.",
              "soporte-m04-s1-tipos-basicos",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Buenas noticias: no tienes que tipar todo a mano.</strong></p>
<p>TypeScript es lo suficientemente inteligente como para <strong>inferir</strong> el tipo en muchos casos. Si escribes <code>const edad = 28</code>, TS sabe solo que es un <code>number</code>. No necesitas escribir <code>const edad: number = 28</code>.</p>
<p>La regla en código real: <strong>tipa lo que TS no puede adivinar solo</strong>. Y eso es típicamente:</p>
<ul>
  <li>Parámetros de funciones (TS no sabe qué le vas a pasar).</li>
  <li>El retorno de funciones complejas (a veces TS infiere bien, otras conviene ser explícito).</li>
  <li>Variables vacías que se llenan después (<code>let lista: Ticket[] = []</code>).</li>
</ul>
<p>Lo demás, dejá que TS lo deduzca. Sobre-tipar es ruido visual sin beneficio.</p>`,
              "soporte-m04-s1-inferencia",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `// Innecesario — TS infiere solo que es number
const edad: number = 28

// Mejor — TS infiere number automaticamente
const edad = 28

// Innecesario — TS infiere string[] solo
const colores: string[] = ["rojo", "verde"]

// Mejor — TS infiere string[] automaticamente
const colores = ["rojo", "verde"]

// Aca SI necesitas anotar — TS no sabe que va a entrar en este array vacio
const tickets: { id: number; titulo: string }[] = []

// Aca SI necesitas anotar — TS no sabe que tipo es 'precio' solo viendo el nombre
function calcularImpuesto(precio: number): number {
  return precio * 0.19
}`,
              "La regla práctica: 'tipa solo donde TS no puede inferir'. El compilador es bueno deduciendo de literales, pero ciego ante parámetros y arrays/objetos vacíos.",
              "soporte-m04-s1-inferencia-codigo",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>¿Cómo se corre TypeScript?</strong></p>
<p>Por debajo, herramientas como Vite (que vas a usar en React) ya transpilan TS a JS automáticamente. Tú escribes <code>.ts</code> o <code>.tsx</code>, el editor te muestra los errores, y al servir la app el código se convierte a JS por debajo.</p>
<p>No necesitas instalar nada extra para los retos de este módulo — el sandbox de la plataforma ya lo hace por ti.</p>
<p>Más adelante, cuando crees tu propio proyecto con Vite (Módulo 05), TS viene incluido de fábrica.</p>`,
              "soporte-m04-s1-como-corre",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "exito",
              `<p><strong>Microvictoria:</strong> ya sabes qué problema resuelve TypeScript, cómo se anota una variable, y la regla de oro de la inferencia.</p>
<p>Eso es <em>literalmente</em> el 50% de lo que vas a usar a diario. El otro 50% son funciones e interfaces, y vienen en las siguientes dos secciones.</p>`,
              "soporte-m04-s1-microvictoria",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 2 — Tipar funciones (+ RETO 1)
      // ----------------------------------------------------------------------
      {
        titulo: "Tipar funciones: el contrato con quien llama tu código (con reto)",
        skill: "TypeScript como diseno",
        temas:
          "Parámetros tipados. Return type explícito vs inferido. Parámetros opcionales con ?. void vs undefined. Reto: función calcularTotal con descuento opcional.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Las funciones son donde TypeScript más valor te entrega. Cuando tipas una función, estás escribiendo un <strong>contrato</strong>: <em>"para usarme, dame estos datos en este formato, y yo te devuelvo esto otro"</em>.</p>
<p>El contrato lo lee el editor mientras escribes. Si alguien (incluido tu yo del futuro) intenta llamar la función con datos equivocados, el editor lo subraya en rojo <strong>antes de que el código corra</strong>.</p>`,
              "soporte-m04-s2-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `// Funcion tradicional tipada: parametros + tipo de retorno
function sumar(a: number, b: number): number {
  return a + b
}

console.log(sumar(3, 5))        // 8 — todo bien
console.log(sumar("3", 5))      // Error en el editor: 'string' no es asignable a 'number'

// Arrow function tipada — mismas anotaciones
const multiplicar = (a: number, b: number): number => a * b

// Funcion sin retorno: void (literalmente "nada")
function saludar(nombre: string): void {
  console.log(\`Hola, \${nombre}!\`)
  // no hay return — devuelve nada — el tipo es void
}

// Si el cuerpo es simple, TS infiere el retorno solo
const cuadrado = (n: number) => n * n   // TS infiere : number sin que lo digas`,
              "El patrón siempre es: parámetro: tipo, parámetro: tipo, ... ) : tipoDeRetorno. Si la función no devuelve nada, el tipo es 'void' (nada). Si TS puede inferirlo del cuerpo, puedes omitirlo — pero en funciones públicas o complejas es mejor ser explícito.",
              "soporte-m04-s2-funcion-tipada",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Parámetros opcionales</strong>: a veces una función puede recibir un argumento o no. En TypeScript, marcas el parámetro como opcional con un <strong><code>?</code></strong> después del nombre.</p>
<p>Importante: <strong>un parámetro opcional se vuelve, dentro de la función, "el tipo declarado O <code>undefined</code>"</strong>. O sea, antes de usarlo, tienes que considerar el caso "no me lo pasaron".</p>`,
              "soporte-m04-s2-opcionales-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `// El '?' marca el parametro como opcional
function saludar(nombre: string, titulo?: string): string {
  if (titulo) {
    return \`Hola, \${titulo} \${nombre}!\`
  }
  return \`Hola, \${nombre}!\`
}

console.log(saludar("Camila"))            // "Hola, Camila!"
console.log(saludar("Pereira", "Sra."))   // "Hola, Sra. Pereira!"

// Tambien podes usar default value (alternativa frecuente)
function saludarConDefault(nombre: string, titulo: string = ""): string {
  if (titulo) {
    return \`Hola, \${titulo} \${nombre}!\`
  }
  return \`Hola, \${nombre}!\`
}

// Regla: los parametros opcionales (o con default) van AL FINAL.
// Esto NO compila:
// function malo(titulo?: string, nombre: string): string { ... }
//                                ^^^^^^ Error: parametro requerido despues de opcional`,
              "Dos formas equivalentes de hacer un parámetro 'no obligatorio': con ? (queda undefined si no lo pasan) o con default value (queda con el valor por defecto). En la práctica, default value es más cómodo para evitar el chequeo de undefined dentro.",
              "soporte-m04-s2-opcionales-codigo",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "warning",
              `<p><strong>Trampa típica: tipar el retorno explícitamente cuando no hace falta, y olvidar tiparlo cuando importa.</strong></p>
<p>Regla pragmática:</p>
<ul>
  <li><strong>Funciones públicas / exportadas / complejas</strong>: tipalas con retorno explícito. Es documentación viva del contrato.</li>
  <li><strong>Funciones internas / cortas / triviales</strong>: deja que TS infiera. Más limpio.</li>
</ul>
<p>Y otra: <strong><code>void</code></strong> (no devuelve nada) es distinto de <strong><code>undefined</code></strong> (devuelve explícitamente el valor <code>undefined</code>). Si la función no tiene <code>return</code>, el tipo correcto es <code>void</code>.</p>`,
              "soporte-m04-s2-void-trampa",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Primer reto autocorregido del módulo: una función con descuento opcional.</strong></p>
<p>Te vas a enfrentar a un escenario clásico de ecommerce: calcular el total de una compra con o sin descuento aplicado. Tu función tiene que recibir el precio (obligatorio) y un descuento (opcional). Si el descuento viene, lo aplica. Si no, devuelve el precio sin tocarlo.</p>
<p>El reto es en <strong>TypeScript</strong>: tipa los parámetros y el retorno. Si no tipas, el sandbox podría aceptarlo igual, pero estarías traicionando el módulo. <em>Todavía no</em> tipas con fluidez, pero acá empieza.</p>`,
              "soporte-m04-s2-intro-reto",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_PREGUNTAS,
            esEvaluable: true,
            skill: "TypeScript como diseno",
            idForzado: ID_SOP_M04_S2_PREG,
            contenido: buildCodigoPreguntas(
              "typescript",
              `Tu tarea: escribir una funcion TIPADA llamada "calcularTotal".

Reglas:
  - Recibe un parametro "precio" (number) — OBLIGATORIO.
  - Recibe un parametro "descuento" (number) — OPCIONAL. Si viene, es un valor entre 0 y 1 (ej. 0.2 = 20% de descuento).
  - Devuelve un number:
      - Si el descuento NO viene: devuelve el precio tal cual.
      - Si el descuento viene: devuelve precio - (precio * descuento).
  - Tipa explicitamente parametros y retorno.

Despues haz exactamente estos 3 console.log:
  console.log(calcularTotal(100, 0.2))   // espera 80
  console.log(calcularTotal(50))         // espera 50
  console.log(calcularTotal(200, 0.5))   // espera 100

Pista: el parametro opcional se marca con '?' despues del nombre.

Salida exacta esperada (3 lineas):
80
50
100`,
              `// Escribe tu solucion abajo.
// Plantilla sugerida:
//
// function calcularTotal(precio: number, descuento?: number): number {
//   // tu logica aqui
// }
//
// console.log(calcularTotal(100, 0.2))
// console.log(calcularTotal(50))
// console.log(calcularTotal(200, 0.5))

`,
              "soporte-m04-s2-codigo-preguntas",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_TESTS,
            esEvaluable: false,
            idForzado: ID_SOP_M04_S2_TEST,
            contenido: buildCodigoTests(
              ID_SOP_M04_S2_PREG,
              `function calcularTotal(precio: number, descuento?: number): number {
  if (descuento === undefined) {
    return precio
  }
  return precio - (precio * descuento)
}

console.log(calcularTotal(100, 0.2))
console.log(calcularTotal(50))
console.log(calcularTotal(200, 0.5))`,
              [
                {
                  id: "t1",
                  descripcion: "Las tres llamadas imprimen los totales correctos",
                  entrada: "",
                  salidaEsperada: "80\n50\n100\n",
                  visible: true,
                },
                {
                  id: "t2",
                  descripcion: "El descuento opcional se aplica solo cuando viene",
                  entrada: "",
                  salidaEsperada: "80\n50\n100\n",
                  visible: true,
                },
                {
                  id: "t3",
                  descripcion: "Test oculto: tipos y comportamiento exactos",
                  entrada: "",
                  salidaEsperada: "80\n50\n100\n",
                  visible: false,
                },
              ],
              "soporte-m04-s2-codigo-tests",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Si pasaste el reto: <strong>acabas de escribir tu primera función TypeScript "de verdad"</strong> — con parámetros tipados, un parámetro opcional, y un retorno explícito.</p>
<p>Si te costó: el bloque más confuso suele ser el chequeo de <code>descuento === undefined</code>. Cuando marcas un parámetro como opcional con <code>?</code>, dentro de la función ese parámetro puede ser <em>el tipo o <code>undefined</code></em>. Por eso tienes que considerar el caso "no me lo pasaron".</p>`,
              "soporte-m04-s2-post-reto",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 3 — Interfaces, types y uniones (+ RETO 2)
      // ----------------------------------------------------------------------
      {
        titulo: "Interfaces, types y uniones: dar nombre a la forma de tus datos (con reto)",
        skill: "TypeScript como diseno",
        temas:
          "interface vs type. Uniones literales ('abierto' | 'cerrado'). Propiedades opcionales con ?. Reto: definir interface Ticket y función contarAbiertos.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>En la sección 1 viste cómo tipar un objeto inline: <code>{ id: number; nombre: string }</code>. Funciona, pero si tu app tiene 30 objetos con esa misma forma, vas a repetir la anotación 30 veces. Y el día que el objeto cambie, vas a tener que actualizar 30 lugares.</p>
<p>La solución: <strong>darle nombre a esa forma</strong>. Hay dos herramientas para hacerlo:</p>
<ul>
  <li><strong><code>interface</code></strong>: la forma "clásica" en TypeScript. Pensada para describir objetos y contratos. Puede ser extendida.</li>
  <li><strong><code>type</code></strong>: más flexible. Sirve para objetos, pero también para uniones, tipos derivados, casi cualquier cosa.</li>
</ul>
<p>En la práctica, las dos hacen lo mismo para el 90% de los casos. <strong>La regla simple: usa <code>interface</code> cuando describes un objeto, usa <code>type</code> para uniones o tipos compuestos.</strong> Si dudas, <code>interface</code>.</p>`,
              "soporte-m04-s3-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `// Interface: el patron clasico para describir un objeto
interface Usuario {
  id: number
  nombre: string
  email: string
  esAdmin: boolean
}

// Ahora podes usar 'Usuario' como tipo en cualquier lugar
const usuario1: Usuario = {
  id: 1,
  nombre: "Camila",
  email: "camila@empresa.com",
  esAdmin: false,
}

const usuario2: Usuario = {
  id: 2,
  nombre: "Pedro",
  email: "pedro@empresa.com",
  esAdmin: true,
}

// Tambien sirve para listas
const usuarios: Usuario[] = [usuario1, usuario2]

// Y para parametros de funcion
function saludarUsuario(u: Usuario): string {
  return \`Hola, \${u.nombre}!\`
}`,
              "Una interface es como un molde: defines la forma una vez, la usas mil. El día que agregas un campo, lo agregas a la interface y todos los lugares que usan ese tipo se enteran solos.",
              "soporte-m04-s3-interface-codigo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>type</strong> hace lo mismo para describir objetos, con una sintaxis ligeramente distinta:</p>
<p><code>type Usuario = { id: number; nombre: string }</code></p>
<p>Pero <code>type</code> brilla en cosas que <code>interface</code> no puede hacer cómodamente: <strong>uniones</strong>, <strong>tipos derivados</strong>, <strong>aliases de primitivos</strong>.</p>
<p>La superpotencia que sí o sí vas a usar: <strong>uniones literales</strong>. Te dejan decir <em>"este campo solo puede ser uno de estos valores específicos"</em>.</p>`,
              "soporte-m04-s3-type-uniones-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `// Type: la version mas flexible
type UsuarioConType = {
  id: number
  nombre: string
}

// Union literal: el campo SOLO puede ser uno de estos strings
type EstadoTicket = "abierto" | "en_progreso" | "cerrado"

const estado1: EstadoTicket = "abierto"        // OK
const estado2: EstadoTicket = "en_progreso"    // OK
const estado3: EstadoTicket = "resuelto"       // Error: no es uno de los permitidos

// Combinacion mas comun en la vida real:
interface Ticket {
  id: number
  titulo: string
  estado: "abierto" | "en_progreso" | "cerrado"   // union INLINE
  prioridad: "baja" | "media" | "alta"
  asignadoA?: string                              // opcional con ?
}

const t1: Ticket = {
  id: 1,
  titulo: "Login no funciona",
  estado: "abierto",
  prioridad: "alta",
  // asignadoA es opcional — puede no estar
}`,
              "Las uniones literales son LA herramienta de TypeScript para evitar bugs por estados imposibles. Antes vivías con strings sueltos y rezando que no se escribieran mal. Ahora el editor te avisa si pones 'cerado' en vez de 'cerrado'.",
              "soporte-m04-s3-uniones-codigo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Propiedades opcionales</strong>: igual que en funciones, las propiedades de una interface/type pueden ser opcionales con <code>?</code> después del nombre.</p>
<p>Como con los parámetros opcionales, una propiedad opcional se vuelve <em>"el tipo declarado O <code>undefined</code>"</em>. Antes de usarla, tienes que considerar el caso "esta propiedad no vino".</p>`,
              "soporte-m04-s3-opcionales-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `interface Producto {
  id: number
  nombre: string
  precio: number
  descripcion?: string   // OPCIONAL — puede o no estar
  imagenUrl?: string     // OPCIONAL
}

const p1: Producto = {
  id: 1,
  nombre: "Polera negra",
  precio: 12990,
  // descripcion e imagenUrl son opcionales, no las pongo
}

const p2: Producto = {
  id: 2,
  nombre: "Polera blanca",
  precio: 12990,
  descripcion: "100% algodon organico",
  imagenUrl: "/img/polera-blanca.jpg",
}

// Acceder a un opcional: TS te obliga a chequear primero
function mostrarDescripcion(p: Producto): string {
  if (p.descripcion) {
    return p.descripcion
  }
  return "Sin descripcion disponible"
}`,
              "Las propiedades opcionales son una bendición para datos del mundo real, donde no todos los registros tienen todos los campos. Y son una fuente común de bugs que TS te evita: antes de acceder, te obliga a chequear que existan.",
              "soporte-m04-s3-opcionales-codigo",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>Regla práctica final — interface vs type:</strong></p>
<ul>
  <li><strong>Objeto que describe una "entidad" del dominio</strong> (Usuario, Ticket, Producto, Pedido) → <code>interface</code>.</li>
  <li><strong>Unión de strings o de tipos</strong> → <code>type</code>. <em>"abierto" | "cerrado"</em>, <em>string | null</em>.</li>
  <li><strong>Alias corto</strong> (renombrar un tipo) → <code>type</code>. <em>type ID = string</em>.</li>
  <li><strong>Si dudas</strong> → <code>interface</code> y a otra cosa.</li>
</ul>
<p>Esta no es ley sagrada — verás equipos que usan solo <code>type</code> y les va perfecto. Pero como heurística inicial, te ahorra horas de "¿cuál usaba acá?".</p>`,
              "soporte-m04-s3-interface-vs-type",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Segundo reto autocorregido: tipar tu propia interface y filtrar con tipos.</strong></p>
<p>El escenario: tienes una lista de tickets (otra vez, sí, porque es exactamente lo que vas a hacer mil veces). Tu tarea es <strong>definir la interface</strong>, <strong>tipar el array</strong>, y <strong>escribir una función tipada</strong> que cuente cuántos están abiertos.</p>
<p>Es el M03 + tipos. Misma lógica, mismo filter, pero ahora con TypeScript haciéndote de copiloto. Vas a ver lo cómodo que se siente cuando el editor sabe qué propiedades tiene cada elemento.</p>`,
              "soporte-m04-s3-intro-reto",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_PREGUNTAS,
            esEvaluable: true,
            skill: "TypeScript como diseno",
            idForzado: ID_SOP_M04_S3_PREG,
            contenido: buildCodigoPreguntas(
              "typescript",
              `Tu tarea: escribir codigo TypeScript que use interface + funcion tipada.

  1. Define una interface llamada "Ticket" con estos 3 campos:
       - id: number
       - titulo: string
       - estado: "abierto" o "cerrado"  (union literal)

  2. Crea una variable "lista" tipada como Ticket[] con estos 4 elementos:
       { id: 1, titulo: "Login no anda", estado: "abierto" }
       { id: 2, titulo: "Logo corrido", estado: "cerrado" }
       { id: 3, titulo: "Pago falla", estado: "abierto" }
       { id: 4, titulo: "Tipografia rara", estado: "abierto" }

  3. Escribe una funcion tipada "contarAbiertos" que reciba un array de Tickets
     y devuelva un number con la cantidad de tickets en estado "abierto".

  4. Imprime el resultado: console.log(contarAbiertos(lista))

Pistas:
  - El estado se declara con uniones literales: estado: "abierto" | "cerrado"
  - Para la funcion: function contarAbiertos(tickets: Ticket[]): number { ... }
  - Usa .filter(...) y la propiedad .length.

Salida exacta esperada: 3`,
              `// Escribe tu solucion abajo.
// Plantilla sugerida:
//
// interface Ticket {
//   // tus campos aqui
// }
//
// const lista: Ticket[] = [
//   // los 4 tickets
// ]
//
// function contarAbiertos(tickets: Ticket[]): number {
//   // tu logica con filter + length
// }
//
// console.log(contarAbiertos(lista))

`,
              "soporte-m04-s3-codigo-preguntas",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_TESTS,
            esEvaluable: false,
            idForzado: ID_SOP_M04_S3_TEST,
            contenido: buildCodigoTests(
              ID_SOP_M04_S3_PREG,
              `interface Ticket {
  id: number
  titulo: string
  estado: "abierto" | "cerrado"
}

const lista: Ticket[] = [
  { id: 1, titulo: "Login no anda", estado: "abierto" },
  { id: 2, titulo: "Logo corrido", estado: "cerrado" },
  { id: 3, titulo: "Pago falla", estado: "abierto" },
  { id: 4, titulo: "Tipografia rara", estado: "abierto" },
]

function contarAbiertos(tickets: Ticket[]): number {
  return tickets.filter(t => t.estado === "abierto").length
}

console.log(contarAbiertos(lista))`,
              [
                {
                  id: "t1",
                  descripcion: "La funcion contarAbiertos devuelve el numero correcto",
                  entrada: "",
                  salidaEsperada: "3\n",
                  visible: true,
                },
                {
                  id: "t2",
                  descripcion: "El conteo de tickets abiertos es exacto",
                  entrada: "",
                  salidaEsperada: "3\n",
                  visible: true,
                },
                {
                  id: "t3",
                  descripcion: "Test oculto: interface, tipado y resultado correctos",
                  entrada: "",
                  salidaEsperada: "3\n",
                  visible: false,
                },
              ],
              "soporte-m04-s3-codigo-tests",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Si pasaste el reto: <strong>ya tipas como dev profesional</strong>. Interface + array tipado + función tipada es exactamente la estructura que vas a escribir el primer día que entres a un proyecto React de verdad. Sin esa base, lees código y no entiendes nada; con esa base, lees el mismo código y todo cuadra.</p>
<p>Si te costó: el bloque que más confunde es la unión literal <code>"abierto" | "cerrado"</code>. Léelo como <em>"este string solo puede ser uno de estos dos valores exactos"</em>. Si escribes "cerado" mal, el editor te lo marca al toque. Esa es la magia.</p>`,
              "soporte-m04-s3-post-reto",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 4 — Genericos suaves + Quiz + cierre
      // ----------------------------------------------------------------------
      {
        titulo: "Genéricos suaves (lo justo) + quiz + cierre",
        skill: "TypeScript como diseno",
        temas:
          "Qué es un genérico, por qué existen, dónde los ves (Array<T>, Promise<T>, useState<T>). Quiz del módulo. Puente a React.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Última parada del módulo: <strong>los genéricos</strong>. La primera vez que los ves dan miedo porque tienen una sintaxis con <code>&lt;</code> y <code>&gt;</code> que parece sacada de un álgebra rara. Pero el concepto en sí es simple, así que respira.</p>
<p>Un <strong>genérico</strong> es <em>"una caja que tiene tipo, pero el tipo se decide al usarla"</em>. Como cuando compras un envase tupperware: el envase es siempre el mismo, pero adentro puede ir arroz, salsa, o restos de comida.</p>
<p>Lo más importante de los genéricos al principio: <strong>los vas a USAR mucho más de lo que los vas a ESCRIBIR</strong>. Aparecen por todas partes en React, Tanstack Query, fetch tipado, formularios. Pero rara vez tendrás que crear tus propios genéricos en el primer año.</p>`,
              "soporte-m04-s4-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `// Array<T> es la forma "larga" de escribir un array tipado
const numeros: Array<number> = [1, 2, 3]
const colores: Array<string> = ["rojo", "verde"]

// Es exactamente equivalente a la forma corta con []
const numerosCorto: number[] = [1, 2, 3]
const coloresCorto: string[] = ["rojo", "verde"]

// Promise<T>: una promesa que se resolvera con un valor de tipo T
async function obtenerUsuario(): Promise<{ id: number; nombre: string }> {
  return { id: 1, nombre: "Camila" }
}

// En React (spoiler del proximo modulo): useState es generico
// const [contador, setContador] = useState<number>(0)
//                                          ^^^^^^^^
// "useState que guarda un number, partiendo en 0"`,
              "Cuando veas Array<T>, Promise<T>, useState<T>, etc., lo que estás viendo es 'esta cosa generica recibe un tipo entre las angulares que dice qué guarda adentro'. La T es solo un nombre convencional para el tipo variable — podría ser cualquier letra.",
              "soporte-m04-s4-genericos-codigo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Crear tus propios genéricos es menos común, pero vale la pena ver el patrón básico para reconocerlo cuando aparezca:</p>
<p><code>function primeroDe&lt;T&gt;(lista: T[]): T | undefined { return lista[0] }</code></p>
<p>Eso lee: <em>"función primeroDe, que recibe una lista de cosas tipo T (lo que sea) y devuelve la primera cosa tipo T, o undefined si la lista está vacía"</em>. La <strong>T</strong> es un comodín que se llena cuando alguien llama la función. Si la llamas con un array de números, T = number; si con strings, T = string.</p>
<p>Por ahora, esto es <strong>solo reconocimiento</strong>: cuando veas <code>&lt;T&gt;</code>, sabes que es un genérico. Cuando lleguemos a React, vas a usar genéricos prefabricados todos los días, sin escribir los tuyos.</p>`,
              "soporte-m04-s4-genericos-propios",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `// Funcion generica: T es un "comodin" de tipo
function primeroDe<T>(lista: T[]): T | undefined {
  return lista[0]
}

// Al llamarla, TS infiere T automaticamente segun el array
const n = primeroDe([1, 2, 3])         // n: number | undefined
const c = primeroDe(["a", "b", "c"])   // c: string | undefined

// Otra usual: fetch generico (lo veras en M06)
async function fetchTipado<T>(url: string): Promise<T> {
  const respuesta = await fetch(url)
  return respuesta.json() as T
}

interface Usuario {
  id: number
  nombre: string
}

// Al llamarla, le dices el tipo entre las angulares
const usuario = await fetchTipado<Usuario>("/api/usuarios/1")
//    ^^^^^^^ TS sabe que es Usuario, autocompleta usuario.id, usuario.nombre, etc.`,
              "El gran beneficio de los genéricos: una sola función sirve para tipos distintos, sin perder la información de tipo. Es como tener un tupperware mágico que se acuerda de qué le pusiste adentro.",
              "soporte-m04-s4-generico-fetch",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>Resumen pragmático de TypeScript al cierre del módulo:</strong></p>
<ul>
  <li><strong>Tipa parámetros y retornos</strong> de tus funciones. Esa sola disciplina previene el 80% de los bugs típicos.</li>
  <li><strong>Usa interface</strong> para describir entidades de tu dominio (Ticket, Usuario, Producto).</li>
  <li><strong>Usa type</strong> para uniones literales <code>"abierto" | "cerrado"</code> y alias.</li>
  <li><strong>Deja que TS infiera</strong> en variables simples y funciones cortas.</li>
  <li><strong>Reconoce</strong> los genéricos cuando aparezcan; ya escribirás los tuyos cuando sea necesario.</li>
  <li><strong>Cero <code>any</code></strong>. El día que pongas <code>any</code> "para que no me moleste", estás traicionando todo el módulo. Si no sabes el tipo, usa <code>unknown</code> y chequea antes de usarlo.</li>
</ul>`,
              "soporte-m04-s4-resumen-pragmatico",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "TypeScript como diseno",
            contenido: buildQuiz(
              [
                {
                  id: "m04-q1",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>¿Cuál es la diferencia principal entre TypeScript y JavaScript respecto a cuándo se detectan los errores?</p>",
                  explicacion:
                    "TS es un sistema de tipos estáticos: revisa al escribir/compilar, en el editor. JS solo se queja en runtime, cuando el código ya está corriendo (a veces ni se queja, peor todavía).",
                  opciones: [
                    {
                      id: "a",
                      texto: "TS detecta errores en runtime, igual que JS, pero más rápido.",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "TS detecta errores de tipos en el editor (estáticamente), antes de que el código corra; JS solo en runtime.",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "TS no detecta errores; solo agrega autocompletado al editor.",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto:
                        "TS y JS detectan exactamente los mismos errores en los mismos momentos.",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m04-q2",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>Estás escribiendo una función que recibe un nombre obligatorio y un apodo opcional, ambos strings, y devuelve un string. ¿Cuál es la firma correcta en TypeScript?</p>",
                  explicacion:
                    "Los parámetros opcionales se marcan con '?' después del nombre. El opcional va siempre al final. El retorno se indica después del paréntesis de cierre con ':'.",
                  opciones: [
                    {
                      id: "a",
                      texto: "<code>function saludar(nombre: string, apodo: string): string</code>",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "<code>function saludar(nombre: string, apodo?: string): string</code>",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "<code>function saludar(nombre?: string, apodo: string)</code>",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "<code>function saludar(nombre, apodo) { return ... }</code>",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m04-q3",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>Necesitas que el campo <code>estado</code> de un ticket solo pueda ser uno de tres strings exactos: 'abierto', 'en_progreso' o 'cerrado'. ¿Qué declaras?</p>",
                  explicacion:
                    "Una unión literal de strings es exactamente esto: 'X' | 'Y' | 'Z' restringe el campo a esos valores exactos. Si pones cualquier otro string, TS te grita en el editor.",
                  opciones: [
                    {
                      id: "a",
                      texto: "<code>estado: string</code>",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto: '<code>estado: "abierto" | "en_progreso" | "cerrado"</code>',
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "<code>estado: any</code>",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "<code>estado: [abierto, en_progreso, cerrado]</code>",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m04-q4",
                  tipo: "VERDADERO_FALSO",
                  enunciado:
                    "<p>Usar <code>any</code> en TypeScript es una buena práctica porque te ahorra tener que pensar en los tipos.</p>",
                  explicacion:
                    "Falso. any apaga el chequeo de tipos para esa variable — pierdes todo el beneficio de TS. Si de verdad no conoces el tipo (input externo, API no tipada), usa unknown y valida antes de usar. any es bandera roja en cualquier revisión de código seria.",
                  correcta: false,
                },
                {
                  id: "m04-q5",
                  tipo: "RESPUESTA_CORTA",
                  enunciado:
                    "<p>¿Qué palabra clave de TypeScript usas, por convención, para describir la forma de un objeto del dominio (como un Usuario o un Ticket) que podría ser extendido más adelante?</p>",
                  explicacion:
                    "interface es la convención para describir entidades. type también funciona, pero interface comunica intención y es extensible. Cualquiera de los dos es aceptable como respuesta.",
                  respuestasAceptadas: ["interface", "type"],
                  normalizacion: {
                    trim: true,
                    ignorarMayusculas: true,
                    ignorarAcentos: true,
                    ignorarEspaciosDobles: true,
                  },
                },
              ],
              "soporte-m04-s4-quiz",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Si llegaste hasta acá con los dos retos pasados y el quiz aprobado, <strong>ya escribes TypeScript de verdad</strong>. No "TypeScript pa la foto" — el que tipa una función, define una interface, usa uniones literales y respeta los opcionales. Eso es lo que te van a pedir el primer día de un equipo serio.</p>
<hr/>
<p><strong>Cierre del módulo.</strong></p>
<p>Lo que llevas:</p>
<ul>
  <li>Por qué TS existe y qué categoría de bugs te ahorra.</li>
  <li>Tipos primitivos, arrays, objetos inline.</li>
  <li>Inferencia: qué dejar que TS adivine y qué anotar tú.</li>
  <li>Funciones tipadas con parámetros, opcionales con <code>?</code>, retorno y <code>void</code>.</li>
  <li><code>interface</code> vs <code>type</code> y cuándo usar cada uno.</li>
  <li>Uniones literales para estados (<em>"abierto" | "cerrado"</em>) — el patrón estrella.</li>
  <li>Genéricos para reconocer (<code>Array&lt;T&gt;</code>, <code>Promise&lt;T&gt;</code>).</li>
</ul>
<p>En el <strong>Módulo 05</strong> entra <strong>React</strong>. Es donde todo lo que aprendiste hasta acá empieza a cuadrar: HTML como JSX, JavaScript moderno para la lógica, TypeScript para los contratos, hooks para el estado. <em>Todavía no</em> vas a ver el "wow" completo — eso llega cuando el primer botón hace lo que tú le programaste, en una página que escribiste tú. Y va a llegar pronto.</p>
<p><strong>Nos vemos al otro lado.</strong></p>`,
              "soporte-m04-s4-cierre",
            ),
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // MODULO 05 — REACT: TU PRIMERA UI VIVA   (COMPLETO)
  // ==========================================================================
  {
    idx: 25,
    titulo: "Módulo 05 — React: tu primera UI viva",
    descripcion:
      "Acá empieza lo que vas a usar todos los días. React no es magia: es JavaScript con tres reglas. Vite, componentes, props, useState, eventos, listas con key, renderizado condicional. Al terminar tienes una lista de tareas real corriendo en tu navegador, hecha por ti, en React + TypeScript.",
    secciones: [
      // ----------------------------------------------------------------------
      // Seccion 1 — Por que React existe (UI declarativa vs imperativa)
      // ----------------------------------------------------------------------
      {
        titulo: "Por qué React existe (y por qué ganó toda la web)",
        skill: "React: pensar en componentes",
        temas:
          "UI declarativa vs imperativa. El dolor del DOM manual recordado del M03. Por qué React cambió todo el frontend. Una sola idea: la UI es función del estado.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Hace dos módulos viviste algo importante sin darte cuenta. En el contador del M03 escribiste, manualmente:</p>
<ul>
  <li>Una variable <code>valor</code> con el estado actual.</li>
  <li>Una función <code>actualizarPantalla()</code> que <em>pintaba el valor en el DOM</em>.</li>
  <li>Tres <code>addEventListener</code> que actualizaban el valor y <em>volvían a pintar</em>.</li>
</ul>
<p>Funcionó. Pero ahora imagina ese mismo contador con 50 cosas que pintar: una lista de tareas, un filtro, un buscador, un modal, una notificación. <strong>Cada cambio de estado te obliga a recordar a mano todos los lugares del DOM que afecta y actualizarlos uno por uno.</strong> Un solo despiste y la pantalla muestra datos viejos. Bienvenido al infierno del frontend pre-2013.</p>`,
              "soporte-m05-s1-recordando-m03",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Hay dos formas de pensar la UI:</p>
<ul>
  <li><strong>Imperativa</strong>: "navegador, anda al elemento X, cambia su texto, agrégale esta clase, ahora pinta esto otro acá". <em>Le mandas paso a paso lo que tiene que hacer.</em></li>
  <li><strong>Declarativa</strong>: "navegador, esta es como debe verse la pantalla en este momento. Encárgate tú de hacerla coincidir". <em>Le describes el resultado, no los pasos.</em></li>
</ul>
<p>El contador del M03 era imperativo. <strong>React es declarativo</strong>: tú describes cómo debe verse tu app según el estado actual, y React se ocupa de tocar el DOM por ti. Cuando el estado cambia, React calcula la diferencia entre "cómo está la pantalla" y "cómo debería estar", y aplica solo los cambios necesarios.</p>
<p>El cambio de mentalidad parece chico. Es enorme. <strong>Es la razón por la que la web cambió de cara entre 2013 y 2018</strong>. Y es la razón por la que vas a aprender React y no jQuery.</p>`,
              "soporte-m05-s1-declarativa-vs-imperativa",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "javascript",
              `// ===== Estilo IMPERATIVO (DOM manual del M03) =====
// Tu pega: acordarte de TODO lo que hay que actualizar cada vez.

let valor = 0
const elemento = document.querySelector("#contador")
const boton = document.querySelector("#mas")

function pintar() {
  elemento.textContent = valor                // pintar 1
  document.title = \`Contador: \${valor}\`       // pintar 2 (titulo)
  // ...si tienes 5 lugares mas, los listas tu, uno por uno
}

boton.addEventListener("click", () => {
  valor = valor + 1
  pintar()    // ← si olvidas esto, la pantalla queda con dato viejo
})

pintar()`,
              "El modelo imperativo: tú llevas la cuenta de qué actualizar. Sostenible para un contador. Imposible cuando la app tiene 30 componentes.",
              "soporte-m05-s1-codigo-imperativo",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `// ===== Estilo DECLARATIVO (React) =====
// Tu pega: describir como se ve la pantalla con el estado actual.
// React decide que tocar y cuando.

import { useState, useEffect } from "react"

export function Contador() {
  const [valor, setValor] = useState(0)

  // El titulo se sincroniza solo con el estado — lo describes, no lo pintas
  useEffect(() => {
    document.title = \`Contador: \${valor}\`
  }, [valor])

  return (
    <div>
      <h1>{valor}</h1>
      <button onClick={() => setValor(valor + 1)}>+ 1</button>
    </div>
  )
}`,
              "El mismo contador en React. Tú declaras: 'el título debe ser Contador: X cuando valor sea X', 'el h1 muestra valor', 'al hacer clic en el botón, sumá 1'. React se ocupa del resto. Si mañana agregas 30 lugares más que dependen del valor, no hay 30 líneas que actualizar — todo se sincroniza solo.",
              "soporte-m05-s1-codigo-declarativo",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>La ecuación que define React, escrita en una línea:</strong></p>
<p style="text-align:center; font-size: 1.2em;"><strong>UI = f(estado)</strong></p>
<p>O sea: <em>la interfaz de usuario es una función pura del estado actual</em>. Si conoces el estado, conoces cómo debe verse la pantalla. No hay variables sueltas, no hay actualizaciones manuales del DOM, no hay <em>"se me olvidó refrescar este pedacito"</em>.</p>
<p>Esa idea es <strong>todo React</strong>. El resto del módulo es traducir esa idea en código.</p>`,
              "soporte-m05-s1-ui-igual-f-estado",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "exito",
              "<p><strong>Microvictoria:</strong> ya tienes en la cabeza la idea más importante de React. <em>UI = función del estado</em>. Si en algún punto del módulo te confundes, vuelves a esta frase y todo se reordena.</p>",
              "soporte-m05-s1-microvictoria",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 2 — Vite + tu primer componente
      // ----------------------------------------------------------------------
      {
        titulo: "Vite y tu primer componente: hola, mundo en React",
        skill: "React: pensar en componentes",
        temas:
          "Vite como herramienta. Crear un proyecto React + TS. La estructura mínima. JSX desmitificado (no es HTML, es JS). Componentes como funciones.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Para arrancar un proyecto React no necesitas configurar 17 archivos como en 2018. Hoy tenemos <strong>Vite</strong> (se pronuncia "vit", en francés "rápido"), una herramienta que te crea un proyecto listo, optimizado, con TypeScript incluido, en treinta segundos.</p>
<p>Lo único que necesitas es Node instalado (lo hiciste en el M00) y la terminal abierta.</p>`,
              "soporte-m05-s2-intro-vite",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "bash",
              `# 1. Te paras en la carpeta donde quieres crear el proyecto
cd ~/Desktop/mi-camino-dev

# 2. Le pides a Vite que cree un proyecto React + TypeScript
pnpm create vite@latest mi-primera-app -- --template react-ts
# (si no tienes pnpm: usa 'npm create vite@latest mi-primera-app -- --template react-ts')

# 3. Entras al proyecto recien creado
cd mi-primera-app

# 4. Instalas las dependencias
pnpm install

# 5. Levantas el servidor de desarrollo
pnpm dev
# → te imprime una URL tipo http://localhost:5173
# → abrela en el navegador y vas a ver una pagina de bienvenida de React
# → cada vez que guardes un archivo, la pagina se recarga sola (HMR)`,
              "Cinco comandos. Treinta segundos. Tienes un proyecto React + TS corriendo en localhost. Cuando esto te funcione la primera vez, anótalo en la bitácora: pasaste de 'la web es magia ajena' a 'puedo crearme un proyecto cuando quiera'.",
              "soporte-m05-s2-comandos-vite",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Lo que Vite te crea tiene esta forma básica (te quedas con los archivos que importan):</p>
<ul>
  <li><code>index.html</code> — el HTML inicial. Tiene un <code>&lt;div id="root"&gt;&lt;/div&gt;</code> vacío.</li>
  <li><code>src/main.tsx</code> — el "encendido": le dice a React <em>"monta la app dentro del div root"</em>.</li>
  <li><code>src/App.tsx</code> — el componente raíz. <strong>Acá vas a trabajar el 95% del tiempo.</strong></li>
  <li><code>package.json</code> — la lista de dependencias y los comandos del proyecto.</li>
</ul>
<p>El resto (configs de Vite, TypeScript, ESLint) viene incluido. No los toques hasta que sepas por qué los estás tocando.</p>`,
              "soporte-m05-s2-estructura",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Un <strong>componente</strong> en React es <strong>una función que devuelve la descripción de un pedazo de UI</strong>. Y ya. Esa es toda la definición.</p>
<p>Tres reglas para que sea un componente React válido:</p>
<ul>
  <li><strong>Es una función</strong> (puede ser <code>function</code> tradicional o arrow function).</li>
  <li><strong>Su nombre empieza con mayúscula</strong> (<code>Saludo</code>, no <code>saludo</code>). Esto le dice a React "soy un componente, no un elemento HTML normal".</li>
  <li><strong>Devuelve algo que parece HTML pero no lo es</strong>. Eso se llama JSX. Veámoslo.</li>
</ul>`,
              "soporte-m05-s2-componente-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `// src/App.tsx
// Tu primer componente "de verdad"

export function App() {
  return (
    <main>
      <h1>Hola, mundo</h1>
      <p>Este es mi primer componente React.</p>
    </main>
  )
}

// Otro componente, mas chico, que vas a usar dentro de App
export function Saludo() {
  return <p>Bienvenido al curso.</p>
}

// Usar un componente dentro de otro: lo escribes como si fuera una etiqueta HTML
export function AppCompleta() {
  return (
    <main>
      <h1>Hola, mundo</h1>
      <Saludo />
      <Saludo />
      <Saludo />
    </main>
  )
}`,
              "Mira cómo se compone: Saludo es una función pequeña, y AppCompleta la usa tres veces como si fuera una etiqueta HTML. Eso es la magia de React: piezas pequeñas que se combinan en piezas grandes.",
              "soporte-m05-s2-primer-componente",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>JSX desmitificado: NO es HTML.</strong></p>
<p>Lo que escribes entre el <code>return (</code> y el <code>)</code> <em>parece</em> HTML, pero es <strong>JSX</strong>: una sintaxis especial que el editor (y Vite) traduce a llamadas a funciones de JavaScript. <code>&lt;h1&gt;hola&lt;/h1&gt;</code> se convierte por debajo en algo como <code>React.createElement("h1", null, "hola")</code>.</p>
<p>Tres diferencias prácticas que te van a chocar al principio:</p>
<ul>
  <li>En HTML escribes <code>class="..."</code>. En JSX escribes <strong><code>className="..."</code></strong> (porque <code>class</code> es palabra reservada en JS).</li>
  <li>En HTML escribes <code>onclick="..."</code>. En JSX escribes <strong><code>onClick={...}</code></strong> (camelCase + llaves).</li>
  <li>En JSX, dentro de las llaves <code>{ }</code> puedes meter cualquier expresión de JavaScript: una variable, una operación, un ternario. <em>"JSX es JS con sintaxis bonita".</em></li>
</ul>`,
              "soporte-m05-s2-jsx-desmitificado",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `// JSX con expresiones de JavaScript entre llaves
export function Tarjeta() {
  const nombre = "Camila"
  const edad = 28
  const esAdmin = true

  return (
    <article className="tarjeta">
      <h2>{nombre}</h2>
      <p>Tiene {edad} anos</p>
      <p>Doble de la edad: {edad * 2}</p>
      <p>{esAdmin ? "Es admin" : "Es usuario regular"}</p>

      {/* Comentarios en JSX van asi, dentro de llaves */}
    </article>
  )
}`,
              "Las llaves { } son la puerta de entrada de JavaScript dentro de JSX. Adentro va cualquier expresión: variable, suma, ternario, llamada a función. Lo único que no puedes meter es un statement (un if/for completo). Para condicionales usas ternario o &&, que veremos en la sección 4.",
              "soporte-m05-s2-jsx-expresiones",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "exito",
              `<p><strong>Microvictoria:</strong> ya tienes un componente React. Lo estás leyendo. Es JavaScript que devuelve algo que parece HTML.</p>
<p>Si esa frase tiene sentido para ti, <strong>ya estás dentro de React</strong>. El resto del módulo es agregar capacidades a estos componentes.</p>`,
              "soporte-m05-s2-microvictoria",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 3 — Props
      // ----------------------------------------------------------------------
      {
        titulo: "Props: los parámetros de tus componentes",
        skill: "React: pensar en componentes",
        temas:
          "Props como parámetros de función. Tipar props con interface. Componentes reutilizables. children. Inmutabilidad de las props.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Hasta acá tus componentes son rígidos: <code>Saludo</code> siempre dice lo mismo, <code>Tarjeta</code> siempre tiene el mismo nombre. Para hacerlos útiles necesitas que reciban datos desde quien los usa. Esos datos se llaman <strong>props</strong> (de <em>properties</em>).</p>
<p>La idea es exactamente la de los parámetros de una función. <strong>Un componente es una función, las props son sus parámetros.</strong> Punto. Si entendiste cómo funcionan los parámetros en el M03 y los tipaste en el M04, ya entiendes props.</p>`,
              "soporte-m05-s3-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `// Props sin tipos (NO recomendado — solo para mostrar el concepto)
function Saludo(props) {
  return <p>Hola, {props.nombre}!</p>
}

// Uso: las props se pasan como atributos HTML
<Saludo nombre="Camila" />
<Saludo nombre="Pedro" />

// MEJOR: props tipadas con TypeScript (asi siempre)
interface SaludoProps {
  nombre: string
}

function SaludoTipado({ nombre }: SaludoProps) {
  //              ^^^^^^^^^^^^
  // Destructuring: extraigo 'nombre' de las props directamente
  return <p>Hola, {nombre}!</p>
}

<SaludoTipado nombre="Camila" />`,
              "El patrón canónico: una interface llamada [Nombre]Props que describe qué entradas recibe el componente. Después destructuras esas props en el parámetro. Te ahorra escribir 'props.nombre' mil veces y el editor te autocompleta todo.",
              "soporte-m05-s3-props-basicas",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Las props pueden tener cualquier tipo: strings, números, booleanos, arrays, objetos, e incluso <strong>funciones</strong> (esto último vas a usar mil veces para manejar eventos del hijo en el padre).</p>
<p>Y como con las interfaces del M04, las props pueden ser <strong>opcionales</strong> con <code>?</code>.</p>`,
              "soporte-m05-s3-props-tipos",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `interface TicketCardProps {
  id: number                                            // number obligatorio
  titulo: string                                        // string obligatorio
  estado: "abierto" | "en_progreso" | "cerrado"        // union literal
  prioridad?: "baja" | "media" | "alta"                 // opcional
  asignadoA?: string                                    // opcional
  onClick?: () => void                                  // funcion opcional
}

export function TicketCard({
  id,
  titulo,
  estado,
  prioridad = "media",      // default cuando no viene
  asignadoA,
  onClick,
}: TicketCardProps) {
  return (
    <article onClick={onClick}>
      <header>
        <strong>#{id}</strong> {titulo}
      </header>
      <p>Estado: {estado}</p>
      <p>Prioridad: {prioridad}</p>
      {asignadoA && <p>Asignado a: {asignadoA}</p>}
    </article>
  )
}

// Uso desde el padre:
<TicketCard
  id={42}
  titulo="Login no funciona"
  estado="abierto"
  prioridad="alta"
  asignadoA="Camila"
  onClick={() => console.log("clickearon el ticket 42")}
/>`,
              "Anatomía completa de un componente real: interface con uniones literales, opcionales con default, función opcional como prop para manejar eventos. Esto es exactamente lo que vas a escribir cuando trabajes en producción.",
              "soporte-m05-s3-props-completas",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Children</strong>: una prop especial que React te regala. Te deja meter JSX <em>entre</em> las etiquetas de tu componente, como si fueran "hijos".</p>
<p>Es lo que te permite hacer componentes tipo <em>caja</em>: <code>&lt;Card&gt;</code>, <code>&lt;Modal&gt;</code>, <code>&lt;Layout&gt;</code>, donde el contenido lo decide quien usa el componente, no el componente mismo.</p>`,
              "soporte-m05-s3-children-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `import type { ReactNode } from "react"

interface CardProps {
  titulo: string
  children: ReactNode      // ReactNode = "cualquier cosa que React pueda renderizar"
}

export function Card({ titulo, children }: CardProps) {
  return (
    <article className="card">
      <header>{titulo}</header>
      <div className="card-body">
        {children}
      </div>
    </article>
  )
}

// Uso: lo que ponga entre <Card> y </Card> entra como children
<Card titulo="Mi seccion">
  <p>Cualquier cosa va aca dentro.</p>
  <p>Multiples elementos. JSX arbitrario.</p>
  <button>Hasta botones.</button>
</Card>`,
              "Children es la prop que convierte un componente en una caja reutilizable. La vas a usar en cada Layout, Modal, Tarjeta, Tooltip que crees en tu carrera.",
              "soporte-m05-s3-children-codigo",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "warning",
              `<p><strong>Regla sagrada: las props son inmutables.</strong></p>
<p>Una vez que un componente recibe sus props, <strong>no las puede modificar</strong>. Pueden leerse, mostrarse, derivar otras cosas a partir de ellas. Pero hacer <code>props.titulo = "otra cosa"</code> es romper React.</p>
<p>Si el componente necesita "cambiar algo", eso ya no es una prop: es <strong>estado</strong>. Y eso es lo que viene en la próxima sección.</p>
<p>Mnemotécnico: <em>props son los argumentos que te pasan; estado es la memoria que tú llevas adentro</em>.</p>`,
              "soporte-m05-s3-props-inmutables",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 4 — useState + eventos + RETO 1
      // ----------------------------------------------------------------------
      {
        titulo: "useState y eventos: cómo tu app gana memoria (con reto)",
        skill: "React: pensar en componentes",
        temas:
          "Por qué las variables normales no sirven. useState explicado paso a paso. onClick, onChange. setState con función. Renderizado condicional (ternario, &&, early return). Reto: función siguienteContador tipada.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Llegamos al concepto más importante de React: <strong>el estado</strong>. Esto es lo que separa una página estática de una app viva.</p>
<p>Acá viene una pregunta que parece tonta pero tiene una respuesta esencial: <em>"¿por qué no puedo usar una variable normal?"</em></p>
<p>Mira este componente. Parece razonable. <strong>Pero no funciona.</strong></p>`,
              "soporte-m05-s4-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `// ESTO NO FUNCIONA — no usa estado, solo variable normal
export function ContadorRoto() {
  let valor = 0   // ← variable normal

  return (
    <div>
      <h1>{valor}</h1>
      <button onClick={() => {
        valor = valor + 1
        console.log("nuevo valor:", valor)  // se imprime bien
      }}>
        + 1
      </button>
    </div>
  )
}

// Que pasa cuando lo pruebas:
// → el console.log si imprime 1, 2, 3, 4...
// → pero el <h1> en pantalla sigue mostrando 0
// → React no se entera de que la variable cambio`,
              "El componente se ejecuta una vez al montarse. Después, aunque cambies la variable, React no sabe que tiene que volver a ejecutar el componente. Necesitas decirle 'oye, esto cambió, repinta'. Eso lo hace useState.",
              "soporte-m05-s4-contador-roto",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong><code>useState</code></strong> es la forma en que un componente "se acuerda" de cosas entre renders. Es un <strong>hook</strong> (una función especial de React) que te entrega dos cosas:</p>
<ol>
  <li><strong>El valor actual</strong> del estado.</li>
  <li><strong>Una función para cambiar ese valor</strong>. Cuando la llamas, React vuelve a ejecutar el componente con el nuevo valor.</li>
</ol>
<p>Lo importante: <strong>no cambies la variable directamente</strong>. Llama a la función que te dio <code>useState</code>. Ahí React se entera y repinta.</p>`,
              "soporte-m05-s4-usestate-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `import { useState } from "react"

// CONTADOR QUE SI FUNCIONA
export function Contador() {
  // useState te entrega [valor, funcionParaCambiar]
  // La convencion: [algo, setAlgo]
  const [valor, setValor] = useState(0)
  //     ^^^^^^^  ^^^^^^^^
  //     valor    funcion para cambiarlo

  return (
    <div>
      <h1>{valor}</h1>
      <button onClick={() => setValor(valor + 1)}>+ 1</button>
      <button onClick={() => setValor(valor - 1)}>- 1</button>
      <button onClick={() => setValor(0)}>reset</button>
    </div>
  )
}

// Tipado explicito (cuando el valor inicial no basta para inferir)
const [tareas, setTareas] = useState<string[]>([])
//                                  ^^^^^^^^^^
// "este useState guarda un array de strings"`,
              "El patrón es siempre el mismo: const [algo, setAlgo] = useState(valorInicial). El primer elemento del array es el valor actual; el segundo es la función para cambiarlo. Cuando llamas a setAlgo, React repinta el componente con el nuevo valor.",
              "soporte-m05-s4-usestate-codigo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Los eventos en React se manejan como props especiales del JSX. <strong>Siempre en camelCase</strong> (<code>onClick</code>, no <code>onclick</code>) y <strong>siempre reciben una función</strong>, no un string.</p>
<p>Los que vas a usar el 90% del tiempo:</p>
<ul>
  <li><strong><code>onClick</code></strong> — el usuario hace click. En botones, links, divs (último recurso).</li>
  <li><strong><code>onChange</code></strong> — un input cambió de valor. Para campos de formulario, checkboxes, selects.</li>
  <li><strong><code>onSubmit</code></strong> — un formulario fue enviado. En <code>&lt;form&gt;</code>.</li>
  <li><strong><code>onKeyDown</code></strong> — el usuario apretó una tecla. Para atajos.</li>
</ul>`,
              "soporte-m05-s4-eventos-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `import { useState } from "react"

export function FormularioNombre() {
  const [nombre, setNombre] = useState("")

  // El evento onChange te entrega un objeto con info del cambio
  // El valor actual del input esta en evento.target.value
  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault()        // evita que el form recargue la pagina
        alert(\`Hola, \${nombre}!\`)
      }}
    >
      <input
        type="text"
        value={nombre}                                       // input "controlado" por el estado
        onChange={(evento) => setNombre(evento.target.value)}  // actualizar estado al escribir
        placeholder="Tu nombre"
      />
      <button type="submit">Saludar</button>
    </form>
  )
}

// Esto se llama "input controlado": el valor del input ES el estado.
// React es la unica fuente de verdad — el input solo muestra lo que dice el estado.`,
              "El patrón input controlado es el más común en React. value={estado} le dice al input qué mostrar; onChange={...} actualiza el estado cuando el usuario escribe. Así el estado y el input están siempre sincronizados.",
              "soporte-m05-s4-eventos-codigo",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "warning",
              `<p><strong>Trampa famosa: el estado se actualiza ASÍNCRONO.</strong></p>
<p>Cuando llamas a <code>setValor(5)</code>, el valor <strong>no cambia en esa línea</strong>: cambia en el próximo render. Si en la siguiente línea haces <code>console.log(valor)</code>, sigue valiendo lo viejo.</p>
<p>Por eso, si quieres actualizar el estado <strong>basado en el valor anterior</strong>, usa la versión con función:</p>
<pre><code>setValor(prev =&gt; prev + 1)</code></pre>
<p>Esa forma garantiza que estás trabajando con el valor más reciente, incluso si hay varias actualizaciones encadenadas. Cuando dudes (especialmente con timers o eventos rápidos), usa la versión con función.</p>`,
              "soporte-m05-s4-trampa-asincrono",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Renderizado condicional</strong>: mostrar o no mostrar un pedazo de UI según el estado. En JSX no puedes meter un <code>if/else</code> tradicional, pero tienes tres alternativas:</p>
<ul>
  <li><strong>Early return</strong>: si el componente entero depende de la condición, devuelve algo distinto al inicio.</li>
  <li><strong>Operador ternario</strong> (<code>condicion ? si : no</code>): para alternar entre dos opciones inline.</li>
  <li><strong>Operador &&</strong> (<code>condicion && jsx</code>): para mostrar algo solo si la condición es verdadera.</li>
</ul>`,
              "soporte-m05-s4-condicional-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `import { useState } from "react"

interface MensajeProps {
  cargando: boolean
  error: string | null
  datos: string | null
}

export function Mensaje({ cargando, error, datos }: MensajeProps) {
  // Early return: el componente entero depende
  if (cargando) {
    return <p>Cargando...</p>
  }
  if (error) {
    return <p>Error: {error}</p>
  }
  if (!datos) {
    return <p>No hay datos para mostrar.</p>
  }

  return <p>{datos}</p>
}

// Ternario inline: alternar entre dos opciones dentro del JSX
export function Login({ logueado }: { logueado: boolean }) {
  return (
    <header>
      {logueado ? <button>Cerrar sesion</button> : <button>Iniciar sesion</button>}
    </header>
  )
}

// && para mostrar solo si la condicion es true
export function Aviso({ hayPendientes, cantidad }: { hayPendientes: boolean; cantidad: number }) {
  return (
    <div>
      <h1>Bandeja</h1>
      {hayPendientes && <p>Tienes {cantidad} pendientes urgentes.</p>}
    </div>
  )
}`,
              "Las tres herramientas que se complementan. Early return para 'el componente entero cambia según condición'. Ternario para 'una de dos opciones'. && para 'mostrar solo si'. OJO con && cuando el lado izquierdo puede ser 0 — usa explícito > 0, porque {0 && <X />} renderiza el número 0 en la pantalla.",
              "soporte-m05-s4-condicional-codigo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Reto autocorregido del módulo: la función que vive dentro de un useState.</strong></p>
<p>Cuando manejas un contador con <code>useState</code>, lo natural es separar la <em>lógica de qué hacer con el estado</em> en una función pura aparte. Esa función recibe el estado actual y una acción, y devuelve el nuevo estado. Es exactamente el patrón que vas a ver mañana en cualquier <code>useReducer</code> serio.</p>
<p>Tu tarea es escribir esa función. Tipada con TypeScript. Pura: solo lógica, sin React, sin DOM. Después React la llamaría dentro del <code>onClick</code> del botón.</p>`,
              "soporte-m05-s4-intro-reto",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_PREGUNTAS,
            esEvaluable: true,
            skill: "React: pensar en componentes",
            idForzado: ID_SOP_M05_S4_PREG,
            contenido: buildCodigoPreguntas(
              "typescript",
              `Tu tarea: escribir una funcion TIPADA llamada "siguienteContador" que React llamaria dentro del onClick de un boton.

Reglas:
  - Recibe "actual" (number): el valor actual del contador.
  - Recibe "accion" (string literal): una de "incrementar", "decrementar" o "reset".
    Usa una UNION LITERAL como tipo.
  - Devuelve un number con el nuevo valor:
      - "incrementar" → actual + 1
      - "decrementar" → actual - 1
      - "reset" → 0
  - Tipa explicitamente parametros y retorno.

Despues haz exactamente estos 3 console.log:
  console.log(siguienteContador(5, "incrementar"))
  console.log(siguienteContador(5, "decrementar"))
  console.log(siguienteContador(5, "reset"))

Pista — la union literal:
  type Accion = "incrementar" | "decrementar" | "reset"

Salida exacta esperada (3 lineas):
6
4
0`,
              `// Escribe tu solucion abajo.
// Plantilla sugerida:
//
// type Accion = "incrementar" | "decrementar" | "reset"
//
// function siguienteContador(actual: number, accion: Accion): number {
//   // tu logica aqui
// }
//
// console.log(siguienteContador(5, "incrementar"))
// console.log(siguienteContador(5, "decrementar"))
// console.log(siguienteContador(5, "reset"))

`,
              "soporte-m05-s4-codigo-preguntas",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_TESTS,
            esEvaluable: false,
            idForzado: ID_SOP_M05_S4_TEST,
            contenido: buildCodigoTests(
              ID_SOP_M05_S4_PREG,
              `type Accion = "incrementar" | "decrementar" | "reset"

function siguienteContador(actual: number, accion: Accion): number {
  if (accion === "incrementar") return actual + 1
  if (accion === "decrementar") return actual - 1
  return 0
}

console.log(siguienteContador(5, "incrementar"))
console.log(siguienteContador(5, "decrementar"))
console.log(siguienteContador(5, "reset"))`,
              [
                {
                  id: "t1",
                  descripcion: "Las tres acciones devuelven el valor esperado",
                  entrada: "",
                  salidaEsperada: "6\n4\n0\n",
                  visible: true,
                },
                {
                  id: "t2",
                  descripcion: "incrementar suma 1, decrementar resta 1, reset vuelve a 0",
                  entrada: "",
                  salidaEsperada: "6\n4\n0\n",
                  visible: true,
                },
                {
                  id: "t3",
                  descripcion: "Test oculto: tipo de acciones y comportamiento exactos",
                  entrada: "",
                  salidaEsperada: "6\n4\n0\n",
                  visible: false,
                },
              ],
              "soporte-m05-s4-codigo-tests",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Si pasaste el reto: <strong>acabas de escribir lo que va dentro de un componente React real</strong>. Esa función — recibir estado actual, aplicar acción, devolver nuevo estado — es el corazón de toda interactividad. En código real, el onClick del botón quedaría así:</p>
<pre><code>&lt;button onClick={() =&gt; setValor(siguienteContador(valor, "incrementar"))}&gt;
  + 1
&lt;/button&gt;</code></pre>
<p>Función pura adentro, React orquestando afuera. Esa separación es lo que hace que el código sea legible, testeable y mantenible a largo plazo.</p>`,
              "soporte-m05-s4-post-reto",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 5 — Listas y key
      // ----------------------------------------------------------------------
      {
        titulo: "Listas y key: renderizar arrays sin romper React",
        skill: "React: pensar en componentes",
        temas:
          "Renderizar un array con map. La prop key y por qué importa. Por qué nunca usar el index como key. Combinar filter + map + condicional.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              "<p>Tu app tiene una lista de tareas. ¿Cómo la renderizas? Recuerda lo que aprendiste en el M03: <strong><code>.map()</code></strong> transforma cada elemento de un array. En React lo usas exactamente igual, pero <strong>devolviendo JSX por cada elemento</strong>.</p>",
              "soporte-m05-s5-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `interface Tarea {
  id: number
  texto: string
  hecha: boolean
}

interface ListaTareasProps {
  tareas: Tarea[]
}

export function ListaTareas({ tareas }: ListaTareasProps) {
  return (
    <ul>
      {tareas.map((tarea) => (
        <li key={tarea.id}>
          {tarea.texto} {tarea.hecha ? "(hecha)" : ""}
        </li>
      ))}
    </ul>
  )
}

// Uso:
const tareas: Tarea[] = [
  { id: 1, texto: "Comprar pan", hecha: false },
  { id: 2, texto: "Llamar al banco", hecha: true },
  { id: 3, texto: "Subir bitacora", hecha: false },
]

<ListaTareas tareas={tareas} />`,
              "El patrón canónico: array.map((item) => <Componente key={item.id} ... />). Cada elemento del array se transforma en un pedazo de JSX. React renderiza todo el resultado dentro del <ul>.",
              "soporte-m05-s5-map-jsx",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Te vas a fijar en algo: cada elemento del map lleva una prop especial <strong><code>key</code></strong>. ¿Para qué sirve?</p>
<p>Cuando la lista cambia (agregas, quitas, reordenas), React necesita saber <strong>cuál elemento es cuál</strong> para no rehacer todo el DOM desde cero. Con <code>key</code>, React identifica cada elemento de manera estable, reutiliza los que ya estaban, y solo crea/destruye los que cambiaron de verdad.</p>
<p>Tres reglas duras de key:</p>
<ul>
  <li><strong>Es obligatorio</strong> cuando renderizas un array. Si no la pones, React te grita en la consola.</li>
  <li><strong>Debe ser única entre hermanos</strong>. Dos elementos del mismo array no pueden compartir key.</li>
  <li><strong>Debe ser estable</strong>. La misma cosa siempre tiene la misma key, aunque cambien de posición.</li>
</ul>`,
              "soporte-m05-s5-key-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `// BIEN — id estable, viene del dato real
{tareas.map(t => <li key={t.id}>{t.texto}</li>)}

// MAL — usar el indice. Funciona... hasta que la lista se reordena o filtra.
{tareas.map((t, indice) => <li key={indice}>{t.texto}</li>)}
//                              ^^^^^^^^^^^^
// Bug: si borras la primera tarea, la segunda pasa a indice 0.
// React piensa "ah, el elemento 0 cambio de texto", no "borraron el 0".
// Resultado: inputs que mantienen el valor viejo, checkboxes mal marcados,
// rara vez se nota al inicio, casi siempre se descubre tarde y duele.

// ULTIMO RECURSO — si NO tienes id, generar uno al crear el elemento
const nuevaTarea = {
  id: Date.now(),     // o crypto.randomUUID()
  texto: "...",
  hecha: false,
}`,
              "El index como key es el bug silencioso más común de React. Funciona si la lista nunca se modifica. En cuanto agregas, borras o filtras, empiezas a ver bugs raros que toman horas en diagnosticarse.",
              "soporte-m05-s5-key-codigo",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "warning",
              `<p><strong>Repite en voz alta: NUNCA uses el <code>index</code> como key.</strong></p>
<p>El día que te pesque el bug, vas a perder horas debuggeando, vas a culpar a React, vas a culparte a ti, vas a culpar a TypeScript. <em>El culpable era el index como key, hace tres meses, en ese commit que parecía inofensivo.</em></p>
<p>Si tu dato no tiene id, generálo al crearlo con <code>Date.now()</code>, <code>crypto.randomUUID()</code>, o un contador propio. Lo que sea, menos el index.</p>`,
              "soporte-m05-s5-trampa-index",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `// Combinar filter + map + condicional: el combo que vas a usar 1000 veces
import { useState } from "react"

interface Tarea {
  id: number
  texto: string
  hecha: boolean
}

export function ListaInteligente({ tareas }: { tareas: Tarea[] }) {
  const [mostrarSoloPendientes, setMostrarSoloPendientes] = useState(false)

  // Decision: que lista renderizo segun el filtro?
  const listaVisible = mostrarSoloPendientes
    ? tareas.filter(t => !t.hecha)
    : tareas

  return (
    <section>
      <label>
        <input
          type="checkbox"
          checked={mostrarSoloPendientes}
          onChange={(e) => setMostrarSoloPendientes(e.target.checked)}
        />
        Solo pendientes
      </label>

      {listaVisible.length === 0 ? (
        <p>No hay tareas que mostrar.</p>
      ) : (
        <ul>
          {listaVisible.map(t => (
            <li key={t.id}>
              {t.texto} {t.hecha && "✓"}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}`,
              "Acá está el combo completo: estado para el filtro, filter para la lista visible, ternario para vacío vs lista, map para renderizar, key para identificar. Si entiendes este bloque entero, ya tienes el 80% de la mecánica de React internalizada.",
              "soporte-m05-s5-combo-completo",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 6 — Reto guiado (lista de tareas) + Quiz + Cierre
      // ----------------------------------------------------------------------
      {
        titulo: "Tu primera lista de tareas en React + TS (reto guiado, quiz, cierre)",
        skill: "React: pensar en componentes",
        temas:
          "Reto guiado: lista de tareas completa con Vite + React + TS (App.tsx copy-paste). Agregar, marcar como hecha, eliminar, filtrar. Quiz del módulo. Puente a M06.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Reto integrador del módulo: lista de tareas en React + TypeScript.</strong></p>
<p>Vas a juntar TODO lo del módulo en una sola pantalla:</p>
<ul>
  <li>Componente con estado.</li>
  <li>Interface tipada (recordar M04).</li>
  <li>Input controlado con <code>onChange</code>.</li>
  <li>Botones con <code>onClick</code>.</li>
  <li>Lista con <code>map</code> y <code>key</code> correcta.</li>
  <li>Renderizado condicional para el estado vacío.</li>
  <li>Filtrado dinámico.</li>
</ul>
<p>Te damos el código completo. Tu pega: <strong>levantarlo en tu computador, jugar con él, romperlo y arreglarlo</strong>. Esa rueda es donde se aprende de verdad.</p>`,
              "soporte-m05-s6-intro-reto",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "bash",
              `# Paso 1: crear el proyecto Vite con React + TypeScript
cd ~/Desktop/mi-camino-dev
pnpm create vite@latest lista-tareas -- --template react-ts
# (si no tienes pnpm: usa 'npm create vite@latest lista-tareas -- --template react-ts')

# Paso 2: entrar y instalar
cd lista-tareas
pnpm install

# Paso 3: reemplazar src/App.tsx con el codigo del siguiente bloque

# Paso 4: levantar el servidor
pnpm dev
# → abre http://localhost:5173 en el navegador
# → cada vez que guardes App.tsx, la pagina se recarga sola`,
              "Cuatro pasos. Tres minutos. Tienes una app React + TS corriendo lista para jugar.",
              "soporte-m05-s6-comandos",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              "<p>Reemplaza el contenido de <code>src/App.tsx</code> con este código. Léelo despacio antes de pegarlo — vas a reconocer todos los pedazos:</p>",
              "soporte-m05-s6-intro-codigo",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `// src/App.tsx
import { useState } from "react"

interface Tarea {
  id: number
  texto: string
  hecha: boolean
}

export default function App() {
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [textoNuevo, setTextoNuevo] = useState("")
  const [mostrarSoloPendientes, setMostrarSoloPendientes] = useState(false)

  const agregarTarea = () => {
    const textoLimpio = textoNuevo.trim()
    if (textoLimpio === "") return
    const nueva: Tarea = {
      id: Date.now(),
      texto: textoLimpio,
      hecha: false,
    }
    setTareas([...tareas, nueva])
    setTextoNuevo("")
  }

  const toggleTarea = (id: number) => {
    setTareas(tareas.map(t => (t.id === id ? { ...t, hecha: !t.hecha } : t)))
  }

  const eliminarTarea = (id: number) => {
    setTareas(tareas.filter(t => t.id !== id))
  }

  const visibles = mostrarSoloPendientes
    ? tareas.filter(t => !t.hecha)
    : tareas

  return (
    <main style={{ maxWidth: 520, margin: "48px auto", fontFamily: "system-ui", padding: "0 24px" }}>
      <h1 style={{ color: "#4f46e5" }}>Mi lista de tareas</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          value={textoNuevo}
          onChange={(e) => setTextoNuevo(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") agregarTarea() }}
          placeholder="Que tengo que hacer?"
          style={{ flex: 1, padding: "8px 12px", border: "1px solid #d6d3d1", borderRadius: 8 }}
        />
        <button
          onClick={agregarTarea}
          style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: "#4f46e5", color: "white", cursor: "pointer" }}
        >
          Agregar
        </button>
      </div>

      <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, color: "#57534e" }}>
        <input
          type="checkbox"
          checked={mostrarSoloPendientes}
          onChange={(e) => setMostrarSoloPendientes(e.target.checked)}
        />
        Mostrar solo pendientes
      </label>

      {visibles.length === 0 ? (
        <p style={{ color: "#a8a29e", fontStyle: "italic" }}>
          {tareas.length === 0
            ? "Sin tareas todavia. Agrega la primera arriba."
            : "Nada pendiente. Todo hecho."}
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {visibles.map(t => (
            <li
              key={t.id}
              style={{ display: "flex", gap: 8, padding: "8px 0", borderBottom: "1px solid #e7e5e4", alignItems: "center" }}
            >
              <input
                type="checkbox"
                checked={t.hecha}
                onChange={() => toggleTarea(t.id)}
              />
              <span style={{ flex: 1, textDecoration: t.hecha ? "line-through" : "none", color: t.hecha ? "#a8a29e" : "#1f2937" }}>
                {t.texto}
              </span>
              <button
                onClick={() => eliminarTarea(t.id)}
                style={{ padding: "4px 8px", border: "none", borderRadius: 6, background: "#fee2e2", color: "#b91c1c", cursor: "pointer" }}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}`,
              "Una sola pantalla, todos los conceptos del módulo: useState (tres veces), interface tipada, input controlado, onClick, onKeyDown, map con key, renderizado condicional anidado, spread y filter. Si entiendes este archivo entero, dominas el 80% de React básico.",
              "soporte-m05-s6-codigo-app",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Una vez que lo tengas corriendo, <strong>experimentá</strong>. No avances al quiz hasta que no hayas roto y arreglado la app al menos dos veces. Sugerencias:</p>
<ul>
  <li>Cambia <code>setTareas([...tareas, nueva])</code> por <code>setTareas([nueva, ...tareas])</code>. ¿Qué cambia visualmente?</li>
  <li>Cambia <code>key={t.id}</code> por <code>key={Math.random()}</code>. Agrega varias tareas, marca algunas, observa qué se rompe.</li>
  <li>Agrega un contador "Tienes X pendientes" arriba de la lista. Pista: <code>tareas.filter(t =&gt; !t.hecha).length</code>.</li>
  <li>Cambia el placeholder, los colores, el padding. <em>Tu app, tu juguete.</em></li>
</ul>
<p>Si en algún punto la app se rompe y no entiendes por qué: abre la consola del navegador (F12 → Console). React te dice qué pasó con mucho detalle.</p>`,
              "soporte-m05-s6-experimenta",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "React: pensar en componentes",
            contenido: buildQuiz(
              [
                {
                  id: "m05-q1",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>Tienes <code>let valor = 0</code> dentro de un componente y un botón que hace <code>valor = valor + 1</code> al hacer click. La pantalla muestra <code>0</code> y nunca cambia. ¿Por qué?</p>",
                  explicacion:
                    "React no se entera de cambios en variables normales. Para que la UI se sincronice con el estado y se repinte cuando cambia, necesitas useState. Esa es exactamente la razón por la que useState existe.",
                  opciones: [
                    {
                      id: "a",
                      texto: "El navegador tiene un bug, hay que recargar la página.",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "El componente se ejecuta una vez al montarse; React no se entera de que la variable cambió. Hay que usar useState.",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto:
                        "Falta declarar la variable con <code>const</code> en lugar de <code>let</code>.",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "El <code>onClick</code> no se está ejecutando.",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m05-q2",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>Estás renderizando una lista de tickets que el usuario puede reordenar y eliminar. ¿Qué deberías usar como <code>key</code>?</p>",
                  explicacion:
                    "El index cambia cuando reordenas o eliminas: React confunde qué elemento es cuál y aparecen bugs sutiles (inputs que mantienen valor viejo, checkboxes mal marcados). El id real del ticket es estable y único.",
                  opciones: [
                    {
                      id: "a",
                      texto: "El index del array (<code>map((t, i) =&gt; ... key={i})</code>).",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto: "El id único del ticket (<code>key={t.id}</code>).",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "El texto del ticket (<code>key={t.titulo}</code>).",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "No hace falta poner key: React la genera sola.",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m05-q3",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>Tienes <code>const [contador, setContador] = useState(0)</code> y quieres sumar 1. ¿Cuál es la forma correcta?</p>",
                  explicacion:
                    "setContador es la función que dispara el re-render con el nuevo valor. Modificar la variable contador directamente no funciona (React no se entera). useState(contador + 1) recrearía el estado, no es la forma de actualizar.",
                  opciones: [
                    {
                      id: "a",
                      texto: "<code>contador = contador + 1</code>",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto: "<code>setContador(contador + 1)</code>",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "<code>useState(contador + 1)</code>",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "<code>contador++</code>",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m05-q4",
                  tipo: "VERDADERO_FALSO",
                  enunciado:
                    "<p>Un componente React puede modificar las props que recibe del padre para cambiar su comportamiento.</p>",
                  explicacion:
                    "Falso. Las props son inmutables: el componente las lee y las usa, pero NO las modifica. Si necesita 'cambiar algo', eso es estado interno y se maneja con useState. Mnemotécnico: props = argumentos que te pasan; estado = memoria que tú llevas adentro.",
                  correcta: false,
                },
                {
                  id: "m05-q5",
                  tipo: "RESPUESTA_CORTA",
                  enunciado:
                    "<p>¿Cómo se llama el hook de React que le da a un componente la capacidad de tener estado interno?</p>",
                  explicacion:
                    "useState es el hook fundamental que entrega [valor, función-para-cambiarlo]. Es la herramienta base de toda interactividad en React.",
                  respuestasAceptadas: ["useState", "use state", "useState()"],
                  normalizacion: {
                    trim: true,
                    ignorarMayusculas: true,
                    ignorarAcentos: true,
                    ignorarEspaciosDobles: true,
                  },
                },
              ],
              "soporte-m05-s6-quiz",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Si llegaste hasta acá con la app de tareas corriendo, el reto autocorregido pasado, el quiz aprobado, y al menos un experimento de los sugeridos: <strong>oficialmente eres dev de React básico</strong>. Lo que escribiste hoy es exactamente el tipo de código que vas a leer y modificar el lunes en cualquier proyecto serio.</p>
<hr/>
<p><strong>Cierre del módulo.</strong></p>
<p>Lo que llevas:</p>
<ul>
  <li>La ecuación madre: <strong>UI = f(estado)</strong>.</li>
  <li>Vite para arrancar proyectos en 30 segundos.</li>
  <li>Componentes como funciones + JSX como JS con sintaxis bonita.</li>
  <li>Props tipadas con <code>interface</code> + <code>children</code>.</li>
  <li><code>useState</code> y la disciplina de no modificar estado directamente.</li>
  <li>Eventos en camelCase + inputs controlados.</li>
  <li>Renderizado condicional con early return, ternario y <code>&&</code>.</li>
  <li>Listas con <code>map</code> + <code>key</code> estable (jamás el index).</li>
  <li>Una app de tareas viva en tu computador.</li>
</ul>
<p>En el <strong>Módulo 06</strong> entra <strong>React real</strong>: los datos del servidor. Hasta acá tu lista vive solo en la memoria del navegador — si recargas la pestaña, se pierde. En el próximo módulo aprendes a pedir datos a un backend (con <code>useEffect</code>, pero <em>poquito</em>, porque la forma correcta es Tanstack Query) y a guardar cambios para que sobrevivan al refresh.</p>
<p>Spoiler: ahí termina el salto de "página tonta" a "aplicación de verdad". Y vas a llegar listo. <em>Todavía no</em>, pero ya falta poco.</p>
<p><strong>Nos vemos al otro lado.</strong></p>`,
              "soporte-m05-s6-cierre",
            ),
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // MODULO 06 — REACT REAL: DATOS DEL SERVIDOR   (COMPLETO)
  // ==========================================================================
  {
    idx: 26,
    titulo: "Módulo 06 — React real: datos del servidor",
    descripcion:
      "El salto de juguete a app real. Aprendes por qué useEffect casi nunca es la respuesta para pedir datos, te metes con Tanstack Query (useQuery + useMutation), navegas entre páginas con React Router y armas formularios controlados con validación. Al terminar tienes una mini app de tickets corriendo: listado, detalle, crear y marcar como resuelto.",
    secciones: [
      // ----------------------------------------------------------------------
      // Seccion 1 — useEffect: cuando si, cuando NO
      // ----------------------------------------------------------------------
      {
        titulo: "useEffect: cuándo sí, cuándo NO",
        skill: "React real con datos del servidor",
        temas:
          "Por qué useEffect existe. Cómo se ve un fetch ingenuo con useEffect + useState. Los cuatro dolores típicos (sin cache, doble fetch en StrictMode, cleanup, refetch al volver a la pestaña). useEffect sigue siendo útil para sincronizar con sistemas externos, pero para pedir datos del servidor hay una herramienta mejor.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Bienvenido al otro lado.</strong></p>
<p>La app de tareas del módulo 5 está corriendo en tu compu. Te funciona. Te enorgulleces. Cierras la pestaña, vuelves a abrirla y... <strong>todo se borró</strong>. Tu jefe te mira raro porque le habías mostrado tu "app". Le explicas que "los datos están en la memoria del navegador" y te dice "ah, ok". Pero los dos saben que eso no es una app de verdad.</p>
<p>Hoy lo arreglamos. Hoy aprendes a hablar con un <strong>servidor</strong>: ese computador remoto donde viven los datos que sobreviven al refresh, al reinicio de tu compu y a que tú te vayas de vacaciones.</p>`,
              "soporte-m06-s1-intro",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>El primer hook con el que te vas a encontrar al googlear "cómo pido datos en React" se llama <code>useEffect</code>. Antes de explicarlo, una verdad incómoda:</p>
<p><strong>La mayoría de los <code>useEffect</code> que se escriben en proyectos viejos están mal.</strong> No porque la gente sea tonta — es que <code>useEffect</code> es una herramienta de uso muy general, y la gente la usa para todo, incluso para casos donde hay una herramienta mejor. Y "pedir datos al servidor" es <em>el</em> caso clásico donde hay una herramienta mejor.</p>
<p>Pero vamos a verlo igual. Porque ese código mal hecho lo vas a encontrar el lunes en cualquier proyecto que tengas que mantener. Y necesitas saber por qué huele mal.</p>`,
              "soporte-m06-s1-verdad-incomoda",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>En una frase: <strong><code>useEffect</code> ejecuta código DESPUÉS de que el componente se pinta en pantalla</strong>. Sirve para "efectos secundarios": cosas que no son parte del render normal — como suscribirse a un evento del navegador, arrancar un timer, mover el foco a un input, o pedir datos al servidor.</p>
<p>Recibe dos cosas:</p>
<ul>
  <li>Una <strong>función</strong> con el código a ejecutar.</li>
  <li>Un <strong>array de dependencias</strong>: si el array está vacío <code>[]</code>, el efecto corre una sola vez al montar el componente. Si tiene variables, vuelve a correr cada vez que esas variables cambien.</li>
</ul>
<p>Suena bien. Veamos cómo se ve cuando lo usas para pedir tickets a un servidor:</p>`,
              "soporte-m06-s1-useeffect-en-simple",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "javascript",
              `import { useState, useEffect } from "react"

export function ListaTicketsIngenua() {
  const [tickets, setTickets] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setCargando(true)
    fetch("/api/tickets")
      .then((r) => r.json())
      .then((data) => {
        setTickets(data)
        setCargando(false)
      })
      .catch((err) => {
        setError(err.message)
        setCargando(false)
      })
  }, []) // <- array vacio: corre una vez al montar

  if (cargando) return <p>Cargando...</p>
  if (error) return <p>Error: {error}</p>
  return (
    <ul>
      {tickets.map((t) => (
        <li key={t.id}>{t.titulo}</li>
      ))}
    </ul>
  )
}`,
              "Este código FUNCIONA. La primera vez. Después aparecen los dolores que vienen en el próximo bloque.",
              "soporte-m06-s1-fetch-ingenuo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Lee bien ese código: <strong>tres <code>useState</code> + un <code>useEffect</code> + tres <code>if</code> de renderizado condicional</strong> para hacer <em>una</em> lista. Imagina una app con 20 listas distintas. Multiplica.</p>
<p>Y ahora los dolores reales que aparecen cuando esa app crece:</p>
<ul>
  <li><strong>Sin cache.</strong> Cada vez que el componente se monta, vuelve a pedir los tickets. ¿Cambiaste a otra pestaña y volviste? Otro request. ¿Tienes la misma lista en dos lugares de la app? Dos requests.</li>
  <li><strong>Doble fetch en desarrollo.</strong> React (con StrictMode activado, que viene por default) llama el effect <strong>dos veces</strong> a propósito en modo dev, para que detectes bugs. Tu fetch corre dos veces. La primera vez que lo veas, vas a pensar que tu compu está poseída.</li>
  <li><strong>Sin cleanup.</strong> Si el usuario se va de la página antes de que llegue la respuesta, el <code>setTickets</code> intenta actualizar un componente que ya no existe. React te grita en la consola: <em>"can't update state on unmounted component"</em>. Memory leak. Para arreglarlo tienes que añadir un <code>AbortController</code> manual. Más código.</li>
  <li><strong>Refetch a mano.</strong> ¿El usuario vuelve a la pestaña después de 1 hora? Tu lista está congelada. ¿Cómo refrescas? Te toca programarlo tú.</li>
  <li><strong>Cero deduplicación.</strong> Si dos componentes piden los mismos tickets al mismo tiempo, son dos requests al servidor. Cero solidaridad.</li>
</ul>
<p>Sin mitos: <strong>nada de esto es culpa tuya ni de React</strong>. Es que estás usando un martillo para atornillar.</p>`,
              "soporte-m06-s1-cuatro-dolores",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "warning",
              `<p><strong>Entonces, ¿<code>useEffect</code> es malo?</strong> No. <code>useEffect</code> es excelente para lo que fue diseñado: <strong>sincronizarse con sistemas externos a React</strong>. Casos donde SÍ lo vas a usar tú mismo:</p>
<ul>
  <li>Suscribirte a un evento del navegador (resize, scroll, teclado).</li>
  <li>Conectarte a una librería que no es de React (un mapa de Leaflet, un editor de código tipo Monaco).</li>
  <li>Mover el foco a un input cuando aparece un modal.</li>
  <li>Arrancar un timer y limpiarlo cuando el componente se va.</li>
</ul>
<p>Pero para <strong>pedir datos al servidor</strong>, mejor herramienta. La regla mental: <em>si lo que vas a hacer es leer datos de una API, NO uses useEffect a pelo. Usa Tanstack Query</em>. Eso es lo que viene.</p>`,
              "soporte-m06-s1-tip-useeffect-no-es-malo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Microvictoria de la sección: <strong>acabas de leer código real de proyectos reales</strong>. Ese patrón <code>useState + useEffect + fetch + tres ifs</code> está vivo en miles de repos. Saber que existe y que tiene cinco dolores conocidos ya te pone delante de muchos devs que llevan dos años repitiéndolo sin entender por qué la app va lenta.</p>
<p><em>Todavía no</em> escribiste tu primer <code>useQuery</code>. En la próxima sección lo haces.</p>`,
              "soporte-m06-s1-microvictoria",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 2 — Tanstack Query: useQuery (+ RETO autocorregible)
      // ----------------------------------------------------------------------
      {
        titulo: "Tanstack Query: useQuery (con reto autocorregido)",
        skill: "React real con datos del servidor",
        temas:
          "Analogía del mozo entrenado. Instalación + provider. useQuery con queryKey + queryFn. data/isLoading/error. La opción select para derivar datos. Reto autocorregible: función pura del seleccionarTicketUrgente que vive dentro de un select.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Entra <strong>Tanstack Query</strong>. La librería que cambió cómo se piden datos en React. Tan popular que prácticamente no hay app React seria sin ella.</p>
<p>La analogía: imagina un <strong>mozo entrenado</strong> en un buen restaurante. Tú le pides un café. El mozo va a la cocina, te lo trae. Si tres clientes piden el mismo café al mismo tiempo, el mozo NO entra tres veces a la cocina — lo pide una sola vez y lo reparte. Si tú vuelves cinco minutos después y pides "lo mismo de antes", el mozo recuerda lo que pediste. Si te ve mirando con cara de "lleva mucho frío esto", lo nota y te trae uno nuevo sin que se lo pidas.</p>
<p>Eso es Tanstack Query. <strong>Un mozo entrenado entre tu componente y el servidor</strong>.</p>`,
              "soporte-m06-s2-mozo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Lo que Tanstack Query hace por ti, sin pedirte permiso:</p>
<ul>
  <li><strong>Cache automático</strong> de cada pedido. Si dos componentes piden lo mismo, un solo request.</li>
  <li><strong>Loading, error y data</strong> en una sola línea. Se acabaron los tres <code>useState</code>.</li>
  <li><strong>Refresca solo</strong> cuando vuelves a la pestaña, cuando recuperas internet, o cuando le dices "esto ya está viejo".</li>
  <li><strong>Cancela</strong> requests si el componente se desmonta. Adiós memory leaks.</li>
  <li><strong>Invalidación</strong>: cuando tú creas o editas algo, le dices "el cache de tickets ya no es confiable", y refresca solo.</li>
</ul>
<p>Y la mejor parte: vas a escribir <em>menos</em> código, no más. Sigue.</p>`,
              "soporte-m06-s2-que-hace",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "bash",
              `# Dentro de la carpeta del proyecto Vite (el del modulo 5):
pnpm add @tanstack/react-query`,
              "Una sola dependencia. Pesa poco. Cambia mucho.",
              "soporte-m06-s2-install",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Antes de usar el hook, hay un paso que se hace UNA vez en toda la app: envolver tu <code>&lt;App /&gt;</code> en un <code>QueryClientProvider</code>. Es como decirle a React "este árbol de componentes puede usar Tanstack Query". Sin esto, los <code>useQuery</code> tiran error.</p>`,
              "soporte-m06-s2-provider-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "tsx",
              `// src/main.jsx (o main.tsx)
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { App } from "./App"

const queryClient = new QueryClient()

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)`,
              "Una sola instancia de QueryClient para toda la app. Se crea afuera del render porque NO debe recrearse en cada render (eso borraría el cache).",
              "soporte-m06-s2-provider-codigo",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "tsx",
              `// src/ListaTickets.jsx
import { useQuery } from "@tanstack/react-query"

async function obtenerTickets() {
  const r = await fetch("/api/tickets")
  if (!r.ok) throw new Error("No pude pedir los tickets")
  return r.json()
}

export function ListaTickets() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["tickets"],
    queryFn: obtenerTickets,
  })

  if (isLoading) return <p>Cargando...</p>
  if (error) return <p>Error: {error.message}</p>
  return (
    <ul>
      {data.map((t) => (
        <li key={t.id}>{t.titulo}</li>
      ))}
    </ul>
  )
}`,
              "Compara con el código ingenuo del bloque anterior: pasaste de tres useState + un useEffect a UNA línea de useQuery. Y encima ahora tienes cache, refetch en focus, dedup, cleanup automático. Por eso decimos 'menos código, no más'.",
              "soporte-m06-s2-usequery-codigo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Lo que <code>useQuery</code> te pide son dos cosas:</p>
<ul>
  <li><strong><code>queryKey</code></strong>: un array que identifica <em>qué</em> estás pidiendo. Piénsalo como la etiqueta del cache. <code>["tickets"]</code> es "la lista de tickets". <code>["tickets", 42]</code> sería "el ticket número 42". Si dos componentes usan el mismo <code>queryKey</code>, comparten cache. Si la key cambia, Tanstack vuelve a pedir.</li>
  <li><strong><code>queryFn</code></strong>: la función async que hace el fetch real. Tanstack la llama cuando hace falta. La regla: que devuelva los datos, y si algo falla, que <strong>lance un error</strong> (con <code>throw new Error</code>). No te tragues los errores en silencio: Tanstack los necesita para mostrar el estado <code>error</code>.</li>
</ul>
<p>El hook te devuelve un objeto. Los tres campos que vas a usar el 90% del tiempo son <code>data</code>, <code>isLoading</code> y <code>error</code>.</p>`,
              "soporte-m06-s2-querykey-queryfn",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Ahora una opción que en el día a día te va a salvar de cien líneas: <code>select</code>.</p>
<p>A veces los datos crudos del servidor traen más cosas de las que necesitas en ESTE componente. O necesitas <strong>calcular algo a partir de ellos</strong> (cuántos tickets urgentes hay, cuál es el más viejo, agruparlos por prioridad). Para eso existe <code>select</code>: una función que recibe los datos crudos y devuelve la versión derivada que tu UI necesita.</p>
<p>La gracia: Tanstack solo re-renderiza el componente si el resultado del <code>select</code> cambió. Lógica pura, separada del componente, testeable. Justo lo que vas a hacer en el reto que viene.</p>`,
              "soporte-m06-s2-select-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "tsx",
              `// En el mismo componente, otra vista derivada:
const { data: cantidadUrgentes } = useQuery({
  queryKey: ["tickets"],
  queryFn: obtenerTickets,
  select: (tickets) =>
    tickets.filter((t) => t.prioridad === "alta" && t.estado === "abierto").length,
})

// "data" aqui ya NO es la lista entera. Es directamente el numero.
// El componente se re-renderiza solo si la cantidad cambia. Cero overhead.

return <p>Tienes {cantidadUrgentes} tickets urgentes abiertos</p>`,
              "Misma queryKey, mismo cache, diferente vista de los datos. Tres componentes pueden usar el mismo cache con tres select distintos: 'lista completa', 'solo urgentes', 'cantidad agrupada por prioridad'. Un solo request al servidor.",
              "soporte-m06-s2-select-codigo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Reto autocorregido del módulo: la función que vive dentro de un <code>select</code>.</strong></p>
<p>Tu jefe te pide saber el ID del <strong>ticket abierto más urgente</strong> para atender primero. Tienes la lista completa de tickets que llegó del servidor. Necesitas filtrar los abiertos de prioridad alta y, de esos, devolver el ID del que se creó <strong>primero</strong> (el que lleva más tiempo esperando).</p>
<p>La función que vas a escribir es <strong>pura</strong>: recibe la lista, devuelve un ID. Sin React, sin servidor, sin DOM. Es <em>literalmente</em> la función que después le pasarías al <code>select</code> de un <code>useQuery</code> en la app real. Por ser pura, es testeable con <code>console.log</code> y la plataforma la corre por ti.</p>
<p>Lee bien el enunciado. La pista te marca el camino. Si te trabas, respira y vuelve al ejemplo del select de arriba. <em>Todavía no</em> te sale a la primera, pero saldrá.</p>`,
              "soporte-m06-s2-intro-reto",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_PREGUNTAS,
            esEvaluable: true,
            skill: "React real con datos del servidor",
            idForzado: ID_SOP_M06_S2_PREG,
            contenido: buildCodigoPreguntas(
              "javascript",
              `Tu jefe te pide saber el ID del ticket abierto MAS URGENTE para atender primero.

La lista de tickets esta en la variable "tickets" (ya viene escrita en el esqueleto). Cada ticket tiene:
  - id (number)
  - estado: "abierto" o "cerrado"
  - prioridad: "alta", "media" o "baja"
  - createdAt (string ISO, formato "YYYY-MM-DD"): la fecha en que se creo

Tu tarea:
  1. Filtra los tickets que esten "abierto" Y prioridad "alta".
  2. De esos, encuentra el que se creo PRIMERO (el createdAt mas antiguo, es decir, el menor alfabeticamente — funciona porque el formato YYYY-MM-DD se ordena bien como string).
  3. Si NO hay ninguno, imprime exactamente "ninguno".
  4. Si hay al menos uno, imprime el ID con console.log (un numero).

Pista — un camino posible:
  const urgentes = tickets.filter(t => t.estado === "abierto" && t.prioridad === "alta")
  if (urgentes.length === 0) {
    console.log("ninguno")
  } else {
    const masViejo = urgentes.reduce((mejor, t) => t.createdAt < mejor.createdAt ? t : mejor)
    console.log(masViejo.id)
  }

Salida exacta esperada: 7`,
              `const tickets = [
  { id: 1, estado: "abierto", prioridad: "media", createdAt: "2026-05-18" },
  { id: 2, estado: "cerrado", prioridad: "alta", createdAt: "2026-05-10" },
  { id: 3, estado: "abierto", prioridad: "baja", createdAt: "2026-05-20" },
  { id: 4, estado: "abierto", prioridad: "alta", createdAt: "2026-05-15" },
  { id: 5, estado: "cerrado", prioridad: "media", createdAt: "2026-05-12" },
  { id: 6, estado: "abierto", prioridad: "alta", createdAt: "2026-05-14" },
  { id: 7, estado: "abierto", prioridad: "alta", createdAt: "2026-05-11" },
  { id: 8, estado: "abierto", prioridad: "media", createdAt: "2026-05-09" },
]

// Escribe tu solucion aqui abajo.
// Recuerda: filter para los abiertos+alta, despues el de menor createdAt, despues console.log del id.
// Si no hay ninguno: console.log("ninguno")

`,
              "soporte-m06-s2-codigo-preguntas",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_TESTS,
            esEvaluable: false,
            idForzado: ID_SOP_M06_S2_TEST,
            contenido: buildCodigoTests(
              ID_SOP_M06_S2_PREG,
              `const tickets = [
  { id: 1, estado: "abierto", prioridad: "media", createdAt: "2026-05-18" },
  { id: 2, estado: "cerrado", prioridad: "alta", createdAt: "2026-05-10" },
  { id: 3, estado: "abierto", prioridad: "baja", createdAt: "2026-05-20" },
  { id: 4, estado: "abierto", prioridad: "alta", createdAt: "2026-05-15" },
  { id: 5, estado: "cerrado", prioridad: "media", createdAt: "2026-05-12" },
  { id: 6, estado: "abierto", prioridad: "alta", createdAt: "2026-05-14" },
  { id: 7, estado: "abierto", prioridad: "alta", createdAt: "2026-05-11" },
  { id: 8, estado: "abierto", prioridad: "media", createdAt: "2026-05-09" },
]

const urgentes = tickets.filter((t) => t.estado === "abierto" && t.prioridad === "alta")
if (urgentes.length === 0) {
  console.log("ninguno")
} else {
  const masViejo = urgentes.reduce((mejor, t) => (t.createdAt < mejor.createdAt ? t : mejor))
  console.log(masViejo.id)
}`,
              [
                {
                  id: "t1",
                  descripcion: "Imprime el id del ticket abierto+alta mas antiguo",
                  entrada: "",
                  salidaEsperada: "7\n",
                  visible: true,
                },
                {
                  id: "t2",
                  descripcion: "La salida es exactamente el numero 7 (sin espacios ni texto extra)",
                  entrada: "",
                  salidaEsperada: "7\n",
                  visible: true,
                },
                {
                  id: "t3",
                  descripcion: "Test oculto: misma lista, mismo resultado esperado",
                  entrada: "",
                  salidaEsperada: "7\n",
                  visible: false,
                },
              ],
              "soporte-m06-s2-codigo-tests",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Si pasaste el reto: <strong>acabas de escribir el tipo exacto de función que vive dentro de un <code>select</code> en cualquier app real con Tanstack Query</strong>. Lógica pura, separada de React, testeable. Es el patrón que vas a repetir mil veces en tu carrera: <em>el servidor te manda lo que tiene; tú lo transformas en lo que la UI necesita</em>.</p>
<p>Si te costó: filo, eso es lo normal. Vuelve al bloque del <code>select</code> de arriba, mira la pista, y vuelve a intentar. No se trata de que te salga a la primera — se trata de que te salga.</p>`,
              "soporte-m06-s2-post-reto",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 3 — useMutation (escribir datos)
      // ----------------------------------------------------------------------
      {
        titulo: "useMutation: crear, actualizar y borrar",
        skill: "React real con datos del servidor",
        temas:
          "useQuery lee, useMutation escribe. Diferencia clave (manual vs automático). mutate() en el onClick. onSuccess + invalidateQueries para refrescar el cache. Optimistic update mencionado como next level, sin exigirlo.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Hasta aquí solo LEÍSTE datos del servidor. Pero tu app también necesita <strong>escribir</strong>: crear un ticket, marcarlo como resuelto, borrar, editar el título. Para eso, Tanstack Query trae el primo hermano de <code>useQuery</code>: <strong><code>useMutation</code></strong>.</p>
<p>Misma idea, otro hook, dos diferencias importantes.</p>`,
              "soporte-m06-s3-intro",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Diferencias clave entre <code>useQuery</code> y <code>useMutation</code>:</strong></p>
<ul>
  <li><code>useQuery</code> se ejecuta <strong>solo</strong>, cuando el componente aparece. <code>useMutation</code> se ejecuta cuando <strong>TÚ le dices</strong>: típicamente en el <code>onClick</code> de un botón o en el <code>onSubmit</code> de un formulario.</li>
  <li><code>useQuery</code> te devuelve <code>data</code> directamente. <code>useMutation</code> te devuelve una <strong>función</strong> llamada <code>mutate</code> que tú disparas con los datos del formulario.</li>
</ul>
<p>El estado lo manejas igual: <code>isPending</code> mientras está corriendo, <code>isError</code> si falla, <code>isSuccess</code> si va bien.</p>`,
              "soporte-m06-s3-diferencias",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "tsx",
              `import { useMutation, useQueryClient } from "@tanstack/react-query"

async function crearTicket(nuevo) {
  const r = await fetch("/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nuevo),
  })
  if (!r.ok) throw new Error("No se pudo crear el ticket")
  return r.json()
}

export function BotonCrearTicket() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: crearTicket,
    onSuccess: () => {
      // "El cache de tickets ya no es confiable, vuelve a pedirlo"
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
    },
  })

  return (
    <button
      onClick={() => mutation.mutate({ titulo: "Internet caido", prioridad: "alta" })}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? "Creando..." : "Crear ticket"}
    </button>
  )
}`,
              "Tres detalles que merecen atención: (1) mutationFn recibe lo que tú le pasaste a mutate(). (2) onSuccess es donde refrescas el cache. (3) El botón se deshabilita mientras está creando — anti doble-click.",
              "soporte-m06-s3-codigo-mutation",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>La línea más importante de ese código es <code>queryClient.invalidateQueries({ queryKey: ["tickets"] })</code>.</p>
<p>Traducción humana: <strong>"oye Tanstack, el cache de tickets ya no es confiable, vuelve a pedirlo"</strong>. Tanstack detecta que cualquier <code>useQuery</code> con <code>queryKey: ["tickets"]</code> está mostrando datos obsoletos y los refresca <em>solo</em>.</p>
<p>Resultado en la UI: el usuario aprieta "Crear ticket", el botón se pone en "Creando...", el servidor responde, la lista de tickets de la otra parte de la pantalla se refresca SOLA con el ticket nuevo arriba. Sin que tú hayas tocado nada de eso a mano.</p>
<p>Esa magia es Tanstack Query haciendo su trabajo. Tú solo le dijiste "este dato ya no es confiable". Él se encarga.</p>`,
              "soporte-m06-s3-invalidacion",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>Sin tabú:</strong> "<em>optimistic update</em>" es el siguiente nivel. Es pintar el ticket nuevo en la lista <em>antes</em> de que el servidor confirme, y si falla, sacarlo. Hace que tu app se sienta <strong>instantánea</strong> — la sensación que tienen las apps caras tipo Linear o Notion.</p>
<p>Se hace con dos callbacks de useMutation (<code>onMutate</code> y <code>onError</code>) y <code>queryClient.setQueryData</code>. Está en la documentación oficial cuando lo necesites.</p>
<p>Para tu integrador del curso, <strong>no es obligatorio</strong>. Con <code>invalidateQueries</code> vas sobrado. Que existe optimistic update, ya lo sabes; cuando llegue el momento, lo aprendes en 20 minutos.</p>`,
              "soporte-m06-s3-tip-optimistic",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Microvictoria: <strong>ya sabes leer Y escribir datos del servidor con Tanstack Query</strong>. Eso es el 80% de lo que hace cualquier app real. Listado, detalle, crear, actualizar, borrar — todo es <code>useQuery</code> + <code>useMutation</code> + <code>invalidateQueries</code> en combinaciones distintas.</p>
<p>El 20% restante lo cubren las dos secciones que vienen: navegación entre páginas (Router) y formularios bien hechos. Y después, el reto guiado donde lo armas todo junto.</p>`,
              "soporte-m06-s3-microvictoria",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 4 — React Router + formularios controlados
      // ----------------------------------------------------------------------
      {
        titulo: "React Router + formularios controlados",
        skill: "React real con datos del servidor",
        temas:
          "Por qué las apps tienen páginas. Routing del lado del cliente vs recarga completa. BrowserRouter + Routes + Route + Link. useParams y useNavigate. Formularios controlados con useState + validación inline + navegación al éxito.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Hasta aquí tu app vive en una sola pantalla. Pero las apps reales tienen <strong>páginas</strong>: la lista de tickets es una página, el detalle de un ticket es otra, el formulario de crear es otra. Y la URL refleja dónde estás: <code>/tickets</code>, <code>/tickets/42</code>, <code>/tickets/nuevo</code>.</p>
<p>¿Por qué importa la URL? Porque permite:</p>
<ul>
  <li><strong>Compartir links</strong>: pegas <code>/tickets/42</code> en un chat y al abrirlo cae directo en ese ticket.</li>
  <li><strong>Refrescar sin perder dónde estabas</strong>: F5 te deja en la misma pantalla.</li>
  <li><strong>Volver con el botón "atrás"</strong> del navegador, como en cualquier sitio.</li>
</ul>`,
              "soporte-m06-s4-intro-router",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>En la web de los años 2000, ir a otra página <strong>recargaba todo</strong>: el HTML, el CSS, el JavaScript, todo de cero. Lento y feo.</p>
<p>En las apps React de hoy usamos <strong>routing del lado del cliente</strong>: la URL cambia, pero el navegador NO recarga la página entera. React simplemente renderiza un <em>componente distinto</em> según la URL actual. La transición es instantánea porque ya está todo cargado.</p>
<p>La librería que hace esto se llama <strong>React Router</strong>. Es la opción estándar — la usa el 90% de los proyectos React.</p>`,
              "soporte-m06-s4-client-routing",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "tsx",
              `// 1) Instalar:
//    pnpm add react-router-dom

// 2) Envolver la app en BrowserRouter (en main.jsx)
import { BrowserRouter } from "react-router-dom"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)`,
              "Igual que el QueryClientProvider, BrowserRouter es un wrapper que se pone UNA vez en toda la app. Adentro, todos los componentes pueden usar los hooks de Router.",
              "soporte-m06-s4-setup",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "tsx",
              `// src/App.jsx
import { Routes, Route, Link } from "react-router-dom"
import { ListaTickets } from "./ListaTickets"
import { DetalleTicket } from "./DetalleTicket"
import { NuevoTicket } from "./NuevoTicket"

export function App() {
  return (
    <div>
      <nav style={{ display: "flex", gap: 16, padding: 16, borderBottom: "1px solid #ddd" }}>
        <Link to="/tickets">Tickets</Link>
        <Link to="/tickets/nuevo">Crear ticket</Link>
      </nav>

      <main style={{ padding: 16 }}>
        <Routes>
          <Route path="/" element={<ListaTickets />} />
          <Route path="/tickets" element={<ListaTickets />} />
          <Route path="/tickets/nuevo" element={<NuevoTicket />} />
          <Route path="/tickets/:id" element={<DetalleTicket />} />
        </Routes>
      </main>
    </div>
  )
}`,
              "Tres piezas. (1) <Link to='/x'> reemplaza al <a href='/x'> de toda la vida — Link evita la recarga. (2) <Routes> es donde React Router decide qué pintar según la URL. (3) :id es un parámetro variable: matchea /tickets/42, /tickets/7, etc.",
              "soporte-m06-s4-routes",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "tsx",
              `// src/DetalleTicket.jsx
import { useParams, useNavigate, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

export function DetalleTicket() {
  const { id } = useParams()           // <- toma el :id de la URL
  const navigate = useNavigate()       // <- para navegar por codigo

  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ["tickets", id],
    queryFn: () => obtenerTicketPorId(id),
  })

  if (isLoading) return <p>Cargando...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <article>
      <h1>{ticket.titulo}</h1>
      <p>Estado: <strong>{ticket.estado}</strong></p>
      <p>Prioridad: {ticket.prioridad}</p>

      <button onClick={() => navigate("/tickets")}>Volver a la lista</button>
      <Link to="/tickets/nuevo">Crear otro</Link>
    </article>
  )
}`,
              "Dos hooks nuevos. useParams() te entrega lo que matcheó el :id de la ruta. useNavigate() te devuelve una función para navegar por código (típico: redirigir al éxito de un formulario). Y nota la queryKey: ['tickets', id] — un cache distinto por cada id.",
              "soporte-m06-s4-useparams-usenavigate",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Última pieza: <strong>formularios controlados</strong>.</p>
<p>"Controlado" significa que el valor del input vive en el <code>useState</code> del componente, no en el DOM. Cada vez que el usuario tipea, <code>onChange</code> actualiza el estado, React re-renderiza, y el input muestra el nuevo valor que viene del estado.</p>
<p>Suena enredado pero la idea es simple: <strong>la fuente de verdad del valor es tu estado, no el input</strong>. Eso te da control total: puedes resetear el form, validar al vuelo, mostrar errores específicos, deshabilitar el botón si algo falta. Es el patrón que vas a usar siempre.</p>`,
              "soporte-m06-s4-controlados-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "tsx",
              `// src/NuevoTicket.jsx
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

export function NuevoTicket() {
  const [titulo, setTitulo] = useState("")
  const [prioridad, setPrioridad] = useState("media")
  const [errores, setErrores] = useState({})

  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: crearTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
      navigate("/tickets")    // <- vuelve a la lista al exito
    },
  })

  function handleSubmit(e) {
    e.preventDefault()
    const nuevos = {}
    if (titulo.trim().length < 5) {
      nuevos.titulo = "El titulo necesita al menos 5 caracteres"
    }
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return
    mutation.mutate({ titulo: titulo.trim(), prioridad })
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Nuevo ticket</h1>

      <label style={{ display: "block", marginBottom: 12 }}>
        Titulo:
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          style={{ display: "block", marginTop: 4, padding: 8 }}
        />
        {errores.titulo && (
          <span style={{ color: "crimson", fontSize: 13 }}>{errores.titulo}</span>
        )}
      </label>

      <label style={{ display: "block", marginBottom: 12 }}>
        Prioridad:
        <select
          value={prioridad}
          onChange={(e) => setPrioridad(e.target.value)}
          style={{ display: "block", marginTop: 4, padding: 8 }}
        >
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>
      </label>

      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Creando..." : "Crear ticket"}
      </button>

      {mutation.isError && (
        <p style={{ color: "crimson" }}>Error: {mutation.error.message}</p>
      )}
    </form>
  )
}`,
              "Todo el patrón profesional en un solo lugar: useState por campo, validación antes de mandar, errores por campo + error global, botón deshabilitado mientras manda, navegación al éxito. Lo copias mil veces en tu carrera; ya lo tienes.",
              "soporte-m06-s4-form-completo",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>Cinco detalles</strong> que separan un formulario amateur de uno profesional, y que ya están en ese código:</p>
<ul>
  <li>El botón se <strong>deshabilita</strong> mientras manda. Anti doble-submit accidental.</li>
  <li>Error por campo, <strong>debajo del input</strong> donde el usuario está mirando.</li>
  <li>Error global de red, <strong>debajo del botón</strong>.</li>
  <li><strong>Validación antes de mandar</strong>: nunca confíes en que el usuario va a tipear bien.</li>
  <li><strong>Navegación al éxito</strong>: vuelves a la lista, no dejas al usuario mirando un formulario vacío preguntándose si funcionó.</li>
</ul>
<p>Cinco detalles. Tu jefe los nota aunque no sepa explicarlos. <em>"Es que se siente bien hecho"</em> — eso es lo que va a decir.</p>`,
              "soporte-m06-s4-tip-detalles",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Microvictoria: ya navegas entre páginas sin recargar, ya capturas datos del usuario, ya validas, ya guardas en el servidor con feedback de loading y error. Si te detienes acá, <strong>ya sabes hacer una app real</strong>.</p>
<p>La sección 5 es para juntarlo todo en una mini app de tickets que va a quedar viva en tu computador. Vamos.</p>`,
              "soporte-m06-s4-microvictoria",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 5 — Reto guiado integrador + quiz + cierre
      // ----------------------------------------------------------------------
      {
        titulo: "Reto guiado: Mini Centro de Tickets",
        skill: "React real con datos del servidor",
        temas:
          "App de tickets completa con mock interno (setTimeout + Promise.resolve): listado, detalle, crear, marcar como resuelto. Quiz final del módulo. Cierre con puente narrativo a M07 (IA como copiloto).",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Llegamos al reto del módulo: <strong>Mini Centro de Tickets</strong>. Una app que lista tickets, deja ver el detalle de cada uno, permite crear nuevos y marcar como resueltos.</p>
<p><strong>Sin backend real</strong>: vamos a simular la API con <code>setTimeout</code> y <code>Promise.resolve</code> para que veas el comportamiento real — con loading, con delays, sin internet de por medio. Cuando llegue el integrador del curso (post M08), apuntas a una API de verdad cambiando cinco líneas.</p>
<p>Sin mitos sobre los mocks: <strong>esto es exactamente cómo se prueban componentes en proyectos reales</strong>. La diferencia con un backend de verdad es que el mock vive en una variable de JavaScript en lugar de en una base de datos. Para tu navegador, la experiencia es la misma.</p>`,
              "soporte-m06-s5-intro",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              "<p>Empezamos. En la carpeta del proyecto Vite del módulo 5, instala las dos dependencias nuevas:</p>",
              "soporte-m06-s5-instalar-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "bash",
              "pnpm add @tanstack/react-query react-router-dom",
              "Dos paquetes. Pesan poco. Cambian todo.",
              "soporte-m06-s5-install",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Ahora creamos el archivo del mock. Es JavaScript puro: una variable en memoria + funciones async que devuelven promesas con un <code>setTimeout</code>. Así se siente como si los datos estuvieran viajando por internet, sin necesitar un servidor de verdad.</p>
<p><strong>Crea el archivo <code>src/mockApi.js</code></strong> y pega exactamente esto:</p>`,
              "soporte-m06-s5-mockapi-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "javascript",
              `// src/mockApi.js
// "Simulamos" un backend: una variable en memoria + funciones async que devuelven
// promesas con un setTimeout para emular la latencia de red.
//
// @typedef define un tipo con JSDoc. No es TypeScript, pero VS Code lo respeta y
// te autocompleta. Asi recuperamos parte del "cinturon" de TS sin compilador.

/**
 * @typedef {Object} Ticket
 * @property {number} id
 * @property {string} titulo
 * @property {"abierto" | "resuelto"} estado
 * @property {"alta" | "media" | "baja"} prioridad
 * @property {string} createdAt  fecha ISO "YYYY-MM-DD"
 */

/** @type {Ticket[]} */
let tickets = [
  { id: 1, titulo: "Internet caido en sala 3", estado: "abierto", prioridad: "alta",  createdAt: "2026-05-20" },
  { id: 2, titulo: "Impresora no responde",     estado: "resuelto", prioridad: "media", createdAt: "2026-05-18" },
  { id: 3, titulo: "Cambiar toner",             estado: "abierto", prioridad: "baja",  createdAt: "2026-05-22" },
  { id: 4, titulo: "VPN se desconecta",         estado: "abierto", prioridad: "alta",  createdAt: "2026-05-21" },
]

let proximoId = 5

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function obtenerTickets() {
  await delay(400)
  return [...tickets]
}

export async function obtenerTicketPorId(id) {
  await delay(300)
  const t = tickets.find((x) => x.id === Number(id))
  if (!t) throw new Error(\`Ticket \${id} no existe\`)
  return { ...t }
}

export async function crearTicket(nuevo) {
  await delay(500)
  const creado = {
    id: proximoId++,
    titulo: nuevo.titulo,
    estado: "abierto",
    prioridad: nuevo.prioridad,
    createdAt: new Date().toISOString().slice(0, 10),
  }
  tickets = [creado, ...tickets]
  return creado
}

export async function marcarResuelto(id) {
  await delay(300)
  tickets = tickets.map((t) =>
    t.id === Number(id) ? { ...t, estado: "resuelto" } : t,
  )
  const actualizado = tickets.find((t) => t.id === Number(id))
  if (!actualizado) throw new Error(\`Ticket \${id} no existe\`)
  return actualizado
}`,
              "Cuatro funciones: obtener todos, obtener uno, crear, marcar resuelto. Tu UI no va a notar la diferencia con un backend real — los componentes hablan con estas funciones igual que hablarían con fetch.",
              "soporte-m06-s5-mockapi-codigo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              "<p>Ahora <strong>reemplaza el contenido completo de <code>src/main.jsx</code></strong> (o <code>main.tsx</code>) por esto:</p>",
              "soporte-m06-s5-main-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "tsx",
              `// src/main.jsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter } from "react-router-dom"
import { App } from "./App"

const queryClient = new QueryClient()

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)`,
              "Dos providers anidados. Orden recomendado: QueryClientProvider afuera, BrowserRouter adentro. Funciona al revés también, pero este orden es el más común en proyectos reales.",
              "soporte-m06-s5-main-codigo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              "<p>Y finalmente, <strong>reemplaza el contenido completo de <code>src/App.jsx</code></strong>. Este es el archivo grande: junta listado, detalle, crear, marcar resuelto, navegación y formulario. Léelo despacio, no lo copies sin mirar — es <em>literalmente</em> el código que define tu primera app real.</p>",
              "soporte-m06-s5-app-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "tsx",
              `// src/App.jsx
import { useState } from "react"
import { Routes, Route, Link, useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  obtenerTickets,
  obtenerTicketPorId,
  crearTicket,
  marcarResuelto,
} from "./mockApi"

// =========================================================================
// App: solo navegacion + ruteo
// =========================================================================
export function App() {
  return (
    <div style={{ fontFamily: "system-ui", maxWidth: 720, margin: "0 auto" }}>
      <nav
        style={{
          display: "flex",
          gap: 16,
          padding: 16,
          borderBottom: "1px solid #ddd",
        }}
      >
        <Link to="/tickets"><strong>Tickets</strong></Link>
        <Link to="/tickets/nuevo">+ Crear</Link>
      </nav>

      <main style={{ padding: 16 }}>
        <Routes>
          <Route path="/" element={<ListaTickets />} />
          <Route path="/tickets" element={<ListaTickets />} />
          <Route path="/tickets/nuevo" element={<NuevoTicket />} />
          <Route path="/tickets/:id" element={<DetalleTicket />} />
        </Routes>
      </main>
    </div>
  )
}

// =========================================================================
// ListaTickets
// =========================================================================
function ListaTickets() {
  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ["tickets"],
    queryFn: obtenerTickets,
  })

  if (isLoading) return <p>Cargando tickets...</p>
  if (error) return <p style={{ color: "crimson" }}>Error: {error.message}</p>

  return (
    <section>
      <h1>Tickets</h1>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {tickets.map((t) => (
          <li
            key={t.id}
            style={{
              border: "1px solid #eee",
              padding: 12,
              marginBottom: 8,
              borderRadius: 8,
            }}
          >
            <Link to={\`/tickets/\${t.id}\`} style={{ textDecoration: "none" }}>
              <strong>#{t.id}</strong> · {t.titulo}
            </Link>
            <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
              {t.estado} · prioridad {t.prioridad} · creado {t.createdAt}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

// =========================================================================
// DetalleTicket
// =========================================================================
function DetalleTicket() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ["tickets", id],
    queryFn: () => obtenerTicketPorId(id),
  })

  const mutation = useMutation({
    mutationFn: () => marcarResuelto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
      queryClient.invalidateQueries({ queryKey: ["tickets", id] })
    },
  })

  if (isLoading) return <p>Cargando ticket...</p>
  if (error) return <p style={{ color: "crimson" }}>Error: {error.message}</p>

  return (
    <article>
      <h1>{ticket.titulo}</h1>
      <p>
        Estado: <strong>{ticket.estado}</strong> · prioridad {ticket.prioridad}
      </p>
      <p style={{ color: "#666", fontSize: 13 }}>Creado: {ticket.createdAt}</p>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={() => navigate("/tickets")}>Volver</button>
        {ticket.estado === "abierto" && (
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Marcando..." : "Marcar como resuelto"}
          </button>
        )}
      </div>

      {mutation.isError && (
        <p style={{ color: "crimson" }}>Error: {mutation.error.message}</p>
      )}
    </article>
  )
}

// =========================================================================
// NuevoTicket
// =========================================================================
function NuevoTicket() {
  const [titulo, setTitulo] = useState("")
  const [prioridad, setPrioridad] = useState("media")
  const [errores, setErrores] = useState({})

  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: crearTicket,
    onSuccess: (creado) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
      navigate(\`/tickets/\${creado.id}\`)
    },
  })

  function handleSubmit(e) {
    e.preventDefault()
    const nuevos = {}
    if (titulo.trim().length < 5) {
      nuevos.titulo = "El titulo necesita al menos 5 caracteres"
    }
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return
    mutation.mutate({ titulo: titulo.trim(), prioridad })
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Nuevo ticket</h1>

      <label style={{ display: "block", marginBottom: 12 }}>
        Titulo:
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          style={{ display: "block", marginTop: 4, padding: 8, width: "100%" }}
        />
        {errores.titulo && (
          <span style={{ color: "crimson", fontSize: 13 }}>{errores.titulo}</span>
        )}
      </label>

      <label style={{ display: "block", marginBottom: 12 }}>
        Prioridad:
        <select
          value={prioridad}
          onChange={(e) => setPrioridad(e.target.value)}
          style={{ display: "block", marginTop: 4, padding: 8 }}
        >
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>
      </label>

      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Creando..." : "Crear ticket"}
      </button>

      {mutation.isError && (
        <p style={{ color: "crimson" }}>Error: {mutation.error.message}</p>
      )}
    </form>
  )
}`,
              "Cuatro componentes en un solo archivo (luego los separas). App orquesta las rutas. ListaTickets usa useQuery. DetalleTicket usa useQuery + useMutation (con dos invalidaciones: la lista y el detalle). NuevoTicket es el formulario controlado completo. Pega, guarda, corre 'pnpm dev', abre http://localhost:5173 y disfruta.",
              "soporte-m06-s5-app-codigo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Tres experimentos para entender qué está pasando bajo el capó (todos te enseñan algo que vas a ver el lunes en producción):</p>
<ul>
  <li><strong>Borra la línea <code>queryClient.invalidateQueries</code></strong> de <code>onSuccess</code> en NuevoTicket. Crea un ticket. Notas que vuelves a la lista pero el nuevo NO aparece. Vuelves a hacer F5 y aparece. Eso es no invalidar el cache: Tanstack sigue mostrando la versión vieja porque cree que está al día.</li>
  <li><strong>Cambia el <code>delay(400)</code> de <code>obtenerTickets</code> a <code>delay(3000)</code></strong>. Vas a ver el "Cargando tickets..." durante 3 segundos largos cada vez que entras. Así se ve un servidor lento en la vida real, y por eso es importante mostrar feedback de loading.</li>
  <li><strong>Haz que <code>crearTicket</code> falle</strong> agregando al inicio: <code>if (Math.random() &lt; 0.5) throw new Error("Error simulado")</code>. Crea un par de tickets. Vas a ver el mensaje rojo de error a veces. Pruebas que tu manejo de errores funciona sin esperar a que el servidor real se caiga.</li>
</ul>
<p>Estos experimentos no son decoración. Son las preguntas reales que vas a hacerte cuando un compañero te diga "la lista no se actualiza" o "la app se siente lenta". Ahora sabes dónde mirar.</p>`,
              "soporte-m06-s5-experimentos",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "exito",
              `<p><strong>Mini Centro de Tickets corriendo en tu computador.</strong></p>
<p>Lista, detalle, crear, marcar resuelto. Loading states, manejo de errores, navegación entre páginas con URL real, formulario controlado con validación. Cache automático. Invalidación al modificar.</p>
<p>Esto es lo que pediste cuando dijiste "quiero ser dev frontend". <strong>Te lo firmo</strong>: si entras a una entrevista interna mañana, esto ya es defendible. No es el integrador final del curso — falta IA, calidad y deploy — pero ya tienes <em>app real corriendo</em>. Que no es poco.</p>`,
              "soporte-m06-s5-microvictoria-final",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Antes del cierre, el quiz del módulo. Cinco preguntas para sellar los conceptos clave: cuándo NO usar useEffect, qué hace invalidateQueries, diferencia useQuery vs useMutation, cómo se navega con React Router y cómo se accede a los parámetros de la URL.</p>
<p>Si pasaste el reto del select y la mini app está corriendo, esto es un trámite. Vamos.</p>`,
              "soporte-m06-s5-intro-quiz",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "React real con datos del servidor",
            contenido: buildQuiz(
              [
                {
                  id: "m06-q1",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>¿Cuál es la regla de oro de <code>useEffect</code> para pedir datos del servidor?</p>",
                  explicacion:
                    "useEffect es de uso general (sincronizar con sistemas externos). Para pedir datos del servidor existe una herramienta específica: Tanstack Query. Te ahorra cache, loading, error, dedup y cleanup automático. useEffect manual es lo que vas a encontrar en proyectos viejos, no lo que vas a escribir tú.",
                  opciones: [
                    {
                      id: "a",
                      texto:
                        "Usarlo siempre con array vacío <code>[]</code> para que solo corra una vez.",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Casi nunca usarlo para eso: usar Tanstack Query (<code>useQuery</code>), que maneja cache, loading, error y cleanup automáticamente.",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto:
                        "Combinarlo siempre con <code>useState</code> para guardar los datos en una variable global.",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto:
                        "Llamar <code>fetch</code> directamente en el cuerpo del componente, sin <code>useEffect</code>.",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m06-q2",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>Acabas de crear un ticket nuevo con <code>useMutation</code>. ¿Qué hace <code>queryClient.invalidateQueries({ queryKey: ['tickets'] })</code> dentro del <code>onSuccess</code>?</p>",
                  explicacion:
                    "Invalidar = marcar el cache como obsoleto. Tanstack detecta que cualquier useQuery con esa queryKey está mostrando datos viejos y los vuelve a pedir al servidor automáticamente. Por eso, después de crear, la lista se refresca sola sin que tú toques nada.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Borra todos los tickets de la base de datos.",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Marca el cache de tickets como obsoleto y hace que Tanstack vuelva a pedirlos al servidor automáticamente.",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Recarga la página entera del navegador.",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "Lanza una excepción si el cache no existe.",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m06-q3",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>¿Cuál es la diferencia principal entre <code>useQuery</code> y <code>useMutation</code>?</p>",
                  explicacion:
                    "useQuery se ejecuta automáticamente cuando el componente aparece (lectura). useMutation te devuelve una función mutate() que TÚ disparas cuando hace falta — típicamente en el onClick de un botón o el onSubmit de un formulario (escritura).",
                  opciones: [
                    {
                      id: "a",
                      texto: "Son lo mismo, son alias el uno del otro.",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "<code>useQuery</code> sirve para POST, <code>useMutation</code> para GET.",
                      esCorrecta: false,
                    },
                    {
                      id: "c",
                      texto:
                        "<code>useQuery</code> se ejecuta solo al montar el componente (leer datos). <code>useMutation</code> te entrega una función <code>mutate()</code> que tú disparas manualmente (escribir datos).",
                      esCorrecta: true,
                    },
                    {
                      id: "d",
                      texto:
                        "<code>useMutation</code> es de Redux, <code>useQuery</code> es de Tanstack Query.",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m06-q4",
                  tipo: "VERDADERO_FALSO",
                  enunciado:
                    '<p>Cuando usas <code>&lt;Link to="/tickets/42"&gt;</code> de React Router, el navegador recarga la página entera igual que con un <code>&lt;a href="/tickets/42"&gt;</code> tradicional.</p>',
                  explicacion:
                    "Falso. La gracia de React Router es justamente esa: cambia la URL pero NO recarga. El componente se actualiza, el resto de la app sigue montado. Es lo que hace que las apps SPA se sientan instantáneas.",
                  correcta: false,
                },
                {
                  id: "m06-q5",
                  tipo: "RESPUESTA_CORTA",
                  enunciado:
                    "<p>¿Cómo se llama el hook de React Router que te entrega los parámetros variables de la URL (por ejemplo el <code>id</code> en la ruta <code>/tickets/:id</code>)?</p>",
                  explicacion:
                    "useParams() te devuelve un objeto con los parámetros matcheados. Si tu ruta es /tickets/:id y la URL actual es /tickets/42, entonces useParams() devuelve { id: '42' }.",
                  respuestasAceptadas: ["useParams", "use params", "useParams()"],
                  normalizacion: {
                    trim: true,
                    ignorarMayusculas: true,
                    ignorarAcentos: true,
                    ignorarEspaciosDobles: true,
                  },
                },
              ],
              "soporte-m06-s5-quiz",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Si llegaste hasta acá con la app de tickets corriendo, el reto autocorregido pasado, el quiz aprobado y al menos un experimento probado: <strong>oficialmente sabes hacer apps reales con React</strong>. Loading states, manejo de errores, cache, navegación entre páginas, formularios bien hechos, escritura al servidor. Eso es lo que se le pide a un dev frontend en su primer mes en cualquier proyecto serio.</p>
<hr/>
<p><strong>Cierre del módulo.</strong></p>
<p>Lo que llevas:</p>
<ul>
  <li>Por qué <code>useEffect</code> casi nunca es la respuesta para pedir datos — y dónde sí lo vas a usar.</li>
  <li><strong>Tanstack Query</strong>: <code>QueryClientProvider</code>, <code>useQuery</code> con <code>queryKey + queryFn</code>, <code>data/isLoading/error</code> en una línea.</li>
  <li>La opción <code>select</code> para derivar datos sin pedir dos veces.</li>
  <li><strong><code>useMutation</code></strong> para crear, actualizar y borrar — con <code>invalidateQueries</code> para refrescar el cache automáticamente.</li>
  <li><strong>React Router</strong>: <code>BrowserRouter</code>, <code>Routes</code>, <code>Route</code>, <code>Link</code>, <code>useParams</code>, <code>useNavigate</code>.</li>
  <li><strong>Formularios controlados</strong> con validación inline, errores por campo, error global y navegación al éxito.</li>
  <li>Una <strong>app de tickets viva</strong> en tu computador.</li>
</ul>
<p>En el <strong>Módulo 07</strong> entra la herramienta que va a multiplicar tu velocidad por tres durante el resto de tu carrera: <strong>la IA como copiloto</strong>. No para reemplazar tu pensamiento — para acelerar lo que ya entiendes. Vas a aprender qué hace que un prompt funcione, cuándo NO confiar en lo que la IA te escribe (alucinaciones, código viejo, frameworks confundidos), y cómo usarla para entender código ajeno cuando llegues a un proyecto nuevo el lunes.</p>
<p>Sin tabú: la IA <strong>no te va a quitar la pega</strong>. Lo que sí, <em>la pega te la quitan los devs que aprenden a usarla bien antes que tú</em>. Por eso este módulo tiene su sección propia: porque saberlo es ventaja competitiva real.</p>
<p><em>Todavía no</em> eres un dev senior. Pero ya hiciste el salto más grande del curso: pasaste de "página tonta" a "aplicación real". El resto es pulir y entregar.</p>
<p><strong>Nos vemos al otro lado.</strong></p>`,
              "soporte-m06-s5-cierre",
            ),
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // MODULO 07 — IA COMO COPILOTO DEL DEV   (COMPLETO)
  // ==========================================================================
  {
    idx: 27,
    titulo: "Módulo 07 — IA como copiloto del dev",
    descripcion:
      "El módulo que te deja en buena posición para los próximos cinco años. Bajamos los dos extremos (la paranoia y el culto), aprendes la anatomía de un buen prompt, conoces las siete técnicas que más mueven la aguja, practicas pair programming real con la IA y aprendes cuándo NO confiar en lo que escribe. Mucho contenido, dos quizzes (uno intermedio, uno final) y un ejercicio de bitácora para tu carpeta de logros.",
    secciones: [
      // ----------------------------------------------------------------------
      // Seccion 1 — Sin panico, sin culto: poner la IA en su lugar
      // ----------------------------------------------------------------------
      {
        titulo: "Sin pánico, sin culto: poner la IA en su lugar",
        skill: "IA como copiloto del dev",
        temas:
          "Bajamos los dos extremos: la paranoia y el culto. Qué SÍ hace bien la IA, qué NO hace bien, cómo funciona en una frase. Los siete mitos del día a día respondidos sin filtro.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>En el cierre del módulo 6 te dejé esta frase: <strong>"la IA no te va a quitar la pega; la pega te la van a quitar los devs que aprenden a usarla bien antes que tú"</strong>. Hoy desarmamos esa idea con calma.</p>
<p>Antes de meterte a aprender técnicas de prompting, hay que <strong>bajar los dos extremos</strong> que andan dando vueltas en LinkedIn y en los grupos de WhatsApp:</p>
<ul>
  <li>El que dice "<em>en seis meses no quedan devs</em>". Falso. Lo decían también con StackOverflow en 2008.</li>
  <li>El que dice "<em>la IA puede hacer cualquier cosa que yo haga</em>". También falso. Vas a ver hoy las cosas concretas en las que se cae.</li>
</ul>
<p>Sin tabú. Mitos por su nombre. Aquí no hay preguntas tontas.</p>`,
              "soporte-m07-s1-intro",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Qué SÍ hace bien la IA (úsalo todos los días):</strong></p>
<ul>
  <li><strong>Boilerplate</strong>: el código repetitivo que todos escribimos cien veces (componente nuevo, función de validación clásica, configuración de algo conocido).</li>
  <li><strong>Traducir entre lenguajes</strong>: tienes un snippet en Python y lo quieres en JavaScript. Diez segundos.</li>
  <li><strong>Explicar código ajeno</strong>: llegas a un proyecto nuevo, pegas un archivo enredado, le pides "explícame qué hace esto". Ahorra horas.</li>
  <li><strong>Detectar el bug obvio</strong>: pegas tu código + el error, te dice "te falta el await en la línea 12". Acierta el 80% de las veces.</li>
  <li><strong>Refactorizar lo feo</strong>: una función de 50 líneas en algo limpio.</li>
  <li><strong>Documentar</strong>: te escribe los comentarios o el README a partir del código.</li>
  <li><strong>Generar tests básicos</strong>: le pegas la función, te tira los primeros 5 tests.</li>
</ul>
<p>Si haces estas siete cosas sin IA cuando podrías estar haciéndolas con IA, <strong>estás dejando productividad en la mesa</strong>. Punto.</p>`,
              "soporte-m07-s1-que-si-hace",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Qué NO hace bien la IA (y cuidado con confiar):</strong></p>
<ul>
  <li><strong>Entender tu proyecto entero</strong>: no sabe en qué carpeta vive qué. Tú le pegas el contexto, ella no lo intuye.</li>
  <li><strong>Decisiones de arquitectura</strong>: "¿uso Tanstack Query o Redux?" — te va a tirar tres párrafos genéricos. La decisión real depende de variables que solo tú conoces.</li>
  <li><strong>Código de librerías nuevas o recientes</strong>: si la librería salió hace 3 meses, probablemente la IA no la conoce o se inventa la API.</li>
  <li><strong>Saber si su respuesta está bien</strong>: la IA <strong>NO</strong> te avisa cuando se está inventando algo. Suena igual de segura cuando acierta y cuando alucina.</li>
  <li><strong>Algoritmos complejos con casos límite</strong>: el código corre "para los ejemplos típicos", se rompe con el caso raro.</li>
  <li><strong>Pensar críticamente sobre tu negocio</strong>: no sabe qué es importante para ti, para tu equipo o para tu empresa.</li>
</ul>
<p>Conclusión simple: <strong>la IA es un copiloto, no un piloto</strong>. El piloto sigues siendo tú. Si te duermes en el volante, la IA no te despierta.</p>`,
              "soporte-m07-s1-que-no-hace",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Cómo funciona la IA en una frase honesta:</strong></p>
<p>Dado un texto de entrada, <strong>predice cuál es la siguiente palabra más probable</strong>, una a la vez, hasta completar la respuesta. Es un autocomplete muy bueno, entrenado con millones de páginas de internet.</p>
<p>Eso significa dos cosas que vas a recordar el resto de tu carrera:</p>
<ul>
  <li><strong>No "razona"</strong> en el sentido humano. Predice patrones. Cuando le dices "piensa paso a paso", lo que haces es forzar el patrón "respuesta paso a paso" — y resulta que ese patrón <em>casualmente</em> produce mejores resultados. Magia matemática, no neuronal.</li>
  <li><strong>Cuando inventa, lo hace con la misma confianza que cuando acierta</strong>. Porque no sabe la diferencia. Para la IA, ambas cosas son "la siguiente palabra más probable". Por eso las alucinaciones son tan peligrosas — suenan igual de bien.</li>
</ul>
<p>Esto NO es opinión técnica. Es cómo funciona. Saberlo te ordena la cabeza cuando la uses.</p>`,
              "soporte-m07-s1-como-funciona",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Los 7 mitos que vas a escuchar esta semana</strong> (y la respuesta directa para cada uno):</p>
<ol>
  <li><strong>"Me va a quitar la pega"</strong> → <em>Falso</em>. La van a quitar a quien NO la use. Saberla usar es el seguro.</li>
  <li><strong>"La IA piensa / entiende / razona"</strong> → <em>Falso</em>. Predice tokens. Lo demás es marketing.</li>
  <li><strong>"Si la respuesta suena segura, está bien"</strong> → <em>Peligrosísimo</em>. Las alucinaciones suenan EXACTAMENTE igual de seguras que las verdades. Ese es justo el problema.</li>
  <li><strong>"Pegarle todo el código del proyecto le ayuda"</strong> → <em>Mito</em>. Menos contexto bien elegido es mejor que más contexto desordenado. Cuanto más le pegas, más se confunde.</li>
  <li><strong>"La IA sabe de mi repo"</strong> → <em>No</em>. Solo sabe lo que tú le pegas en la conversación. En la próxima sesión, parte de cero. Tu repo es privado para ella.</li>
  <li><strong>"Si me sale a la primera, soy mejor dev"</strong> → <em>Falso</em>. Iterar tres veces es LO NORMAL y lo correcto. El primer output rara vez es el bueno.</li>
  <li><strong>"Aceptar las sugerencias de Copilot sin leerlas es eficiente"</strong> → <em>Bug latente garantizado</em>. Vas a tardar más arreglando lo que aceptaste sin mirar que lo que ahorraste escribiendo.</li>
</ol>
<p>Si te encuentras a alguien diciendo cualquiera de estas siete, ya sabes responder. Sin pelear, sin convencer — solo saber.</p>`,
              "soporte-m07-s1-mitos",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>La regla mental que te va a salvar mil veces:</strong></p>
<p>Trata a la IA como tratarías a un <strong>practicante muy rápido pero sin contexto</strong>. Sabe mucho de teoría general. No sabe nada de tu proyecto. Trabaja a la velocidad del rayo, pero hay que revisarle todo. Pregunta cosas obvias a veces. Y si te quedas dormido revisando, te pasa basura sin avisar.</p>
<p>Esa imagen mental te ahorra el 80% de los errores que vas a cometer con la IA en tu primer año.</p>`,
              "soporte-m07-s1-tip-practicante",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Microvictoria de la sección: <strong>tienes el chip puesto en su lugar</strong>. Ni paranoia ni culto. Sabes qué hace bien, qué hace mal, cómo funciona por debajo y los siete mitos típicos del entorno.</p>
<p>Eso solo ya te diferencia del 70% de gente que está usando IA hoy. Ahora vamos a la parte técnica: <strong>cómo se le pide bien</strong>. <em>Todavía no</em> has escrito tu primer prompt serio del curso. En la próxima sección lo haces.</p>`,
              "soporte-m07-s1-microvictoria",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 2 — Anatomia de un buen prompt
      // ----------------------------------------------------------------------
      {
        titulo: "Anatomía de un buen prompt",
        skill: "IA como copiloto del dev",
        temas:
          "Las 4 partes universales: contexto, tarea, restricciones, formato de salida. El test del antes/después: un prompt vago y otro completo, lado a lado, para que veas la diferencia con tus propios ojos.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>La mayoría de los prompts que la gente escribe son <strong>basura</strong>. No te lo tomes personal — los míos también lo fueron al inicio. La diferencia entre un prompt que ahorra una hora y uno que te hace perder tres está en cuatro partes que vas a aprender a poner siempre.</p>
<p>Las <strong>4 partes universales</strong> de un buen prompt:</p>
<ol>
  <li><strong>Contexto</strong>: qué proyecto, qué stack, qué intentas resolver. Sin esto, la IA te da una respuesta genérica de tutorial.</li>
  <li><strong>Tarea</strong>: qué quieres que haga, en una sola frase clara.</li>
  <li><strong>Restricciones</strong>: lo que SÍ debe respetar (librerías, estilo, longitud) y lo que NO debe hacer.</li>
  <li><strong>Formato de salida</strong>: cómo quieres recibir la respuesta. Código solo, JSON, paso a paso, etc.</li>
</ol>
<p>Vamos a ver la diferencia con tus propios ojos:</p>`,
              "soporte-m07-s2-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "markdown",
              `# Prompt MALO (lo que escribe casi todo el mundo)

hazme un componente que muestre una lista de tickets`,
              "Lee eso y dime qué va a salir. Te lo adelanto: un componente React con MUI o Bootstrap o tres librerías que no usas, datos hardcoded de un blog, sin tipos, sin manejo de loading y con un useEffect que ya sabes que está mal. Y todo eso porque no le dijiste nada.",
              "soporte-m07-s2-prompt-malo",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "markdown",
              `# Prompt BUENO (con las 4 partes)

## Contexto
Estoy trabajando en una app de soporte en React 18 + Vite + Tanstack Query.
Ya tengo una funcion "obtenerTickets()" que devuelve una promesa con un array
de tickets. Cada ticket tiene: id (number), titulo (string), estado
("abierto" | "resuelto") y prioridad ("alta" | "media" | "baja").

## Tarea
Escribime un componente "ListaTickets" que muestre la lista en pantalla.

## Restricciones
- Usar useQuery con queryKey ["tickets"].
- Manejar estados de loading y error explicitamente.
- Sin librerias de UI externas (nada de MUI, Bootstrap, ni Tailwind).
- Estilos inline simples, maximo 100 lineas total.
- JavaScript (no TypeScript) en este caso.

## Formato de salida
Solo el archivo .jsx completo, sin explicaciones ni texto alrededor.
Si necesitas aclarar algo, hazlo como comentario dentro del codigo.`,
              "Lee uno y otro. ¿Notas la diferencia? El segundo prompt es 4 veces más largo de escribir, pero te ahorra 30 minutos de ida y vuelta. La inversión vale.",
              "soporte-m07-s2-prompt-bueno",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Las 4 partes en detalle, una por una:</p>
<ul>
  <li><strong>Contexto</strong>: dile el stack, las decisiones ya tomadas y los datos con los que está trabajando. La IA NO sabe nada de tu proyecto — todo lo que necesita para no inventarse cosas, se lo pegas tú. Ahorra "asunciones" diciendo qué versiones usas: React 18, Node 22, etc.</li>
  <li><strong>Tarea</strong>: una sola frase, con un verbo claro. "Escríbeme", "explícame", "refactoriza", "encuentra el bug". Si tienes dos tareas, son <strong>dos prompts</strong>, no uno.</li>
  <li><strong>Restricciones</strong>: aquí van las prohibiciones explícitas. <em>"Sin librerías externas"</em>, <em>"máximo 100 líneas"</em>, <em>"sin comentarios"</em>, <em>"usa el patrón X que ya tengo en el proyecto"</em>. Cada restricción que NO pones, la IA decide por ti — y casi siempre decide mal.</li>
  <li><strong>Formato de salida</strong>: lo más importante para no perder tiempo copiando. <em>"Solo el código"</em>, <em>"responde con JSON"</em>, <em>"primero el archivo, después la explicación"</em>. Si vas a pegar el output en algún lado, dile cómo lo quieres.</li>
</ul>`,
              "soporte-m07-s2-cuatro-partes-detalle",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>El test del antes/después</strong>: cada vez que escribas un prompt, antes de mandarlo, hazte mentalmente estas cuatro preguntas:</p>
<ol>
  <li>¿Le di <strong>contexto</strong> suficiente para que no se invente cosas?</li>
  <li>¿La <strong>tarea</strong> está en una sola frase clara con un verbo?</li>
  <li>¿Le puse <strong>restricciones</strong> (qué SÍ y qué NO)?</li>
  <li>¿Le dije cómo quiero <strong>el formato de salida</strong>?</li>
</ol>
<p>Si las cuatro tienen "sí" — manda. Si alguna tiene "no", reescribe ese pedazo. <strong>30 segundos de revisión te ahorran 20 minutos de ida y vuelta</strong>.</p>`,
              "soporte-m07-s2-test-mental",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "exito",
              `<p>Microvictoria seria: <strong>ya tienes la base universal del prompting</strong>. Las 4 partes funcionan con cualquier IA (Claude, ChatGPT, Copilot Chat, Gemini), para cualquier tarea (código, texto, análisis), en cualquier idioma. Es la plantilla mental que vas a usar todos los días.</p>
<p>El resto del módulo son <strong>técnicas que se montan encima</strong> de estas 4 partes. La sección 3 entra con 7 técnicas que te van a multiplicar la calidad de los outputs sin escribir más.</p>`,
              "soporte-m07-s2-tip-microvictoria",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 3 — Tecnicas de prompting (caja de herramientas) + MINI-QUIZ
      // ----------------------------------------------------------------------
      {
        titulo: "Técnicas de prompting: la caja de herramientas",
        skill: "IA como copiloto del dev",
        temas:
          "Siete técnicas con ejemplo concreto cada una: Zero-shot, Few-shot, Chain-of-Thought, Role prompting, Output format, Negative prompting, Decomposition. Cada técnica viene con su 'cuándo conviene' y un mini-quiz evaluable al cierre para sellar el conocimiento.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Ya tienes la base universal (las 4 partes). Ahora viene la caja de herramientas: <strong>7 técnicas específicas</strong> que se montan encima del prompt base y mejoran dramáticamente la calidad del output. Cada una resuelve un problema concreto.</p>
<p>No tienes que memorizarlas. Tienes que <strong>saber que existen</strong> y reconocer cuándo conviene cada una. La sección termina con un mini-quiz de 3 preguntas para sellar lo aprendido — ahí evalúas tu capacidad de "elegir la técnica adecuada" para una situación dada.</p>
<p>Sin tabú: estas técnicas no son académicas ni teóricas. <strong>Son las que mueven la aguja en el día a día real de un dev</strong>. Las saqué de lo que vas a usar la próxima semana, no de papers.</p>`,
              "soporte-m07-s3-intro",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Técnica 1 — Zero-shot.</strong></p>
<p>"Zero-shot" suena complicado pero es <strong>el prompt más simple posible</strong>: solo describes la tarea, sin darle ejemplos. Es lo que haces el 90% del tiempo cuando la tarea es bien conocida y bien definida.</p>
<p><strong>Cuándo conviene:</strong> tareas comunes y específicas. "Convierte esta lista a JSON", "extrae los emails de este texto", "tradúceme esto al inglés". Si la tarea es obvia para cualquiera que la lea, zero-shot basta.</p>
<p><strong>Cuándo NO conviene:</strong> cuando el formato de salida es raro o muy específico. Ahí necesitas la siguiente técnica.</p>`,
              "soporte-m07-s3-zero-shot",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "markdown",
              `# Ejemplo zero-shot

Convierte este array de objetos JavaScript a CSV.
Primera linea son los headers, separados por coma.

[
  { id: 1, titulo: "Internet caido", estado: "abierto" },
  { id: 2, titulo: "Impresora", estado: "resuelto" }
]`,
              "Tarea clara, formato conocido (CSV), sin ambigüedad. No le hicieron falta ejemplos. Eso es zero-shot.",
              "soporte-m07-s3-zero-shot-codigo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Técnica 2 — Few-shot (darle ejemplos).</strong></p>
<p>Aquí le muestras 1-3 ejemplos del input y del output que esperas, y le dices "ahora hazlo con este otro input". Es la técnica que <strong>más resuelve cuando el formato de salida es específico</strong> y no podrías describirlo bien con palabras.</p>
<p><strong>Cuándo conviene:</strong> formato de output muy particular (un JSON con shape único, un comentario con cierto estilo, una respuesta corta tipo "OK" o "FALLA"). Cuando lo describes con ejemplos, la IA capta el patrón en segundos.</p>
<p><strong>Regla mental:</strong> si tu prompt empieza con "Por ejemplo, si te paso X, quiero que devuelvas Y", estás usando few-shot.</p>`,
              "soporte-m07-s3-few-shot",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "markdown",
              `# Ejemplo few-shot

Clasifica el tono de los siguientes mensajes de ticket en "tecnico",
"urgente" o "consulta". Devuelve UNA palabra por linea, sin nada mas.

Ejemplos:
- "El servidor de produccion esta caido, perdemos plata cada minuto" -> urgente
- "Como cambio mi contraseña?" -> consulta
- "Stack trace: NullPointerException en linea 124 del UserService" -> tecnico

Ahora clasifica estos:
1. "No me llega el correo de bienvenida desde ayer"
2. "Cuenta bloqueada, presentacion al cliente en 10 minutos"
3. "Migracion fallo con error 500, logs adjuntos"`,
              "Tres ejemplos cortos y el output esperado. Le quitas toda la ambigüedad. Sin few-shot, te tira un párrafo explicando. Con few-shot, te tira tres palabras.",
              "soporte-m07-s3-few-shot-codigo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Técnica 3 — Chain-of-Thought ("piensa paso a paso").</strong></p>
<p>Cuando la tarea requiere razonamiento (lógica, debugging, decisión técnica), <strong>pedirle que explique paso a paso ANTES de darte la respuesta final</strong> mejora drásticamente la precisión.</p>
<p>¿Por qué funciona? Porque la IA "predice tokens uno a uno". Cuando le obligas a generar primero el razonamiento, esos tokens influencian los siguientes — y la respuesta final sale apoyada en el razonamiento que ya escribió. Es como pensar en voz alta vs improvisar de una.</p>
<p><strong>Cuándo conviene:</strong> debugging, problemas de lógica, "¿por qué esto no funciona?", decisiones técnicas con varias opciones.</p>
<p><strong>Cuándo NO conviene:</strong> tareas mecánicas (formato, traducción, extracción). Ahí el razonamiento es ruido.</p>`,
              "soporte-m07-s3-cot",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "markdown",
              `# Ejemplo Chain-of-Thought

Mi componente React vuelve a hacer fetch cada vez que tipeo en un input.
Aqui esta el codigo (uso useState para el input + useEffect con fetch + Tanstack Query).

PRIMERO: explica paso a paso por que esta pasando esto.
DESPUES: dame el codigo corregido.

[pegas tu codigo aqui]`,
              "Forzar 'PRIMERO el razonamiento, DESPUES el código' triplica la probabilidad de que detecte la causa real (probablemente useEffect re-disparándose por una dependencia mal puesta). Sin esto, te da el código corregido a tientas, y a veces ni corrige.",
              "soporte-m07-s3-cot-codigo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Técnica 4 — Role prompting (actúa como…).</strong></p>
<p>Le asignas un <strong>rol experto</strong> al inicio del prompt y la IA ajusta su estilo, profundidad y vocabulario. Sin esto, te habla "estilo tutorial de blog". Con esto, te habla como el rol que pediste.</p>
<p><strong>Cuándo conviene:</strong> code review (actúa como reviewer senior), explicaciones (actúa como mentor de junior), análisis de performance (actúa como ingeniero de performance), debugging difícil (actúa como debugger paciente que pregunta antes de responder).</p>
<p><strong>Sin tabú</strong>: esto no es psicología ni hipnosis. Es estadística — los textos donde alguien actúa como "reviewer senior" tienen un estilo distinto, y la IA replica ese estilo.</p>`,
              "soporte-m07-s3-role",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "markdown",
              `# Ejemplo Role prompting

Actua como un code reviewer senior de React con 10 años de experiencia,
que es exigente pero respetuoso. Tu trabajo es encontrar problemas que el
autor del codigo no vio.

Revisa el siguiente componente. Para cada problema que encuentres:
1. Indica la linea exacta.
2. Explica POR QUE es un problema.
3. Sugiere la correccion.

No me felicites por lo que esta bien. Solo lo que esta mal.

[pegas tu componente]`,
              "Comparado con 'revisa este código', un role-prompt como ese te da hallazgos 3x más profundos, con justificación real. Y nota la restricción: 'no me felicites' — ahorras párrafos inútiles.",
              "soporte-m07-s3-role-codigo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Técnica 5 — Output format (formato forzado).</strong></p>
<p>Le dices <strong>exactamente cómo quieres recibir la respuesta</strong>. JSON con keys específicas, tabla markdown, lista numerada, código sin texto alrededor.</p>
<p><strong>Cuándo conviene:</strong> cuando vas a procesar la salida (programáticamente o pegándola en otro lado). También cuando estás cansado de leer "Excelente pregunta, aquí va una explicación detallada..." antes de cada respuesta.</p>
<p>Esta técnica es <strong>la que más tiempo te va a ahorrar al día</strong>. Te lo firmo.</p>`,
              "soporte-m07-s3-output-format",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "markdown",
              `# Ejemplo Output format

Lee esta descripcion de bug que escribio un usuario y extrae los datos
estructurados.

Responde EXCLUSIVAMENTE con JSON. Nada de texto antes ni despues.
La estructura debe ser EXACTAMENTE asi:

{
  "titulo": string (max 80 chars),
  "prioridad": "alta" | "media" | "baja",
  "componente_afectado": string,
  "pasos_para_reproducir": string[]
}

Descripcion del usuario:
"Desde ayer no puedo entrar al modulo de facturacion. Pongo mi contraseña
y me devuelve a la pantalla de login. Probe en Chrome y Edge, igual."`,
              "Le diste el shape exacto. Te va a responder con un JSON parseable. Sin párrafos, sin disculpas, sin 'avísame si necesitas algo más'. Si después haces JSON.parse() de su respuesta en código, funciona.",
              "soporte-m07-s3-output-format-codigo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Técnica 6 — Negative prompting (decir lo que NO quieres).</strong></p>
<p>La IA tiene <strong>manías</strong>: agrega comentarios donde no van, te explica las cosas obvias, mete <em>console.log</em> "para debugging", usa librerías que no le pediste. La técnica es simple: <strong>dile explícitamente lo que NO quieres</strong>.</p>
<p>"No agregues comentarios", "no expliques", "no uses librerías externas", "no inventes funciones que yo no haya mencionado".</p>
<p><strong>Cuándo conviene:</strong> SIEMPRE que sepas que la IA tiende a hacer algo molesto. Pones la prohibición y se ahorra el ruido. Es la técnica más barata y más efectiva.</p>`,
              "soporte-m07-s3-negative",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "markdown",
              `# Ejemplo Negative prompting

Refactoriza esta funcion para que use async/await en lugar de promesas
encadenadas con .then().

NO hagas lo siguiente:
- NO agregues comentarios al codigo (lo voy a leer yo, no necesito ayuda).
- NO me expliques el cambio antes ni despues.
- NO uses try/catch (yo decido despues si va).
- NO uses ninguna libreria externa.

Responde con el codigo refactorizado y NADA mas.

[pegas tu codigo con .then()]`,
              "El output va a ser exactamente lo que pediste. Si no le pones los 'NO', tienes 7 líneas de comentario, dos párrafos de explicación, y un try/catch que no necesitas.",
              "soporte-m07-s3-negative-codigo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Técnica 7 — Decomposition (divide y vencerás).</strong></p>
<p>Para tareas grandes, NO pidas todo de una. <strong>Divide en sub-tareas y pide una a la vez</strong>. La IA simplifica demasiado cuando le pides "hazme la app completa" — te da algo que parece funcionar pero está lleno de huecos.</p>
<p><strong>Cuándo conviene:</strong> cualquier cosa que tenga más de un archivo, más de 100 líneas, o más de un concepto.</p>
<p><strong>Cómo se ve:</strong> primer prompt para la estructura de archivos. Segundo prompt para el primer archivo. Tercer prompt para el segundo archivo. Etcétera. <em>Más prompts, no menos</em>. Suena lento, pero es más rápido y más certero.</p>`,
              "soporte-m07-s3-decomposition",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "markdown",
              `# Ejemplo Decomposition (un prompt a la vez)

# Prompt 1
Voy a hacer una app de gestion de tickets en React + Tanstack Query + Router.
Antes de pedirte codigo, dame SOLO la estructura de archivos sugerida
(carpetas + archivos + 1 linea de descripcion por archivo).
Nada de codigo todavia.

# Prompt 2 (despues de revisar la estructura)
Empecemos por el archivo "src/mockApi.js". Dame solo ese archivo, con las
funciones obtenerTickets, obtenerTicketPorId y crearTicket. Sin codigo de
React. Mock interno con setTimeout.

# Prompt 3
Ahora "src/ListaTickets.jsx". Usa useQuery con queryKey ["tickets"].
Sin estilos por ahora.

# ... y asi`,
              "Tres prompts pequeños vs uno gigante. Resultado: cada archivo sale mejor pensado, tú revisas en cada paso y corriges antes de que la basura se acumule. Decomposition es la diferencia entre 'me sirve' y 'tengo que reescribirlo todo'.",
              "soporte-m07-s3-decomposition-codigo",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>Las técnicas se combinan</strong> (esto se llama "stacking"). Un prompt real serio puede usar 3 o 4 técnicas a la vez: rol + restricciones + formato + chain-of-thought. <em>No es trampa, es lo normal</em>.</p>
<p>Ejemplo combinado:</p>
<ul>
  <li><strong>Rol</strong>: "actúa como reviewer senior de React".</li>
  <li><strong>Chain-of-thought</strong>: "para cada hallazgo, explica el razonamiento antes de proponer corrección".</li>
  <li><strong>Output format</strong>: "responde con una lista numerada".</li>
  <li><strong>Negative</strong>: "no me felicites por lo bueno, solo lo malo".</li>
</ul>
<p>Cuatro técnicas en un solo prompt = output 10x mejor. Esa es la receta real.</p>`,
              "soporte-m07-s3-tip-stacking",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Mini-quiz de la sección: 3 preguntas para sellar las técnicas.</strong></p>
<p>Antes de seguir a la sección 4, asegura que las técnicas quedaron firmes. Te van a llegar 3 situaciones reales — tu trabajo es elegir la técnica adecuada para cada una.</p>
<p>Pasa este mini-quiz y sigue tranquilo. Si te equivocas en alguna, vuelve al ejemplo de esa técnica y vuelve a intentar. <em>Todavía no</em> tienes que memorizarlas todas — pero sí reconocerlas.</p>`,
              "soporte-m07-s3-intro-mini-quiz",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "IA como copiloto del dev",
            contenido: buildQuiz(
              [
                {
                  id: "m07-s3-q1",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    '<p>Tienes que pedirle a la IA que clasifique 50 mensajes de ticket en "tecnico", "urgente" o "consulta", devolviendo UNA palabra por línea. ¿Qué técnica te conviene aplicar?</p>',
                  explicacion:
                    "Few-shot. El formato de salida (una palabra por línea, solo tres valores posibles) es muy específico y se describe MUCHO mejor con 2-3 ejemplos que con un párrafo de explicación. Con few-shot capta el patrón en segundos. Chain-of-Thought aquí sobra (no necesitas razonamiento), y zero-shot deja el formato ambiguo.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Chain-of-Thought (pedirle que piense paso a paso).",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Few-shot: darle 2-3 ejemplos de mensaje → clasificación, y después la lista real.",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: 'Zero-shot: simplemente decirle "clasifica estos mensajes".',
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "Decomposition: pedirle uno por uno los 50 mensajes.",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m07-s3-q2",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>Le pides a la IA que arregle un bug, pero te tira el código corregido sin entender la causa, y a veces no corrige el problema real. ¿Qué técnica conviene aplicar para mejorar la precisión?</p>",
                  explicacion:
                    "Chain-of-Thought. Pedirle EXPLICAR el problema paso a paso ANTES de darte el código corregido fuerza a la IA a apoyar la respuesta final en el razonamiento que ya escribió. Es la técnica clave para bugs y decisiones técnicas. Role prompting también ayuda, pero CoT es la respuesta directa.",
                  opciones: [
                    {
                      id: "a",
                      texto:
                        'Chain-of-Thought: "primero explica paso a paso la causa, después dame el código".',
                      esCorrecta: true,
                    },
                    {
                      id: "b",
                      texto: "Output format: pedirle el código en JSON.",
                      esCorrecta: false,
                    },
                    {
                      id: "c",
                      texto: 'Negative prompting: "no me expliques, solo el código".',
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "Few-shot: darle ejemplos de bugs anteriores.",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m07-s3-q3",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    '<p>Cada vez que le pides un refactor, la IA te agrega 5 líneas de comentarios explicando el código, mete un <code>try/catch</code> que no pediste y al final te escribe "avísame si necesitas algo más". ¿Qué técnica frena eso?</p>',
                  explicacion:
                    'Negative prompting. Decir EXPLÍCITAMENTE lo que NO quieres es la forma más barata y efectiva de cortar las manías de la IA. "No agregues comentarios, no uses try/catch, responde solo con el código". Tres líneas y te ahorras todo el ruido.',
                  opciones: [
                    {
                      id: "a",
                      texto: 'Role prompting: "actúa como reviewer senior".',
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        'Negative prompting: decir explícitamente "NO agregues comentarios, NO uses try/catch, NO me expliques".',
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Chain-of-Thought: pedirle que razone paso a paso.",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "Decomposition: pedirle el refactor en partes.",
                      esCorrecta: false,
                    },
                  ],
                },
              ],
              "soporte-m07-s3-mini-quiz",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Microvictoria de sección: <strong>tienes las 7 técnicas en tu caja de herramientas</strong>. No las vas a usar todas todos los días — pero sí las vas a reconocer cuando te sirvan, y eso ya te pone delante de mucha gente que lleva un año usando IA sin saber que existen.</p>
<p>En la sección 4 entramos a lo que llamamos <strong>pair programming real</strong>: no se trata solo de cómo le pides — se trata de cómo <em>trabajas con ella</em> en el día a día. Iterar, pedir explicaciones, usarla para entender código ajeno. La diferencia entre "le pego cosas a ChatGPT" y "estoy programando en pareja con la IA".</p>`,
              "soporte-m07-s3-microvictoria",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 4 — Pair programming real
      // ----------------------------------------------------------------------
      {
        titulo: "Pair programming real: conversar, no dictar",
        skill: "IA como copiloto del dev",
        temas:
          "Cambiar el chip de 'pedirle cosas' a 'trabajar con ella'. Pedir explicación antes de pegar el código. Iterar en lugar de aceptar el primer output. Usar la IA para entender código ajeno (el caso de uso más rentable en soporte). Cuándo cortar y hacerlo tú.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Hasta aquí aprendiste a <strong>pedir bien</strong>. Pero pedir bien es solo la mitad del juego. La otra mitad es <strong>cómo trabajas con la IA en el día a día</strong>: cómo la usas como compañera de programación, no como vending machine de código.</p>
<p>La diferencia es sutil pero brutal:</p>
<ul>
  <li><strong>Vending machine</strong>: le pego una tarea, copio el output, sigo. Si falla, le pego el error y vuelvo a copiar.</li>
  <li><strong>Pair programming</strong>: le pido, leo, le pregunto, itero, decido qué acepto, qué rechazo, qué entiendo y qué no.</li>
</ul>
<p>La diferencia entre las dos es la que separa al dev que crece del que se estanca. <strong>Sin tabú</strong>: si vas a usar IA como vending machine durante todo tu primer año, tu carrera se va a frenar. Si la usas como compañera, vas a crecer el doble de rápido que sin ella.</p>`,
              "soporte-m07-s4-intro",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Hábito 1: Pídele que explique ANTES de pegar el código.</strong></p>
<p>Antes de aceptar cualquier código que te tira la IA, <strong>léelo y pídele que te explique lo que entiendas a medias</strong>. "¿Por qué usaste <code>useMemo</code> aquí?", "¿qué hace ese <code>?.</code>?", "¿qué pasa si <code>tickets</code> es undefined?".</p>
<p>Dos beneficios al precio de uno:</p>
<ul>
  <li><strong>Aprendes</strong>: cada explicación es una mini-clase gratis adaptada a tu nivel exacto.</li>
  <li><strong>Pillas alucinaciones</strong>: cuando la IA empieza a "explicar" algo que es inventado, se nota — porque la explicación se enreda.</li>
</ul>
<p>Esto no es perder tiempo. Es <strong>el atajo más rápido al "saber"</strong>.</p>`,
              "soporte-m07-s4-habito-1",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Hábito 2: Iterar en lugar de aceptar el primer output.</strong></p>
<p>El primer output de la IA <strong>rara vez es el bueno</strong>. Y eso está bien — porque tu trabajo es iterarlo hasta que sirva. Aceptar el primero "porque me pasó algo" es renunciar a la calidad real.</p>
<p>Iteraciones típicas que vas a hacer mil veces:</p>
<ul>
  <li>"Me gusta, pero acórtalo a la mitad."</li>
  <li>"Esto no es Tanstack Query 5, es Tanstack Query 3 — usa la API actual."</li>
  <li>"Cambia la prop <code>onClick</code> por <code>onSubmit</code> porque va en un form."</li>
  <li>"Sin <code>any</code>. Si no sabes el tipo, dime y lo aclaramos juntos."</li>
</ul>
<p>Cada iteración cuesta 30 segundos y mejora el resultado. <strong>Iterar 3 veces es lo normal, no lo excepcional</strong>. Si te sale a la primera, ya conoces ese caso de memoria — felicidades. Si necesitas iterar, también felicidades, estás haciendo bien el trabajo.</p>`,
              "soporte-m07-s4-habito-2",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Hábito 3: Usarla para entender código ajeno (tu caso más rentable).</strong></p>
<p>Esto es <strong>oro puro para gente de soporte</strong> que lleva años leyendo código que escribió otra persona. La IA es buenísima para explicarte un archivo enredado, una función larga, un patrón que no reconoces. Le pegas el código, le dices "explícame qué hace, paso a paso, asumiendo que llevo poco con esto", y te lo desmenuza.</p>
<p>Casos reales del día a día que vas a vivir:</p>
<ul>
  <li>Llegas a un proyecto nuevo. Te asignan corregir un bug en un archivo que tiene 400 líneas. <strong>Le pegas el archivo y le pides un resumen primero</strong>. En 30 segundos sabes el mapa.</li>
  <li>Un compañero te manda un PR para revisar y no entiendes la mitad de los cambios. <strong>Le pegas el diff y le pides "explícame qué se modificó y por qué"</strong>.</li>
  <li>Encuentras una función con un regex enredado. <strong>Le pegas el regex y le pides "tradúceme esto a español"</strong>.</li>
</ul>
<p>El prompt base para este caso:</p>`,
              "soporte-m07-s4-habito-3",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "markdown",
              `# Prompt para entender codigo ajeno

Te voy a pegar un archivo de un proyecto al que acabo de llegar.
No conozco el contexto del proyecto.

Tu tarea:
1. Resumeme en 3 lineas que hace este archivo en terminos generales.
2. Listame las funciones / componentes / clases que define, una por una,
   con una linea de descripcion cada una.
3. Mencioname cualquier cosa que te llame la atencion (patrones raros,
   posibles bugs, cosas obsoletas).

No me felicites. No me expliques que es React o que es JavaScript.
Asume que llevo poco programando — usa lenguaje claro.

[pegas el archivo]`,
              "Pega este prompt + un archivo cualquiera que no entiendas. Sale entendible en 20 segundos. Es el atajo más grande para entrar a proyectos nuevos sin pedirle ayuda a nadie.",
              "soporte-m07-s4-codigo-entender",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Hábito 4: Saber cuándo cortar.</strong></p>
<p>A veces la IA <strong>se atasca</strong>. Le explicas, ajustas, iteras 4 veces y sigue dándote algo que no encaja. Ahí hay que cortar y hacerlo tú.</p>
<p>Señales de que es momento de cortar:</p>
<ul>
  <li>Llevas <strong>más de 5 iteraciones</strong> en la misma tarea y empeora en lugar de mejorar.</li>
  <li>La IA empieza a <strong>contradecirse</strong> entre mensajes ("primero te dije X, ahora te digo Y").</li>
  <li>Sospechas que está <strong>inventando</strong> APIs que no existen (te tira nombres de funciones que no encuentras en Google).</li>
  <li>El problema requiere <strong>contexto de tu negocio</strong> que no le diste — y no quieres pegarle medio repo.</li>
</ul>
<p>Cuando cortes: cierra la conversación, busca la documentación oficial de lo que sea, escribe la solución tú, y si quieres, vuelve a la IA en otra conversación nueva para que revise lo que ya hiciste. <strong>Mucho más rápido que seguir peleando con una conversación contaminada</strong>.</p>`,
              "soporte-m07-s4-habito-4",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "warning",
              `<p><strong>5 banderas rojas en una conversación con IA.</strong> Si ves alguna, sospecha:</p>
<ol>
  <li><strong>Te tira nombres de funciones / propiedades / librerías que no aparecen en Google</strong>. Probablemente las inventó.</li>
  <li><strong>Cambia de respuesta drásticamente</strong> sin que tú le hayas dado información nueva. Está improvisando.</li>
  <li><strong>Usa una API que tú sabes que no existe en esa versión</strong> (React 18 con <code>useStore</code>, por ejemplo).</li>
  <li><strong>Te dice "esto funciona en general" sin explicar por qué funciona en TU caso</strong>. Generalidad = falta de comprensión.</li>
  <li><strong>Niega un error que tú estás viendo en consola</strong>. "Pero ese código está bien" — no, no está bien si te tira error.</li>
</ol>
<p>Cuando veas una bandera roja: <strong>verifica con la documentación oficial</strong>. Si la confirmas, corta y resuelve tú.</p>`,
              "soporte-m07-s4-tip-banderas",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              "<p>Microvictoria de sección: <strong>tienes la mentalidad correcta</strong>. Pides bien (S2 + S3), trabajas en pareja (S4), y en la sección 5 vamos a cerrar con el último ingrediente: <em>cuándo NO confiar</em>, cómo auditar lo que escribe la IA y un ejercicio de bitácora para que esto quede en tu carpeta de logros.</p>",
              "soporte-m07-s4-microvictoria",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // Seccion 5 — Cuando NO confiar + ejercicio bitacora + QUIZ FINAL + cierre
      // ----------------------------------------------------------------------
      {
        titulo: "Cuándo NO confiar: auditar lo que escribe la IA",
        skill: "IA como copiloto del dev",
        temas:
          "Los 4 tipos de fallo de la IA con ejemplo real. Checklist mínima de code review de lo que escribe la IA (5 puntos). Ejercicio guiado de bitácora: refactor con IA documentando el antes/después y el prompt usado. Quiz final del módulo + cierre con puente narrativo a M08.",
        bloques: [
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Llegamos al último ingrediente del módulo: <strong>cuándo NO confiar</strong>. Porque la IA, igual que un colega muy rápido pero distraído, <strong>se equivoca</strong>. Y cuando se equivoca, te lo dice con la misma seguridad con la que acierta.</p>
<p>Sin tabú: <strong>las alucinaciones son el problema número 1 de la IA aplicada a código</strong>. Saber detectarlas es la mitad del trabajo de un dev moderno. Esta sección te da el ojo entrenado.</p>`,
              "soporte-m07-s5-intro",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Los 4 tipos de fallo</strong> que te vas a encontrar (en orden de frecuencia):</p>
<ol>
  <li><strong>Alucinaciones de API</strong>: te inventa nombres de funciones, propiedades o métodos que no existen en la librería. Suena coherente, no existe. Frecuencia: <em>todos los días</em>.</li>
  <li><strong>Código viejo</strong>: te tira sintaxis de React 16, de TypeScript de hace 5 años, de Node con <code>require</code> cuando el proyecto usa <code>import</code>. La IA "vio" mucho código viejo durante su entrenamiento.</li>
  <li><strong>Frameworks confundidos</strong>: te mezcla Tanstack Query con SWR, React Router 6 con React Router 5, Express con Fastify. Patrones de una librería metidos en otra.</li>
  <li><strong>Soluciones que "parecen funcionar"</strong>: el código corre, los ejemplos típicos pasan, pero falla en el caso límite que no probaste. Bug latente garantizado.</li>
</ol>
<p>Los 4 te van a pasar. Tu trabajo NO es evitarlos — es <strong>detectarlos rápido</strong>.</p>`,
              "soporte-m07-s5-cuatro-fallos",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "javascript",
              `// ALUCINACION REAL: este codigo te lo puede tirar la IA si le pides
// "como hago retry de un useQuery cuando falla". Lee con cuidado.

const { data, retry, refetch } = useQuery({
  queryKey: ["tickets"],
  queryFn: obtenerTickets,
  retryOnError: true,        // <- INVENTADA: no existe en Tanstack Query
  onRetry: () => console.log("reintentando"),  // <- INVENTADA: tampoco
})

// Lo unico real ahi es "data" y "refetch". El resto es alucinacion pura.
// "retry" es una opcion de configuracion (no algo que devuelve), pero la IA
// lo metio en la desestructuracion como si fuera una funcion. Bug latente.
//
// Lo correcto es:
//   retry: 3   <- es una opcion (cuantas veces reintentar antes de fallar)
//
// Si copiabas esto sin leer, en runtime "retry" seria undefined y al
// usarlo en un onClick te explotaba con "retry is not a function".`,
              "Lee cuántas cosas inventadas hay en 5 líneas. Y el código compila, no te da error de TypeScript hasta que lo usas. Por eso 'auditarlo a mano' es la única defensa real.",
              "soporte-m07-s5-alucinacion-codigo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Checklist mínima de code review de lo que escribe la IA</strong> — 5 puntos que vas a aplicar SIEMPRE antes de pegar el código en tu rama:</p>
<ol>
  <li><strong>¿Existen todas las funciones / propiedades / métodos que usa?</strong> Si tienes duda de una, búscala en la documentación oficial o en Google. Si no la encuentras, era alucinación.</li>
  <li><strong>¿La versión de la librería coincide con la que tengo en <code>package.json</code>?</strong> La IA mezcla versiones — verifica.</li>
  <li><strong>¿Maneja los casos límite?</strong> ¿Qué pasa si el array viene vacío, si la respuesta es <code>null</code>, si el usuario no tiene permiso? Léelo pensando en lo raro.</li>
  <li><strong>¿Sigue los patrones del proyecto?</strong> Si tu proyecto usa Tanstack Query y la IA te tira un <code>useEffect</code>, hay un mismatch que va a doler después.</li>
  <li><strong>¿Lo entiendo línea por línea?</strong> Si hay UNA línea que no entiendes, pregúntale a la IA qué hace antes de aceptarla. Nunca pegues código que no entiendes.</li>
</ol>
<p>Suena exigente. Lo es. Y son los 5 minutos que te separan de los devs que pegan basura y los que entregan código que funciona.</p>`,
              "soporte-m07-s5-checklist",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "warning",
              `<p><strong>La regla de oro de auditar IA:</strong></p>
<p>Si confías en la IA <strong>tanto como confías en un compañero que llegó la semana pasada al equipo</strong> — vas bien. Le crees al 80%, pero revisas todo lo importante antes de mergear.</p>
<p>Si confías <strong>menos</strong>, estás siendo paranoico y dejas de aprovecharla.<br>
Si confías <strong>más</strong>, vas a mergear bugs latentes.</p>
<p>El 80% es el punto dulce.</p>`,
              "soporte-m07-s5-tip-regla-oro",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Ejercicio guiado para tu bitácora</strong> (entregable del módulo, no autocorregido — esto lo haces en tu computador y queda como evidencia en tu carpeta de logros).</p>
<p>Te voy a dar una función intencionalmente <strong>fea</strong>. Tu tarea:</p>
<ol>
  <li>Copia esa función a un archivo nuevo en tu proyecto (<code>refactor-ia.js</code>).</li>
  <li>Abre tu IA favorita (Claude, ChatGPT, Copilot Chat). Aplica las <strong>4 partes del prompt</strong> (S2) + al menos <strong>2 técnicas</strong> (S3).</li>
  <li>Pide el refactor. Itera 2-3 veces si hace falta — eso es lo normal.</li>
  <li>Aplica la <strong>checklist de auditoría</strong> (los 5 puntos de arriba) al output.</li>
  <li>En tu <code>bitacora.md</code> (la del módulo 00), agrega una entrada con: el <strong>código antes</strong>, el <strong>prompt que usaste</strong>, el <strong>código después</strong>, y <strong>una línea sobre qué aceptaste y qué rechazaste</strong>.</li>
</ol>
<p>El ejercicio es parte de tu evidencia de carrera. <strong>Súbelo a GitHub</strong> con el resto de tu bitácora — recuerda M01.</p>`,
              "soporte-m07-s5-ejercicio-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "javascript",
              `// CODIGO FEO INICIAL — esto es lo que vas a refactorizar con IA.
// Es una funcion real-ish: agrupa tickets por prioridad y cuenta cuantos
// hay abiertos vs resueltos. Funciona, pero esta horrible. Bien hecho a
// proposito para que tengas algo que mejorar.

function procesa(t) {
  var resultado = {}
  for (var i = 0; i < t.length; i++) {
    var p = t[i].prioridad
    if (resultado[p] == undefined) {
      resultado[p] = { abiertos: 0, resueltos: 0, total: 0 }
    }
    if (t[i].estado == "abierto") {
      resultado[p].abiertos = resultado[p].abiertos + 1
    } else if (t[i].estado == "resuelto") {
      resultado[p].resueltos = resultado[p].resueltos + 1
    }
    resultado[p].total = resultado[p].total + 1
  }
  return resultado
}

// Antipatrones que vas a pillar:
//   - var en lugar de const/let
//   - for clasico en lugar de reduce o forEach
//   - == en lugar de ===
//   - nombres de variables horribles ("t", "p")
//   - sin tipos (en un proyecto serio podria tener tipos)
//   - sin manejo de array vacio o input invalido
//
// La IA va a sugerirte un refactor con reduce, nombres claros, const,
// estricta igualdad. Tu trabajo: auditarlo y decidir que aceptas.`,
              "Copia esto, refactorízalo con IA siguiendo las 4 partes + 2 técnicas. Documenta en tu bitácora el antes/después/prompt. Es el entregable del módulo.",
              "soporte-m07-s5-codigo-feo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Antes del cierre, el <strong>quiz final del módulo</strong>: 5 preguntas que cubren los conceptos clave de las 5 secciones (mitos, anatomía de prompt, técnicas, hábitos de pair programming, auditoría).</p>
<p>Si pasaste el mini-quiz de S3 y leíste el módulo, esto es trámite. Vamos.</p>`,
              "soporte-m07-s5-intro-quiz-final",
            ),
          },
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "IA como copiloto del dev",
            contenido: buildQuiz(
              [
                {
                  id: "m07-q1",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>¿Cuál de estos prompts es el mejor para pedirle a la IA un componente de listado de tickets?</p>",
                  explicacion:
                    "El (b) es el bueno porque contiene las 4 partes universales: contexto (React + Vite + Tanstack Query, funciones existentes), tarea (componente ListaTickets), restricciones (useQuery, sin librerías de UI, máx 100 líneas) y formato de salida (solo el .jsx, sin texto alrededor). El (a) es zero-context, el (c) le pega medio proyecto innecesariamente, el (d) le pide algo imposible (no le diste el código).",
                  opciones: [
                    {
                      id: "a",
                      texto:
                        '<em>"Hazme un componente que muestre una lista de tickets en React"</em>.',
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Un prompt con contexto del stack (React + Vite + Tanstack Query), tarea clara, restricciones explícitas (sin librerías de UI, máx 100 líneas) y formato de salida (solo el archivo .jsx).",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto:
                        '<em>"Aquí tienes todo el código de mi proyecto (15 archivos pegados). Hazme un componente que muestre tickets."</em>',
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: '<em>"Arregla mi componente de tickets"</em>.',
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m07-q2",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>La IA acaba de tirarte código y notas que usa una función llamada <code>useAsyncQuery</code> que tú no conoces. Buscas en Google y solo aparecen 3 resultados de un blog viejo, no en la documentación oficial. ¿Qué haces?</p>",
                  explicacion:
                    "Es una alucinación clásica de API. La IA inventó un nombre que suena plausible, mezclado entre useQuery (Tanstack) y useAsync (otro hook que sí existió). La defensa correcta es: verificar con docs oficiales y rechazar lo inventado. Aceptar 'porque parece coherente' es exactamente cómo se mergean bugs latentes.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Lo pego porque suena coherente y compila.",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Lo rechazo y le pido a la IA que use solo la API real de Tanstack Query (useQuery, useMutation). Probablemente alucinó <code>useAsyncQuery</code>.",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Instalo otra librería que sí tenga <code>useAsyncQuery</code>.",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto:
                        "Le pido a la IA que me explique cómo funciona <code>useAsyncQuery</code> y confío en su explicación.",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m07-q3",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>Le pides a la IA debuggear un componente que no funciona, pero te tira el código corregido sin explicar la causa, y a veces no corrige el bug real. ¿Qué técnica te conviene aplicar?</p>",
                  explicacion:
                    "Chain-of-Thought. Forzar 'PRIMERO explica el razonamiento paso a paso, DESPUÉS dame el código corregido' mejora drásticamente la precisión en tareas de debugging y razonamiento. Las otras opciones aplican a otros casos pero no a este.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Few-shot: darle 3 ejemplos de bugs anteriores que ya arreglaste.",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Chain-of-Thought: pedirle que <strong>primero</strong> explique paso a paso la causa del bug, y <strong>después</strong> dé el código corregido.",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Output format: pedirle el código corregido como JSON.",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: 'Negative prompting: decirle "no me expliques nada".',
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m07-q4",
                  tipo: "VERDADERO_FALSO",
                  enunciado:
                    "<p>Cuando la IA te responde con seguridad y un tono profesional, podemos confiar en que la respuesta es correcta.</p>",
                  explicacion:
                    "Falso, y peligrosamente falso. La IA suena IGUAL de segura cuando acierta que cuando alucina. No tiene un mecanismo interno para 'dudar' — solo predice el siguiente token más probable. El tono no es señal de corrección. Por eso necesitamos la checklist de auditoría siempre.",
                  correcta: false,
                },
                {
                  id: "m07-q5",
                  tipo: "RESPUESTA_CORTA",
                  enunciado:
                    "<p>¿Cómo se llama la técnica de prompting que consiste en darle a la IA 2 o 3 ejemplos del input y el output esperado, para que capte el patrón antes de procesar tu caso real?</p>",
                  explicacion:
                    "Few-shot prompting. Es la técnica clave cuando el formato de salida es muy específico o cuando quieres asegurar consistencia. Acepta también 'few shot' (sin guión) o variaciones similares.",
                  respuestasAceptadas: [
                    "few-shot",
                    "few shot",
                    "fewshot",
                    "few-shot prompting",
                    "few shot prompting",
                  ],
                  normalizacion: {
                    trim: true,
                    ignorarMayusculas: true,
                    ignorarAcentos: true,
                    ignorarEspaciosDobles: true,
                  },
                },
              ],
              "soporte-m07-s5-quiz-final",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Si pasaste los dos quizzes, terminaste el ejercicio de bitácora con tu prompt y tu refactor documentados, y subiste eso a tu repo de GitHub: <strong>tienes algo que el 80% de devs no tiene</strong> — método para usar IA. No solo "usar IA", método. La diferencia es enorme y se nota en cuestión de meses.</p>
<hr/>
<p><strong>Cierre del módulo.</strong></p>
<p>Lo que llevas:</p>
<ul>
  <li>El chip en su lugar: la IA <strong>no piensa</strong>, predice tokens. Suena igual de segura cuando acierta que cuando alucina.</li>
  <li>Los 7 mitos del día a día respondidos sin tabú.</li>
  <li>La anatomía universal del prompt: <strong>contexto · tarea · restricciones · formato de salida</strong>.</li>
  <li>Las 7 técnicas de prompting: <strong>zero-shot, few-shot, chain-of-thought, role prompting, output format, negative prompting, decomposition</strong>. Y que se combinan ("stacking").</li>
  <li>4 hábitos de pair programming real: pedir explicación antes de pegar, iterar, usarla para entender código ajeno, saber cuándo cortar.</li>
  <li>5 banderas rojas de una conversación que se está degradando.</li>
  <li>La checklist mínima de auditoría: existencia, versión, casos límite, patrones del proyecto, comprensión línea por línea.</li>
  <li>Un refactor con IA documentado en tu bitácora pública.</li>
</ul>
<p>En el <strong>Módulo 08</strong> entra el último ingrediente del curso: <strong>calidad mínima y entrega</strong>. Aprendes a leer un stack trace sin pánico, a escribir un test que valga la pena, a usar lint/format sin pelearte con la herramienta, y a hacer deploy de tu proyecto a una URL pública en 5 minutos con Vercel. Es la última pieza antes del proyecto integrador.</p>
<p>Sin tabú: <em>no se trata de "ser ingeniero de calidad"</em>. Se trata de que tu proyecto integrador sea defendible y tengas una URL para mandar el lunes a tu jefe. Lo mínimo necesario, hecho bien.</p>
<p><em>Todavía no</em> estás listo para el integrador. Te faltan los últimos detalles de pulido. Pero ya casi llegamos.</p>
<p><strong>Nos vemos al otro lado.</strong></p>`,
              "soporte-m07-s5-cierre",
            ),
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // MODULO 08 — CALIDAD MINIMA Y ENTREGA
  // ==========================================================================
  {
    idx: 28,
    titulo: "Módulo 08 — Calidad mínima y entrega",
    descripcion:
      "Lo justo para que tu proyecto integrador sea defendible. Lectura de errores sin pánico, un test que valga la pena, lint y formato sin pelearte con la herramienta, y deploy a Vercel en 5 minutos. Al terminar, tu proyecto vive en una URL pública que puedes mandar el lunes.",
    secciones: [
      // ----------------------------------------------------------------------
      // SECCION 1 — Errores, tests y lint sin terror
      // ----------------------------------------------------------------------
      {
        titulo: "Errores, tests y lint sin terror",
        skill: "Calidad minima y entrega",
        temas:
          "Cómo leer un stack trace. Mensajes del navegador. Errores de TypeScript en VS Code. Anatomía de un buen test. Lint y formato: por qué existen Biome y Prettier.",
        bloques: [
          // --- Apertura ---
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Bienvenido a la última recta del curso.</strong></p>
<p>Hasta aquí aprendiste a <em>construir</em>: JavaScript, TypeScript, componentes, datos del servidor, IA como copiloto. En este módulo aprendes a <strong>defender lo que construiste</strong>. Tres cosas, ni una más:</p>
<ul>
  <li><strong>Leer errores sin pánico.</strong> Cuando algo se rompe, leer el mensaje en vez de cerrarlo.</li>
  <li><strong>Escribir un test que valga la pena.</strong> Uno bien escrito vale más que diez genéricos.</li>
  <li><strong>Usar lint y formato sin pelearte.</strong> Las herramientas trabajan para ti, no contra ti.</li>
</ul>
<p><em>Sin tabú</em>: no se trata de "ser ingeniero de calidad". Se trata de que cuando algo falle, tengas un método; cuando entregues, tengas un cinturón mínimo. Lo justo para que tu proyecto integrador sea defendible.</p>
<p>Vamos. <em>Todavía no</em> tienes el método. En 30 minutos sí.</p>`,
              "soporte-m08-s1-apertura",
            ),
          },

          // --- Subseccion 1: lectura de errores ---
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Parte 1 — El error es información, no fracaso.</strong></p>
<p>El primer instinto cuando algo se rompe es cerrar el mensaje y volver a intentar. Mal. El error rojo es la herramienta de diagnóstico más valiosa que tienes: te está diciendo <em>qué pasó, dónde, y en qué orden</em>. Aprender a leerlo te ahorra horas.</p>
<p>Vas a ver tres tipos de error en tu día a día como dev frontend:</p>
<ol>
  <li>Errores del <strong>navegador</strong> (la consola de Chrome o Firefox).</li>
  <li>Errores de <strong>TypeScript</strong> en VS Code (las líneas rojas onduladas).</li>
  <li>Errores de <strong>Node.js</strong> en la terminal (cuando levantas el proyecto).</li>
</ol>
<p>Cada uno habla un dialecto distinto. Te enseño los tres.</p>`,
              "soporte-m08-s1-errores-intro",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>El stack trace del navegador — qué leer y qué ignorar.</strong></p>
<p>Cuando algo revienta en el navegador, Chrome te tira un mensaje rojo con varias líneas. Eso es el <strong>stack trace</strong> (en inglés: la pila de llamadas). Es el itinerario que siguió tu código antes de chocar. La regla de oro:</p>
<ul>
  <li><strong>Lee la primera línea.</strong> Te dice <em>qué</em> falló (TypeError, ReferenceError, etc.) y <em>el mensaje en humano</em>.</li>
  <li><strong>Salta a la primera línea que sea TU código.</strong> El stack incluye también el código de React, Vite, librerías. No te asustes de esas. Busca tu archivo, tu línea.</li>
  <li><strong>Ignora el resto.</strong> El detalle de cómo React llegó hasta ahí casi nunca importa.</li>
</ul>`,
              "soporte-m08-s1-stack-trace",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "text",
              `Uncaught TypeError: Cannot read properties of undefined (reading 'titulo')
    at TicketCard (TicketCard.tsx:14:22)             ← TU CODIGO. Aqui esta el bug.
    at renderWithHooks (react-dom.development.js:14985:18)
    at mountIndeterminateComponent (react-dom.development.js:17811:13)
    at beginWork (react-dom.development.js:19049:16)
    at HTMLUnknownElement.callCallback (react-dom.development.js:3945:14)
    ... (50 lineas mas de React, ignorar)`,
              "Línea 1: el qué (intentaste leer 'titulo' de algo que es undefined). Línea 2: el dónde (TicketCard.tsx línea 14, columna 22). Las 50 líneas siguientes son React explicándote cómo llegó hasta ahí — no te interesan. Casi siempre el bug está en tu archivo, no en React.",
              "soporte-m08-s1-stack-trace-ejemplo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Los 3 errores que vas a ver el 80% del tiempo.</strong></p>
<p>Sin tabú: no son 100 errores distintos. Son 3, en versiones distintas. Si los reconoces de memoria, ya ganaste medio día.</p>
<ul>
  <li><code>Cannot read properties of undefined (reading 'X')</code> — intentaste leer una propiedad de algo que <strong>no existe todavía</strong>. Casi siempre porque los datos del servidor aún no llegaron, o porque un objeto opcional vino vacío. Defensa: <code>data?.titulo</code> en vez de <code>data.titulo</code>, o renderiza solo cuando <code>data</code> exista.</li>
  <li><code>X is not a function</code> — llamaste a algo como función pero no lo es. Casi siempre porque <strong>importaste mal</strong> (export default vs export nombrado) o porque la variable tiene otro tipo del que crees. Defensa: <code>console.log(typeof X)</code> y verifica los imports.</li>
  <li><code>X is not defined</code> — usaste una variable que <strong>no existe</strong>. Typo en el nombre o se te olvidó importar. Defensa: el linter te lo marca antes de correr.</li>
</ul>`,
              "soporte-m08-s1-tres-errores",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>El error de TypeScript en VS Code — la línea roja ondulada.</strong></p>
<p>Cuando TypeScript te subraya algo en rojo, pasa el mouse encima. El popup te dice <em>qué</em> esperaba y <em>qué</em> recibió. Lee esa diferencia: ahí está la pista. Los más comunes:</p>
<ul>
  <li><code>Property 'X' does not exist on type 'Y'</code> — estás leyendo un campo que tu tipo no tiene. O el tipo está mal, o el campo está mal escrito.</li>
  <li><code>Type 'A' is not assignable to type 'B'</code> — le estás dando un valor que no encaja con el tipo declarado. Típico: mandar <code>string</code> donde se espera <code>number</code>.</li>
  <li><code>Object is possibly 'undefined'</code> — el famoso. TypeScript te avisa que el valor puede no existir todavía. Defensa: <code>?.</code> o un <code>if</code> previo.</li>
</ul>
<p>TypeScript en VS Code es el primer test de tu código. Antes de ejecutar nada, ya te avisa de los bugs evidentes. <em>Cero pánico</em>: es información gratis.</p>`,
              "soporte-m08-s1-errores-ts",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "typescript",
              `interface Ticket {
  id: number
  titulo: string
  estado: "abierto" | "cerrado"
}

const t: Ticket = { id: 1, titulo: "Login roto", estado: "abierto" }

console.log(t.descripcion)
//          ~~~~~~~~~~~~~
// Property 'descripcion' does not exist on type 'Ticket'.
// Traduccion humana: "el tipo Ticket no tiene descripcion. O la agregas
// al tipo, o estas leyendo el campo equivocado".`,
              "El error de TS no es castigo: es un mensaje claro. Te dice exactamente qué propiedad no existe y en qué tipo. La solución casi siempre es agregar el campo al tipo o corregir el nombre. Cero misterio.",
              "soporte-m08-s1-error-ts-ejemplo",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              "<p><strong>Regla del primer minuto.</strong> Cuando algo se rompe, dedica el primer minuto a <em>leer</em>. No a googlear, no a probar cosas al azar. Solo leer el mensaje y mirar la línea que apunta. El 70% de los bugs se resuelven así. El otro 30% sí necesita Google o IA — pero llegas con la pregunta correcta.</p>",
              "soporte-m08-s1-tip-leer",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              "<p><strong>Microvictoria.</strong> Si te quedó claro que la primera línea del stack trace + la primera línea que apunta a tu código resuelven la mayoría de los bugs, ya tienes la mitad del módulo. <em>Te lo firmo</em>: vas a usar esto cada semana de tu vida como dev.</p>",
              "soporte-m08-s1-microvictoria-errores",
            ),
          },

          // --- Subseccion 2: tests basicos ---
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Parte 2 — Un test que valga la pena.</strong></p>
<p>"Test" suena a algo enorme. No lo es. Un test es <strong>un trozo de código que prueba otro trozo de código</strong>. Le pasa entradas conocidas y verifica que la salida sea la esperada. Punto.</p>
<p>De hecho, ya escribes tests sin darte cuenta. Cuando termines una función y abras la consola para probarla con tres valores distintos para ver si funciona, eso es un test mental. Solo le falta quedar escrito en un archivo para que se ejecute solo la próxima vez.</p>
<p>La pregunta no es "¿cómo escribo tests?". La herramienta es secundaria. La pregunta es <strong>"¿qué pruebo?"</strong> — qué casos elijo. Ahí está el oficio.</p>`,
              "soporte-m08-s1-tests-intro",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>La regla de los tres casos.</strong> Un test bien escrito cubre tres situaciones, y casi siempre con eso basta:</p>
<ul>
  <li><strong>El caso típico.</strong> Lo que pasa el 95% del tiempo. Si esto falla, la función ni siquiera sirve para lo básico.</li>
  <li><strong>El caso raro.</strong> Una entrada que no es típica pero ocurre. Email con mayúsculas, lista vacía, número negativo, string con espacios al final.</li>
  <li><strong>El caso límite.</strong> El borde extremo: ¿qué pasa si llega <code>null</code>? ¿Lista de un solo elemento? ¿String vacío? Ahí es donde los bugs se esconden.</li>
</ul>
<p>Tres tests bien elegidos atrapan más bugs que diez tests genéricos del caso típico repetido. <em>Filo</em>.</p>`,
              "soporte-m08-s1-tres-casos",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "javascript",
              `// Una funcion pura que queremos probar.
function calcularDescuento(precio, porcentaje) {
  if (porcentaje < 0 || porcentaje > 100) return precio
  return precio - (precio * porcentaje) / 100
}

// Tests: tres casos bien elegidos.
console.assert(calcularDescuento(100, 10) === 90, "caso tipico: 10% de 100 = 90")
console.assert(calcularDescuento(100, 0) === 100, "caso raro: 0% no descuenta nada")
console.assert(calcularDescuento(100, 150) === 100, "caso limite: porcentaje invalido devuelve el precio original")

// Si todos pasan: silencio. Si uno falla: mensaje rojo en la consola.
// Eso es un test. Sin libreria, sin nada.`,
              "console.assert es la versión mínima de un test. Si la expresión es true, no pasa nada. Si es false, te imprime el mensaje en rojo. En proyectos reales se usa Vitest o Jest, pero el concepto es el mismo: una entrada, una salida esperada, una verificación.",
              "soporte-m08-s1-test-ejemplo",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "exito",
              `<p><strong>Un test bien escrito vale más que diez genéricos.</strong> Cuando llegues al proyecto integrador, no te obsesiones con "cubrir todo". Elige <em>una</em> función pura (validar email, calcular total, filtrar lista) y escríbele tres tests bien pensados. Eso ya te pone por encima del 80% del público.</p>`,
              "soporte-m08-s1-tip-tests",
            ),
          },

          // --- Subseccion 3: reto autocorregible ---
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Reto autocorregido del módulo: tu propio test mental, ahora en código.</strong></p>
<p>Te toca escribir una función pura que valida si un email es aceptable para abrir un ticket en el Mini Centro. La regla del negocio es simple, pero tiene casos raros y límites que un test mediocre no atraparía. Tu función decide; los tres tests deciden si tu función está bien.</p>
<p>Lee bien el enunciado. La pista está al final, con un camino posible. Si te trabas, vuelve al ejemplo de <code>calcularDescuento</code> de arriba — el patrón es idéntico. <em>Todavía no</em> te sale a la primera, pero esta vez tienes ya el método. Saldrá.</p>`,
              "soporte-m08-s1-intro-reto",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_PREGUNTAS,
            esEvaluable: true,
            skill: "Calidad minima y entrega",
            idForzado: ID_SOP_M08_S1_PREG,
            contenido: buildCodigoPreguntas(
              "javascript",
              `Tu jefe del Mini Centro de Tickets quiere una funcion que valide el email del usuario antes de abrir un ticket.

Reglas del negocio (cortas y claras):
  1. Tiene que ser un string.
  2. Tiene que contener exactamente un "@".
  3. Despues del "@" tiene que haber al menos un punto "." (para el dominio).
  4. No puede estar vacio ni tener espacios.

Tu tarea:
  - Escribe una funcion "esEmailValido(email)" que devuelva true o false.
  - Despues, llamala con los 4 valores del array "casos" que viene en el esqueleto.
  - Imprime con console.log el resultado de cada uno, UNA LINEA POR CASO, exactamente "true" o "false".

Pista — un camino posible:
  function esEmailValido(email) {
    if (typeof email !== "string") return false
    if (email.includes(" ")) return false
    const partes = email.split("@")
    if (partes.length !== 2) return false
    if (partes[0].length === 0) return false
    if (!partes[1].includes(".")) return false
    return true
  }
  for (const c of casos) console.log(esEmailValido(c))

Salida exacta esperada (4 lineas):
true
false
false
false`,
              `// Los 4 casos a validar (en orden):
//   1. "ana@ntt.cl"     → email valido normal
//   2. "ana ntt.cl"     → no tiene @
//   3. "ana@ntt"        → no tiene punto despues del @
//   4. "ana @ntt.cl"    → tiene espacio
const casos = ["ana@ntt.cl", "ana ntt.cl", "ana@ntt", "ana @ntt.cl"]

// Escribe tu solucion aqui abajo.
// Recuerda: define esEmailValido(email), recorre los casos, console.log de cada resultado.

`,
              "soporte-m08-s1-codigo-preguntas",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_TESTS,
            esEvaluable: false,
            idForzado: ID_SOP_M08_S1_TEST,
            contenido: buildCodigoTests(
              ID_SOP_M08_S1_PREG,
              `const casos = ["ana@ntt.cl", "ana ntt.cl", "ana@ntt", "ana @ntt.cl"]

function esEmailValido(email) {
  if (typeof email !== "string") return false
  if (email.includes(" ")) return false
  const partes = email.split("@")
  if (partes.length !== 2) return false
  if (partes[0].length === 0) return false
  if (!partes[1].includes(".")) return false
  return true
}

for (const c of casos) console.log(esEmailValido(c))`,
              [
                {
                  id: "t1",
                  descripcion:
                    "Imprime los 4 resultados en el orden correcto: true, false, false, false",
                  entrada: "",
                  salidaEsperada: "true\nfalse\nfalse\nfalse\n",
                  visible: true,
                },
                {
                  id: "t2",
                  descripcion:
                    "Salida exacta: una linea por caso, solo 'true' o 'false', sin texto extra",
                  entrada: "",
                  salidaEsperada: "true\nfalse\nfalse\nfalse\n",
                  visible: true,
                },
                {
                  id: "t3",
                  descripcion:
                    "Test oculto: los 4 casos del array siguen dando el resultado esperado",
                  entrada: "",
                  salidaEsperada: "true\nfalse\nfalse\nfalse\n",
                  visible: false,
                },
              ],
              "soporte-m08-s1-codigo-tests",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Microvictoria.</strong> Si los tres tests pasaron en verde, acabas de escribir una función pura, eligiste los casos que importaban, y la verificaste. Eso es <em>literalmente</em> lo que hace cualquier dev senior antes de mergear: una función + tres asserts mentales. La diferencia es que ahora lo haces conscientemente.</p>
<p>Cuando llegues al proyecto integrador, este mismo patrón te sirve para validar prioridad de ticket, calcular tiempo abierto, filtrar por estado. Cualquier función pura, tres casos, listo.</p>`,
              "soporte-m08-s1-microvictoria-reto",
            ),
          },

          // --- Subseccion 4: lint y formato ---
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Parte 3 — Lint y formato sin pelearte con la herramienta.</strong></p>
<p>Dos herramientas que vas a ver en cualquier proyecto frontend serio. Hacen cosas distintas y no compiten:</p>
<ul>
  <li><strong>Formateador</strong> (Prettier, o Biome): se encarga del <em>estilo visual</em>. Espacios, comillas, saltos de línea, indentación. No cambia lo que tu código hace; lo deja bonito y consistente para que todo el equipo lo lea igual.</li>
  <li><strong>Linter</strong> (ESLint, o Biome): se encarga de <em>detectar problemas</em>. Variables que declaraste y no usas, imports duplicados, comparaciones sospechosas (<code>==</code> en vez de <code>===</code>), patrones que van a causar bugs.</li>
</ul>
<p><strong>Biome</strong> hace las dos cosas en una sola herramienta (es lo que usa este mismo proyecto). <strong>Prettier + ESLint</strong> es la combinación clásica. Ambas opciones son válidas: lo importante es que el proyecto tenga <em>una</em> elegida y todos la respeten.</p>`,
              "soporte-m08-s1-lint-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "javascript",
              `// ANTES del formateador (asi lo escribiste a la 1 AM):
function   esEmailValido(email){
const partes=email.split('@');
       if(partes.length!=2){return false}
return true
}

// DESPUES del formateador (un comando, cero pelea):
function esEmailValido(email) {
  const partes = email.split("@")
  if (partes.length !== 2) {
    return false
  }
  return true
}

// Hace lo mismo. Se lee infinitamente mejor.
// Y el linter ademas te marca el "!=" como sospechoso: deberia ser "!==".`,
              "El formateador no cambia el comportamiento, solo el aspecto. El linter sí detecta cosas que pueden romper (como el != en vez de !==). Ninguno reemplaza al otro: el formateador te ahorra discusiones de estilo en equipo, el linter te ahorra bugs.",
              "soporte-m08-s1-lint-ejemplo",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>Configurar Biome o Prettier toma 30 segundos.</strong> En la mayoría de los IDE modernos (VS Code incluido), instalas la extensión y activas "formatear al guardar". A partir de ahí, cada vez que guardas, el archivo queda formateado. Cero esfuerzo manual. Si te peleas con el formateador, casi siempre es porque tienes <em>dos</em> formateadores activos al mismo tiempo y se sobrescriben — desactiva uno y problema resuelto.</p>`,
              "soporte-m08-s1-tip-lint",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              "<p><strong>Microvictoria.</strong> Si entiendes que el formateador es para el estilo y el linter para detectar problemas, y que ambos trabajan <em>para ti</em>, ya superaste la pelea más tonta que tienen los devs nuevos. <em>Te lo firmo</em>: vas a quejarte los primeros 30 minutos cuando el formateador te cambie algo, y después no vas a querer escribir código sin él.</p>",
              "soporte-m08-s1-microvictoria-lint",
            ),
          },

          // --- Quiz final del modulo ---
          {
            tipo: TipoBloque.QUIZ,
            esEvaluable: true,
            skill: "Calidad minima y entrega",
            contenido: buildQuiz(
              [
                {
                  id: "m08-q1",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>Tu app revienta y Chrome te tira un stack trace de 50 líneas. ¿Por dónde empiezas?</p>",
                  explicacion:
                    "La primera línea te dice el tipo de error y el mensaje en humano (qué pasó). La primera línea que apunta a TU código te dice dónde corregir. El resto del stack es React/Vite/librerías llegando hasta ahí — casi nunca importa para resolver el bug.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Copio el stack completo y se lo pego a la IA sin leerlo.",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Leo la primera línea (qué pasó) y busco la primera línea que apunta a MI código (dónde corregir). Ignoro las 48 líneas restantes de React.",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Cierro el mensaje y recargo a ver si se arregla solo.",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "Reviso línea por línea las 50 entradas del stack trace.",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m08-q2",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>VS Code te subraya en rojo <code>data.titulo</code> con el mensaje <em>\"Object is possibly 'undefined'\"</em>. ¿Qué te está diciendo TypeScript?</p>",
                  explicacion:
                    "TypeScript te avisa que 'data' puede no existir todavía (típico cuando los datos vienen de Tanstack Query y aún están cargando). La defensa estándar es usar el optional chaining (data?.titulo) o un if previo que confirme que data ya llegó. No es un error: es información gratis para evitar el famoso 'Cannot read properties of undefined' en runtime.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Que 'data' siempre va a ser undefined y tengo que reescribir todo.",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Que 'data' puede no existir en algún momento (por ejemplo, mientras carga). Defensa: <code>data?.titulo</code> o un <code>if (data)</code> previo.",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Que TypeScript está roto y hay que reiniciar VS Code.",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "Que tengo que eliminar el tipo y usar <code>any</code>.",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m08-q3",
                  tipo: "OPCION_UNICA",
                  enunciado:
                    "<p>Tienes una función <code>calcularPromedio(nums)</code>. Según la regla de los tres casos, ¿qué tests escribes?</p>",
                  explicacion:
                    "Tres casos bien elegidos: el típico (lista normal de números, verificas que el promedio es correcto), el raro (un solo elemento, verificas que el promedio es ese mismo elemento), y el límite (lista vacía, ¿devuelve 0?, ¿lanza error?, eso es decisión de diseño). Cinco tests del caso típico con números distintos no agregan información.",
                  opciones: [
                    {
                      id: "a",
                      texto: "Cinco tests con listas distintas de números positivos.",
                      esCorrecta: false,
                    },
                    {
                      id: "b",
                      texto:
                        "Uno con la lista <code>[2, 4, 6]</code> (caso típico), uno con la lista de un solo elemento (caso raro) y uno con la lista vacía (caso límite).",
                      esCorrecta: true,
                    },
                    {
                      id: "c",
                      texto: "Solo uno con <code>[1, 2, 3]</code>, si pasa ya está cubierto.",
                      esCorrecta: false,
                    },
                    {
                      id: "d",
                      texto: "Cien tests aleatorios generados por la IA.",
                      esCorrecta: false,
                    },
                  ],
                },
                {
                  id: "m08-q4",
                  tipo: "VERDADERO_FALSO",
                  enunciado:
                    "<p>El formateador (Biome o Prettier) cambia el comportamiento de tu código además del estilo.</p>",
                  explicacion:
                    "Falso. El formateador SOLO cambia el aspecto: espacios, comillas, saltos de línea, indentación. El código hace exactamente lo mismo después de formatear. Quien sí puede sugerir cambios de comportamiento es el linter (te marca el <code>==</code> como sospechoso, te marca un import sin usar, etc.), pero incluso ahí eres tú quien decide aplicar el cambio. Formateador = aspecto, linter = problemas.",
                  correcta: false,
                },
                {
                  id: "m08-q5",
                  tipo: "RESPUESTA_CORTA",
                  enunciado:
                    '<p>¿Cómo se llama (en inglés) el itinerario de llamadas que te muestra el navegador cuando algo revienta en JavaScript? Son las líneas que te dicen "falló aquí, llamada desde acá, llamada desde más allá".</p>',
                  explicacion:
                    "Stack trace. Literalmente 'pila de llamadas'. Es el rastro que dejó tu código (más React, más librerías) antes de chocar contra el error. La regla práctica: la primera línea te da el qué, la primera línea de tu código te da el dónde.",
                  respuestasAceptadas: ["stack trace", "stack-trace", "stacktrace", "stack"],
                  normalizacion: {
                    trim: true,
                    ignorarMayusculas: true,
                    ignorarAcentos: true,
                    ignorarEspaciosDobles: true,
                  },
                },
              ],
              "soporte-m08-s1-quiz-final",
            ),
          },

          // --- Cierre de seccion ---
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p>Cinturón de calidad puesto. Ya tienes método para leer un error, criterio para escribir un test que valga la pena, y entiendes para qué existen el linter y el formateador. <em>Filo</em>.</p>
<p>Falta una sola cosa: que tu proyecto <strong>viva en algún lado</strong> donde alguien pueda abrirlo. Pasamos a la última sección del curso: deploy a Vercel. Cinco minutos, sin tarjeta, una URL pública que puedes compartir.</p>`,
              "soporte-m08-s1-cierre",
            ),
          },
        ],
      },

      // ----------------------------------------------------------------------
      // SECCION 2 — Deploy a Vercel
      // ----------------------------------------------------------------------
      {
        titulo: "Deploy a Vercel: tu proyecto en una URL pública",
        skill: "Calidad minima y entrega",
        temas:
          "Vercel en 5 minutos, sin tarjeta. Conectar el repo de GitHub. Variables de entorno. Cómo compartir la URL de tu proyecto. Cierre del curso.",
        bloques: [
          // --- Apertura ---
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>El último kilómetro.</strong></p>
<p>Hasta aquí tu proyecto vive en <code>localhost:5173</code> — solo lo ves tú. Para que alguien más pueda abrirlo (tu jefe el lunes, un reclutador en LinkedIn, tu mamá), necesita una <strong>URL pública</strong>. Eso es lo que llamamos "deploy" (en inglés: desplegar): subir tu código a un servidor que lo sirva al mundo.</p>
<p>Antes esto era doloroso: alquilar servidor, configurarlo, mantenerlo. Hoy <strong>Vercel</strong> lo resuelve en 5 minutos, gratis para proyectos personales, sin tarjeta de crédito. Conectas tu repo de GitHub y cada vez que haces <code>git push</code>, tu app pública se actualiza sola. Magia, pero real.</p>`,
              "soporte-m08-s2-apertura",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Por qué Vercel y no otra cosa.</strong></p>
<p>Hay alternativas: Netlify, Cloudflare Pages, GitHub Pages, Render. Todas funcionan. Te recomendamos <strong>Vercel</strong> por tres razones concretas:</p>
<ul>
  <li><strong>Detecta Vite automáticamente.</strong> No tienes que configurar nada de build: lee tu <code>package.json</code>, ve que usas Vite, y sabe qué hacer.</li>
  <li><strong>Plan gratis generoso.</strong> Para proyectos personales y portafolio sobra. Sin tarjeta.</li>
  <li><strong>Preview deployments.</strong> Cada vez que abres un Pull Request en GitHub, Vercel te genera una URL aparte solo con esos cambios. Útil para que alguien revise antes de mergear.</li>
</ul>
<p><em>Sin tabú</em>: para el proyecto integrador da exactamente lo mismo cuál uses si te late otra. Vercel es la ruta más corta de aquí al lunes con URL en la mano.</p>`,
              "soporte-m08-s2-por-que-vercel",
            ),
          },

          // --- Pasos del deploy ---
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Prerrequisito: tu proyecto vive en GitHub.</strong></p>
<p>Vercel necesita leer tu código desde algún lado. Lo más simple es GitHub (que ya manejas desde el módulo de Git). Si tu proyecto integrador todavía no está allí, son tres comandos:</p>`,
              "soporte-m08-s2-github-intro",
            ),
          },
          {
            tipo: TipoBloque.CODIGO_ILUSTRATIVO,
            esEvaluable: false,
            contenido: buildCodigoIlustrativo(
              "bash",
              `# 1. Crear el repo en GitHub desde la web (boton verde "New").
#    Le pones nombre (ej: "mini-centro-tickets"), publico o privado, sin README.

# 2. En tu terminal, dentro de la carpeta del proyecto:
git init
git add .
git commit -m "feat: proyecto integrador del curso"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/mini-centro-tickets.git
git push -u origin main

# 3. Listo: tu codigo ya esta en GitHub. Refrescas la pagina del repo y aparece.`,
              "Si ya hiciste el módulo de Git, esto es revisión. La única línea nueva es 'git remote add origin URL', que conecta tu carpeta local con el repo de GitHub. El URL te lo da GitHub al crear el repo (te lo muestra en la página del proyecto vacío).",
              "soporte-m08-s2-github-pasos",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Los 5 minutos de Vercel.</strong> Con el repo en GitHub, el flujo es así:</p>
<ol>
  <li>Vas a <strong>vercel.com</strong>, eliges "Sign Up", inicias sesión con GitHub. Una sola autorización y listo — Vercel ya ve tus repos.</li>
  <li>En el dashboard de Vercel, clic en <strong>"Add New → Project"</strong>. Te muestra la lista de tus repos.</li>
  <li>Eliges <strong>tu repo del proyecto integrador</strong>. Vercel detecta que es Vite, te muestra la configuración (build command, output directory) ya rellena.</li>
  <li>Clic en <strong>"Deploy"</strong>. Espera 1-2 minutos. Vercel hace <code>npm install</code>, <code>npm run build</code>, y publica.</li>
  <li>Te aparece tu URL: <code>tu-proyecto.vercel.app</code>. Esa URL es pública. La puedes abrir en cualquier navegador del mundo, mandarla por WhatsApp, ponerla en tu CV.</li>
</ol>
<p><em>Te lo firmo</em>: la primera vez que vees tu app corriendo en una URL pública con tu nombre, hay un momento de "guau, esto es real". Anótalo.</p>`,
              "soporte-m08-s2-pasos-deploy",
            ),
          },
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "info",
              `<p><strong>Auto-deploy en cada push.</strong> Desde ese momento, cada vez que hagas <code>git push</code> a la rama <code>main</code>, Vercel detecta el cambio, rebuildea, y actualiza la URL pública. Tú solo programas y haces push: el deploy es automático. Eso es lo que se llama <strong>"continuous deployment"</strong> (despliegue continuo) y es estándar en la industria moderna.</p>`,
              "soporte-m08-s2-tip-autodeploy",
            ),
          },

          // --- Variables de entorno ---
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Variables de entorno — cuándo las necesitas.</strong></p>
<p>Si tu proyecto integrador <strong>usa solo el mock interno</strong> (los datos vienen de un array en el código, como en M06), <em>no necesitas configurar nada más</em>. Saltas directo al deploy y funciona.</p>
<p>Si en algún momento conectas tu app a una API real (la URL de un backend, una API key de un servicio externo), <strong>no las pongas en el código</strong>. Las pones como "variables de entorno" en Vercel: en tu proyecto → Settings → Environment Variables → agregas <code>VITE_API_URL</code> y su valor. Vercel las inyecta en cada build.</p>
<p>Regla: cualquier cosa que <em>no</em> quieras que aparezca en GitHub (porque es secreta o porque cambia por entorno) va como variable de entorno. <em>Sin tabú</em>: una API key en el código público es de los errores más comunes y costosos. Te ahorra dolores de cabeza ponerla bien desde el principio.</p>`,
              "soporte-m08-s2-env-vars",
            ),
          },

          // --- Microvictoria + cierre del modulo ---
          {
            tipo: TipoBloque.TIP,
            esEvaluable: false,
            contenido: buildTip(
              "exito",
              `<p><strong>Tienes algo que mostrar al mundo.</strong> Una URL pública con tu nombre y tu código corriendo. Eso es lo que separa "estoy aprendiendo" de "ya construí algo". Tu CV cambia con esa URL en él. <em>Filo</em>.</p>`,
              "soporte-m08-s2-tip-mundo",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://vercel.com/docs/frameworks/vite",
              "Guía oficial: deploy de Vite en Vercel",
              "La doc oficial. Tres minutos de lectura, screenshots paso a paso. Si te trabas en algún paso, esta es la primera referencia.",
              "soporte-m08-s2-recurso-vercel",
            ),
          },
          {
            tipo: TipoBloque.RECURSO,
            esEvaluable: false,
            contenido: buildRecurso(
              "enlace",
              "https://vercel.com/dashboard",
              "Tu dashboard de Vercel",
              "Donde verás todos tus proyectos desplegados, sus URLs, los logs de cada deploy. Bookmark obligado.",
              "soporte-m08-s2-recurso-dashboard",
            ),
          },

          // --- Cierre del modulo + cierre del curso ---
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<hr/>
<p><strong>Cierre del Módulo 08.</strong></p>
<p>Lo que llevas:</p>
<ul>
  <li><strong>Método para leer errores</strong>: primera línea (qué), primera línea de tu código (dónde), ignorar el resto. Los 3 errores que vas a ver el 80% del tiempo, con su defensa.</li>
  <li><strong>Errores de TypeScript</strong> traducidos a humano. Tu primer test gratis antes de ejecutar nada.</li>
  <li><strong>Regla de los tres casos</strong>: típico + raro + límite. Tres tests bien elegidos atrapan más bugs que diez genéricos.</li>
  <li><strong>Una función pura validada</strong> con tres tests que tú escribiste y pasaron en verde.</li>
  <li><strong>Lint vs formato</strong>: el formateador es para el estilo, el linter para detectar problemas. Trabajan para ti.</li>
  <li><strong>Tu proyecto en una URL pública</strong> con deploy automático en cada push. Continuous deployment, estándar de la industria.</li>
</ul>`,
              "soporte-m08-s2-cierre-modulo",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>Y con esto cierras los 9 módulos del curso.</strong></p>
<p>Hace nueve módulos eras alguien de soporte que sabía leer logs y resolver tickets. Hoy:</p>
<ul>
  <li>Tienes <strong>Git</strong> como red de seguridad y no le tienes miedo a un merge.</li>
  <li>Entiendes <strong>cómo funciona la web por dentro</strong> — DOM, HTTP, request/response.</li>
  <li>Escribes <strong>JavaScript moderno</strong> con confianza: destructuring, map/filter, async/await, módulos.</li>
  <li>Usas <strong>TypeScript</strong> como cinturón de seguridad, no como obstáculo.</li>
  <li>Construyes <strong>componentes React</strong> con estado y entiendes la ecuación <code>UI = f(estado)</code>.</li>
  <li>Conectas <strong>React con datos del servidor</strong> usando Tanstack Query: loading, error, success, cache. Mozo entrenado en tu cocina.</li>
  <li>Usas <strong>IA como copiloto</strong> con método: contexto + tarea + restricciones + auditoría. No como oráculo.</li>
  <li>Tienes <strong>cinturón mínimo de calidad</strong> y una URL pública donde corre tu código.</li>
</ul>
<p>Eso es un perfil de <strong>dev frontend junior real</strong>. No es marketing del curso: es la suma honesta de lo que hiciste módulo a módulo.</p>`,
              "soporte-m08-s2-cierre-curso-lo-que-llevas",
            ),
          },
          {
            tipo: TipoBloque.PARRAFO,
            esEvaluable: false,
            contenido: buildParrafo(
              `<p><strong>El último paso: el proyecto integrador.</strong></p>
<p>Lo viste asomarse en cada módulo. Ahora es real. En la sección <strong>"Proyecto integrador"</strong> de tu plataforma encontrarás el brief completo del <strong>Mini Centro de Tickets</strong>: una app en React + TypeScript con lista filtrable, creación de tickets, Tanstack Query para los datos, Zod para los tipos, un test de un componente puro, y deploy a Vercel con URL pública. Integra los 9 módulos del curso.</p>
<p>Se evalúa en tres capas: el <strong>código</strong> (que esté limpio y tipado), <strong>la defensa</strong> (5 minutos explicando por qué decidiste lo que decidiste — el qué de tu app), y los <strong>tests</strong> (que pasen en verde lo que dijiste que pasaría). El peso está calibrado para que la conversación humana valga más que las pruebas automáticas: queremos saber si <em>entendiste</em>, no solo si copiaste.</p>
<p><em>Todavía no</em> está terminado. Pero ya tienes todo lo que necesitas: las herramientas, los hábitos, el método. Lo que sigue es ponerlos a trabajar.</p>
<p>Gracias por haber llegado hasta acá. <strong>Nos vemos al otro lado.</strong></p>`,
              "soporte-m08-s2-cierre-final",
            ),
          },
        ],
      },
    ],
  },
]
