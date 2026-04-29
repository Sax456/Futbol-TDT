// ============================================================
// admin.js — Panel administrador TDT Mundial
// ============================================================

// Protección de ruta — verifica rol real desde localStorage
const _usuarioAdmin = (() => {
  try {
    const raw = localStorage.getItem("usuario");
    if (!raw) throw new Error("no session");
    const u = JSON.parse(raw);
    if (u.rol !== "admin") throw new Error("not admin");
    return u;
  } catch {
    alert("Acceso denegado");
    window.location.replace("index.html");
    return null;
  }
})();

if (!_usuarioAdmin) throw new Error("stop");

let partidosCache = [];
let vistaActual = "partidos";

// ============================================================
// NAVEGACIÓN
// ============================================================
function mostrarSeccion(seccion) {
  vistaActual = seccion;
  document.querySelectorAll(".seccionPanel").forEach(s => s.style.display = "none");
  document.querySelectorAll(".tabBtn").forEach(b => b.classList.remove("activo"));
  document.getElementById("seccion-" + seccion).style.display = "block";
  document.getElementById("tab-" + seccion).classList.add("activo");
  if (seccion === "resultados") cargarPartidosResultados();
  if (seccion === "ranking")    cargarRanking();
  if (seccion === "partidos")   cargarPartidosAdmin();
}

// ============================================================
// SECCIÓN: PARTIDOS
// ============================================================
async function cargarPartidosAdmin() {
  const contenedor = document.getElementById("listaPartidos");
  contenedor.innerHTML = "<p>Cargando...</p>";

  const { data: partidos, error } = await db
    .from("partidos")
    .select("*, grupos(nombre)")
    .order("fecha", { ascending: true });

  if (error) {
    contenedor.innerHTML = `<p style="color:red">Error: ${error.message}</p>`;
    return;
  }
  partidosCache = partidos;
  renderizarPartidos(partidos);
}

function renderizarPartidos(partidos) {
  const contenedor  = document.getElementById("listaPartidos");
  const filtroGrupo = document.getElementById("filtroGrupo").value;
  const filtrados   = filtroGrupo ? partidos.filter(p => p.grupo_id == filtroGrupo) : partidos;

  if (filtrados.length === 0) { contenedor.innerHTML = "<p>No hay partidos.</p>"; return; }

  const porMes = {};
  for (const p of filtrados) {
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
      const fechaFormateada = p.fecha
        ? new Date(p.fecha).toLocaleString("es-CO", {
            weekday: "short", day: "2-digit", month: "short",
            hour: "2-digit", minute: "2-digit"
          })
        : "Sin fecha";

      html += `
        <div class="adminCard ${esPorDefinir ? "pendiente" : ""}">
          <div class="adminCardTop">
            <span class="grupoTag">${p.grupos?.nombre || "Grupo ?"}</span>
            <span class="fechaTag">${fechaFormateada}</span>
            ${esPorDefinir ? '<span class="pendienteTag">⚠ Por definir</span>' : ""}
          </div>
          <div class="adminCardBody">
            <input class="inputEquipo" id="e1-${p.id}" value="${p.equipo1}" placeholder="Equipo 1" />
            <span class="vsLabel">vs</span>
            <input class="inputEquipo" id="e2-${p.id}" value="${p.equipo2}" placeholder="Equipo 2" />
            <input class="inputFecha" type="datetime-local" id="f-${p.id}"
              value="${p.fecha ? toDatetimeLocal(p.fecha) : ""}" />
            <button class="btnGuardar"  onclick="guardarPartido(${p.id})">💾 Guardar</button>
            <button class="btnEliminar" onclick="eliminarPartido(${p.id})">🗑 Eliminar</button>
          </div>
        </div>
      `;
    }
  }
  contenedor.innerHTML = html;
}

function filtrarPartidos() {
  renderizarPartidos(partidosCache);
}

function toDatetimeLocal(isoString) {
  const d = new Date(isoString);
  d.setMinutes(d.getMinutes() - 300); // UTC → Colombia (UTC-5)
  return d.toISOString().slice(0, 16);
}

