// ============================================================
// apuestas.js — Lógica de apuestas combinadas TDT Mundial
// ============================================================

const PUNTOS_POR_STAT = {
  ganador  : 2,
  empate   : 1,
  marcador : 3,
  amarillas: 3,
  rojas    : 4,
  corners  : 2
};

const LABELS_STAT = {
  ganador  : "⚽ Equipo ganador",
  empate   : "🤝 Empate",
  marcador : "🎯 Marcador exacto",
  amarillas: "🟨 Tarjetas amarillas",
  rojas    : "🟥 Tarjetas rojas",
  corners  : "🚩 Tiros de esquina"
};

// ============================================================
// RENDERIZAR FORMULARIO DE APUESTA EN UN PARTIDO
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

  // Construir stats apostados actuales para pre-llenar
  const statsActuales = {};
  if (detalleExistente) {
    detalleExistente.forEach(d => { statsActuales[d.tipo_stat] = d.valor_apostado; });
  }

  const statsSeleccionados = Object.keys(statsActuales);
  const hayApuesta = apuestaExistente != null;

  return `
    <div class="apuestaForm" id="apuestaForm-${partido.id}">
      <div class="apuestaHeader">
        <span class="apuestaTitulo">Tu apuesta combinada</span>
        <span class="apuestaInfo">Falla uno → pierdes todo</span>
      </div>

      <div class="statsGrid">
        ${renderStatCheck("ganador",   partido, statsActuales)}
        ${renderStatCheck("empate",    partido, statsActuales)}
        ${renderStatCheck("marcador",  partido, statsActuales)}
        ${renderStatCheck("amarillas", partido, statsActuales)}
        ${renderStatCheck("rojas",     partido, statsActuales)}
        ${renderStatCheck("corners",   partido, statsActuales)}
      </div>

      <div class="apuestaFooter">
        <div class="puntosPreview" id="preview-${partido.id}">
          ${calcularPuntosPreview(statsSeleccionados)} pts posibles
        </div>
        <button
          class="btnApostar"
          onclick="guardarApuestaCompleta(${partido.id}, '${partido.equipo1}', '${partido.equipo2}')"
        >
          ${hayApuesta ? "✏️ Actualizar apuesta" : "💾 Guardar apuesta"}
        </button>
      </div>
    </div>
  `;
}

function renderStatCheck(tipo, partido, statsActuales) {
  const checked = statsActuales[tipo] !== undefined ? "checked" : "";
  const pts = PUNTOS_POR_STAT[tipo];
  const label = LABELS_STAT[tipo];
  const inputId = `stat-${tipo}-${partido.id}`;
  const checkId = `chk-${tipo}-${partido.id}`;

  let inputHtml = "";

  if (tipo === "ganador") {
    const val = statsActuales[tipo] || "";
    inputHtml = `
      <select class="statInput" id="${inputId}" onchange="actualizarPreview(${partido.id})">
        <option value="">-- Selecciona --</option>
        <option value="${partido.equipo1}" ${val === partido.equipo1 ? "selected" : ""}>${partido.equipo1}</option>
        <option value="${partido.equipo2}" ${val === partido.equipo2 ? "selected" : ""}>${partido.equipo2}</option>
      </select>
    `;
  } else if (tipo === "empate") {
    // Empate no necesita input extra
    inputHtml = `<span class="statFijo">Apuestas a empate</span>`;
  } else if (tipo === "marcador") {
    const val = statsActuales[tipo] || "";
    const [g1, g2] = val ? val.split("-") : ["", ""];
    inputHtml = `
      <div class="marcadorInput">
        <input type="number" min="0" max="20" class="statInput mini" id="${inputId}-g1"
          value="${g1}" placeholder="0" onchange="actualizarPreview(${partido.id})" />
        <span>-</span>
        <input type="number" min="0" max="20" class="statInput mini" id="${inputId}-g2"
          value="${g2}" placeholder="0" onchange="actualizarPreview(${partido.id})" />
      </div>
    `;
  } else {
    // amarillas, rojas, corners — número
    inputHtml = `
      <input type="number" min="0" max="30" class="statInput"
        id="${inputId}" value="${statsActuales[tipo] || ""}"
        placeholder="Cantidad" onchange="actualizarPreview(${partido.id})" />
    `;
  }

  return `
    <div class="statRow" id="row-${tipo}-${partido.id}">
      <label class="statCheckLabel">
        <input type="checkbox" id="${checkId}" ${checked}
          onchange="toggleStat('${tipo}', ${partido.id})"
        />
        <span class="statNombre">${label}</span>
        <span class="statPts">+${pts} pts</span>
      </label>
      <div class="statInputArea" id="area-${tipo}-${partido.id}"
        style="display:${checked ? "flex" : "none"}">
        ${inputHtml}
      </div>
    </div>
  `;
}

