// ============================================================
// auth.js — Login, registro y protección de rutas
// TDT Mundial 2026
// ============================================================

async function hashPass(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function requireAuth(rolRequerido = "user") {
  const raw = localStorage.getItem("usuario");
  if (!raw) { window.location.replace("login.html"); return null; }
  const usuario = JSON.parse(raw);
  if (rolRequerido === "admin" && usuario.rol !== "admin") {
    window.location.replace("dashboard.html");
    return null;
  }
  return usuario;
}

// ---- MOSTRAR REGISTRO (con animación al lado) ---------------
const fechaLimite = new Date("2026-06-11");

function mostrarRegistro() {
  if (new Date() > fechaLimite) { alert("Registro cerrado"); return; }

  const card = document.getElementById("cardRegistro");
  const btn  = document.getElementById("btnCrearCuenta");

  btn.style.display = "none";
  document.getElementById("error").textContent = "";

  // Paso 1: hacer visible en el DOM para que ocupe espacio
  card.classList.add("aparecer");

  // Paso 2: en el siguiente frame aplicar la clase de animación
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      card.classList.add("visible");
    });
  });
}

function cancelarRegistro() {
  const card = document.getElementById("cardRegistro");
  const btn  = document.getElementById("btnCrearCuenta");

  card.classList.remove("visible");

  // Esperar que termine la animación para ocultar
  setTimeout(() => {
    card.classList.remove("aparecer");
    btn.style.display = "block";
  }, 300);

  limpiarFormulario(["nombreReal", "nuevoUser", "nuevoPass", "codigo"]);
}

// ---- REGISTRO -----------------------------------------------
async function registrar() {
  const nombre  = document.getElementById("nombreReal").value.trim();
  const cedula  = document.getElementById("nuevoUser").value.trim();
  const pass    = document.getElementById("nuevoPass").value;
  const codigo  = document.getElementById("codigo").value.trim();
  const errorEl = document.getElementById("error");
  errorEl.textContent = "";

  if (!nombre || !cedula || !pass) {
    errorEl.textContent = "Completa todos los campos";
    return;
  }
  if (!/^\d+$/.test(cedula)) {
    errorEl.textContent = "La cédula solo debe contener números";
    return;
  }
  if (codigo !== "TDT2026") {
    errorEl.textContent = "Código empresa incorrecto";
    return;
  }
  if (new Date() > fechaLimite) {
    errorEl.textContent = "Registro cerrado";
    return;
  }

  const { data: existe } = await db
    .from("usuarios")
    .select("id")
    .eq("user", cedula)
    .single();

  if (existe) {
    errorEl.textContent = "Esa cédula ya está registrada";
    return;
  }

  const passHash = await hashPass(pass);
  const { error } = await db
    .from("usuarios")
    .insert([{ nombre, user: cedula, pass: passHash, rol: "user" }]);

  if (error) {
    errorEl.textContent = "Error al crear cuenta: " + error.message;
    return;
  }

  limpiarFormulario(["nombreReal", "nuevoUser", "nuevoPass", "codigo"]);
  cancelarRegistro();
  alert("✅ Cuenta creada. Ya puedes iniciar sesión.");
}

// ---- LOGIN --------------------------------------------------
async function login() {
  const cedula  = document.getElementById("user").value.trim();
  const pass    = document.getElementById("pass").value;
  const errorEl = document.getElementById("error");
  errorEl.textContent = "";

  if (!cedula || !pass) {
    errorEl.textContent = "Ingresa tu cédula y contraseña";
    return;
  }
  if (!/^\d+$/.test(cedula)) {
    errorEl.textContent = "La cédula solo debe contener números";
    return;
  }

  const passHash = await hashPass(pass);
  const { data, error } = await db
    .from("usuarios")
    .select("*")
    .eq("user", cedula)
    .eq("pass", passHash)
    .single();

  if (error || !data) {
    errorEl.textContent = "Cédula o contraseña incorrectos";
    document.getElementById("pass").value = "";
    return;
  }

  localStorage.setItem("usuario", JSON.stringify({
    nombre: data.nombre,
    user  : data.user,
    rol   : data.rol
  }));
  localStorage.setItem("rol", data.rol);

  await verificarNotificaciones(data.user);
  limpiarFormulario(["user", "pass"]);
  window.location = data.rol === "admin" ? "admin.html" : "dashboard.html";
}

// ---- NOTIFICACIONES ----------------------------------------
async function verificarNotificaciones(userId) {
  const { data: apuestas } = await db
    .from("apuestas")
    .select("id, estado, puntos_ganados, partido_id, visto")
    .eq("usuario_id", userId)
    .in("estado", ["ganada", "perdida"])
    .eq("visto", false);

  if (!apuestas || apuestas.length === 0) return;
  localStorage.setItem("notificaciones_pendientes", JSON.stringify(apuestas));
}

// ---- UTILIDADES --------------------------------------------
function limpiarFormulario(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

function logout() {
  localStorage.removeItem("usuario");
  localStorage.removeItem("rol");
  localStorage.removeItem("notificaciones_pendientes");
  window.location = "index.html";
}
