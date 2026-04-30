// ============================================================
// apuestas.js — Lógica de apuestas combinadas TDT Mundial
// ============================================================

const PUNTOS_RESULTADO = 2;
const PUNTOS_MARCADOR  = 3;
const PUNTOS_ROJAS     = 4;

const OPCIONES_AMARILLAS = [
  { valor: "mas3", label: "Más de 3",  pts: 1 },
  { valor: "mas5", label: "Más de 5",  pts: 2 },
  { valor: "mas6", label: "Más de 6",  pts: 3 },
  { valor: "mas8", label: "Más de 8",  pts: 4 },
];

const OPCIONES_CORNERS = [
  { valor: "cero",  label: "0 corners <span class='cornersAviso'>(sin tiros de esquina en todo el partido)</span>", pts: 5 },
  { valor: "mas10", label: "Más de 10", pts: 1 },
  { valor: "mas12", label: "Más de 12", pts: 2 },
  { valor: "mas16", label: "Más de 16", pts: 3 },
];

// Guarda qué estaba seleccionado ANTES del click para poder deseleccionar
let _radioAntes = {};

function recordarRadio(tipo, partidoId) {
  const checked = document.querySelector(`input[name="${tipo}-${partidoId}"]:checked`);
  _radioAntes[`${tipo}-${partidoId}`] = checked ? checked.value : null;
}

function toggleRadio(tipo, partidoId, valor) {
  const key   = `${tipo}-${partidoId}`;
  const radio = document.querySelector(`input[name="${key}"][value="${valor}"]`);
  if (!radio) return;
  if (_radioAntes[key] === valor) {
    setTimeout(() => {
      radio.checked = false;
      radio.closest(".radioOpcion").classList.remove("seleccionada");
      actualizarPreview(partidoId);
    }, 0);
  }
  _radioAntes[key] = null;
}

function toggleRadioResultado(partidoId, valor) {
  const key   = `resultado-${partidoId}`;
  const radio = document.querySelector(`input[name="${key}"][value="${valor}"]`);
  if (!radio) return;
  if (_radioAntes[key] === valor) {
    setTimeout(() => {
      radio.checked = false;
      radio.closest(".radioOpcion").classList.remove("seleccionada");
      const rowMarcador = document.getElementById(`rowMarcador-${partidoId}`);
      const chkMarcador = document.getElementById(`chk-marcador-${partidoId}`);
      if (rowMarcador) { rowMarcador.style.opacity = "1"; rowMarcador.style.pointerEvents = "auto"; }
      if (chkMarcador) { chkMarcador.disabled = false; }
      actualizarPreview(partidoId);
    }, 0);
  }
  _radioAntes[key] = null;
}

