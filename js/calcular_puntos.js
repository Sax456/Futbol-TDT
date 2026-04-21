// ============================================================
// calcular_puntos.js — Lógica de puntos TDT Mundial
// Se ejecuta desde admin cuando ingresa un resultado
// ============================================================

const PUNTOS = {
  ganador  : 2,
  empate   : 1,
  marcador : 3,
  amarillas: 3,
  rojas    : 4,
  corners  : 2
};

// ============================================================
// FUNCIÓN PRINCIPAL — llamar después de guardar resultado
// ============================================================
async function calcularPuntosPartido(partidoId, resultado) {
  // resultado = { goles1, goles2, amarillas, rojas, corners }

  // 1. Obtener todas las apuestas de este partido
  const { data: apuestas, error } = await db
    .from("apuestas")
    .select("*, apuestas_detalle(*)")
    .eq("partido_id", partidoId)
    .eq("estado", "pendiente");

  if (error || !apuestas || apuestas.length === 0) return;

  // 2. Determinar resultado real
  const goles1   = parseInt(resultado.goles1);
  const goles2   = parseInt(resultado.goles2);
  const esEmpate = goles1 === goles2;
  const ganador  = esEmpate ? null : (goles1 > goles2 ? resultado.equipo1 : resultado.equipo2);
  const marcador = `${goles1}-${goles2}`;

  // 3. Evaluar cada apuesta
  for (const apuesta of apuestas) {
    const detalles = apuesta.apuestas_detalle || [];
    if (detalles.length === 0) continue;

    let todosAcertados = true;
    let puntosGanados  = 0;

    for (const detalle of detalles) {
      const acerto = verificarStat(detalle, {
        ganador, esEmpate, marcador,
        amarillas: parseInt(resultado.amarillas),
        rojas    : parseInt(resultado.rojas),
        corners  : parseInt(resultado.corners)
      });

      if (acerto) {
        puntosGanados += PUNTOS[detalle.tipo_stat] || 0;
      } else {
        todosAcertados = false;
        break; // apuesta combinada — falla uno falla todo
      }
    }

    // 4. Actualizar apuesta
    await db
      .from("apuestas")
      .update({
        estado        : todosAcertados ? "ganada" : "perdida",
        puntos_ganados: todosAcertados ? puntosGanados : 0
      })
      .eq("id", apuesta.id);
  }
}

function verificarStat(detalle, real) {
  const val = detalle.valor_apostado;

  switch (detalle.tipo_stat) {
    case "ganador":
      return !real.esEmpate && val === real.ganador;
    case "empate":
      return real.esEmpate;
    case "marcador":
      return val === real.marcador;
    case "amarillas":
      return parseInt(val) === real.amarillas;
    case "rojas":
      return parseInt(val) === real.rojas;
    case "corners":
      return parseInt(val) === real.corners;
    default:
      return false;
  }
}
