// ============================================================
// apuestas.js — Lógica de apuestas combinadas TDT Mundial
// ============================================================

const PUNTOS_POR_STAT = {
  resultado: 2,  // ganador o empate
  marcador : 3,
  amarillas: 3,
  rojas    : 4,
  corners  : 2
};

// ============================================================
// RENDERIZAR FORMULARIO DE APUESTA
// ============================================================
function renderFormApuesta(partido, apuestaExistente, detalleExistente) {
  const bloqueado = new Date(partido.fecha) <= new Date();
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  if (!usuario) {
    return `<div class="apuestaBloqueada">🔒 Inicia sesión para apostar</div>`;
  }

  if (bloqueado) {
    if (apuestaExistente) {
      return renderApuestaRealizada(apuestaExistente, detalleExistente, partido);
    }
    return `<div class="apuestaBloqueada">⏱ Partido iniciado — apuestas cerradas</div>`;
  }

  // Pre-cargar valores existentes
  const statsActuales = {};
  if (detalleExistente) {
    detalleExistente.forEach(d => { statsActuales[d.tipo_stat] = d.valor_apostado; });
  }

  const resultadoActual = statsActuales["resultado"] || ""; // "equipo1" | "empate" | "equipo2"
  const marcadorActual  = statsActuales["marcador"]  || "";
  const [mg1, mg2] = marcadorActual ? marcadorActual.split("-") : ["", ""];

  const chkMarcador  = !!statsActuales["marcador"];
  const chkAmarillas = !!statsActuales["amarillas"];
  const chkRojas     = !!statsActuales["rojas"];
  const chkCorners   = !!statsActuales["corners"];

  const hayApuesta = !!apuestaExistente;

  return `
    <div class="apuestaForm" id="apuestaForm-${partido.id}">
      <div class="apuestaHeader">
        <span class="apuestaTitulo">Tu apuesta combinada</span>
        <span class="apuestaInfo">Falla uno → pierdes todo</span>
      </div>

      <!-- RESULTADO: radio buttons -->
      <div class="statRow">
        <div class="statCheckLabel">
          <span class="statNombre">⚽ Resultado del partido</span>
          <span class="statPts">+2 pts</span>
        </div>
        <div class="resultadoOpciones">
          <label class="radioOpcion ${resultadoActual === "equipo1" ? "seleccionada" : ""}">
            <input type="radio" name="resultado-${partido.id}" value="equipo1"
              ${resultadoActual === "equipo1" ? "checked" : ""}
              onchange="onResultadoChange(${partido.id})" />
            ${partido.equipo1}
          </label>
          <label class="radioOpcion ${resultadoActual === "empate" ? "seleccionada" : ""}">
            <input type="radio" name="resultado-${partido.id}" value="empate"
              ${resultadoActual === "empate" ? "checked" : ""}
              onchange="onResultadoChange(${partido.id})" />
            Empate
          </label>
          <label class="radioOpcion ${resultadoActual === "equipo2" ? "seleccionada" : ""}">
            <input type="radio" name="resultado-${partido.id}" value="equipo2"
              ${resultadoActual === "equipo2" ? "checked" : ""}
              onchange="onResultadoChange(${partido.id})" />
            ${partido.equipo2}
          </label>
        </div>
      </div>

      <!-- MARCADOR EXACTO -->
      <div class="statRow" id="rowMarcador-${partido.id}"
        style="${resultadoActual === "empate" ? "opacity:0.4;pointer-events:none;" : ""}">
        <label class="statCheckLabel">
          <input type="checkbox" id="chk-marcador-${partido.id}"
            ${chkMarcador ? "checked" : ""}
            ${resultadoActual === "empate" ? "disabled" : ""}
            onchange="toggleStat('marcador', ${partido.id})" />
          <span class="statNombre">🎯 Marcador exacto</span>
          <span class="statPts">+3 pts</span>
        </label>
        <div class="statInputArea" id="area-marcador-${partido.id}"
          style="display:${chkMarcador ? "flex" : "none"}">
          <div class="marcadorInput">
            <input type="number" min="0" max="20" class="statInput mini"
              id="stat-marcador-${partido.id}-g1" value="${mg1}" placeholder="0"
              onchange="validarMarcador(${partido.id})" />
            <span>-</span>
            <input type="number" min="0" max="20" class="statInput mini"
              id="stat-marcador-${partido.id}-g2" value="${mg2}" placeholder="0"
              onchange="validarMarcador(${partido.id})" />
          </div>
          <span class="marcadorError" id="errorMarcador-${partido.id}"></span>
        </div>
      </div>

      <!-- AMARILLAS -->
      <div class="statRow">
        <label class="statCheckLabel">
          <input type="checkbox" id="chk-amarillas-${partido.id}"
            ${chkAmarillas ? "checked" : ""}
            onchange="toggleStat('amarillas', ${partido.id})" />
          <span class="statNombre">🟨 Tarjetas amarillas</span>
          <span class="statPts">+3 pts</span>
        </label>
        <div class="statInputArea" id="area-amarillas-${partido.id}"
          style="display:${chkAmarillas ? "flex" : "none"}">
          <input type="number" min="0" max="30" class="statInput"
            id="stat-amarillas-${partido.id}"
            value="${statsActuales["amarillas"] || ""}" placeholder="Cantidad" />
        </div>
      </div>

      <!-- ROJAS -->
      <div class="statRow">
        <label class="statCheckLabel">
          <input type="checkbox" id="chk-rojas-${partido.id}"
            ${chkRojas ? "checked" : ""}
            onchange="toggleStat('rojas', ${partido.id})" />
          <span class="statNombre">🟥 Tarjetas rojas</span>
          <span class="statPts">+4 pts</span>
        </label>
        <div class="statInputArea" id="area-rojas-${partido.id}"
          style="display:${chkRojas ? "flex" : "none"}">
          <input type="number" min="0" max="10" class="statInput"
            id="stat-rojas-${partido.id}"
            value="${statsActuales["rojas"] || ""}" placeholder="Cantidad" />
        </div>
      </div>

      <!-- CORNERS -->
      <div class="statRow">
        <label class="statCheckLabel">
          <input type="checkbox" id="chk-corners-${partido.id}"
            ${chkCorners ? "checked" : ""}
            onchange="toggleStat('corners', ${partido.id})" />
          <span class="statNombre">🚩 Tiros de esquina</span>
          <span class="statPts">+2 pts</span>
        </label>
        <div class="statInputArea" id="area-corners-${partido.id}"
          style="display:${chkCorners ? "flex" : "none"}">
          <input type="number" min="0" max="30" class="statInput"
            id="stat-corners-${partido.id}"
            value="${statsActuales["corners"] || ""}" placeholder="Cantidad" />
        </div>
      </div>

      <div class="apuestaFooter">
        <div class="puntosPreview" id="preview-${partido.id}">
          ${calcularPuntosPreview(partido.id)} pts posibles
        </div>
        <button class="btnApostar"
          onclick="guardarApuestaCompleta(${partido.id}, '${partido.equipo1}', '${partido.equipo2}')">
          ${hayApuesta ? "✏️ Actualizar apuesta" : "💾 Guardar apuesta"}
        </button>
      </div>
    </div>
  `;
}

