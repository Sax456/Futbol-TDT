let usuarioRaw = localStorage.getItem("usuario")
let usuario = null
try {
  usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null
} catch(e) {
  usuario = { nombre: usuarioRaw }
}

if(usuario){
  document.getElementById("usuario").innerText = usuario.nombre
}



function volver(){

window.history.back()

}



function logout(){

localStorage.removeItem(
"usuario"
)

localStorage.removeItem(
"user"
)

localStorage.removeItem(
"rol"
)

window.location=
"index.html"

}