// ============================================================
// RENDER FORMULARIO
// ============================================================
function renderFormApuesta(partido, apuestaExistente, detalleExistente) {
  const bloqueado = new Date(partido.fecha) <= new Date();
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  if (!usuario) return `<div class="apuestaBloqueada">🔒 Inicia sesión para apostar</div>`;
  if (bloqueado) {
    if (apuestaExistente) return renderApuestaRealizada(apuestaExistente, detalleExistente, partido);
    return `<div class="apuestaBloqueada">⏱ Partido iniciado — apuestas cerradas</div>`;
  }
  // Si ya tiene apuesta guardada y el partido aún no inicia → mostrar resumen editable
  if (apuestaExistente) return renderApuestaGuardada(apuestaExistente, detalleExistente, partido);

  const statsActuales = {};
  if (detalleExistente) detalleExistente.forEach(d => { statsActuales[d.tipo_stat] = d.valor_apostado; });

  const resultadoActual = statsActuales["resultado"] || "";
  const marcadorActual  = statsActuales["marcador"]  || "";
  const [mg1, mg2]      = marcadorActual ? marcadorActual.split("-") : ["", ""];
  const amarillaActual  = statsActuales["amarillas"] || "";
  const rojaActual      = statsActuales["rojas"]     || "";
  const cornerActual    = statsActuales["corners"]   || "";

  const chkMarcador  = !!statsActuales["marcador"];
  const chkAmarillas = !!statsActuales["amarillas"];
  const chkRojas     = !!statsActuales["rojas"];
  const chkCorners   = !!statsActuales["corners"];

  // Radio buttons amarillas
  const radiosAmarillas = OPCIONES_AMARILLAS.map(op => {
    const sel = amarillaActual === op.valor ? "seleccionada" : "";
    const chk = amarillaActual === op.valor ? "checked" : "";
    return `
      <label class="radioOpcion ${sel}" onmousedown="recordarRadio('amarillas', ${partido.id})">
        <input type="radio" name="amarillas-${partido.id}" value="${op.valor}" ${chk}
          onclick="toggleRadio('amarillas', ${partido.id}, '${op.valor}')"
          onchange="onRadioChange('amarillas', ${partido.id})" />
        ${op.label} <span class="opcionPts">+${op.pts}pts</span>
      </label>`;
  }).join("");

  // Radio buttons corners
  const radiosCorners = OPCIONES_CORNERS.map(op => {
    const sel = cornerActual === op.valor ? "seleccionada" : "";
    const chk = cornerActual === op.valor ? "checked" : "";
    return `
      <label class="radioOpcion ${sel}" onmousedown="recordarRadio('corners', ${partido.id})">
        <input type="radio" name="corners-${partido.id}" value="${op.valor}" ${chk}
          onclick="toggleRadio('corners', ${partido.id}, '${op.valor}')"
          onchange="onRadioChange('corners', ${partido.id})" />
        ${op.label} <span class="opcionPts">+${op.pts}pts</span>
      </label>`;
  }).join("");

  const esEmpateActual = resultadoActual === "empate";
  const opacityMarcador = esEmpateActual ? "opacity:0.4;pointer-events:none;" : "";

  return `
    <div class="apuestaForm" id="apuestaForm-${partido.id}">
      <div class="apuestaHeader">
        <span class="apuestaTitulo">Tu apuesta combinada</span>
        <span class="apuestaInfo">Falla uno → pierdes todo</span>
      </div>

      <!-- RESULTADO -->
      <div class="statRow">
        <div class="statCheckLabel">
          <span class="statNombre">⚽ Resultado del partido</span>
          <span class="statPts">+${PUNTOS_RESULTADO} pts</span>
        </div>
        <div class="resultadoOpciones">
          <label class="radioOpcion ${resultadoActual === "equipo1" ? "seleccionada" : ""}"
            onmousedown="recordarRadio('resultado', ${partido.id})">
            <input type="radio" name="resultado-${partido.id}" value="equipo1"
              ${resultadoActual === "equipo1" ? "checked" : ""}
              onclick="toggleRadioResultado(${partido.id}, 'equipo1')"
              onchange="onResultadoChange(${partido.id})" />
            ${partido.equipo1}
          </label>
          <label class="radioOpcion ${resultadoActual === "empate" ? "seleccionada" : ""}"
            onmousedown="recordarRadio('resultado', ${partido.id})">
            <input type="radio" name="resultado-${partido.id}" value="empate"
              ${resultadoActual === "empate" ? "checked" : ""}
              onclick="toggleRadioResultado(${partido.id}, 'empate')"
              onchange="onResultadoChange(${partido.id})" />
            Empate
          </label>
          <label class="radioOpcion ${resultadoActual === "equipo2" ? "seleccionada" : ""}"
            onmousedown="recordarRadio('resultado', ${partido.id})">
            <input type="radio" name="resultado-${partido.id}" value="equipo2"
              ${resultadoActual === "equipo2" ? "checked" : ""}
              onclick="toggleRadioResultado(${partido.id}, 'equipo2')"
              onchange="onResultadoChange(${partido.id})" />
            ${partido.equipo2}
          </label>
        </div>
      </div>

      <!-- MARCADOR EXACTO -->
       <div class="statRow" id="rowMarcador-${partido.id}" style="${esEmpateActual || !resultadoActual ? "opacity:0.4;pointer-events:none;" : ""}">
        <label class="statCheckLabel">
          <input type="checkbox" id="chk-marcador-${partido.id}"
            ${chkMarcador ? "checked" : ""}
            ${esEmpateActual ? "disabled" : ""}
            onchange="toggleStat('marcador', ${partido.id})" />
          <span class="statNombre">🎯 Marcador exacto</span>
          <span class="statPts">+${PUNTOS_MARCADOR} pts</span>
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
        </label>
        <div class="statInputArea opcionesWrap" id="area-amarillas-${partido.id}"
          style="display:${chkAmarillas ? "flex" : "none"}">
          ${radiosAmarillas}
        </div>
      </div>

      <!-- ROJAS -->
      <div class="statRow">
        <label class="statCheckLabel">
          <input type="checkbox" id="chk-rojas-${partido.id}"
            ${chkRojas ? "checked" : ""}
            onchange="toggleStat('rojas', ${partido.id})" />
          <span class="statNombre">🟥 Tarjetas rojas</span>
          <span class="statPts">+${PUNTOS_ROJAS} pts</span>
        </label>
        <div class="statInputArea" id="area-rojas-${partido.id}"
          style="display:${chkRojas ? "flex" : "none"}">
          <input type="number" min="1" max="10" class="statInput"
            id="stat-rojas-${partido.id}"
            value="${rojaActual || ""}" placeholder="Mín. 1" />
          <span class="inputHint">Mínimo 1 roja</span>
        </div>
      </div>

      <!-- CORNERS -->
      <div class="statRow">
        <label class="statCheckLabel">
          <input type="checkbox" id="chk-corners-${partido.id}"
            ${chkCorners ? "checked" : ""}
            onchange="toggleStat('corners', ${partido.id})" />
          <span class="statNombre">🚩 Tiros de esquina</span>
        </label>
        <div class="statInputArea opcionesWrap" id="area-corners-${partido.id}"
          style="display:${chkCorners ? "flex" : "none"}">
          ${radiosCorners}
        </div>
      </div>

      <div class="apuestaFooter">
        <div class="puntosPreview" id="preview-${partido.id}">
          ${calcularPuntosPreview(partido.id)} pts posibles
        </div>
        <button class="btnApostar"
          onclick="guardarApuestaCompleta(${partido.id}, '${partido.equipo1}', '${partido.equipo2}')">
          💾 Guardar apuesta
        </button>
      </div>
    </div>`;
}

