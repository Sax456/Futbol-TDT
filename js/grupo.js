// ============================================================
// grupo.js — Muestra partidos del grupo + sistema de apuestas
// ============================================================

async function cargarPartidos() {
  const params = new URLSearchParams(window.location.search);
  const grupoId = params.get("grupo");

  if (!grupoId) {
    document.getElementById("tituloGrupo").textContent = "Grupo no encontrado";
    return;
  }

  // Cargar nombre del grupo
  const { data: grupo } = await db
    .from("grupos")
    .select("nombre")
    .eq("id", grupoId)
    .single();

  document.getElementById("tituloGrupo").textContent = grupo?.nombre || "Grupo";

  // Cargar partidos
  const { data: partidos, error } = await db
    .from("partidos")
    .select("*")
    .eq("grupo_id", grupoId)
    .order("fecha", { ascending: true });

  if (error || !partidos) {
    document.getElementById("listaPartidos").innerHTML = "<p>Error cargando partidos</p>";
    return;
  }

  // Cargar apuestas existentes del usuario
  const rawUsuario = localStorage.getItem("usuario");
  const usuario = rawUsuario ? JSON.parse(rawUsuario) : null;
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
      const bloqueado = p.fecha && new Date(p.fecha) <= new Date();
      const fechaFormateada = p.fecha
        ? new Date(p.fecha).toLocaleString("es-CO", {
            weekday: "long", day: "2-digit", month: "short",
            hour: "2-digit", minute: "2-digit"
          })
        : "Fecha por confirmar";

      const apuestaExistente = apuestas[p.id] || null;
      const detalleExistente = detalles[p.id] || null;
      const formApuesta = renderFormApuesta(p, apuestaExistente, detalleExistente);

      html += `
        <div class="partidoCard ${bloqueado ? "bloqueado" : ""} ${esPorDefinir ? "porDefinir" : ""}">
          <div class="partidoTop">
            <span class="partidoFecha">${fechaFormateada}</span>
            ${esPorDefinir ? '<span class="tagPorDefinir">⚠ Por definir</span>' : ""}
            ${bloqueado ? '<span class="tagBloqueado">⏱ Cerrado</span>' : ""}
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
}

cargarPartidos();