function renderApuestaRealizada(apuesta, detalle, partido) {
  const estadoClass = apuesta.estado === "ganada" ? "ganada" : apuesta.estado === "perdida" ? "perdida" : "pendiente";
  const estadoLabel = apuesta.estado === "ganada" ? "✅ Ganada" : apuesta.estado === "perdida" ? "❌ Perdida" : "⏳ Pendiente";

  let detalleHtml = detalle.map(d => `
    <div class="detalleItem">
      <span>${LABELS_STAT[d.tipo_stat]}</span>
      <span class="detalleValor">${d.valor_apostado}</span>
    </div>
  `).join("");

  return `
    <div class="apuestaRealizada ${estadoClass}">
      <div class="apuestaEstado">${estadoLabel}
        ${apuesta.estado === "ganada" ? `<span class="puntosGanados">+${apuesta.puntos_ganados} pts</span>` : ""}
      </div>
      <div class="apuestaDetalles">${detalleHtml}</div>
    </div>
  `;
}

// ============================================================
// TOGGLE STAT — mostrar/ocultar input al marcar checkbox
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
  const statsSeleccionados = Object.keys(PUNTOS_POR_STAT).filter(tipo =>
    document.getElementById(`chk-${tipo}-${partidoId}`)?.checked
  );
  const pts = calcularPuntosPreview(statsSeleccionados);
  const preview = document.getElementById(`preview-${partidoId}`);
  if (preview) preview.textContent = `${pts} pts posibles`;
}

function calcularPuntosPreview(statsSeleccionados) {
  return statsSeleccionados.reduce((sum, tipo) => sum + (PUNTOS_POR_STAT[tipo] || 0), 0);
}

// ============================================================
// GUARDAR APUESTA COMPLETA
// ============================================================
async function guardarApuestaCompleta(partidoId, equipo1, equipo2) {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario) { alert("Debes iniciar sesión"); return; }

  // Recoger stats seleccionados y sus valores
  const statsElegidos = [];

  for (const tipo of Object.keys(PUNTOS_POR_STAT)) {
    const chk = document.getElementById(`chk-${tipo}-${partidoId}`);
    if (!chk || !chk.checked) continue;

    let valor = "";

    if (tipo === "ganador") {
      valor = document.getElementById(`stat-ganador-${partidoId}`)?.value;
      if (!valor) { alert("Selecciona el equipo ganador"); return; }
    } else if (tipo === "empate") {
      valor = "empate";
    } else if (tipo === "marcador") {
      const g1 = document.getElementById(`stat-marcador-${partidoId}-g1`)?.value;
      const g2 = document.getElementById(`stat-marcador-${partidoId}-g2`)?.value;
      if (g1 === "" || g2 === "") { alert("Ingresa el marcador completo"); return; }
      valor = `${g1}-${g2}`;
    } else {
      valor = document.getElementById(`stat-${tipo}-${partidoId}`)?.value;
      if (valor === "") { alert(`Ingresa un valor para ${LABELS_STAT[tipo]}`); return; }
    }

    statsElegidos.push({ tipo_stat: tipo, valor_apostado: valor });
  }

  if (statsElegidos.length === 0) {
    alert("Selecciona al menos un stat para apostar");
    return;
  }

  // Validar que no mezclen ganador + empate
  const tieneGanador = statsElegidos.some(s => s.tipo_stat === "ganador");
  const tieneEmpate  = statsElegidos.some(s => s.tipo_stat === "empate");
  if (tieneGanador && tieneEmpate) {
    alert("No puedes apostar a ganador y empate al mismo tiempo");
    return;
  }

  const btn = document.querySelector(`#apuestaForm-${partidoId} .btnApostar`);
  btn.disabled = true;
  btn.textContent = "Guardando...";

  try {
    // 1. Upsert apuesta principal
    const { data: apuestaData, error: err1 } = await db
      .from("apuestas")
      .upsert({ usuario_id: usuario.user, partido_id: partidoId, estado: "pendiente", puntos_ganados: 0 },
               { onConflict: "usuario_id,partido_id" })
      .select()
      .single();

    if (err1) throw err1;

    const apuestaId = apuestaData.id;

    // 2. Borrar detalles anteriores y reinsertar
    const { error: err2 } = await db
      .from("apuestas_detalle")
      .delete()
      .eq("apuesta_id", apuestaId);

    if (err2) throw err2;

    const detalles = statsElegidos.map(s => ({ apuesta_id: apuestaId, ...s }));
    const { error: err3 } = await db.from("apuestas_detalle").insert(detalles);
    if (err3) throw err3;

    btn.textContent = "✅ Apuesta guardada";
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = "✏️ Actualizar apuesta";
    }, 2000);

  } catch (err) {
    console.error(err);
    alert("Error al guardar: " + err.message);
    btn.disabled = false;
    btn.textContent = "💾 Guardar apuesta";
  }
}

// ============================================================
// CARGAR APUESTAS EXISTENTES DEL USUARIO PARA UN GRUPO
// ============================================================
async function cargarApuestasUsuario(usuarioId, partidoIds) {
  if (!usuarioId || partidoIds.length === 0) return { apuestas: {}, detalles: {} };

  const ids = partidoIds.join(",");

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

  // Mapas para acceso rápido
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
