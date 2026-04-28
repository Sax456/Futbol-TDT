// ============================================================
// navbar.js — Navbar + puntos + notificaciones
// ============================================================

async function cargarNavbar() {
  const rawUsuario = localStorage.getItem("usuario");
  const usuario = rawUsuario ? JSON.parse(rawUsuario) : null;
  if (!usuario) return;

  const el = document.getElementById("usuario");
  if (el) el.innerText = usuario.nombre;

  // Puntos totales
  const { data } = await db
    .from("apuestas")
    .select("puntos_ganados")
    .eq("usuario_id", usuario.user)
    .eq("estado", "ganada");

  const totalPuntos = data
    ? data.reduce((sum, a) => sum + (a.puntos_ganados || 0), 0)
    : 0;

  const puntosEl = document.getElementById("puntosNavbar");
  if (puntosEl) puntosEl.innerText = `⭐ ${totalPuntos} pts`;

  // Mostrar notificaciones pendientes si las hay
  mostrarNotificaciones(usuario);
}

async function mostrarNotificaciones(usuario) {
  const raw = localStorage.getItem("notificaciones_pendientes");
  if (!raw) return;

  let notifs;
  try { notifs = JSON.parse(raw); } catch { return; }
  if (!notifs || notifs.length === 0) return;

  // Limpiar de localStorage
  localStorage.removeItem("notificaciones_pendientes");

  const ganadas  = notifs.filter(n => n.estado === "ganada");
  const perdidas = notifs.filter(n => n.estado === "perdida");
  const totalPts = ganadas.reduce((s, n) => s + (n.puntos_ganados || 0), 0);

  let msg = "🔔 Resultados de tus apuestas:\n\n";
  if (ganadas.length > 0)  msg += `✅ ${ganadas.length} apuesta${ganadas.length > 1 ? "s" : ""} ganada${ganadas.length > 1 ? "s" : ""} — +${totalPts} pts\n`;
  if (perdidas.length > 0) msg += `❌ ${perdidas.length} apuesta${perdidas.length > 1 ? "s" : ""} perdida${perdidas.length > 1 ? "s" : ""}`;

  alert(msg);

  // Marcar como vistas en BD
  const ids = notifs.map(n => n.id);
  await db
    .from("apuestas")
    .update({ visto: true })
    .in("id", ids);
}

function volver() {
  window.history.back();
}

function logout() {
  localStorage.removeItem("usuario");
  localStorage.removeItem("rol");
  localStorage.removeItem("notificaciones_pendientes");
  window.location = "index.html";
}

cargarNavbar();