async function guardarPartido(id) {
  const equipo1 = document.getElementById(`e1-${id}`).value.trim();
  const equipo2 = document.getElementById(`e2-${id}`).value.trim();
  const fechaRaw = document.getElementById(`f-${id}`).value;

  if (!equipo1 || !equipo2) { alert("Completa los nombres de los equipos"); return; }

  const fecha = fechaRaw ? fechaRaw + ":00-05:00" : null;

  const { error } = await db
    .from("partidos")
    .update({ equipo1, equipo2, fecha })
    .eq("id", id);

  if (error) { alert("Error: " + error.message); return; }
  alert("✅ Partido guardado");
  cargarPartidosAdmin();
}

async function eliminarPartido(id) {
  if (!confirm("¿Eliminar este partido y todas sus apuestas?")) return;

  // Buscar apuestas del partido
  const { data: apuestas } = await db
    .from("apuestas")
    .select("id")
    .eq("partido_id", id);

  if (apuestas && apuestas.length > 0) {
    const apuestaIds = apuestas.map(a => a.id);
    await db.from("apuestas_detalle").delete().in("apuesta_id", apuestaIds);
    await db.from("apuestas").delete().in("id", apuestaIds);
  }

  await db.from("resultados").delete().eq("partido_id", id);
  const { error } = await db.from("partidos").delete().eq("id", id);

  if (error) { alert("Error al eliminar: " + error.message); return; }
  alert("✅ Partido eliminado");
  cargarPartidosAdmin();
}

async function agregarPartido() {
  const grupoId = document.getElementById("nuevoGrupo").value;
  const equipo1 = document.getElementById("nuevoE1").value.trim();
  const equipo2 = document.getElementById("nuevoE2").value.trim();
  const fechaRaw = document.getElementById("nuevoFecha").value;

  if (!grupoId) { alert("Selecciona un grupo"); return; }
  if (!equipo1 || !equipo2) { alert("Ingresa los nombres de los equipos"); return; }

  const fecha = fechaRaw ? fechaRaw + ":00-05:00" : null;

  const { error } = await db
    .from("partidos")
    .insert([{ equipo1, equipo2, grupo_id: parseInt(grupoId), fecha }]);

  if (error) { alert("Error: " + error.message); return; }

  cancelarNuevo();
  alert("✅ Partido creado");
  cargarPartidosAdmin();
}

// ============================================================
// SECCIÓN: RESULTADOS
// ============================================================
async function cargarPartidosResultados() {
  const contenedor = document.getElementById("listaResultados");
  contenedor.innerHTML = "<p>Cargando...</p>";

  const ahora = new Date().toISOString();

  const { data: partidos, error } = await db
    .from("partidos")
    .select("*, grupos(nombre)")
    .lte("fecha", ahora)
    .order("fecha", { ascending: false });

  if (error) { contenedor.innerHTML = `<p style="color:red">Error: ${error.message}</p>`; return; }

  const { data: resultados } = await db.from("resultados").select("*");
  const resMap = {};
  (resultados || []).forEach(r => { resMap[r.partido_id] = r; });

  if (!partidos || partidos.length === 0) {
    contenedor.innerHTML = "<p>No hay partidos iniciados aún.</p>";
    return;
  }

  let html = "";
  for (const p of partidos) {
    const res = resMap[p.id];
    html += `
      <div class="resultadoCard ${res ? "conResultado" : ""}">
        <div class="resultadoTop">
          <span class="grupoTag">${p.grupos?.nombre || "?"}</span>
          <span class="fechaTag">${new Date(p.fecha).toLocaleString("es-CO", {
            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
          })}</span>
          ${res ? '<span class="tagCompletado">✅ Ingresado</span>' : ""}
        </div>
        <div class="resultadoEquipos">
          <strong>${p.equipo1}</strong>
          <span class="vsLabel">vs</span>
          <strong>${p.equipo2}</strong>
        </div>
        <div class="resultadoInputs">
          <div class="inputGrupo">
            <label>Goles ${p.equipo1}</label>
            <input type="number" min="0" id="g1-${p.id}" value="${res?.goles1 ?? ""}" placeholder="0" />
          </div>
          <div class="inputGrupo">
            <label>Goles ${p.equipo2}</label>
            <input type="number" min="0" id="g2-${p.id}" value="${res?.goles2 ?? ""}" placeholder="0" />
          </div>
          <div class="inputGrupo">
            <label>🟨 Amarillas</label>
            <input type="number" min="0" id="am-${p.id}" value="${res?.amarillas ?? ""}" placeholder="0" />
          </div>
          <div class="inputGrupo">
            <label>🟥 Rojas</label>
            <input type="number" min="0" id="ro-${p.id}" value="${res?.rojas ?? ""}" placeholder="0" />
          </div>
          <div class="inputGrupo">
            <label>🚩 Corners</label>
            <input type="number" min="0" id="co-${p.id}" value="${res?.corners ?? ""}" placeholder="0" />
          </div>
          <button class="btnGuardar" onclick="guardarResultado(${p.id}, '${p.equipo1}', '${p.equipo2}')">
            💾 Guardar resultado
          </button>
        </div>
      </div>
    `;
  }
  contenedor.innerHTML = html;
}

