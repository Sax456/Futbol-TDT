let parametros =
new URLSearchParams(
window.location.search
)

let grupoId =
parametros.get("grupo")

document.getElementById(
"tituloGrupo"
).innerText =
"Grupo " + grupoId


async function cargarPartidos(){

let contenedor =
document.getElementById("partidos")

contenedor.innerHTML =
"Cargando partidos..."

let { data: partidos, error } =
await db
.from("partidos")
.select("*")
.eq("grupo_id", grupoId)

console.log("PARTIDOS:", partidos)
console.log("ERROR:", error)

if(error){

contenedor.innerHTML =
"Error al cargar partidos"

return

}

if(!partidos || partidos.length === 0){

contenedor.innerHTML =
"No hay partidos en este grupo"

return

}

contenedor.innerHTML = ""

partidos.forEach(p=>{

contenedor.innerHTML += `

<div class="partidoCard">

<div class="equipos">
${p.equipo1} vs ${p.equipo2}
</div>

<div class="fecha">
${p.fecha ? new Date(p.fecha).toLocaleString() : "Sin fecha"}
</div>

</div>

`

})

}

cargarPartidos()
