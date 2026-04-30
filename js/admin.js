/* ============================================================
   mis-apuestas.css — Estilos página mis apuestas TDT Mundial
   ============================================================ */

.tituloMisApuestas {
  padding: 0 20px;
}

/* ---- RESUMEN ---- */
.resumenContainer {
  display: flex;
  gap: 16px;
  padding: 0 40px 24px;
  flex-wrap: wrap;
}

.resumenCard {
  background: #0f172a;
  border-radius: 12px;
  border: 1px solid #1e293b;
  padding: 20px 24px;
  flex: 1;
  min-width: 120px;
  text-align: center;
}

.resumenCard.destacado {
  border-color: #ff7a00;
  background: #1c0d00;
}

.resumenIcon { font-size: 24px; margin-bottom: 6px; }
.resumenNum  { font-size: 32px; font-weight: 800; color: white; font-family: 'Bebas Neue', sans-serif; }
.resumenLabel { font-size: 12px; color: #64748b; margin-top: 4px; }

/* ---- FILTROS ---- */
.filtrosContainer {
  display: flex;
  gap: 10px;
  padding: 0 40px 20px;
  flex-wrap: wrap;
}

.filtroBtn {
  background: #0f172a;
  color: #94a3b8;
  border: 1px solid #1e293b;
  padding: 8px 18px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 13px;
  font-family: 'Montserrat', sans-serif;
  letter-spacing: 1px;
  transition: all 0.2s;
}

.filtroBtn:hover { border-color: #ff7a00; color: white; }
.filtroBtn.activo {
  background: #ff7a00;
  color: white;
  border-color: #ff7a00;
  font-weight: bold;
}

/* ---- LISTA ---- */
.misApuestasContainer {
  padding: 0 40px 60px;
}

/* ---- CARD DE APUESTA ---- */
.maCard {
  background: #0f172a;
  border-radius: 12px;
  border-left: 4px solid #334155;
  padding: 18px 20px;
  margin-bottom: 16px;
}

.maCard.ganada   { border-left-color: #16a34a; }
.maCard.perdida  { border-left-color: #dc2626; }
.maCard.pendiente { border-left-color: #f59e0b; }

.maCardTop {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.maGrupo {
  background: #1e293b;
  color: #94a3b8;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 12px;
}

.maFecha {
  color: #64748b;
  font-size: 12px;
  flex: 1;
  text-transform: capitalize;
}

.maEstadoBadge {
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}
.maEstadoBadge.ganada   { background: #052e16; color: #4ade80; }
.maEstadoBadge.perdida  { background: #1c0a0a; color: #f87171; }
.maEstadoBadge.pendiente { background: #1c1400; color: #fbbf24; }

.maEquipos {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 14px;
}

.maVs {
  color: #ff7a00;
  font-size: 13px;
}

.maDetalles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.maDetalleItem {
  background: #020617;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 6px 12px;
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
}

.maDetalleTipo  { color: #94a3b8; }
.maDetalleValor { color: white; font-weight: bold; }

.maPuntos {
  background: #052e16;
  border: 1px solid #16a34a;
  border-radius: 8px;
  padding: 8px 14px;
  color: #4ade80;
  font-weight: bold;
  font-size: 14px;
  display: inline-block;
  border-top-color: #78350f;
  color: #f59e0b;
}

/* ---- RESPONSIVE ---- */
@media (max-width: 768px) {
  .resumenContainer, .filtrosContainer, .misApuestasContainer {
    padding-left: 16px;
    padding-right: 16px;
  }
  .resumenCard { min-width: calc(50% - 8px); }
  .maEquipos   { font-size: 14px; }
}