// ============================================================
// CUANDO CAMBIA EL RESULTADO (radio)
// ============================================================
function onResultadoChange(partidoId) {
  const resultado = document.querySelector(`input[name="resultado-${partidoId}"]:checked`)?.value;

  const rowMarcador  = document.getElementById(`rowMarcador-${partidoId}`);
  const chkMarcador  = document.getElementById(`chk-marcador-${partidoId}`);
  const areaMarcador = document.getElementById(`area-marcador-${partidoId}`);

  if (resultado === "empate") {
    // Bloquear marcador
    rowMarcador.style.opacity = "0.4";
    rowMarcador.style.pointerEvents = "none";
    chkMarcador.checked = false;
    chkMarcador.disabled = true;
    areaMarcador.style.display = "none";
  } else {
    // Habilitar marcador
    rowMarcador.style.opacity = "1";
    rowMarcador.style.pointerEvents = "auto";
    chkMarcador.disabled = false;
    // Si marcador estaba abierto, revalidar
    if (chkMarcador.checked) validarMarcador(partidoId);
  }

  // Actualizar estilos de radio
  document.querySelectorAll(`input[name="resultado-${partidoId}"]`).forEach(radio => {
    radio.closest(".radioOpcion").classList.toggle("seleccionada", radio.checked);
  });

  actualizarPreview(partidoId);
}