// ============================================================
// EVENTOS DE RADIO
// ============================================================
function onResultadoChange(partidoId) {
  const resultado    = document.querySelector(`input[name="resultado-${partidoId}"]:checked`)?.value;
  const rowMarcador  = document.getElementById(`rowMarcador-${partidoId}`);
  const chkMarcador  = document.getElementById(`chk-marcador-${partidoId}`);
  const areaMarcador = document.getElementById(`area-marcador-${partidoId}`);

  if (resultado === "empate") {
    rowMarcador.style.opacity = "0.4";
    rowMarcador.style.pointerEvents = "none";
    chkMarcador.checked = false;
    chkMarcador.disabled = true;
    areaMarcador.style.display = "none";
  } else if (resultado) {
    rowMarcador.style.opacity = "1";
    rowMarcador.style.pointerEvents = "auto";
    chkMarcador.disabled = false;
  } else {
    // Se deseleccionó el resultado — bloquear marcador
    rowMarcador.style.opacity = "0.4";
    rowMarcador.style.pointerEvents = "none";
    chkMarcador.checked = false;
    chkMarcador.disabled = true;
    document.getElementById(`area-marcador-${partidoId}`).style.display = "none";
  }

  document.querySelectorAll(`input[name="resultado-${partidoId}"]`).forEach(r => {
    r.closest(".radioOpcion").classList.toggle("seleccionada", r.checked);
  });

  actualizarPreview(partidoId);
}

