                                                                                                                                                              // ============================================================
// auth.js — Login, registro y protección de rutas
// TDT Mundial 2026
// ============================================================

// --- HASH SHA-256 -------------------------------------------
async function hashPass(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// --- PROTECCIÓN DE RUTAS ------------------------------------
// Llama esta función al inicio de cada página protegida
function requireAuth(rolRequerido = "user") {
  const raw = localStorage.getItem("usuario");
  if (!raw) {
    window.location.replace("login.html");
    return null;
  }
  const usuario = JSON.parse(raw);
  if (rolRequerido === "admin" && usuario.rol !== "admin") {
    window.location.replace("dashboard.html");
    return null;
  }
  return usuario;
}

// --- REGISTRO -----------------------------------------------
const fechaLimite = new Date("2026-06-11");

function mostrarRegistro() {
  if (new Date() > fechaLimite) {
    alert("Registro cerrado");
    return;
  }
  document.getElementById("registro").style.display = "block";
}

async function registrar() {
  const nombre = document.getElementById("nombreReal").value.trim();
  const user   = document.getElementById("nuevoUser").value.trim();
  const pass   = document.getElementById("nuevoPass").value;
  const codigo = document.getElementById("codigo").value.trim();

  if (!nombre || !user || !pass) {
    alert("Completa todos los campos");
    return;
  }

  if (codigo !== "TDT2026") {
    alert("Código empresa incorrecto");
    return;
  }

  if (new Date() > fechaLimite) {
    alert("Registro cerrado");
    return;
  }

  // Verificar si el usuario ya existe
  const { data: existe } = await db
    .from("usuarios")
    .select("id")
    .eq("user", user)
    .single();

  if (existe) {
    alert("Ese nombre de usuario ya está en uso");
    return;
  }

  const passHash = await hashPass(pass);

  const { error } = await db
    .from("usuarios")
    .insert([{ nombre, user, pass: passHash, rol: "user" }]);

  if (error) {
    alert("Error al crear cuenta: " + error.message);
    return;
  }

  alert("✅ Cuenta creada correctamente. Ya puedes iniciar sesión.");
  document.getElementById("registro").style.display = "none";
}

// --- LOGIN --------------------------------------------------
async function login() {
  const user = document.getElementById("user").value.trim();
  const pass = document.getElementById("pass").value;
  const errorEl = document.getElementById("error");
  errorEl.innerText = "";

  if (!user || !pass) {
    errorEl.innerText = "Ingresa usuario y contraseña";
    return;
  }

  const passHash = await hashPass(pass);

  const { data, error } = await db
    .from("usuarios")
    .select("*")
    .eq("user", user)
    .eq("pass", passHash)
    .single();

  if (error || !data) {
    errorEl.innerText = "Usuario o contraseña incorrectos";
    return;
  }

  localStorage.setItem("usuario", JSON.stringify({
    nombre: data.nombre,
    user  : data.user,
    rol   : data.rol
  }));
  localStorage.setItem("rol", data.rol);

  // Guardar notificaciones pendientes de ver
  await verificarNotificaciones(data.user);

  window.location = data.rol === "admin" ? "admin.html" : "dashboard.html";
}

// --- NOTIFICACIONES AL LOGIN --------------------------------
async function verificarNotificaciones(userId) {
  // Buscar apuestas recién resueltas (ganadas o perdidas) que el usuario no ha visto
  const { data: apuestas } = await db
    .from("apuestas")
    .select("id, estado, puntos_ganados, partido_id, visto")
    .eq("usuario_id", userId)
    .in("estado", ["ganada", "perdida"])
    .eq("visto", false);

  if (!apuestas || apuestas.length === 0) return;

  // Guardar en localStorage para mostrarlas en dashboard
  localStorage.setItem("notificaciones_pendientes", JSON.stringify(apuestas));
}
