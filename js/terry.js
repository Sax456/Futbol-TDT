// ============================================================
// terry.js — Chatbot TDT Mundial
// ============================================================

const GROQ_API_KEY = "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"; // 👈 Pon tu key de console.groq.com

(function () {
  // ── Inyectar estilos ──────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@400;600;700&display=swap');

    #terry-bubble {
      position: fixed;
      bottom: 28px;
      right: 28px;
      width: 62px;
      height: 62px;
      border-radius: 50%;
      background: linear-gradient(135deg, #ff7a00, #ff4500);
      box-shadow: 0 4px 24px rgba(255,122,0,0.5);
      cursor: pointer;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
      border: none;
    }
    #terry-bubble:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 32px rgba(255,122,0,0.7);
    }
    #terry-bubble .terry-avatar {
      font-size: 28px;
      line-height: 1;
      user-select: none;
    }
    #terry-bubble .terry-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 18px;
      height: 18px;
      background: #22c55e;
      border-radius: 50%;
      border: 2px solid #020617;
      display: none;
    }
    #terry-bubble.has-notif .terry-badge { display: block; }

    #terry-window {
      position: fixed;
      bottom: 100px;
      right: 28px;
      width: 360px;
      max-height: 560px;
      background: #0d1b2a;
      border: 1px solid #1e3a5f;
      border-radius: 20px;
      box-shadow: 0 16px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,122,0,0.1);
      display: flex;
      flex-direction: column;
      z-index: 9998;
      overflow: hidden;
      transform: scale(0.85) translateY(20px);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), opacity 0.2s;
    }
    #terry-window.open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }

    .terry-header {
      background: linear-gradient(135deg, #0f2540, #1a3a5c);
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid rgba(255,122,0,0.2);
      flex-shrink: 0;
    }
    .terry-header-avatar {
      width: 42px;
      height: 42px;
      background: linear-gradient(135deg, #ff7a00, #ff4500);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }
    .terry-header-info { flex: 1; }
    .terry-header-name {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 20px;
      color: #ff7a00;
      letter-spacing: 2px;
      line-height: 1;
    }
    .terry-header-status {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .terry-dot {
      width: 7px; height: 7px;
      background: #22c55e;
      border-radius: 50%;
      display: inline-block;
      animation: terry-pulse 2s infinite;
    }
    @keyframes terry-pulse {
      0%,100% { opacity:1; } 50% { opacity:0.4; }
    }
    .terry-close {
      background: none; border: none; color: #64748b;
      font-size: 20px; cursor: pointer; padding: 4px;
      transition: color 0.15s;
    }
    .terry-close:hover { color: white; }

    .terry-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scroll-behavior: smooth;
    }
    .terry-messages::-webkit-scrollbar { width: 4px; }
    .terry-messages::-webkit-scrollbar-track { background: transparent; }
    .terry-messages::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 4px; }

    .terry-msg {
      display: flex;
      gap: 8px;
      align-items: flex-end;
      animation: terry-fadein 0.2s ease;
    }
    @keyframes terry-fadein {
      from { opacity:0; transform: translateY(6px); }
      to   { opacity:1; transform: translateY(0); }
    }
    .terry-msg.user { flex-direction: row-reverse; }

    .terry-msg-avatar {
      width: 28px; height: 28px;
      background: linear-gradient(135deg, #ff7a00, #ff4500);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; flex-shrink: 0;
    }
    .terry-msg.user .terry-msg-avatar {
      background: linear-gradient(135deg, #1e3a5f, #0f2540);
    }

    .terry-bubble-msg {
      max-width: 78%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 13px;
      line-height: 1.5;
      font-family: 'Montserrat', sans-serif;
    }
    .terry-msg.bot .terry-bubble-msg {
      background: #1a2f4a;
      color: #e2e8f0;
      border-bottom-left-radius: 4px;
    }
    .terry-msg.user .terry-bubble-msg {
      background: linear-gradient(135deg, #ff7a00, #c85000);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .terry-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      padding: 0 14px 12px;
      flex-shrink: 0;
    }
    .terry-chip {
      background: #0f2540;
      border: 1px solid #1e3a5f;
      color: #94a3b8;
      padding: 7px 13px;
      border-radius: 20px;
      font-size: 12px;
      cursor: pointer;
      font-family: 'Montserrat', sans-serif;
      transition: all 0.15s;
      white-space: nowrap;
    }
    .terry-chip:hover {
      border-color: #ff7a00;
      color: #ff7a00;
      background: rgba(255,122,0,0.08);
    }

    .terry-input-row {
      display: flex;
      gap: 8px;
      padding: 12px 14px;
      border-top: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    }
    .terry-input {
      flex: 1;
      background: #0f2540;
      border: 1px solid #1e3a5f;
      border-radius: 12px;
      padding: 10px 14px;
      color: white;
      font-size: 13px;
      font-family: 'Montserrat', sans-serif;
      outline: none;
      transition: border-color 0.15s;
    }
    .terry-input:focus { border-color: #ff7a00; }
    .terry-input::placeholder { color: #334155; }
    .terry-send {
      width: 40px; height: 40px;
      background: linear-gradient(135deg, #ff7a00, #c85000);
      border: none; border-radius: 12px;
      color: white; font-size: 16px;
      cursor: pointer; flex-shrink: 0;
      transition: transform 0.15s, opacity 0.15s;
      display: flex; align-items: center; justify-content: center;
    }
    .terry-send:hover { transform: scale(1.05); }
    .terry-send:disabled { opacity: 0.4; cursor: not-allowed; }

    .terry-typing {
      display: flex; gap: 4px;
      align-items: center; padding: 4px 0;
    }
    .terry-typing span {
      width: 7px; height: 7px;
      background: #ff7a00;
      border-radius: 50%;
      animation: terry-bounce 1.2s infinite;
    }
    .terry-typing span:nth-child(2) { animation-delay: 0.15s; }
    .terry-typing span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes terry-bounce {
      0%,60%,100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }

    .terry-card {
      background: #0f2540;
      border: 1px solid #1e3a5f;
      border-radius: 12px;
      padding: 10px 12px;
      margin-top: 6px;
      font-size: 12px;
    }
    .terry-card-title {
      color: #ff7a00;
      font-weight: 700;
      font-size: 13px;
      margin-bottom: 4px;
    }
    .terry-card-row {
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      padding: 2px 0;
    }
    .terry-card-row span:last-child { color: #e2e8f0; }

    @media (max-width: 420px) {
      #terry-window { width: calc(100vw - 24px); right: 12px; bottom: 90px; }
      #terry-bubble { bottom: 18px; right: 18px; }
    }
  `;
  document.head.appendChild(style);

  // ── HTML ──────────────────────────────────────────────────
  const container = document.createElement("div");
  container.innerHTML = `
    <button id="terry-bubble" title="Habla con Terry">
      <span class="terry-avatar">⚽</span>
      <span class="terry-badge"></span>
    </button>

    <div id="terry-window">
      <div class="terry-header">
        <div class="terry-header-avatar">⚽</div>
        <div class="terry-header-info">
          <div class="terry-header-name">TERRY</div>
          <div class="terry-header-status">
            <span class="terry-dot"></span> Asistente TDT Mundial
          </div>
        </div>
        <button class="terry-close" id="terry-close">✕</button>
      </div>

      <div class="terry-messages" id="terry-messages"></div>

      <div class="terry-chips" id="terry-chips">
        <button class="terry-chip" data-q="partidos hoy">📅 Partidos hoy</button>
        <button class="terry-chip" data-q="proximos partidos">⏭ Próximos</button>
        <button class="terry-chip" data-q="mis apuestas">🎯 Mis apuestas</button>
        <button class="terry-chip" data-q="mi ranking">🏆 Mi ranking</button>
        <button class="terry-chip" data-q="reglas">📖 Reglas</button>
        <button class="terry-chip" data-q="puntos">⭐ Sistema de puntos</button>
      </div>

      <div class="terry-input-row">
        <input class="terry-input" id="terry-input" placeholder="Pregúntale a Terry..." maxlength="200" />
        <button class="terry-send" id="terry-send">➤</button>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  // ── Estado ────────────────────────────────────────────────
  const bubble  = document.getElementById("terry-bubble");
  const win     = document.getElementById("terry-window");
  const closeBtn = document.getElementById("terry-close");
  const msgs    = document.getElementById("terry-messages");
  const input   = document.getElementById("terry-input");
  const sendBtn = document.getElementById("terry-send");
  const chips   = document.getElementById("terry-chips");
  let isOpen    = false;
  let isTyping  = false;

  // ── Toggle ────────────────────────────────────────────────
  function toggle() {
    isOpen = !isOpen;
    win.classList.toggle("open", isOpen);
    bubble.querySelector(".terry-avatar").textContent = isOpen ? "✕" : "⚽";
    if (isOpen && msgs.children.length === 0) greet();
  }

  bubble.addEventListener("click", toggle);
  closeBtn.addEventListener("click", () => { isOpen = false; win.classList.remove("open"); bubble.querySelector(".terry-avatar").textContent = "⚽"; });

  chips.addEventListener("click", e => {
    const chip = e.target.closest(".terry-chip");
    if (chip) handleQuery(chip.dataset.q);
  });

  sendBtn.addEventListener("click", send);
  input.addEventListener("keydown", e => { if (e.key === "Enter") send(); });

  function send() {
    const val = input.value.trim();
    if (!val || isTyping) return;
    input.value = "";
    handleQuery(val);
  }

  // ── Mensajes ──────────────────────────────────────────────
  function addMsg(role, html) {
    const div = document.createElement("div");
    div.className = `terry-msg ${role}`;
    const avatarEmoji = role === "bot" ? "⚽" : "👤";
    div.innerHTML = `
      <div class="terry-msg-avatar">${avatarEmoji}</div>
      <div class="terry-bubble-msg">${html}</div>
    `;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function showTyping() {
    const div = document.createElement("div");
    div.className = "terry-msg bot";
    div.id = "terry-typing-indicator";
    div.innerHTML = `
      <div class="terry-msg-avatar">⚽</div>
      <div class="terry-bubble-msg">
        <div class="terry-typing"><span></span><span></span><span></span></div>
      </div>
    `;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function hideTyping() {
    const t = document.getElementById("terry-typing-indicator");
    if (t) t.remove();
  }

  function greet() {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
    const nombre = usuario?.nombre || usuario?.user || "campeón";
    addMsg("bot", `¡Hola <strong>${nombre}</strong>! 👋 Soy <strong>Terry</strong>, tu asistente del TDT Mundial. ⚽<br><br>Puedo decirte qué partidos hay hoy, cómo van tus apuestas, tu posición en el ranking y mucho más. ¿En qué te ayudo?`);
  }

  // ── Lógica de queries ─────────────────────────────────────
  async function handleQuery(q) {
  addMsg("user", q);
  isTyping = true;
  sendBtn.disabled = true;
  showTyping();

  const lower = q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // ── Easter eggs ──------------------------------------------------------------------------------------------------------
  if (/tdt/i.test(lower)) {
    addMsgAndReset(`¡GOL GOL GOL! 🎉<br><br><img src="IMG/vannier.jpeg" style="width:60%;border-radius:12px;margin-top:6px;"/>`);
    return;
  }
  if (/y yo/i.test(lower)) {
    addMsgAndReset(`¡Bien! 👍<br><br><img src="IMG/Mauricio.jpeg" style="width:60%;border-radius:12px;margin-top:6px;"/>`);
    return;
  }
  
  try {
    let datosHTML = null;
    let intro     = "";

    if (/hoy|esta noche|esta tarde|juegan hoy|hay hoy/.test(lower)) {
      datosHTML = await getPartidosHoy();
      intro     = "📅 Aquí están los partidos de hoy:";
    } else if (/proxim|siguient|despues|manana|semana|cuando jueg|agenda|programac|que hay/.test(lower)) {
      datosHTML = await getProximos();
      intro     = "⏭ Estos son los próximos partidos:";
    } else if (/mis apuesta|como voy|aposte|apueste|mis result|cuantas gane|cuantas perd/.test(lower)) {
      datosHTML = await getMisApuestas();
      intro     = "🎯 Aquí van tus apuestas:";
    } else if (/mi ranking|mi posicion|cuantos punto|mis punto|donde voy|puesto|tabla|clasificac/.test(lower)) {
      datosHTML = await getMiRanking();
      intro     = "🏆 Aquí está tu posición:";
    } else if (/quien va|quien lidera|quien tiene mas|lider|primero|ganando el torneo/.test(lower)) {
      datosHTML = await getLider();
      intro     = "👀 Te cuento quién va arriba:";
    } else if (/regl|como funciona|como jugar|como se juega|explicame/.test(lower)) {
      datosHTML = getReglas();
      intro     = "📖 Aquí te explico cómo funciona:";
    } else if (/punto|puntaje|cuanto vale|sistema|cuantos punt/.test(lower)) {
      datosHTML = getSistemaPuntos();
      intro     = "⭐ Así funciona el sistema de puntos:";
    } else if (/hola|buenas|hey|buenos|saludos|como estas|que mas|quiubo|ey|que tal|buenas tardes|buenas noches|buenos dias/.test(lower)) {
      datosHTML = await getSaludo();
      intro     = "";
    }

    if (datosHTML !== null) {
      hideTyping();
      addMsg("bot", intro ? `${intro}<br><br>${datosHTML}` : datosHTML);
    } else {
      const libre = await getIA(q);
      hideTyping();
      addMsg("bot", libre);
    }

  } catch (e) {
    console.error(e);
    hideTyping();
    addMsg("bot", "Uy, algo falló. Intenta de nuevo 🙈");
  }

  isTyping = false;
  sendBtn.disabled = false;
  msgs.scrollTop = msgs.scrollHeight;
}

function addMsgAndReset(html) {
  hideTyping();
  addMsg("bot", html);
  isTyping = false;
  sendBtn.disabled = false;
}

  // ── Funciones de datos ────────────────────────────────────
  async function getPartidosHoy() {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).toISOString();
    const fin    = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59).toISOString();

    const { data } = await db.from("partidos").select("*, grupos(nombre)")
      .gte("fecha", inicio).lte("fecha", fin).order("fecha");

    if (!data || data.length === 0)
      return "Hoy no hay partidos programados. 😴 Aprovecha para revisar tus apuestas de los próximos días.";

    let html = `📅 <strong>Partidos de hoy:</strong><br>`;
    data.forEach(p => {
      const hora = new Date(p.fecha).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
      html += `<div class="terry-card">
        <div class="terry-card-title">${p.equipo1} vs ${p.equipo2}</div>
        <div class="terry-card-row"><span>🕐 Hora</span><span>${hora}</span></div>
        <div class="terry-card-row"><span>📌 Grupo</span><span>${p.grupos?.nombre || "?"}</span></div>
      </div>`;
    });
    return html;
  }

  async function getProximos() {
    const ahora = new Date().toISOString();
    const { data } = await db.from("partidos").select("*, grupos(nombre)")
      .gt("fecha", ahora).order("fecha").limit(5);

    if (!data || data.length === 0)
      return "No hay partidos próximos programados por ahora. 🗓️";

    let html = `⏭ <strong>Próximos partidos:</strong><br>`;
    data.forEach(p => {
      const fecha = new Date(p.fecha).toLocaleString("es-CO", {
        weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
      });
      html += `<div class="terry-card">
        <div class="terry-card-title">${p.equipo1} vs ${p.equipo2}</div>
        <div class="terry-card-row"><span>📅 Fecha</span><span>${fecha}</span></div>
        <div class="terry-card-row"><span>📌 Grupo</span><span>${p.grupos?.nombre || "?"}</span></div>
      </div>`;
    });
    return html;
  }

  async function getMisApuestas() {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
    if (!usuario) return "🔒 Necesitas iniciar sesión para ver tus apuestas.";

    const { data: apuestas } = await db.from("apuestas").select("*, partidos(equipo1, equipo2, fecha)")
      .eq("usuario_id", usuario.user).order("creado_en", { ascending: false }).limit(8);

    if (!apuestas || apuestas.length === 0)
      return "Aún no tienes apuestas registradas. ¡Anímate a apostar! 🎯";

    const ganadas  = apuestas.filter(a => a.estado === "ganada").length;
    const perdidas = apuestas.filter(a => a.estado === "perdida").length;
    const pend     = apuestas.filter(a => a.estado === "pendiente").length;
    const puntos   = apuestas.filter(a => a.estado === "ganada").reduce((s, a) => s + (a.puntos_ganados || 0), 0);

    let html = `🎯 <strong>Tus apuestas:</strong><br>
    <div class="terry-card">
      <div class="terry-card-row"><span>✅ Ganadas</span><span>${ganadas}</span></div>
      <div class="terry-card-row"><span>❌ Perdidas</span><span>${perdidas}</span></div>
      <div class="terry-card-row"><span>⏳ Pendientes</span><span>${pend}</span></div>
      <div class="terry-card-row"><span>⭐ Puntos ganados</span><span>${puntos}</span></div>
    </div>`;

    const recientes = apuestas.slice(0, 3);
    if (recientes.length > 0) {
      html += `<br><strong>Últimas 3:</strong>`;
      recientes.forEach(a => {
        const estadoIcon = a.estado === "ganada" ? "✅" : a.estado === "perdida" ? "❌" : "⏳";
        const partido = a.partidos;
        html += `<div class="terry-card">
          <div class="terry-card-title">${partido?.equipo1 || "?"} vs ${partido?.equipo2 || "?"}</div>
          <div class="terry-card-row"><span>Estado</span><span>${estadoIcon} ${a.estado}</span></div>
          ${a.estado === "ganada" ? `<div class="terry-card-row"><span>Puntos</span><span>+${a.puntos_ganados}</span></div>` : ""}
        </div>`;
      });
    }

    return html;
  }

  async function getMiRanking() {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
    if (!usuario) return "🔒 Necesitas iniciar sesión para ver tu ranking.";

    const { data: apuestas } = await db.from("apuestas").select("usuario_id, puntos_ganados").eq("estado", "ganada");
    const { data: usuarios } = await db.from("usuarios").select("user, nombre, rol").neq("rol", "admin");

    if (!usuarios) return "No se pudo cargar el ranking. 😓";

    const puntosMap = {};
    (apuestas || []).forEach(a => {
      puntosMap[a.usuario_id] = (puntosMap[a.usuario_id] || 0) + (a.puntos_ganados || 0);
    });

    const ranking = usuarios
      .map(u => ({ ...u, puntos: puntosMap[u.user] || 0 }))
      .sort((a, b) => b.puntos - a.puntos);

    const miPosicion = ranking.findIndex(r => r.user === usuario.user) + 1;
    const miData     = ranking.find(r => r.user === usuario.user);
    const medallas   = ["🥇", "🥈", "🥉"];

    let html = `🏆 <strong>Tu posición en el ranking:</strong>
    <div class="terry-card">
      <div class="terry-card-title">${medallas[miPosicion - 1] || `#${miPosicion}`} ${miData?.nombre || usuario.user}</div>
      <div class="terry-card-row"><span>⭐ Puntos</span><span>${miData?.puntos || 0}</span></div>
      <div class="terry-card-row"><span>📊 Posición</span><span>${miPosicion} de ${ranking.length}</span></div>
    </div>`;

    if (miPosicion > 1) {
      const anterior = ranking[miPosicion - 2];
      const diff = anterior.puntos - (miData?.puntos || 0);
      html += `<br>Necesitas <strong>${diff} punto${diff !== 1 ? "s" : ""}</strong> más para superar a <strong>${anterior.nombre}</strong> 💪`;
    } else {
      html += `<br>¡Vas de <strong>primero</strong>! Mantén el ritmo 🔥`;
    }

    html += `<br><br><strong>Top 3:</strong>`;
    ranking.slice(0, 3).forEach((r, i) => {
      const esYo = r.user === usuario.user ? " <span style='color:#ff7a00'>(tú)</span>" : "";
      html += `<div class="terry-card">
        <div class="terry-card-row"><span>${medallas[i] || `#${i+1}`} ${r.nombre}${esYo}</span><span>⭐ ${r.puntos}</span></div>
      </div>`;
    });

    return html;
  }

  async function getLider() {
    const { data: apuestas } = await db.from("apuestas").select("usuario_id, puntos_ganados").eq("estado", "ganada");
    const { data: usuarios } = await db.from("usuarios").select("user, nombre, rol").neq("rol", "admin");
    if (!usuarios) return "No pude cargar el ranking 😓";

    const puntosMap = {};
    (apuestas || []).forEach(a => {
      puntosMap[a.usuario_id] = (puntosMap[a.usuario_id] || 0) + (a.puntos_ganados || 0);
    });

    const ranking = usuarios
      .map(u => ({ ...u, puntos: puntosMap[u.user] || 0 }))
      .sort((a, b) => b.puntos - a.puntos);

    if (ranking.length === 0) return "Aún no hay nadie en el ranking. ¡Sé el primero! 🏆";

    const lider = ranking[0];
    return `🥇 El líder actual es <strong>${lider.nombre}</strong> con <strong>${lider.puntos} puntos</strong>. ¡Hay que alcanzarlo! 🔥`;
  }

  async function getSaludo() {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
    const nombre = usuario?.nombre || usuario?.user || "crack";
    const { data } = await db.from("partidos").select("id").gt("fecha", new Date().toISOString()).limit(1);
    const hayProximos = data && data.length > 0;
    return `¡Hola <strong>${nombre}</strong>! 👋 ¿Qué necesitas? ${hayProximos ? "Hay partidos próximos, ¿quieres verlos? 👀" : ""}`;
  }

  function getReglas() {
    return `📖 <strong>Cómo funciona TDT Mundial:</strong>
    <div class="terry-card">
      <div class="terry-card-title">Apuesta combinada</div>
      <div class="terry-card-row"><span>Elige uno o más stats</span><span>⚽🎯🟨🟥🚩</span></div>
      <div class="terry-card-row"><span>¿Falla uno?</span><span>Pierdes todo ❌</span></div>
      <div class="terry-card-row"><span>¿Aciertas todos?</span><span>Sumas puntos ✅</span></div>
    </div>
    <div class="terry-card">
      <div class="terry-card-title">Cierre de apuestas</div>
      <div class="terry-card-row"><span>Se cierran cuando</span><span>inicia el partido</span></div>
    </div>`;
  }

  function getSistemaPuntos() {
    return `⭐ <strong>Sistema de puntos:</strong>
    <div class="terry-card">
      <div class="terry-card-row"><span>⚽ Resultado partido</span><span>+2 pts</span></div>
      <div class="terry-card-row"><span>🎯 Marcador exacto</span><span>+3 pts</span></div>
      <div class="terry-card-row"><span>🟥 Tarjetas rojas</span><span>+4 pts</span></div>
    </div>
    <div class="terry-card">
      <div class="terry-card-title">🟨 Amarillas</div>
      <div class="terry-card-row"><span>Más de 3</span><span>+1 pt</span></div>
      <div class="terry-card-row"><span>Más de 5</span><span>+2 pts</span></div>
      <div class="terry-card-row"><span>Más de 6</span><span>+3 pts</span></div>
      <div class="terry-card-row"><span>Más de 8</span><span>+4 pts</span></div>
    </div>
    <div class="terry-card">
      <div class="terry-card-title">🚩 Corners</div>
      <div class="terry-card-row"><span>0 corners</span><span>+5 pts</span></div>
      <div class="terry-card-row"><span>Más de 10</span><span>+1 pt</span></div>
      <div class="terry-card-row"><span>Más de 12</span><span>+2 pts</span></div>
      <div class="terry-card-row"><span>Más de 16</span><span>+3 pts</span></div>
    </div>`;
  }

  async function getIntro(pregunta, contexto) {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const nombre  = usuario?.nombre || "crack";
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${typeof GROQ_API_KEY !== "undefined" ? GROQ_API_KEY : ""}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 80,
        messages: [
          { role: "system", content: `Eres Terry, asistente colombiano y divertido del TDT Mundial. El usuario se llama ${nombre}. Escribe UNA sola oración corta y natural para introducir la información que viene, sin repetir los datos. Sin HTML, sin emojis de fútbol repetitivos. Tono parce y animado.` },
          { role: "user", content: `El usuario dijo: "${pregunta}". Contexto: ${contexto}` }
        ]
      })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "Aquí va lo que encontré:";
  } catch {
    return "Aquí va lo que encontré:";
  }
}

  async function getIA(pregunta) {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const nombre = usuario?.nombre || "usuario";

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${typeof GROQ_API_KEY !== "undefined" ? GROQ_API_KEY : ""}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 300,
        messages: [
          { role: "system", content: `Eres Terry, asistente de TDT Mundial, plataforma colombiana de apuestas de fútbol. Eres divertido, parce, experto en fútbol. Respondes en español, máximo 3 oraciones cortas. El usuario se llama ${nombre}.` },
          { role: "user", content: pregunta }
        ]
      })
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "No entendí bien, intenta con los botones de arriba 👆";
  } catch (e) {
    return "No pude procesar eso ahora 😅 Prueba uno de los botones de arriba 👆";
  }
}

})();
