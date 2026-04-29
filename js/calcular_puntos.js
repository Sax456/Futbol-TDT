// ============================================================
// calcular_puntos.js — Lógica de puntos TDT Mundial
// ============================================================

const PUNTOS_FIJOS = {
  resultado: 2,
  marcador : 3,
  rojas    : 4
};

const PUNTOS_AMARILLAS = {
  mas3: 1,
  mas5: 2,
  mas6: 3,
  mas8: 4
};

const PUNTOS_CORNERS = {
  cero : 5,
  mas10: 1,
  mas12: 2,
  mas16: 3
};

async function calcularPuntosPartido(partidoId, resultado) {
  const { data: apuestas, error } = await db
    .from("apuestas")
    .select("*, apuestas_detalle(*)")
    .eq("partido_id", partidoId);

  if (error || !apuestas || apuestas.length === 0) return;

  const goles1    = parseInt(resultado.goles1);
  const goles2    = parseInt(resultado.goles2);
  const esEmpate  = goles1 === goles2;
  const ganador   = esEmpate ? null : (goles1 > goles2 ? resultado.equipo1 : resultado.equipo2);
  const marcador  = `${goles1}-${goles2}`;
  const amarillas = parseInt(resultado.amarillas) || 0;
  const rojas     = parseInt(resultado.rojas)     || 0;
  const corners   = parseInt(resultado.corners)   || 0;

  for (const apuesta of apuestas) {
    const detalles = apuesta.apuestas_detalle || [];
    if (detalles.length === 0) continue;

    let todosAcertados = true;
    let puntosGanados  = 0;

    for (const detalle of detalles) {
      const { acerto, puntos } = verificarStat(detalle, {
        ganador, esEmpate, marcador, amarillas, rojas, corners
      });

      if (acerto) {
        puntosGanados += puntos;
      } else {
        todosAcertados = false;
        break;
      }
    }

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

    case "resultado":
      if (val === "empate") return { acerto: real.esEmpate,                           puntos: PUNTOS_FIJOS.resultado };
      return { acerto: !real.esEmpate && val === real.ganador,                         puntos: PUNTOS_FIJOS.resultado };

    case "marcador":
      return { acerto: val === real.marcador,                                          puntos: PUNTOS_FIJOS.marcador };

    case "rojas":
      return { acerto: parseInt(val) === real.rojas,                                   puntos: PUNTOS_FIJOS.rojas };

    case "amarillas":
      const umbralAm = { mas3: 3, mas5: 5, mas6: 6, mas8: 8 }[val];
      return { acerto: umbralAm !== undefined && real.amarillas > umbralAm,            puntos: PUNTOS_AMARILLAS[val] || 0 };

    case "corners":
      if (val === "cero")  return { acerto: real.corners === 0,                        puntos: PUNTOS_CORNERS.cero };
      const umbralCo = { mas10: 10, mas12: 12, mas16: 16 }[val];
      return { acerto: umbralCo !== undefined && real.corners > umbralCo,             puntos: PUNTOS_CORNERS[val] || 0 };

    default:
      return { acerto: false, puntos: 0 };
  }
}