async function guardarResultado(partidoId, equipo1, equipo2) {
  const goles1    = document.getElementById(`g1-${partidoId}`).value;
  const goles2    = document.getElementById(`g2-${partidoId}`).value;
  const amarillas = document.getElementById(`am-${partidoId}`).value;
  const rojas     = document.getElementById(`ro-${partidoId}`).value;
  const corners   = document.getElementById(`co-${partidoId}`).value;

  if (goles1 === "" || goles2 === "") { alert("Ingresa los goles de ambos equipos"); return; }

  const { error } = await db
    .from("resultados")
    .upsert({
      partido_id: partidoId,
      goles1    : parseInt(goles1),
      goles2    : parseInt(goles2),
      amarillas : amarillas !== "" ? parseInt(amarillas) : null,
      rojas     : rojas     !== "" ? parseInt(rojas)     : null,
      corners   : corners   !== "" ? parseInt(corners)   : null,
      ingresado_en: new Date().toISOString()
    }, { onConflict: "partido_id" });

  if (error) { alert("Error al guardar: " + error.message); return; }

  // Recalcular puntos (también corrige apuestas ya procesadas)
  await calcularPuntosPartido(partidoId, { equipo1, equipo2, goles1, goles2, amarillas, rojas, corners });

  alert("✅ Resultado guardado y puntos actualizados");
  cargarPartidosResultados();
}

// ============================================================
// SECCIÓN: RANKING
// ============================================================
async function cargarRanking() {
  const contenedor = document.getElementById("tablaRanking");
  contenedor.innerHTML = "<p>Calculando...</p>";

  const { data: apuestas, error } = await db
    .from("apuestas")
    .select("usuario_id, puntos_ganados")
    .eq("estado", "ganada");

  const { data: usuarios } = await db.from("usuarios").select("user, nombre");

  if (error || !usuarios) { contenedor.innerHTML = "<p>Error cargando ranking</p>"; return; }

  const puntosMap = {};
  (apuestas || []).forEach(a => {
    puntosMap[a.usuario_id] = (puntosMap[a.usuario_id] || 0) + (a.puntos_ganados || 0);
  });

  const ranking = usuarios
    .filter(u => u.rol !== "admin")
    .map(u => ({ nombre: u.nombre, user: u.user, puntos: puntosMap[u.user] || 0 }))
    .sort((a, b) => b.puntos - a.puntos);

  const medallas = ["🥇", "🥈", "🥉"];

  let html = `
    <table class="rankingTable">
      <thead>
        <tr><th>#</th><th>Usuario</th><th>Puntos</th></tr>
      </thead>
      <tbody>
  `;
  ranking.forEach((r, i) => {
    html += `
      <tr class="${i < 3 ? "top3" : ""}">
        <td>${medallas[i] || (i + 1)}</td>
        <td>${r.nombre}</td>
        <td class="puntosCell">⭐ ${r.puntos}</td>
      </tr>
    `;
  });
  html += "</tbody></table>";
  contenedor.innerHTML = html;
}

// Iniciar en la sección de partidos
cargarPartidosAdmin();

function mostrarFormNuevo() {
  document.getElementById("formNuevo").style.display = "block";
  document.getElementById("btnMostrarForm").style.display = "none";
}

function cancelarNuevo() {
  document.getElementById("formNuevo").style.display = "none";
  document.getElementById("btnMostrarForm").style.display = "block";
  document.getElementById("nuevoGrupo").value = "";
  document.getElementById("nuevoE1").value = "";
  document.getElementById("nuevoE2").value = "";
  document.getElementById("nuevoFecha").value = "";
}
