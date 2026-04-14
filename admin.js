
function habilitarGrupo(id){

fetch("partidos.json")

.then(r=>r.json())

.then(datos=>{

let grupo=
datos.grupos.find(g=>

g.id==id)

grupo.habilitado=true

alert("Grupo habilitado")

})

}