function onRadioChange(tipo, partidoId) {
  document.querySelectorAll(`input[name="${tipo}-${partidoId}"]`).forEach(r => {
    r.closest(".radioOpcion").classList.toggle("seleccionada", r.checked);
  });
  actualizarPreview(partidoId);
}

// ============================================================
// VALIDAR MARCADOR
// ============================================================
function validarMarcador(partidoId) {
  const resultado = document.querySelector(`input[name="resultado-${partidoId}"]:checked`)?.value;
  const g1 = parseInt(document.getElementById(`stat-marcador-${partidoId}-g1`)?.value);
  const g2 = parseInt(document.getElementById(`stat-marcador-${partidoId}-g2`)?.value);
  const errorEl = document.getElementById(`errorMarcador-${partidoId}`);
  if (!errorEl || isNaN(g1) || isNaN(g2)) return true;

  let error = "";
  if (resultado === "equipo1" && g1 <= g2) error = "⚠ El marcador debe mostrar que gana el equipo 1";
  else if (resultado === "equipo2" && g2 <= g1) error = "⚠ El marcador debe mostrar que gana el equipo 2";

  errorEl.textContent = error;
  return error === "";
}

// ============================================================
// TOGGLE STAT
// ============================================================
function toggleStat(tipo, partidoId) {
  const checked = document.getElementById(`chk-${tipo}-${partidoId}`).checked;
  document.getElementById(`area-${tipo}-${partidoId}`).style.display = checked ? "flex" : "none";
  actualizarPreview(partidoId);
}

// ============================================================
// PREVIEW PUNTOS
// ============================================================
function actualizarPreview(partidoId) {
  const preview = document.getElementById(`preview-${partidoId}`);
  if (preview) preview.textContent = `${calcularPuntosPreview(partidoId)} pts posibles`;
}

function calcularPuntosPreview(partidoId) {
  let pts = 0;
  if (document.querySelector(`input[name="resultado-${partidoId}"]:checked`)) pts += PUNTOS_RESULTADO;

  const chkM = document.getElementById(`chk-marcador-${partidoId}`);
  if (chkM?.checked) pts += PUNTOS_MARCADOR;

  const chkA = document.getElementById(`chk-amarillas-${partidoId}`);
  if (chkA?.checked) {
    const op = OPCIONES_AMARILLAS.find(o => o.valor === document.querySelector(`input[name="amarillas-${partidoId}"]:checked`)?.value);
    if (op) pts += op.pts;
  }

  const chkR = document.getElementById(`chk-rojas-${partidoId}`);
  if (chkR?.checked) pts += PUNTOS_ROJAS;

  const chkC = document.getElementById(`chk-corners-${partidoId}`);
  if (chkC?.checked) {
    const op = OPCIONES_CORNERS.find(o => o.valor === document.querySelector(`input[name="corners-${partidoId}"]:checked`)?.value);
    if (op) pts += op.pts;
  }

  return pts;
}

