
let fechaLimite =
new Date("2026-06-11")


function mostrarRegistro(){

let hoy =
new Date()

if(hoy > fechaLimite){

alert(
"Registro cerrado"
)

return

}

document.getElementById(
"registro"
).style.display="block"

}



async function registrar(){

let nombre =
document.getElementById(
"nombreReal"
).value

let user=
document.getElementById(
"nuevoUser"
).value

let pass=
document.getElementById(
"nuevoPass"
).value

let codigo=
document.getElementById(
"codigo"
).value


if(codigo!="TDT2026"){

alert(
"Codigo empresa incorrecto"
)

return

}


let { data,error } =
await db
.from("usuarios")
.insert([

{

nombre:nombre,
user:user,
pass:pass,
rol:"user"

}

])


if(error){

console.log(error)

alert(
error.message
)

return

}



alert(
"Cuenta creada correctamente"
)

}




async function login(){

let user =
document.getElementById(
"user"
).value

let pass =
document.getElementById(
"pass"
).value


let { data,error } =
await db

.from("usuarios")

.select("*")

.eq("user",user)

.eq("pass",pass)

.single()


if(data){

localStorage.setItem(
"usuario",
data.nombre
)

localStorage.setItem(
"user",
data.user
)

localStorage.setItem(
"rol",
data.rol
)


if(data.rol=="admin"){

window.location=
"admin.html"

}

else{

window.location=
"dashboard.html"

}

}

else{

document.getElementById(
"error"
).innerText=

"Usuario incorrecto"

}

}




