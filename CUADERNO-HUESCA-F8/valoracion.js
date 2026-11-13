(function(){
  const CUAL=[['fisico','Físico'],['velocidad','Velocidad punta'],['pies','Manejo de pies'],['pase','Pase corto y medio'],['golpeo','Golpeo y balón parado'],['aereo','Juego aéreo'],['lectura','Lectura del juego'],['duelos','Duelos y anticipación'],['actitud','Actitud en el entreno'],['comunicacion','Comunicación']];
  const OCULTAR=/^(fortalezas|aspectos a mejorar|a mejorar|perfil|perfil técnico)$/i;
  function panelValoracion(j){
    const cv=j.cualidades||{};
    let h='<div id="panelVal" style="width:100%;margin:14px 0 4px;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--bg)"><b style="font-size:14px">Valoración (1 a 5)</b><div class="mini muted" style="margin:3px 0 8px">Pulsa un número por cualidad. Se guarda al momento.</div>';
    CUAL.forEach(c=>{
      h+='<div style="display:grid;grid-template-columns:1fr repeat(5,34px);align-items:center;gap:4px;padding:6px 0;border-bottom:1px solid var(--line)"><span style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+c[1]+'</span>';
      for(let v=1;v<=5;v++){
        const on=cv[c[0]]===v;
        h+='<button class="btn xs'+(on?' primary':'')+'" style="width:34px;min-width:0;padding:6px 0;margin:0" onclick="valorarJugador(\''+j.id+'\',\''+c[0]+'\','+v+')">'+v+'</button>';
      }
      h+='</div>';
    });
    h+='<div class="mini muted" style="margin-top:8px">El perfil y las estrellas del informe se calculan con estas valoraciones.</div></div>';
    return h;
  }
  function ocultarEscritura(){
    document.querySelectorAll('b,label,span,div').forEach(el=>{
      const txt=(el.textContent||'').trim();
      if(!txt||txt.length>40||!OCULTAR.test(txt)) return;
      if(el.closest('#panelVal')) return;
      const caja=el.closest('.grow')||el.parentElement;
      if(caja && caja.querySelector('textarea,input') && !caja.querySelector('button.primary')) caja.style.display='none';
    });
  }
  window.valorarJugador=function(id,clave,v){
    const j=D.jugadores.find(x=>x.id===id); if(!j) return;
    j.cualidades=j.cualidades||{};
    j.cualidades[clave]=v;
    marcar(j); salvar();
    const cont=document.getElementById('panelVal');
    if(cont) cont.outerHTML=panelValoracion(j);
    aviso('Valoración guardada');
  };
  const _editarOrig=window.editarJugador;
  window.editarJugador=function(id){
    _editarOrig.apply(this,arguments);
    const j=D.jugadores.find(x=>x.id===id); if(!j) return;
    ocultarEscritura();
    if(document.getElementById('panelVal')) return;
    const b=[...document.querySelectorAll('b')].find(x=>x.textContent.trim()==='Foto de la cara');
    if(!b) return;
    const fila=(b.closest('.grow')||b).parentElement;
    if(fila) fila.insertAdjacentHTML('afterend', panelValoracion(j));
  };
})();