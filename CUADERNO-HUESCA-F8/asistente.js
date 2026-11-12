/* ASISTENTE DE ÓRDENES · Cuaderno del entrenador */
const NUMPAL={un:1,uno:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,once:11,doce:12,trece:13,catorce:14,quince:15,dieciseis:16,diecisiete:17,dieciocho:18,diecinueve:19,veinte:20,veintiuno:21,veintidos:22,veintitres:23,veinticuatro:24,veinticinco:25,treinta:30};
function numDe(s){
  s=String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const m=s.match(/\d+/); if(m) return +m[0];
  const k=Object.keys(NUMPAL).find(k=>new RegExp('(^|\\s)'+k+'(\\s|$)').test(s));
  return k?NUMPAL[k]:null;
}
const ASIS={pend:null,ultima:null,log:[]};
const PREGUNTA={objetivo:'¿Cuál es el objetivo?',espacio:'¿Qué espacio? (por ejemplo 20x20 o medio campo)',jugadores:'¿Cuántos jugadores?',duracion:'¿Cuántos minutos?'};
const AYUDA='Puedes decir: "crea tarea rueda de pases para 16 jugadores" · "crea tarea X con objetivo Y, espacio 20x20 y 10 minutos" · "crea X y métela en la sesión" · "mete la última tarea en la sesión" · "mete T-OF-079 en la sesión" · "quita la tarea 2 de la sesión" · "pon 15 minutos" · "cambia el objetivo a …" · "para 12 jugadores" · "otra igual" · "lista la sesión" · "crea X, y luego mete la última en la sesión". Si falta un dato te lo pregunto; responde "no" para saltarlo.';
const SINON=[
  [/\b(metelas?|metelos?|metela|metelo|meter|anadela|anadelo|agrega|agregar|incluye|incluir|inserta|insertar|suma|sumar|coloca|colocar)\b/g,'mete'],
  [/\b(quitala|quitalo|quitar|sacala|sacalo|saca|sacar|elimina|eliminala|eliminalo|retira|retirar|borra|borrala|borralo|fuera)\b/g,'quita'],
  [/\b(crear|creame|crea|haz|genera|generar|monta|montar|inventa|inventar)\b/g,'crea'],
  [/\b(lista|listar|muestra|mostrar|ensename|dime|ver)\b/g,'lista'],
  [/\b(duplicar|duplica|copia|copiar|repite|repetir)\b/g,'duplica'],
  [/\b(modifica|modificar|ajusta|ajustar|sube|subir|baja|bajar|deja|dejar)\b/g,'cambia'],
  [/\b(ultima|ultimo|anterior|esa|esta)\b/g,'ultima']
];
function asisLog(txt){ ASIS.log.unshift(txt); ASIS.log=ASIS.log.slice(0,4); pintarAsistente(); }
function asisSesion(){ return D.sesiones.filter(s=>s.fecha===hoyISO()&&!esPartido(s.tipo)).sort((a,b)=>b.creada-a.creada)[0]||null; }
function asisBanco(ref){
  ref=(ref||'').toLowerCase().trim();
  if(!ref||/ultima/.test(ref)) return D.tareas.find(x=>x.id===ASIS.ultima)||null;
  const cod=ref.match(/t-[a-z]{2,3}-\d{3}/);
  if(cod) return D.tareas.find(x=>x.codigo.toLowerCase()===cod[0])||null;
  return D.tareas.find(x=>x.nombre.toLowerCase().includes(ref))||null;
}
function refrescarSesionAbierta(){ if(vista==='sesion'&&sesionActiva&&typeof mostrarTareasSesion==='function') mostrarTareasSesion(); }
function asisNorm(s){
  let t=String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[.!¡¿?;:]+/g,' ').replace(/,/g,' y ').replace(/\s+/g,' ').trim();
  SINON.forEach(([re,rep])=>{ t=t.replace(re,rep); });
  return t.replace(/\s+/g,' ').trim();
}
function asisExtraer(t){
  const c={}; let m;
  m=t.match(/(\d+|[a-z]+)\s+(?:jugadores|jugadoras|personas|chavales|ninos|gente)\b/);
  if(m&&numDe(m[1])) c.jugadores=String(numDe(m[1]));
  if(!c.jugadores&&(m=t.match(/\bpara\s+(\d+)\b/))) c.jugadores=m[1];
  m=t.match(/(\d+|[a-z]+)\s*(?:min|minutos|minuto)\b/);
  if(m&&numDe(m[1])) c.duracion=String(numDe(m[1]));
  if(!c.duracion&&(m=t.match(/(?:duracion|dure|durar|tiempo)\s*(?:de|es|a|por|sea|sean|:)?\s*(\d+|[a-z]+)\b/))&&numDe(m[1])) c.duracion=String(numDe(m[1]));
  if(/medio campo/.test(t)) c.espacio='medio campo';
  m=t.match(/(?:espacio|campo|medidas|dimensiones|zona)\s*(?:de|es|a|:)?\s*(\d+\s*x\s*\d+|\d+\s*por\s*\d+|campo entero|campo completo)/);
  if(m&&!c.espacio) c.espacio=m[1].replace(/\s*por\s*/,'x').replace(/\s*x\s*/,'x');
  const campoRe=kw=>new RegExp('(?:'+kw+')\\s*(?:es|de|a|son|:|que)?\\s*(.+?)(?=\\s+(?:y\\s+)?(?:espacio|objetivo|minutos|duracion|jugadores|normas|material|variantes|correcciones|para|con)\\b|$)');
  if((m=t.match(campoRe('objetivo|meta|finalidad|pretende|trabajar')))) c.objetivo=m[1].trim();
  if((m=t.match(campoRe('normas|norma|reglas|regla|condiciones')))) c.normas=m[1].trim();
  if((m=t.match(campoRe('material|materiales')))) c.material=m[1].trim();
  if((m=t.match(campoRe('variantes|variante')))) c.variantes=m[1].trim();
  if((m=t.match(campoRe('correcciones|correccion|corregir')))) c.correcciones=m[1].trim();
  if(/defensiv/.test(t)) c.contenido='defensiva';
  else if(/transici/.test(t)) c.contenido='transicion';
  else if(/portero|porteria/.test(t)) c.contenido='portero';
  else if(/corner|balon parado/.test(t)) c.contenido='balon';
  else if(/individual/.test(t)) c.contenido='individual';
  return c;
}
function asisNombre(t){
  let n=t.replace(/^(crea|crear|creame|haz|genera|monta|inventa)\s+(una?\s+)?(tarea\s+)?(llamada\s+|que se llame\s+)?/,'');
  n=n.split(/\s+(?:para|con|objetivo|espacio|minutos|duracion|jugadores|normas|material|variantes|correcciones|y mete|y luego|mete)\b/)[0];
  return n.replace(/\s+y$/,'').trim();
}
function crearTarea(nombre,campos,meter){
  const d={nombre:nombre.charAt(0).toUpperCase()+nombre.slice(1),objetivo:campos.objetivo||'',espacio:campos.espacio||'',jugadores:campos.jugadores||'',duracion:campos.duracion||'',material:campos.material||'',normas:campos.normas||'',variantes:campos.variantes||'',correcciones:campos.correcciones||'',contenido:campos.contenido||'ofensiva',nivel:1};
  d.codigo=nuevoCodigo(d.contenido); reservarCodigo(d.codigo);
  const tarea=marcar(Object.assign({id:uid(),valoracion:null},d,{dibujo:dibujoBase(d)}));
  D.tareas.push(tarea); ASIS.ultima=tarea.id;
  let msg='Tarea "'+d.nombre+'" creada ('+d.codigo+').';
  if(meter){
    const s=asisSesion();
    if(s){ s.tareas=s.tareas||[]; if(!s.tareas.includes(tarea.id)) s.tareas.push(tarea.id); marcar(s); msg+=' Añadida a la sesión de hoy.'; }
    else msg+=' No hay sesión de entreno hoy.';
  }
  salvar();
  const falta=['objetivo','espacio','jugadores','duracion'].filter(k=>!d[k]);
  if(falta.length){ ASIS.pend={tipo:'campo',tarea:tarea.id,falta}; msg+=' '+PREGUNTA[falta[0]]; }
  asisLog(msg);
  refrescarSesionAbierta();
}
function asisCrear(t){
  if(!/^crea\b/.test(t)) return false;
  const nombre=asisNombre(t), campos=asisExtraer(t);
  const meter=/\bsesion\b/.test(t)&&/\bmete\b/.test(t);
  if(!nombre){ ASIS.pend={tipo:'nombre',campos,meter}; asisLog('¿Cómo se llama la tarea?'); return true; }
  crearTarea(nombre,campos,meter);
  return true;
}
function asisRespuesta(t){
  const p=ASIS.pend;
  if(/^(mete|quita|crea|lista|cambia|duplica)\b/.test(t)) return false;
  if(p.tipo==='nombre'){
    ASIS.pend=null;
    crearTarea(asisNombre(t)||t,Object.assign({},asisExtraer(t),p.campos||{}),p.meter);
    return true;
  }
  const tarea=D.tareas.find(x=>x.id===p.tarea);
  if(!tarea){ ASIS.pend=null; return false; }
  if(/^no\b/.test(t)){ p.falta.shift(); }
  else {
    const ext=asisExtraer(t);
    const keys=Object.keys(ext).filter(k=>k!=='contenido');
    if(keys.length){
      keys.forEach(k=>{ tarea[k]=ext[k]; const i=p.falta.indexOf(k); if(i>=0) p.falta.splice(i,1); });
    } else {
      const campo=p.falta[0];
      tarea[campo]=(campo==='jugadores'||campo==='duracion')?String(numDe(t)||t):t.charAt(0).toUpperCase()+t.slice(1);
      p.falta.shift();
    }
  }
  if(tarea.dibujo&&tarea.dibujo.auto) tarea.dibujo=dibujoBase(tarea);
  salvar();
  if(p.falta.length){ asisLog('Vale. '+PREGUNTA[p.falta[0]]); }
  else { ASIS.pend=null; asisLog('Tarea "'+tarea.nombre+'" completa.'); }
  refrescarSesionAbierta();
  return true;
}
function asisEditar(t){
  if(!/^(cambia|pon|ajusta|para|con)\b/.test(t)) return false;
  const c=asisExtraer(t), keys=Object.keys(c);
  if(!keys.length) return false;
  const tarea=asisBanco('ultima');
  if(!tarea){ asisLog('No hay ninguna tarea reciente para cambiar.'); return true; }
  keys.forEach(k=>{ tarea[k]=c[k]; });
  if(tarea.dibujo&&tarea.dibujo.auto) tarea.dibujo=dibujoBase(tarea);
  salvar(); asisLog('Actualizada "'+tarea.nombre+'": '+keys.map(k=>k+' = '+c[k]).join(', ')+'.');
  return true;
}
function asisDuplicar(t){
  if(!/^duplica\b/.test(t)&&!/\botra igual\b/.test(t)) return false;
  const base=asisBanco('ultima');
  if(!base){ asisLog('No hay ninguna tarea reciente para copiar.'); return true; }
  const n=Object.assign({},base,{id:uid(),codigo:nuevoCodigo(base.contenido),nombre:base.nombre+' (2)',valoracion:null});
  n.dibujo=dibujoBase(n); reservarCodigo(n.codigo); marcar(n); D.tareas.push(n); ASIS.ultima=n.id; salvar();
  asisLog('Copia creada: "'+n.nombre+'".');
  return true;
}
function asisMeter(t){
  if(!/^mete\b/.test(t)||!/\bsesion\b/.test(t)) return false;
  const resto=t.replace(/^mete\s*/,'').replace(/\s*(en|a|de|para)\s*(la\s+)?sesion.*$/,'').replace(/^(la|el|lo|una?|esa|esta)\s+/,'').replace(/^tarea\s+/,'').trim();
  const tarea=asisBanco(resto);
  if(!tarea){ asisLog('No encuentro esa tarea. Dime el código (por ejemplo T-OF-079) o el nombre.'); return true; }
  const s=asisSesion();
  if(!s){ asisLog('No hay sesión de entreno hoy. Créala con el botón Entreno.'); return true; }
  s.tareas=s.tareas||[]; if(!s.tareas.includes(tarea.id)) s.tareas.push(tarea.id);
  marcar(s); salvar(); asisLog('"'+tarea.nombre+'" añadida a la sesión de hoy.'); refrescarSesionAbierta();
  return true;
}
function asisQuitar(t){
  if(!/^quita\b/.test(t)||!/\bsesion\b/.test(t)) return false;
  const s=asisSesion();
  if(!s){ asisLog('No hay sesión de entreno hoy.'); return true; }
  const pos=t.match(/tarea\s+(\d+)/), cod=t.match(/t-[a-z]{2,3}-\d{3}/);
  let id=null;
  if(pos) id=(s.tareas||[])[+pos[1]-1];
  else if(cod){ const x=D.tareas.find(q=>q.codigo.toLowerCase()===cod[0]); id=x?x.id:null; }
  else { const x=asisBanco(t.replace(/^quita\s*(la\s+|el\s+)?(tarea\s+)?/,'').replace(/\s*(de|en)\s*(la\s+)?sesion.*$/,'')); id=x?x.id:null; }
  if(!id||!(s.tareas||[]).includes(id)){ asisLog('Esa tarea no está en la sesión de hoy.'); return true; }
  s.tareas=s.tareas.filter(x=>x!==id); marcar(s); salvar();
  const x=D.tareas.find(q=>q.id===id);
  asisLog('Quitada "'+(x?x.nombre:'')+'" de la sesión.'); refrescarSesionAbierta();
  return true;
}
function asisListar(t){
  if(!/^lista\b/.test(t)&&!/\b(que tareas|tareas de)\b/.test(t)) return false;
  const s=asisSesion();
  if(!s){ asisLog('No hay sesión de entreno hoy.'); return true; }
  const ids=s.tareas||[];
  asisLog(ids.length?'Sesión de hoy: '+ids.map((id,i)=>{ const x=D.tareas.find(q=>q.id===id); return (i+1)+'. '+(x?x.nombre:'?'); }).join(' · '):'La sesión de hoy no tiene tareas.');
  return true;
}
function asisEjecutar(t){
  if(!t) return;
  if(ASIS.pend&&asisRespuesta(t)) return;
  if(asisDuplicar(t)) return;
  if(asisCrear(t)) return;
  if(asisEditar(t)) return;
  if(asisMeter(t)) return;
  if(asisQuitar(t)) return;
  if(asisListar(t)) return;
  asisLog('No he entendido: "'+t+'". Di "ayuda" para ver ejemplos.');
}
function asisProcesar(texto){
  const t=asisNorm(texto);
  if(!t) return;
  if(/^(ayuda|ejemplos|que puedo decir|como funciona)/.test(t)){ asisLog(AYUDA); return; }
  if(/^(cancela|olvidalo|basta|dejalo|nada)$/.test(t)){ ASIS.pend=null; asisLog('Cancelado.'); return; }
  t.split(/\s+(?:y luego|luego|despues|y despues|y tambien|tambien)\s+/).filter(Boolean).forEach(p=>asisEjecutar(p.trim()));
}
let escuchando=false, reco=null;
function pintarMic(){
  ['asisMicI','asisMicD'].forEach(id=>{ const b=document.getElementById(id); if(b) b.style.background=escuchando?'#dc2626':''; });
}
function dictar(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){ aviso('El dictado no está disponible aquí. Escribe la orden.','warn'); return; }
  if(escuchando){ try{ reco.stop(); }catch(e){} return; }
  reco=new SR(); reco.lang='es-ES'; reco.interimResults=true; reco.continuous=false;
  const base=(document.getElementById('asisTexto')||{}).value||'';
  const prefijo=base?base+' ':'';
  reco.onresult=e=>{
    let txt=''; for(const r of e.results) txt+=r[0].transcript;
    const ta=document.getElementById('asisTexto'); if(ta) ta.value=prefijo+txt;
  };
  reco.onend=()=>{ escuchando=false; pintarMic(); };
  reco.onerror=()=>{ escuchando=false; pintarMic(); aviso('No te he oído. Prueba otra vez.','warn'); };
  escuchando=true; pintarMic();
  try{ reco.start(); }catch(e){ escuchando=false; pintarMic(); aviso('No se pudo iniciar el dictado','warn'); }
}
function pintarAsistente(){
  const el=document.getElementById('asistente'); if(!el) return;
  const prev=(document.getElementById('asisTexto')||{}).value||'';
  el.innerHTML='<div class="card" style="padding:10px">'+
    '<div style="display:flex;gap:8px;align-items:stretch">'+
    '<button id="asisMicI" class="btn" style="width:auto;min-width:48px;font-size:20px" aria-label="Dictar">🎤</button>'+
    '<textarea id="asisTexto" placeholder="Di o escribe: crea tarea rueda de pases para 16 jugadores" style="min-height:48px;flex:1;font-size:15px"></textarea>'+
    '<button id="asisMicD" class="btn" style="width:auto;min-width:48px;font-size:20px" aria-label="Dictar">🎤</button></div>'+
    '<div style="display:flex;gap:8px;margin-top:8px"><button id="asisEnviar" class="btn primary">Ejecutar</button><button id="asisBorrar" class="btn ghost" style="width:auto">Borrar</button></div>'+
    '<div id="asisLog" style="margin-top:10px;font-size:13px;color:var(--tinta-2)">'+ASIS.log.map(x=>'<p style="margin:4px 0">'+esc(x)+'</p>').join('')+'</div></div>';
  document.getElementById('asisTexto').value=prev;
  document.getElementById('asisMicI').onclick=dictar;
  document.getElementById('asisMicD').onclick=dictar;
  document.getElementById('asisEnviar').onclick=()=>{
    const cajaT=document.getElementById('asisTexto');
    const v=cajaT.value; cajaT.value='';
    asisProcesar(v);
  };
  document.getElementById('asisBorrar').onclick=()=>{ document.getElementById('asisTexto').value=''; };
  pintarMic();
}
const _mostrarHoyOriginal=mostrarHoy;
mostrarHoy=function(){ _mostrarHoyOriginal(); pintarAsistente(); };