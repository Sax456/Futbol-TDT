async function cargarNavbar() {
  const rawUsuario = localStorage.getItem("usuario");
  const usuario = rawUsuario ? JSON.parse(rawUsuario) : null;

  if (usuario) {
    // Mostrar nombre
    document.getElementById("usuario").innerText = usuario.nombre;

    // Consultar puntos totales
    const { data } = await db
      .from("apuestas")
      .select("puntos_ganados")
      .eq("usuario_id", usuario.user)
      .eq("estado", "ganada");

    const totalPuntos = data
      ? data.reduce((sum, a) => sum + a.puntos_ganados, 0)
      : 0;

    // Mostrar puntos si el elemento existe en la página
    const puntosEl = document.getElementById("puntosNavbar");
    if (puntosEl) puntosEl.innerText = `⭐ ${totalPuntos} pts`;
  }
}

function volver() {
  window.history.back();
}

function logout() {
  localStorage.removeItem("usuario");
  localStorage.removeItem("user");
  localStorage.removeItem("rol");
  window.location = "index.html";
}

cargarNavbar();
