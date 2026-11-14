/* Acta de partido: datos del partido, análisis por apartados y PDF mejorado.
   Se carga después de index.html y sustituye pdfActa y mostrarActa. */
(function(){
  const DATOS=[
    ['hora','Hora','Ej. 11:00'],
    ['lugar','Campo','Nombre del campo'],
    ['arbitro','Árbitro','Nombre del árbitro'],
    ['jornada','Jornada','Ej. J7']
  ];
  const ANA=[
    ['bien','Qué salió bien','Lo que queremos repetir'],
    ['mejorar','A corregir','Errores o cosas a mejorar'],
    ['trabajar','Para el próximo entreno','Qué trabajar esta semana']
  ];

  function campo(k,lbl,ph){
    return '<label class="field" style="margin:0"><span>'+lbl+'</span>'+
      '<input id="x_'+k+'" placeholder="'+ph+'" oninput="campoSesion(\''+k+'\',this.value)"></label>';
  }
  function area(k,lbl,ph){
    return '<label class="field"><span>'+lbl+'</span>'+
      '<textarea id="x_'+k+'" placeholder="'+ph+'" oninput="campoSesion(\''+k+'\',this.value)"></textarea></label>';
  }

  function anadirCampos(){
    if(document.getElementById('aExtra')) return;
    const notas=document.getElementById('aNotas'); if(!notas) return;
    const bloque=notas.closest('label'); if(!bloque) return;
    let h='<div id="aExtra" style="margin-bottom:13px">'+
      '<p class="mini muted" style="margin:0 0 8px">Datos del partido y análisis (salen en el PDF)</p>'+
      '<div class="grid2" style="margin-bottom:11px">'+campo(DATOS[0][0],DATOS[0][1],DATOS[0][2])+campo(DATOS[1][0],DATOS[1][1],DATOS[1][2])+'</div>'+
      '<div class="grid2" style="margin-bottom:11px">'+campo(DATOS[2][0],DATOS[2][1],DATOS[2][2])+campo(DATOS[3][0],DATOS[3][1],DATOS[3][2])+'</div>';
    ANA.forEach(([k,l,p])=>{ h+=area(k,l,p); });
    h+='</div>';
    bloque.insertAdjacentHTML('beforebegin',h);
  }

  function rellenar(s){
    const poner=(id,val)=>{ const el=document.getElementById(id); if(!el) return; el.value=val??''; el.disabled=!!s.cerrada; };
    DATOS.forEach(([k])=>poner('x_'+k,s[k]));
    ANA.forEach(([k])=>poner('x_'+k,s[k]));
  }

  const _mostrarActa=window.mostrarActa;
  window.mostrarActa=function(s){
    _mostrarActa.apply(this,arguments);
    anadirCampos();
    rellenar(s);
  };

  function seccion(titulo,contenido){
    return '<div class="doc-tarea" style="border:none;margin:0 0 10px">'+
      '<h4 class="doc-h">'+titulo+'</h4>'+contenido+'</div>';
  }

  window.pdfActa=function(){
    const s=D.sesiones.find(x=>x.id===sesionActiva); if(!s) return;
    const regs=D.registros.filter(r=>r.sesionId===s.id)
      .map(r=>({r:r,j:D.jugadores.find(x=>x.id===r.jugadorId)}))
      .filter(o=>o.j);
    const estado=o=>o.r.estado||'titular';
    const conv=regs.filter(o=>estado(o)!=='no');
    const n=v=>(v===undefined||v===null||v==='')?0:(+v||0);
    const cero=v=>n(v)===0?'—':n(v);
    const hay=v=>(v!==undefined&&v!==null&&String(v).trim()!=='');
    const colNota=v=>{
      if(!hay(v)) return '—';
      const x=+v;
      const c=x>=8?'#1E7B3A':(x<=6?'#8A8A8A':'#111');
      return '<span style="font-weight:700;color:'+c+'">'+x+'</span>';
    };
    const sinDato=v=>hay(v)?esc(v):'—';
    const lista=a=>a.length?a.join(', '):'—';

    const conNota=conv.filter(o=>hay(o.r.nota));
    const media=conNota.length
      ? (conNota.reduce((a,o)=>a+(+o.r.nota),0)/conNota.length).toFixed(1).replace('.',',')
      : '—';
    const goles=conv.reduce((a,o)=>a+n(o.r.goles),0);
    const asis=conv.reduce((a,o)=>a+n(o.r.asistencias),0);
    const mins=conv.reduce((a,o)=>a+n(o.r.minutos),0);
    const maxNota=conNota.length?Math.max(...conNota.map(o=>+o.r.nota)):null;
    const mejores=maxNota===null?[]:conNota.filter(o=>+o.r.nota===maxNota).map(o=>esc(o.j.nombre));
    const goleadores=conv.filter(o=>n(o.r.goles)>0)
      .map(o=>esc(o.j.nombre)+(n(o.r.goles)>1?' ('+n(o.r.goles)+')':''));
    const asistentes=conv.filter(o=>n(o.r.asistencias)>0)
      .map(o=>esc(o.j.nombre)+(n(o.r.asistencias)>1?' ('+n(o.r.asistencias)+')':''));

    let h=docCab('Acta de partido',
      fechaLarga(s.fecha)+' · Microciclo '+String(s.mc).padStart(2,'0')+(hay(s.jornada)?' · '+esc(s.jornada):''));

    h+='<div class="doc-tarea" style="border:none;margin:0 0 10px">'+
      '<table class="doc-meta"><tr>'+
      '<td style="width:44%"><b>Rival</b>'+
        (escudoDe(s.rival)?'<img src="'+escudoDe(s.rival)+'" style="height:44px;vertical-align:middle;margin-right:8px">':'')+
        esc(s.rival||'—')+'</td>'+
      '<td><b>Condición</b>'+(s.local==='visitante'?'Visitante':'Local')+'</td>'+
      '<td><b>Resultado</b><span style="font-size:15pt;font-weight:700">'+esc(s.resultado||'—')+'</span></td>'+
      '</tr><tr>'+
      '<td><b>Fecha y hora</b>'+fechaCorta(s.fecha)+(hay(s.hora)?' · '+esc(s.hora):'')+'</td>'+
      '<td><b>Campo</b>'+sinDato(s.lugar)+'</td>'+
      '<td><b>Sistema</b>'+sinDato(s.formacion)+'</td>'+
      '<td><b>Árbitro</b>'+sinDato(s.arbitro)+'</td>'+
      '</tr></table></div>';

    let dibujo='';
    try{ dibujo=campoSVG(repartoMinutos(s.id)); }catch(e){ dibujo=''; }
    if(dibujo){
      h+='<div class="doc-tarea" style="border:none;margin:0 0 12px;display:flex;gap:16px;align-items:flex-start">'+
        '<div style="width:230px;flex:none">'+dibujo+'</div>'+
        '<div style="flex:1;min-width:0;padding-top:6px">'+
          '<b style="font-size:7.5pt;letter-spacing:.11em;text-transform:uppercase;color:#555">Sistema</b>'+
          '<p style="margin:2px 0 10px;font-size:13pt;font-weight:700">'+esc(nombreSistema(formacionDe(s)))+'</p>'+
          '<p class="doc-p" style="margin:0;color:#555">Alineación inicial sobre el campo. Los suplentes y no convocados aparecen en las tablas siguientes.</p>'+
        '</div></div>';
    }
    let dibujo='';
    try{ dibujo=campoSVG(repartoMinutos(s.id)); }catch(e){ dibujo=''; }
    if(dibujo){
      h+='<div class="doc-tarea" style="border:none;margin:0 0 12px;display:flex;gap:16px;align-items:flex-start">'+
        '<div style="width:230px;flex:none">'+dibujo+'</div>'+
        '<div style="flex:1;min-width:0;padding-top:6px">'+
          '<b style="font-size:7.5pt;letter-spacing:.11em;text-transform:uppercase;color:#555">Sistema</b>'+
          '<p style="margin:2px 0 10px;font-size:13pt;font-weight:700">'+esc(nombreSistema(formacionDe(s)))+'</p>'+
          '<p class="doc-p" style="margin:0;color:#555">Alineación inicial sobre el campo. Los suplentes y no convocados aparecen en las tablas siguientes.</p>'+
        '</div></div>';
    }
    let dibujo='';
    try{ dibujo=campoSVG(repartoMinutos(s.id)); }catch(e){ dibujo=''; }
    if(dibujo){
      h+='<div class="doc-tarea" style="border:none;margin:0 0 12px;display:flex;gap:16px;align-items:flex-start">'+
        '<div style="width:230px;flex:none">'+dibujo+'</div>'+
        '<div style="flex:1;min-width:0;padding-top:6px">'+
          '<b style="font-size:7.5pt;letter-spacing:.11em;text-transform:uppercase;color:#555">Sistema</b>'+
          '<p style="margin:2px 0 10px;font-size:13pt;font-weight:700">'+esc(nombreSistema(formacionDe(s)))+'</p>'+
          '<p class="doc-p" style="margin:0;color:#555">Alineación inicial sobre el campo. Los suplentes y no convocados aparecen en las tablas siguientes.</p>'+
        '</div></div>';
    }
    h+=seccion('Resumen del partido',
      '<table class="doc-meta"><tr>'+
      '<td><b>Goles</b>'+goles+'</td>'+
      '<td><b>Asistencias</b>'+asis+'</td>'+
      '<td><b>Minutos repartidos</b>'+mins+'</td>'+
      '<td><b>Nota media</b>'+media+'</td></tr>'+
      '<tr><td colspan="2"><b>Mejor nota'+(maxNota!==null?' ('+maxNota+')':'')+'</b>'+lista(mejores)+'</td>'+
      '<td colspan="2"><b>Goleadores</b>'+lista(goleadores)+'</td></tr>'+
      '<tr><td colspan="4"><b>Asistencias de gol</b>'+lista(asistentes)+'</td></tr>'+
      '</table>');

    const grupos=[['titular','Titulares'],['suplente','Suplentes'],['no','No convocados']];
    grupos.forEach(([k,tit])=>{
      const g=regs.filter(o=>estado(o)===k);
      if(!g.length) return;
      let t;
      if(k==='no'){
        t='<table class="doc-lista"><thead><tr><th style="width:40px">Nº</th><th>Jugador</th></tr></thead><tbody>'+
          g.map(o=>'<tr><td class="c">'+(o.j.dorsal??'—')+'</td><td>'+esc(o.j.nombre)+'</td></tr>').join('')+
          '</tbody></table>';
      } else {
        t='<table class="doc-lista"><thead><tr>'+
          '<th style="width:40px">Nº</th><th>Jugador</th><th style="width:95px">Puesto</th>'+
          '<th style="width:52px">Min</th><th style="width:48px">Gol</th><th style="width:48px">Asis</th>'+
          '<th style="width:52px">Nota</th></tr></thead><tbody>'+
          g.map(o=>'<tr><td class="c">'+(o.j.dorsal??'—')+'</td><td>'+esc(o.j.nombre)+'</td>'+
            '<td>'+esc(o.j.puesto||'')+'</td>'+
            '<td class="c">'+cero(o.r.minutos)+'</td>'+
            '<td class="c">'+cero(o.r.goles)+'</td>'+
            '<td class="c">'+cero(o.r.asistencias)+'</td>'+
            '<td class="c">'+colNota(o.r.nota)+'</td></tr>').join('')+
          '</tbody></table>';
      }
      h+=seccion(tit+' · '+g.length,t);
    });

    const conAna=ANA.filter(([k])=>hay(s[k]));
    if(conAna.length){
      conAna.forEach(([k,tit])=>{
        h+=seccion(tit,'<p class="doc-p" style="white-space:pre-line">'+esc(s[k])+'</p>');
      });
    } else if(hay(s.notas)){
      h+=seccion('Análisis','<p class="doc-p" style="white-space:pre-line">'+esc(s.notas)+'</p>');
    }

    h+='<div class="doc-tarea" style="border:none;margin-top:18px">'+
      '<table style="width:100%"><tr><td style="width:50%"></td>'+
      '<td style="border-top:1px solid #333;padding-top:5px;font-size:9.5pt">'+
      '<b>Iván Pascual López</b><br><span style="color:#555">Entrenador · Alevín B · SD Huesca</span>'+
      '</td></tr></table></div>';

    h+='<p style="margin:14px 0 0;font-size:7.5pt;color:#8A8A8A;letter-spacing:.1em;text-transform:uppercase">'+
      'Generado el '+esc(fechaLarga(hoyISO()))+' · Cuaderno del entrenador</p>';

    imprimir(h,'Acta '+s.fecha);
  };
})();