// ============================================================
// mis-apuestas.js — Vista de apuestas del usuario
// ============================================================

const usuarioMA = requireAuth("user");

const LABELS_STAT = {
  resultado: "⚽ Resultado",
  marcador : "🎯 Marcador exacto",
  amarillas: "🟨 Amarillas",
  rojas    : "🟥 Rojas",
  corners  : "🚩 Corners"
};

let todasLasApuestas = [];

async function cargarMisApuestas() {
  const { data: apuestas, error } = await db
    .from("apuestas")
    .select("*, apuestas_detalle(*)")
    .eq("usuario_id", usuarioMA.user)
    .order("creado_en", { ascending: false });

  if (error || !apuestas) {
    document.getElementById("listaApuestas").innerHTML =
      "<p style='color:red;text-align:center'>Error cargando apuestas</p>";
    return;
  }

  if (apuestas.length === 0) {
    document.getElementById("listaApuestas").innerHTML =
      "<p style='color:#64748b;text-align:center;margin-top:60px'>Aún no tienes apuestas 🎯<br><br><a href='dashboard.html' style='color:#ff7a00'>Ir a hacer apuestas →</a></p>";
    actualizarResumen([]);
    return;
  }

  // Obtener info de partidos
  const partidoIds = [...new Set(apuestas.map(a => a.partido_id))];
  const { data: partidos } = await db
    .from("partidos")
    .select("id, equipo1, equipo2, fecha, grupo_id, grupos(nombre)")
    .in("id", partidoIds);

  const partidosMap = {};
  (partidos || []).forEach(p => { partidosMap[p.id] = p; });

  todasLasApuestas = apuestas.map(a => ({
    ...a,
    partido: partidosMap[a.partido_id] || null
  }));

  actualizarResumen(todasLasApuestas);
  renderApuestas(todasLasApuestas);
}

function actualizarResumen(apuestas) {
  const ganadas   = apuestas.filter(a => a.estado === "ganada").length;
  const perdidas  = apuestas.filter(a => a.estado === "perdida").length;
  const pendientes = apuestas.filter(a => a.estado === "pendiente").length;
  const puntos    = apuestas.filter(a => a.estado === "ganada")
    .reduce((s, a) => s + (a.puntos_ganados || 0), 0);

  document.getElementById("numGanadas").textContent   = ganadas;
  document.getElementById("numPerdidas").textContent  = perdidas;
  document.getElementById("numPendientes").textContent = pendientes;
  document.getElementById("numPuntos").textContent    = puntos;
}

function filtrar(estado) {
  document.querySelectorAll(".filtroBtn").forEach(b => b.classList.remove("activo"));
  document.getElementById("f-" + estado).classList.add("activo");

  const filtradas = estado === "todas"
    ? todasLasApuestas
    : todasLasApuestas.filter(a => a.estado === estado);

  renderApuestas(filtradas);
}

function renderApuestas(apuestas) {
  const contenedor = document.getElementById("listaApuestas");

  if (apuestas.length === 0) {
    contenedor.innerHTML = "<p style='color:#64748b;text-align:center;margin-top:40px'>No hay apuestas en esta categoría</p>";
    return;
  }

  let html = "";
  for (const a of apuestas) {
    const p = a.partido;
    const estadoClass = a.estado === "ganada" ? "ganada" : a.estado === "perdida" ? "perdida" : "pendiente";
    const estadoLabel = a.estado === "ganada" ? "✅ Ganada" : a.estado === "perdida" ? "❌ Perdida" : "⏳ Pendiente";

    const fechaStr = p?.fecha
      ? new Date(p.fecha).toLocaleString("es-CO", {
          weekday: "short", day: "2-digit", month: "short",
          hour: "2-digit", minute: "2-digit"
        })
      : "Fecha desconocida";

    const detallesHtml = (a.apuestas_detalle || []).map(d => `
      <div class="maDetalleItem">
        <span class="maDetalleTipo">${LABELS_STAT[d.tipo_stat] || d.tipo_stat}</span>
        <span class="maDetalleValor">${d.valor_apostado}</span>
      </div>
    `).join("");

    html += `
      <div class="maCard ${estadoClass}">
        <div class="maCardTop">
          <span class="maGrupo">${p?.grupos?.nombre || "Grupo ?"}</span>
          <span class="maFecha">${fechaStr}</span>
          <span class="maEstadoBadge ${estadoClass}">${estadoLabel}</span>
        </div>
        <div class="maEquipos">
          <span>${p?.equipo1 || "?"}</span>
          <span class="maVs">vs</span>
          <span>${p?.equipo2 || "?"}</span>
        </div>
        <div class="maDetalles">
          ${detallesHtml}
        </div>
        ${a.estado === "ganada" ? `
          <div class="maPuntos">
            <span>⭐ +${a.puntos_ganados} puntos ganados</span>
          </div>
        ` : ""}
      </div>
    `;
  }
  contenedor.innerHTML = html;
}

cargarMisApuestas();