// ============================================================
// GUARDAR APUESTA
// ============================================================
async function guardarApuestaCompleta(partidoId, equipo1, equipo2) {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (!usuario) { alert("Debes iniciar sesión"); return; }

  const resultadoRaw = document.querySelector(`input[name="resultado-${partidoId}"]:checked`)?.value;

  // Si no hay resultado seleccionado, el marcador exacto no tiene sentido
  const chkMarcadorSinResultado = document.getElementById(`chk-marcador-${partidoId}`);
  if (!resultadoRaw && chkMarcadorSinResultado?.checked) {
    alert("Para apostar al marcador exacto debes seleccionar primero el resultado del partido");
    return;
  }

  const statsElegidos = [];

if (resultadoRaw) {
  const valorResultado = resultadoRaw === "empate" ? "empate"
    : resultadoRaw === "equipo1" ? equipo1 : equipo2;
  statsElegidos.push({ tipo_stat: "resultado", valor_apostado: valorResultado });
}

  const chkM = document.getElementById(`chk-marcador-${partidoId}`);
  if (chkM?.checked) {
    if (!validarMarcador(partidoId)) { alert("El marcador no es consistente con el resultado"); return; }
    const g1 = document.getElementById(`stat-marcador-${partidoId}-g1`)?.value;
    const g2 = document.getElementById(`stat-marcador-${partidoId}-g2`)?.value;
    if (g1 === "" || g2 === "") { alert("Ingresa el marcador completo"); return; }
    statsElegidos.push({ tipo_stat: "marcador", valor_apostado: `${g1}-${g2}` });
  }

  const chkA = document.getElementById(`chk-amarillas-${partidoId}`);
  if (chkA?.checked) {
    const opAm = document.querySelector(`input[name="amarillas-${partidoId}"]:checked`)?.value;
    if (!opAm) { alert("Selecciona una opción para amarillas"); return; }
    statsElegidos.push({ tipo_stat: "amarillas", valor_apostado: opAm });
  }

  const chkR = document.getElementById(`chk-rojas-${partidoId}`);
  if (chkR?.checked) {
    const val = parseInt(document.getElementById(`stat-rojas-${partidoId}`)?.value);
    if (!val || val < 1) { alert("El mínimo de rojas es 1"); return; }
    statsElegidos.push({ tipo_stat: "rojas", valor_apostado: String(val) });
  }

  const chkC = document.getElementById(`chk-corners-${partidoId}`);
  if (chkC?.checked) {
    const opCo = document.querySelector(`input[name="corners-${partidoId}"]:checked`)?.value;
    if (!opCo) { alert("Selecciona una opción para corners"); return; }
    statsElegidos.push({ tipo_stat: "corners", valor_apostado: opCo });
  }

  if (statsElegidos.length === 0) {
  alert("Selecciona al menos un stat para apostar");
  return;
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
    const { error: err3 } = await db.from("apuestas_detalle")
      .insert(statsElegidos.map(s => ({ apuesta_id: apuestaData.id, ...s })));
    if (err3) throw err3;

    btn.textContent = "✅ Apuesta guardada";

    setTimeout(() => {
      const contenedor = document.getElementById(`apuestaForm-${partidoId}`);
      if (contenedor) {
        const apuestaFake = { estado: "pendiente", puntos_ganados: 0 };
        contenedor.outerHTML = renderApuestaRealizada(apuestaFake, statsElegidos, { equipo1, equipo2 });
      }
    }, 800);

  } catch (err) {
    console.error(err);
    alert("Error al guardar: " + err.message);
    btn.disabled = false;
    btn.textContent = "💾 Guardar apuesta";
  }
}

// ============================================================
// APUESTA GUARDADA (partido aún no iniciado — editable)
// ============================================================
function renderApuestaGuardada(apuesta, detalle, partido) {
  const LABELS_VALOR = {
    mas3: "Más de 3", mas5: "Más de 5", mas6: "Más de 6", mas8: "Más de 8",
    cero: "0 corners", mas10: "Más de 10", mas12: "Más de 12", mas16: "Más de 16"
  };
  const LABELS_TIPO = {
    resultado: "⚽ Resultado", marcador: "🎯 Marcador exacto",
    amarillas: "🟨 Amarillas", rojas: "🟥 Rojas", corners: "🚩 Corners"
  };

  const puntosPosibles = (detalle || []).reduce((acc, d) => {
    if (d.tipo_stat === "resultado") return acc + 2;
    if (d.tipo_stat === "marcador")  return acc + 3;
    if (d.tipo_stat === "rojas")     return acc + 4;
    if (d.tipo_stat === "amarillas") return acc + ({ mas3:1, mas5:2, mas6:3, mas8:4 }[d.valor_apostado] || 0);
    if (d.tipo_stat === "corners")   return acc + ({ cero:5, mas10:1, mas12:2, mas16:3 }[d.valor_apostado] || 0);
    return acc;
  }, 0);

  const detalleHtml = (detalle || []).map(d => `
    <div class="detalleItem">
      <span>${LABELS_TIPO[d.tipo_stat] || d.tipo_stat}</span>
      <span class="detalleValor">${LABELS_VALOR[d.valor_apostado] || d.valor_apostado}</span>
    </div>`).join("");

  return `
    <div class="apuestaRealizada pendiente">
      <div class="apuestaEstado">⏳ Pendiente
        <span class="puntosPendientes">⭐ ${puntosPosibles} pts en juego</span>
      </div>
      <div class="apuestaDetalles">${detalleHtml}</div>
    </div>`;
}

