// HTML serializado de Tiptap para los bloques de lectura del mock. Se separa
// del archivo principal del mock para mantener < 150 lineas y para que el
// contenido editorial sea facil de revisar.

export const CUERPO_INTRO = `
<h2>Estrategias de Branching modernas</h2>
<p>El modelo de <strong>feature branches</strong> es la estrategia mas utilizada
en equipos modernos de desarrollo. Cada funcionalidad se desarrolla en una rama
independiente que se integra al tronco principal mediante pull requests.</p>
<h3>Convenciones de naming</h3>
<p>Las ramas siguen un patron predecible que comunica intencion sin ambiguedad:</p>
<ul>
  <li><code>feature/NXL-123-add-login-form</code></li>
  <li><code>bugfix/NXL-456-fix-null-pointer</code></li>
  <li><code>hotfix/NXL-789-security-patch</code></li>
</ul>
<p>Cada tipo de rama tiene un <em>lifecycle</em> distinto y compromisos
distintos con el equipo.</p>
`.trim()

export const CUERPO_DETALLE = `
<h2>Git Flow vs Trunk-Based</h2>
<p>Existen dos grandes filosofias en la industria:</p>
<h3>Git Flow</h3>
<p>Modelo con ramas <code>main</code>, <code>develop</code>, <code>release/*</code>
y <code>hotfix/*</code>. Util cuando hay <strong>multiples versiones en
produccion</strong> simultaneamente.</p>
<h3>Trunk-Based Development</h3>
<p>Todo se integra rapido a una sola rama <code>main</code>. Ramas de feature
viven menos de 24 horas. Requiere disciplina alta y feature flags maduros.</p>
<p>La eleccion no es ideologica: depende del equipo, el tipo de producto y la
cadencia de release que el negocio necesita sostener.</p>
`.trim()

export const CUERPO_CIERRE = `
<h2>Cuando elegir cada estrategia</h2>
<p>No hay respuesta universal. Hay tres preguntas que conviene contestar antes
de definir la estrategia del equipo:</p>
<ol>
  <li>Cuantas versiones tienes que mantener vivas en paralelo.</li>
  <li>Que tan frecuente es tu ciclo de deploy a produccion.</li>
  <li>Que tanta confianza tienes en tu suite de tests automaticos.</li>
</ol>
<p>Si las tres apuntan al continuo (una version, deploy diario, tests solidos)
trunk-based gana. Si alguna empuja a discreto (multiples versiones, deploys
semanales, tests fragiles) Git Flow tiene mas sentido.</p>
`.trim()
