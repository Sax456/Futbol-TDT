let usuario =
localStorage.getItem("usuario")

if(usuario){

document.getElementById(
"usuario"
).innerText =
usuario

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
