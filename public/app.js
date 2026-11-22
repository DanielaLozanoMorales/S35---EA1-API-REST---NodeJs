'use strict';
const DEFS = {
  media: {title:'Películas y series', description:'Administra el catálogo audiovisual en un solo lugar.', columns:['titulo','serial','anio_estreno','genero_id','tipo_id'], fields:[['serial','Código / serial','text',true],['titulo','Título','text',true],['sinopsis','Sinopsis','textarea',false],['url_pelicula','URL de la película','url',true],['portada','URL de portada','url',false],['anio_estreno','Año de estreno','number',true],['genero_id','Género','relation',true],['director_id','Director','relation',true],['productora_id','Productora','relation',true],['tipo_id','Tipo','relation',true]]},
  generos: {title:'Géneros', description:'Organiza las categorías del catálogo.', columns:['nombre','estado','descripcion'], fields:[['nombre','Nombre del género','text',true],['estado','Estado','estado',false],['descripcion','Descripción','textarea',false]]},
  directores: {title:'Directores', description:'Registra los responsables de las producciones.', columns:['nombres','estado'], fields:[['nombres','Nombres completos','text',true],['estado','Estado','estado',false]]},
  productoras: {title:'Productoras', description:'Gestiona las empresas productoras.', columns:['nombre','estado','slogan'], fields:[['nombre','Nombre','text',true],['estado','Estado','estado',false],['slogan','Eslogan','text',false],['descripcion','Descripción','textarea',false]]},
  tipos: {title:'Tipos', description:'Clasifica las producciones como películas o series.', columns:['nombre','descripcion'], fields:[['nombre','Nombre del tipo','text',true],['descripcion','Descripción','textarea',false]]}
};
const LABELS={titulo:'Título',serial:'Serial',anio_estreno:'Año',genero_id:'Género',tipo_id:'Tipo',nombre:'Nombre',nombres:'Nombres',estado:'Estado',descripcion:'Descripción',slogan:'Eslogan'};
const RELATIONS={genero_id:'generos',director_id:'directores',productora_id:'productoras',tipo_id:'tipos'};
let resource='media', data=[], catalogs={}, editingId=null, messageTimer;
const $ = id=>document.getElementById(id);