// ============================================================
// VALIDAR MARCADOR CONSISTENTE CON RESULTADO
// ============================================================
function validarMarcador(partidoId) {
  const resultado = document.querySelector(`input[name="resultado-${partidoId}"]:checked`)?.value;
  const g1 = parseInt(document.getElementById(`stat-marcador-${partidoId}-g1`)?.value);
  const g2 = parseInt(document.getElementById(`stat-marcador-${partidoId}-g2`)?.value);
  const errorEl = document.getElementById(`errorMarcador-${partidoId}`);

  if (!errorEl || isNaN(g1) || isNaN(g2)) return true;

  let error = "";

  if (resultado === "equipo1" && g1 <= g2) {
    error = "⚠ El marcador debe mostrar que gana el equipo 1";
  } else if (resultado === "equipo2" && g2 <= g1) {
    error = "⚠ El marcador debe mostrar que gana el equipo 2";
  }

  errorEl.textContent = error;
  return error === "";
}

// ============================================================
// TOGGLE STAT
// ============================================================
function toggleStat(tipo, partidoId) {
  const checked = document.getElementById(`chk-${tipo}-${partidoId}`).checked;
  const area = document.getElementById(`area-${tipo}-${partidoId}`);
  area.style.display = checked ? "flex" : "none";
  actualizarPreview(partidoId);
}

// ============================================================
// PREVIEW DE PUNTOS
// ============================================================
function actualizarPreview(partidoId) {
  const preview = document.getElementById(`preview-${partidoId}`);
  if (preview) preview.textContent = `${calcularPuntosPreview(partidoId)} pts posibles`;
}

function calcularPuntosPreview(partidoId) {
  let pts = 0;
  const resultado = document.querySelector(`input[name="resultado-${partidoId}"]:checked`);
  if (resultado) pts += PUNTOS_POR_STAT["resultado"];

  ["marcador","amarillas","rojas","corners"].forEach(tipo => {
    const chk = document.getElementById(`chk-${tipo}-${partidoId}`);
    if (chk?.checked) pts += PUNTOS_POR_STAT[tipo] || 0;
  });

  return pts;
}

// ============================================================
// GUARDAR APUESTA
// ============================================================
async function guardarApuestaCompleta(partidoId, equipo1, equipo2) {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario) { alert("Debes iniciar sesión"); return; }

  const resultadoRaw = document.querySelector(`input[name="resultado-${partidoId}"]:checked`)?.value;
  if (!resultadoRaw) { alert("Selecciona el resultado del partido"); return; }

  const statsElegidos = [];

  // Resultado (ganador o empate)
  let valorResultado = "";
  if (resultadoRaw === "empate") {
    valorResultado = "empate";
  } else if (resultadoRaw === "equipo1") {
    valorResultado = equipo1;
  } else {
    valorResultado = equipo2;
  }
  statsElegidos.push({ tipo_stat: "resultado", valor_apostado: valorResultado });

  // Marcador
  const chkMarcador = document.getElementById(`chk-marcador-${partidoId}`);
  if (chkMarcador?.checked) {
    if (!validarMarcador(partidoId)) { alert("El marcador no es consistente con el resultado"); return; }
    const g1 = document.getElementById(`stat-marcador-${partidoId}-g1`)?.value;
    const g2 = document.getElementById(`stat-marcador-${partidoId}-g2`)?.value;
    if (g1 === "" || g2 === "") { alert("Ingresa el marcador completo"); return; }
    statsElegidos.push({ tipo_stat: "marcador", valor_apostado: `${g1}-${g2}` });
  }

  // Amarillas, rojas, corners
  for (const tipo of ["amarillas","rojas","corners"]) {
    const chk = document.getElementById(`chk-${tipo}-${partidoId}`);
    if (!chk?.checked) continue;
    const val = document.getElementById(`stat-${tipo}-${partidoId}`)?.value;
    if (val === "") { alert(`Ingresa un valor para ${tipo}`); return; }
    statsElegidos.push({ tipo_stat: tipo, valor_apostado: val });
  }

  const btn = document.querySelector(`#apuestaForm-${partidoId} .btnApostar`);
  btn.disabled = true;
  btn.textContent = "Guardando...";

  try {
    const { data: apuestaData, error: err1 } = await db
      .from("apuestas")
      .upsert(
        { usuario_id: usuario.user, partido_id: partidoId, estado: "pendiente", puntos_ganados: 0 },
        { onConflict: "usuario_id,partido_id" }
      )
      .select()
      .single();

    if (err1) throw err1;

    await db.from("apuestas_detalle").delete().eq("apuesta_id", apuestaData.id);
    const detalles = statsElegidos.map(s => ({ apuesta_id: apuestaData.id, ...s }));
    const { error: err3 } = await db.from("apuestas_detalle").insert(detalles);
    if (err3) throw err3;

    btn.textContent = "✅ Apuesta guardada";
    setTimeout(() => { btn.disabled = false; btn.textContent = "✏️ Actualizar apuesta"; }, 2000);

  } catch (err) {
    console.error(err);
    alert("Error al guardar: " + err.message);
    btn.disabled = false;
    btn.textContent = "💾 Guardar apuesta";
  }
}

