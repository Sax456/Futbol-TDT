console.log("JS cargado");


async function cargarGrupos(){

console.log("Entró a cargarGrupos");

let contenedor =
document.getElementById("grupos")

contenedor.innerHTML="Cargando grupos..."

let { data: grupos, error } = await db

.from("grupos")

.select("*")

console.log("DATOS:", grupos)
console.log("ERROR:", error)



contenedor.innerHTML=""


// Mostrar grupos
for(let g of grupos){

// contar equipos del grupo
let { data: equipos } = await db

.from("equipos")

.select("*")

.eq("grupo_id",g.id)


contenedor.innerHTML+=`

<div class="grupoCard">

<h2>${g.nombre}</h2>

<p>${equipos.length} equipos</p>

<button 

class="grupoBtn"

onclick="entrarGrupo(${g.id})"

>

Entrar

</button>

</div>

`

}

}


// entrar al grupo
function entrarGrupo(id){

window.location.href =

"grupo.html?grupo="+id

}


// logout
function logout(){

localStorage.removeItem(

"usuario"

)

window.location=

"index.html"

}


// cargar cuando abre página
cargarGrupos()