async function api(url, options={}) {
  const response=await fetch(url,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
  const text=await response.text(); let result;
  try{result=JSON.parse(text);}catch{throw new Error('La API no devolvió JSON. Revisa el servidor.');}
  if(!response.ok)throw new Error(result.error||`Error HTTP ${response.status}`);
  return result;
}
function notify(text,error=false) {
  clearTimeout(messageTimer);const el=$('notification');el.textContent=text;el.classList.toggle('error',error);el.classList.remove('hidden');messageTimer=setTimeout(()=>el.classList.add('hidden'),5000);
}
async function refreshCatalogs(){
  const values=await Promise.all(['generos','directores','productoras','tipos'].map(name=>api(`/api/${name}`)));
  ['generos','directores','productoras','tipos'].forEach((name,i)=>catalogs[name]=values[i]);
  $('count-genres').textContent=catalogs.generos.length;
  $('count-types').textContent=catalogs.tipos.length;
}
function showEditor(open){$('editor').classList.toggle('hidden',!open);}
async function load(){
  $('section-title').textContent=DEFS[resource].title;
  $('section-description').textContent=DEFS[resource].description;
  $('table-heading').textContent=`Catálogo de ${DEFS[resource].title.toLowerCase()}`;
  $('search').value='';showEditor(false);editingId=null;
  try{
    await refreshCatalogs();data=await api(`/api/${resource}`);
    $('count-current').textContent=data.length;renderTable();
    $('api-status').textContent='API conectada';$('status-dot').className='status-dot ok';
  }catch(err){$('api-status').textContent='Sin conexión';$('status-dot').className='status-dot error';notify(err.message,true);$('table-body').replaceChildren(makeTextCellRow('No se pudo cargar el catálogo.',1));}
}
function makeTextCellRow(text,span){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=span;td.className='empty';td.textContent=text;tr.append(td);return tr;}
function readable(record,key){
  if(RELATIONS[key]){const item=(catalogs[RELATIONS[key]]||[]).find(a=>a.id===record[key]);return item?.nombre||item?.nombres||`#${record[key]}`;}
  return record[key]??'—';
}
function renderTable(){
  const fields=DEFS[resource].columns;
  const header=document.createElement('tr');
  [...fields.map(f=>LABELS[f]||f),'Acciones'].forEach(name=>{const th=document.createElement('th');th.textContent=name;header.append(th);});
  $('table-head').replaceChildren(header);
  const query=$('search').value.trim().toLowerCase();
  const filtered=data.filter(record=>Object.values(record).some(value=>String(value??'').toLowerCase().includes(query)) || fields.some(k=>String(readable(record,k)).toLowerCase().includes(query)));
  const tbody=$('table-body');tbody.replaceChildren();
  if(!filtered.length)tbody.append(makeTextCellRow('No se encontraron registros. Puedes crear uno nuevo.',fields.length+1));
  for(const record of filtered){
    const tr=document.createElement('tr');
    for(const field of fields){const td=document.createElement('td');const str=String(readable(record,field));td.title=str;
      if(field==='estado'){const pill=document.createElement('span');pill.className=`pill ${str==='Inactivo'?'inactive':''}`;pill.textContent=str;td.append(pill);}else td.textContent=str;
      tr.append(td);
    }
    const actions=document.createElement('td');
    const edit=document.createElement('button');edit.type='button';edit.className='action';edit.textContent='Editar';edit.addEventListener('click',()=>openEditor(record));
    const del=document.createElement('button');del.type='button';del.className='action delete';del.textContent='Eliminar';del.addEventListener('click',()=>deleteRecord(record));
    actions.append(edit,del);tr.append(actions);tbody.append(tr);
  }
  $('results-label').textContent=`Mostrando ${filtered.length} de ${data.length} registros`;
}
function addField(container, field, current){
  const [name,caption,type,required]=field;
  const wrapper=document.createElement('div');wrapper.className='field'+(type==='textarea'?' full':'');
  const label=document.createElement('label');label.htmlFor=`field-${name}`;label.textContent=caption+(required?' *':'');
  let input;
  if(type==='textarea'){input=document.createElement('textarea');input.rows=3;}
  else if(type==='relation'||type==='estado'){input=document.createElement('select');
    if(type==='estado'){for(const v of ['Activo','Inactivo']){const opt=new Option(v,v);input.add(opt);}}
    else {input.add(new Option(`Selecciona ${caption.toLowerCase()}`,'',true,false));for(const record of catalogs[RELATIONS[name]]||[]){if(record.estado==='Inactivo' && record.id!==current?.[name])continue;input.add(new Option(record.nombre||record.nombres,record.id));}}
  }else {input=document.createElement('input');input.type=type;if(type==='number'){input.min='1888';input.max=String(new Date().getFullYear()+5);input.step='1';}}
  input.id=`field-${name}`;input.name=name;input.required=required;
  if(current&&current[name]!==undefined&&current[name]!==null)input.value=String(current[name]);
  if(!current&&type==='estado')input.value='Activo';
  wrapper.append(label,input);container.append(wrapper);
}
function openEditor(record=null){
  editingId=record?.id??null;
  $('editor-title').textContent=record?`Editar ${DEFS[resource].title.toLowerCase()} #${record.id}`:'Crear nuevo registro';
  const fields=$('form-fields');fields.replaceChildren();DEFS[resource].fields.forEach(f=>addField(fields,f,record));showEditor(true);
  $('editor').scrollIntoView({behavior:'smooth',block:'start'});
}
async function saveRecord(event){
  event.preventDefault();
  const values={};
  for(const [key,,type] of DEFS[resource].fields){const raw=$(`field-${key}`).value; if(type==='number'||type==='relation')values[key]=raw===''?null:Number(raw);else values[key]=raw;}
  const editing=editingId!==null;
  $('save-record').disabled=true;
  try{
    await api(`/api/${resource}${editing?'/'+editingId:''}`,{method:editing?'PATCH':'POST',body:JSON.stringify(values)});
    notify(editing?'Registro actualizado correctamente.':'Registro creado correctamente.');await load();
  }catch(err){notify(err.message,true);}finally{$('save-record').disabled=false;}
}
async function deleteRecord(record){
  if(!confirm(`¿Eliminar el registro #${record.id}? Esta acción no se puede deshacer.`))return;
  try{await api(`/api/${resource}/${record.id}`,{method:'DELETE'});notify('Registro eliminado correctamente.');await load();}catch(err){notify(err.message,true);}
}
$('tabs').addEventListener('click',e=>{const btn=e.target.closest('[data-resource]');if(!btn)return;resource=btn.dataset.resource;document.querySelectorAll('.nav-button').forEach(b=>b.classList.toggle('active',b===btn));load();});
$('new-record').addEventListener('click',()=>openEditor());
$('cancel-editor').addEventListener('click',()=>{editingId=null;showEditor(false);});
$('record-form').addEventListener('submit',saveRecord);
$('search').addEventListener('input',renderTable);
load();