// ============================================================
// APUESTA YA REALIZADA (partido bloqueado)
// ============================================================
function renderApuestaRealizada(apuesta, detalle, partido) {
  const estadoClass = apuesta.estado === "ganada" ? "ganada" : apuesta.estado === "perdida" ? "perdida" : "pendiente";
  const estadoLabel = apuesta.estado === "ganada" ? "✅ Ganada" : apuesta.estado === "perdida" ? "❌ Perdida" : "⏳ Pendiente";

  const LABELS = {
    resultado: "⚽ Resultado",
    marcador : "🎯 Marcador exacto",
    amarillas: "🟨 Amarillas",
    rojas    : "🟥 Rojas",
    corners  : "🚩 Corners"
  };

  const detalleHtml = (detalle || []).map(d => `
    <div class="detalleItem">
      <span>${LABELS[d.tipo_stat] || d.tipo_stat}</span>
      <span class="detalleValor">${d.valor_apostado}</span>
    </div>
  `).join("");

  return `
    <div class="apuestaRealizada ${estadoClass}">
      <div class="apuestaEstado">${estadoLabel}
        ${apuesta.estado === "ganada"
          ? `<span class="puntosGanados">+${apuesta.puntos_ganados} pts</span>`
          : ""}
      </div>
      <div class="apuestaDetalles">${detalleHtml}</div>
    </div>
  `;
}

// ============================================================
// CARGAR APUESTAS EXISTENTES DEL USUARIO
// ============================================================
async function cargarApuestasUsuario(usuarioId, partidoIds) {
  if (!usuarioId || partidoIds.length === 0) return { apuestas: {}, detalles: {} };

  const { data: apuestas } = await db
    .from("apuestas")
    .select("*")
    .eq("usuario_id", usuarioId)
    .in("partido_id", partidoIds);

  if (!apuestas || apuestas.length === 0) return { apuestas: {}, detalles: {} };

  const apuestaIds = apuestas.map(a => a.id);
  const { data: detalles } = await db
    .from("apuestas_detalle")
    .select("*")
    .in("apuesta_id", apuestaIds);

  const apuestasMap = {};
  apuestas.forEach(a => { apuestasMap[a.partido_id] = a; });

  const detallesMap = {};
  (detalles || []).forEach(d => {
    const apuesta = apuestas.find(a => a.id === d.apuesta_id);
    if (apuesta) {
      if (!detallesMap[apuesta.partido_id]) detallesMap[apuesta.partido_id] = [];
      detallesMap[apuesta.partido_id].push(d);
    }
  });

  return { apuestas: apuestasMap, detalles: detallesMap };
}
