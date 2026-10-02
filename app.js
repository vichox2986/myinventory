let activos=[];
let coincidenciasActuales=[];
let indiceSeleccionado=-1;

const input=document.getElementById("serie");
const boton=document.getElementById("btnBuscar");
const sugerencias=document.getElementById("sugerencias");
const resultado=document.getElementById("resultado");
const estado=document.getElementById("estado");

function txt(v){return v===null||v===undefined?"":String(v);}
function norm(v){return txt(v).trim().toLowerCase();}
function clave(v){return norm(v).replace(/\s+/g,"");}
function esc(v){return txt(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function fecha(v){
  const s=txt(v);
  const m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m?`${m[3]}/${m[2]}/${m[1]}`:s;
}

function renderDato(label,value){
  // Si Activo Fijo no tiene valor, se muestra vacío, no un guion.
  if(value===null||value===undefined||value==="") return `<div class="dato"><strong>${esc(label)}</strong><span></span></div>`;
  return `<div class="dato"><strong>${esc(label)}</strong><span>${esc(value)}</span></div>`;
}

function obtenerCoincidencias(){
  const q=clave(input.value);
  if(!q)return [];
  // La búsqueda inicial se hace exclusivamente contra SERIE.
  return activos.filter(a=>clave(a["Serie"]).endsWith(q));
}

function mostrarSugerencias(lista){
  coincidenciasActuales=lista.slice(0,15);
  indiceSeleccionado=-1;
  if(!coincidenciasActuales.length){
    sugerencias.innerHTML="";
    sugerencias.style.display="none";
    return;
  }
  sugerencias.innerHTML=coincidenciasActuales.map((a,i)=>`
    <button type="button" class="suggestion" data-index="${i}">
      <strong>${esc(a["Serie"])}</strong>
      <small>${esc(a["Tipo Equipo"])} · ${esc(a["Marca"])} ${esc(a["Modelo"])}</small>
    </button>`).join("");
  sugerencias.style.display="block";
}

function buscar(){
  const q=input.value.trim();
  if(!q){mostrarSugerencias([]);resultado.innerHTML="";estado.textContent="Ingrese una serie o sus últimos dígitos.";return;}
  const lista=obtenerCoincidencias();
  mostrarSugerencias(lista);
  if(!lista.length){
    resultado.innerHTML=`<div class="error">No se encontraron series que coincidan con <strong>${esc(q)}</strong>.</div>`;
    estado.textContent="Sin coincidencias.";
  }else if(lista.length===1){
    estado.textContent="1 coincidencia encontrada.";
    mostrarActivo(lista[0]);
  }else{
    estado.textContent=`${lista.length} coincidencia(s) encontrada(s).`;
    resultado.innerHTML=`<p class="muted">Seleccione una de las sugerencias o presione Enter para abrir la primera.</p>`;
  }
}

function seleccionarIndice(i){
  const a=coincidenciasActuales[i];
  if(!a)return;
  input.value=txt(a["Serie"]);
  mostrarActivo(a);
}

function mostrarActivo(a){
  sugerencias.innerHTML="";
  sugerencias.style.display="none";

  const asignacion=a["_assignment"];

  // Mapeo verificado contra BASE WEB(1).xlsx:
  // Empresa B, Tipo C, Marca D, Modelo E, Serie F,
  // Ubicación G, Estado H, Correlativo I, Activo Fijo J,
  // Fecha de compra K, Usuario L, Descripción M, Acta Real N.

  resultado.innerHTML=`
  <div class="activo">
    <h2>${esc(a["Marca"])} ${esc(a["Modelo"])}</h2>
    <div class="grid">
      ${renderDato("Empresa",a["Empresa"])}
      ${renderDato("Serie",a["Serie"])}
      ${renderDato("Tipo",a["Tipo Equipo"])}
      ${renderDato("Marca",a["Marca"])}
      ${renderDato("Modelo",a["Modelo"])}
      ${renderDato("Acta",a["ACTA REAL"])}
      ${renderDato("Ubicación",a["Ubicación"])}
      ${renderDato("Estado",a["Estado"])}
      ${renderDato("Correlativo",a["Correlativo"])}
      ${renderDato("Activo fijo",a["Activo Fijo"])}
      ${renderDato("Fecha compra",fecha(a["Fecha de compra"]))}
      ${renderDato("Usuario",a["USUARIO"])}
      ${renderDato("Descripción",a["DESCRIPCION"])}
    </div>

    <h3 class="section-title">Asignación</h3>
    ${asignacion?`
    <div class="grid">
      ${renderDato("ABM",asignacion.abm)}
      ${renderDato("Acta",asignacion.acta)}
      ${renderDato("RUT",asignacion.rut)}
      ${renderDato("Asignado a",asignacion.personal)}
      ${renderDato("Cargo",asignacion.cargo)}
      ${renderDato("Gerencia",asignacion.gerencia)}
      ${renderDato("Área",asignacion.area)}
      ${renderDato("Unidad",asignacion.unidad)}
      ${renderDato("Fecha asignación",asignacion.fecha_asignacion)}
      ${renderDato("Estado asignación",asignacion.estado_asignacion)}
    </div>`:
    `<p class="muted">No existe coincidencia en ASIGNACIONES para el ACTA REAL de este equipo.</p>`}
  </div>`;
}

input.addEventListener("input",()=>{
  if(!activos.length)return;
  const lista=obtenerCoincidencias();
  mostrarSugerencias(lista);
  if(!input.value.trim()){
    resultado.innerHTML="";
    estado.textContent=`${activos.length.toLocaleString("es-CL")} activos cargados.`;
  }else if(!lista.length){
    resultado.innerHTML=`<div class="error">No se encontraron coincidencias.</div>`;
    estado.textContent="Sin coincidencias.";
  }else{
    resultado.innerHTML=`<p class="muted">${lista.length} coincidencia(s). Seleccione una o presione Buscar.</p>`;
    estado.textContent=`${lista.length} coincidencia(s) encontrada(s).`;
  }
});

boton.addEventListener("click",buscar);

input.addEventListener("keydown",e=>{
  if(e.key==="Enter"){
    e.preventDefault();
    if(indiceSeleccionado>=0&&coincidenciasActuales[indiceSeleccionado])seleccionarIndice(indiceSeleccionado);
    else buscar();
  }else if(e.key==="ArrowDown"&&coincidenciasActuales.length){
    e.preventDefault();
    indiceSeleccionado=(indiceSeleccionado+1)%coincidenciasActuales.length;
    actualizarMarcado();
  }else if(e.key==="ArrowUp"&&coincidenciasActuales.length){
    e.preventDefault();
    indiceSeleccionado=indiceSeleccionado<=0?coincidenciasActuales.length-1:indiceSeleccionado-1;
    actualizarMarcado();
  }else if(e.key==="Escape"){
    sugerencias.style.display="none";
    indiceSeleccionado=-1;
  }
});

function actualizarMarcado(){
  [...sugerencias.querySelectorAll(".suggestion")].forEach((el,i)=>el.classList.toggle("selected",i===indiceSeleccionado));
}

sugerencias.addEventListener("click",e=>{
  const b=e.target.closest(".suggestion");
  if(b)seleccionarIndice(Number(b.dataset.index));
});

fetch("./activos.json",{cache:"no-store"})
.then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();})
.then(data=>{
  if(!Array.isArray(data))throw new Error("Formato inválido");
  activos=data;
  input.disabled=false;
  boton.disabled=false;
  input.placeholder="Ej.: últimos 4 dígitos de la serie";
  estado.textContent=`${activos.length.toLocaleString("es-CL")} activos cargados.`;
})
.catch(err=>{
  console.error(err);
  estado.innerHTML=`<div class="error">No se pudo cargar activos.json: ${esc(err.message)}</div>`;
});
