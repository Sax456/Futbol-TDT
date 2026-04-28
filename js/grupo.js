// ============================================================
// grupo.js — Partidos del grupo + apuestas + contador regresivo
// ============================================================

// Protección de ruta — solo usuarios autenticados
const usuarioActual = requireAuth("user");

async function cargarPartidos() {
  const params  = new URLSearchParams(window.location.search);
  const grupoId = params.get("grupo");

  if (!grupoId) {
    document.getElementById("tituloGrupo").textContent = "Grupo no encontrado";
    return;
  }

  const { data: grupo } = await db
    .from("grupos")
    .select("nombre")
    .eq("id", grupoId)
    .single();

  document.getElementById("tituloGrupo").textContent = grupo?.nombre || "Grupo";

  const { data: partidos, error } = await db
    .from("partidos")
    .select("*")
    .eq("grupo_id", grupoId)
    .order("fecha", { ascending: true });

  if (error || !partidos) {
    document.getElementById("listaPartidos").innerHTML = "<p>Error cargando partidos</p>";
    return;
  }

  const usuario    = usuarioActual;
  const partidoIds = partidos.map(p => p.id);

  const { apuestas, detalles } = usuario
    ? await cargarApuestasUsuario(usuario.user, partidoIds)
    : { apuestas: {}, detalles: {} };

  // Agrupar por mes
  const porMes = {};
  for (const p of partidos) {
    const mes = p.fecha
      ? new Date(p.fecha).toLocaleString("es-CO", { month: "long", year: "numeric" })
      : "Sin fecha";
    if (!porMes[mes]) porMes[mes] = [];
    porMes[mes].push(p);
  }

  let html = "";
  for (const [mes, lista] of Object.entries(porMes)) {
    html += `<h3 class="mesHeader">${mes.charAt(0).toUpperCase() + mes.slice(1)}</h3>`;
    for (const p of lista) {
      const esPorDefinir = p.equipo1 === "Por definir" || p.equipo2 === "Por definir";
      const bloqueado    = p.fecha && new Date(p.fecha) <= new Date();

      const fechaFormateada = p.fecha
        ? new Date(p.fecha).toLocaleString("es-CO", {
            weekday: "long", day: "2-digit", month: "short",
            hour: "2-digit", minute: "2-digit"
          })
        : "Fecha por confirmar";

      const apuestaExistente = apuestas[p.id] || null;
      const detalleExistente = detalles[p.id]  || null;
      const formApuesta      = renderFormApuesta(p, apuestaExistente, detalleExistente);

      // Contador regresivo — solo si no está bloqueado y tiene fecha
      const countdownHtml = (!bloqueado && p.fecha)
        ? `<span class="countdown" data-fecha="${p.fecha}" id="cd-${p.id}">⏳ Calculando...</span>`
        : "";

      html += `
        <div class="partidoCard ${bloqueado ? "bloqueado" : ""} ${esPorDefinir ? "porDefinir" : ""}">
          <div class="partidoTop">
            <span class="partidoFecha">${fechaFormateada}</span>
            ${countdownHtml}
            ${esPorDefinir ? '<span class="tagPorDefinir">⚠ Por definir</span>' : ""}
            ${bloqueado    ? '<span class="tagBloqueado">⏱ Cerrado</span>'      : ""}
          </div>
          <div class="equiposRow">
            <span class="equipoNombre">${p.equipo1}</span>
            <span class="vsTexto">vs</span>
            <span class="equipoNombre">${p.equipo2}</span>
          </div>
          ${formApuesta}
        </div>
      `;
    }
  }

  document.getElementById("listaPartidos").innerHTML = html;

  // Arrancar contadores regresivos
  iniciarContadores();
}

// --- CONTADOR REGRESIVO -------------------------------------
function iniciarContadores() {
  const elementos = document.querySelectorAll(".countdown[data-fecha]");
  if (elementos.length === 0) return;

  function actualizar() {
    const ahora = new Date();
    elementos.forEach(el => {
      const fecha = new Date(el.dataset.fecha);
      const diff  = fecha - ahora;

      if (diff <= 0) {
        el.textContent = "";
        el.closest(".partidoCard")?.classList.add("bloqueado");
        return;
      }

      const dias    = Math.floor(diff / 86400000);
      const horas   = Math.floor((diff % 86400000) / 3600000);
      const minutos = Math.floor((diff % 3600000)  / 60000);
      const segs    = Math.floor((diff % 60000)    / 1000);

      if (dias > 0) {
        el.textContent = `⏳ Cierra en ${dias}d ${horas}h ${minutos}m`;
      } else if (horas > 0) {
        el.textContent = `⏳ Cierra en ${horas}h ${minutos}m`;
        el.style.color = "#ff7a00"; // naranja cuando queda poco
      } else {
        el.textContent = `⏳ Cierra en ${minutos}m ${segs}s`;
        el.style.color = "#ef4444"; // rojo cuando queda menos de 1h
        el.style.fontWeight = "bold";
      }
    });
  }

  actualizar();
  setInterval(actualizar, 1000);
}

cargarPartidos();
