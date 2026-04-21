// ============================================================
// admin.js — Panel administrador TDT Mundial
// ============================================================

// Verificar que sea admin
const rolGuardado = localStorage.getItem("rol");
if (rolGuardado !== "admin") {
  alert("Acceso denegado");
  window.location = "index.html";
}

let partidosCache = [];

// ============================================================
// INICIALIZAR
// ============================================================
async function iniciarAdmin() {
  await cargarPartidosAdmin();
}

// ============================================================
// CARGAR Y RENDERIZAR PARTIDOS
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
  const contenedor = document.getElementById("listaPartidos");
  const filtroGrupo = document.getElementById("filtroGrupo").value;

  const filtrados = filtroGrupo
    ? partidos.filter(p => p.grupo_id == filtroGrupo)
    : partidos;

  if (filtrados.length === 0) {
    contenedor.innerHTML = "<p>No hay partidos.</p>";
    return;
  }

  // Agrupar por mes para mostrar secciones
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
            <input
              class="inputEquipo"
              id="e1-${p.id}"
              value="${p.equipo1}"
              placeholder="Equipo 1"
            />
            <span class="vsLabel">vs</span>
            <input
              class="inputEquipo"
              id="e2-${p.id}"
              value="${p.equipo2}"
              placeholder="Equipo 2"
            />
            <input
              class="inputFecha"
              type="datetime-local"
              id="f-${p.id}"
              value="${p.fecha ? toDatetimeLocal(p.fecha) : ""}"
            />
            <button class="btnGuardar" onclick="guardarPartido(${p.id})">
              💾 Guardar
            </button>
          </div>
        </div>
      `;
    }
  }

  contenedor.innerHTML = html;
}

// ============================================================
// GUARDAR CAMBIOS EN PARTIDO
// ============================================================
async function guardarPartido(id) {
  const equipo1 = document.getElementById(`e1-${id}`).value.trim();
  const equipo2 = document.getElementById(`e2-${id}`).value.trim();
  const fechaInput = document.getElementById(`f-${id}`).value;

  if (!equipo1 || !equipo2) {
    alert("Los nombres de equipos no pueden estar vacíos");
    return;
  }

  const btn = document.querySelector(`button[onclick="guardarPartido(${id})"]`);
  btn.disabled = true;
  btn.textContent = "Guardando...";

  const updates = { equipo1, equipo2 };
  if (fechaInput) updates.fecha = new Date(fechaInput).toISOString();

  const { error } = await db
    .from("partidos")
    .update(updates)
    .eq("id", id);

  if (error) {
    alert("Error: " + error.message);
    btn.disabled = false;
    btn.textContent = "💾 Guardar";
    return;
  }

  btn.textContent = "✅ Guardado";
  setTimeout(() => {
    btn.disabled = false;
    btn.textContent = "💾 Guardar";
  }, 2000);

  // Actualizar cache local
  const idx = partidosCache.findIndex(p => p.id === id);
  if (idx !== -1) {
    partidosCache[idx].equipo1 = equipo1;
    partidosCache[idx].equipo2 = equipo2;
    if (fechaInput) partidosCache[idx].fecha = new Date(fechaInput).toISOString();
  }
}

// ============================================================
// AGREGAR PARTIDO NUEVO
// ============================================================
function mostrarFormNuevo() {
  document.getElementById("formNuevo").style.display = "block";
  document.getElementById("btnMostrarForm").style.display = "none";
}

async function agregarPartido() {
  const grupoId  = document.getElementById("nuevoGrupo").value;
  const equipo1  = document.getElementById("nuevoE1").value.trim();
  const equipo2  = document.getElementById("nuevoE2").value.trim();
  const fechaVal = document.getElementById("nuevoFecha").value;

  if (!grupoId || !equipo1 || !equipo2) {
    alert("Completa grupo y ambos equipos");
    return;
  }

  const nuevoPartido = {
    grupo_id: parseInt(grupoId),
    equipo1,
    equipo2,
    fecha: fechaVal ? new Date(fechaVal).toISOString() : null
  };

  const { error } = await db.from("partidos").insert([nuevoPartido]);

  if (error) {
    alert("Error: " + error.message);
    return;
  }

  alert("✅ Partido agregado");
  document.getElementById("formNuevo").style.display = "none";
  document.getElementById("btnMostrarForm").style.display = "inline-block";
  // Limpiar form
  ["nuevoGrupo","nuevoE1","nuevoE2","nuevoFecha"].forEach(id => {
    document.getElementById(id).value = "";
  });
  await cargarPartidosAdmin();
}

function cancelarNuevo() {
  document.getElementById("formNuevo").style.display = "none";
  document.getElementById("btnMostrarForm").style.display = "inline-block";
}

// ============================================================
// FILTRO POR GRUPO
// ============================================================
function filtrarPartidos() {
  renderizarPartidos(partidosCache);
}

// ============================================================
// HELPERS
// ============================================================
function toDatetimeLocal(isoString) {
  // Convierte ISO a formato que acepta datetime-local input
  const d = new Date(isoString);
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Arrancar
iniciarAdmin();