// ============================================================
// APUESTA YA REALIZADA
// ============================================================
function renderApuestaRealizada(apuesta, detalle, partido) {
  const estadoClass = apuesta.estado === "ganada" ? "ganada" : apuesta.estado === "perdida" ? "perdida" : "pendiente";
  const estadoLabel = apuesta.estado === "ganada" ? "✅ Ganada" : apuesta.estado === "perdida" ? "❌ Perdida" : "⏳ Pendiente";

  const puntosPosibles = (detalle || []).reduce((acc, d) => {
    if (d.tipo_stat === "resultado") return acc + 2;
    if (d.tipo_stat === "marcador")  return acc + 3;
    if (d.tipo_stat === "rojas")     return acc + 4;
    if (d.tipo_stat === "amarillas") return acc + ({ mas3:1, mas5:2, mas6:3, mas8:4 }[d.valor_apostado] || 0);
    if (d.tipo_stat === "corners")   return acc + ({ cero:5, mas10:1, mas12:2, mas16:3 }[d.valor_apostado] || 0);
    return acc;
  }, 0);

  const LABELS_VALOR = {
    mas3: "Más de 3", mas5: "Más de 5", mas6: "Más de 6", mas8: "Más de 8",
    cero: "0 corners", mas10: "Más de 10", mas12: "Más de 12", mas16: "Más de 16"
  };
  const LABELS_TIPO = {
    resultado: "⚽ Resultado", marcador: "🎯 Marcador exacto",
    amarillas: "🟨 Amarillas", rojas: "🟥 Rojas", corners: "🚩 Corners"
  };

  const detalleHtml = (detalle || []).map(d => `
    <div class="detalleItem">
      <span>${LABELS_TIPO[d.tipo_stat] || d.tipo_stat}</span>
      <span class="detalleValor">${LABELS_VALOR[d.valor_apostado] || d.valor_apostado}</span>
    </div>`).join("");

  return `
    <div class="apuestaRealizada ${estadoClass}">
      <div class="apuestaEstado">${estadoLabel}
        ${apuesta.estado === "ganada"
          ? `<span class="puntosGanados">+${apuesta.puntos_ganados} pts</span>`
          : apuesta.estado === "pendiente"
          ? `<span class="puntosPendientes">⭐ ${puntosPosibles} pts en juego</span>`
          : ""}
      </div>
      <div class="apuestaDetalles">${detalleHtml}</div>
    </div>`;
}

// ============================================================
// CARGAR APUESTAS EXISTENTES
// ============================================================
async function cargarApuestasUsuario(usuarioId, partidoIds) {
  if (!usuarioId || partidoIds.length === 0) return { apuestas: {}, detalles: {} };

  const { data: apuestas } = await db
    .from("apuestas").select("*")
    .eq("usuario_id", usuarioId).in("partido_id", partidoIds);

  if (!apuestas || apuestas.length === 0) return { apuestas: {}, detalles: {} };

  const apuestaIds = apuestas.map(a => a.id);
  const { data: detalles } = await db
    .from("apuestas_detalle").select("*").in("apuesta_id", apuestaIds);

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
