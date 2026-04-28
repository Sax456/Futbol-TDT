// ============================================================
// dashboard.js — Carga grupos TDT Mundial
// ============================================================

async function cargarGrupos() {
  const contenedor = document.getElementById("grupos");
  contenedor.innerHTML = "Cargando grupos...";

  const { data: grupos, error } = await db
    .from("grupos")
    .select("*")
    .order("id", { ascending: true });

  if (error || !grupos) {
    contenedor.innerHTML = "<p>Error cargando grupos</p>";
    return;
  }

  // Contar partidos por grupo (sin depender de tabla equipos)
  const { data: partidos } = await db
    .from("partidos")
    .select("id, grupo_id");

  const conteoPartidos = {};
  (partidos || []).forEach(p => {
    conteoPartidos[p.grupo_id] = (conteoPartidos[p.grupo_id] || 0) + 1;
  });

  contenedor.innerHTML = "";

  for (const g of grupos) {
    const numPartidos = conteoPartidos[g.id] || 0;
    contenedor.innerHTML += `
      <div class="grupoCard" onclick="entrarGrupo(${g.id})">
        <h2>${g.nombre}</h2>
        <button class="grupoBtn">Entrar</button>
      </div>
    `;
  }
}

function entrarGrupo(id) {
  window.location.href = "grupo.html?grupo=" + id;
}

function logout() {
  localStorage.removeItem("usuario");
  localStorage.removeItem("rol");
  window.location = "index.html";
}

cargarGrupos();
