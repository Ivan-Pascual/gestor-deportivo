// Prueba en navegador: equipos por tarea, liga interna, el 8 o el 11 en el acta y uso de la app.
// Uso: node novedades.js   (CAPTURAS=carpeta para guardar pantallazos)
const path = require('path');
const { chromium } = require('playwright');

const APP = 'file://' + path.join(__dirname, '..', 'CUADERNO-HUESCA-F8', 'index.html');
const CAP = process.env.CAPTURAS;
let fallos = 0;
const ok = (nombre, cond, extra = '') => {
  console.log((cond ? 'OK    ' : 'FALLO ') + nombre + (extra ? ' · ' + extra : ''));
  if (!cond) fallos++;
};

(async () => {
  const opciones = { args: ['--no-sandbox'] };
  if (process.env.CHROME_PATH) opciones.executablePath = process.env.CHROME_PATH;
  const navegador = await chromium.launch(opciones);
  const page = await navegador.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errores = [];
  page.on('pageerror', e => errores.push(e.message));
  page.on('dialog', d => d.accept());
  await page.addInitScript(() => { window.print = () => {}; });
  await page.goto(APP);
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    const ov = document.getElementById('quienNombre');
    for (let e = ov; e; e = e.parentElement) {
      if (getComputedStyle(e).position === 'fixed') { e.style.display = 'none'; break; }
    }
  });
  const foto = async n => { if (CAP) await page.screenshot({ path: path.join(CAP, n + '.png'), fullPage: true }); };

  // plantilla genérica: 14 de campo y 2 porteros
  await page.evaluate(() => {
    const puestos = ['Central', 'Central', 'Central', 'Medio', 'Medio', 'Medio', 'Medio', 'Medio', 'Extremo', 'Extremo', 'Extremo', 'Punta', 'Punta', 'Medio'];
    D.jugadores = puestos.map((p, i) => ({ id: 'j' + i, nombre: 'Jugador ' + (i + 2), dorsal: i + 2, puesto: p, tipo: 'campo', equipo: 'B' }));
    D.jugadores.push({ id: 'g1', nombre: 'Portero Uno', dorsal: 1, puesto: 'Portero', tipo: 'portero', equipo: 'B' },
      { id: 'g2', nombre: 'Portero Dos', dorsal: 13, puesto: 'Portero', tipo: 'portero', equipo: 'B' });
    D.sesiones = []; D.registros = []; salvar();
  });

  // 1) Entreno con dos tareas: equipos igualados y resultado
  const eq = await page.evaluate(() => {
    nueva('entreno');
    const s = D.sesiones.find(x => x.id === sesionActiva);
    s.fecha = sumaDias(hoyISO(), -1);
    D.registros.filter(r => r.sesionId === s.id && r.jugadorId === 'j13').forEach(r => r.asistio = false);
    s.tareas = D.tareas.slice(0, 2).map(t => t.id);
    mostrarTareasSesion();
    const [t1, t2] = s.tareas;
    eqAbrir(t1); eqEquilibrar(t1, 2);
    const e = s.equipos[t1];
    const tam = [0, 1].map(k => Object.values(e.de).filter(v => v === k).length);
    const gk = [0, 1].map(k => ['g1', 'g2'].filter(g => e.de[g] === k).length);
    eqGanador(t1, 0);
    eqComoAnterior(t2); eqGanador(t2, 'empate');
    return { tam, gk, igual: JSON.stringify(s.equipos[t2].de) === JSON.stringify(e.de), sid: s.id, t1 };
  });
  ok('Equipos parejos (15 presentes en 2 petos)', Math.abs(eq.tam[0] - eq.tam[1]) <= 1 && eq.tam[0] + eq.tam[1] === 15, JSON.stringify(eq.tam));
  ok('Un portero en cada peto', eq.gk[0] === 1 && eq.gk[1] === 1);
  ok('«Como la anterior» copia los equipos', eq.igual);
  await page.evaluate(t => { tareaEquipos = t; mostrarTareasSesion(); }, eq.t1);
  await page.waitForTimeout(200);
  await page.evaluate(() => document.getElementById('sTareas').scrollIntoView());
  await foto('1-equipos-tarea');

  // 2) Liga: automática + anotada a mano (suma y resta)
  const liga = await page.evaluate(sid => {
    const s = D.sesiones.find(x => x.id === sid);
    const e = s.equipos[s.tareas[0]];
    const ganador = Object.keys(e.de).find(id => e.de[id] === 0);
    const perdedor = Object.keys(e.de).find(id => e.de[id] === 1);
    const r = id => D.registros.find(x => x.sesionId === sid && x.jugadorId === id);
    normaActiva = 'mvp_entreno'; ligaQuitar = false; ligaAnotar(r(ganador).id);
    normaActiva = 'tarde'; ligaAnotar(r(perdedor).id);
    const P = puntosLiga('', '');
    return { g: P[ganador].total, p: P[perdedor].total, ausente: (P.j13 || { total: 0 }).total };
  }, eq.sid);
  // ganador: asiste 1 + gana 3 + empata 1 + mvp 3 = 8 · perdedor: asiste 1 + empata 1 − tarde 1 = 1
  ok('Puntos automáticos y a mano (ganador 8, perdedor 1, ausente 0)', liga.g === 8 && liga.p === 1 && liga.ausente === 0, JSON.stringify(liga));
  await page.evaluate(() => document.getElementById('sLiga').scrollIntoView());
  await foto('2-liga-en-sesion');

  // 3) Partido F8: todos al banquillo, sugerir el 8, cambiar a F11
  const p8 = await page.evaluate(() => {
    nueva('partido');
    const s = D.sesiones.find(x => x.id === sesionActiva);
    const banquillo = D.registros.filter(r => r.sesionId === s.id && r.estado === 'suplente').length;
    sugerirActa();
    const tit = D.registros.filter(r => r.sesionId === s.id && r.estado === 'titular').length;
    return { banquillo, tit, formato: formatoDe(s), sid: s.id };
  });
  ok('El partido empieza con todos en el banquillo', p8.banquillo === 16 && p8.formato === 'F8', JSON.stringify(p8));
  ok('«Sugerir el 8» pone 7 + portero', p8.tit === 8);
  await page.evaluate(() => window.scrollTo(0, 0));
  await foto('3-acta-f8');
  const tocar = await page.evaluate(() => {
    const g = document.querySelector('#aCampo svg g[onclick^="slotAbrirRid"]');
    g.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return !!document.querySelector('#aSlot .card');
  });
  ok('Tocar un jugador del campo abre el cambio', tocar);
  await foto('4-acta-cambio');
  const p11 = await page.evaluate(() => {
    slotCerrar(); setFormato('F11'); sugerirActa();
    const s = D.sesiones.find(x => x.id === sesionActiva);
    const tit = D.registros.filter(r => r.sesionId === s.id && r.estado === 'titular').length;
    return { tit, formacion: formacionDe(s), huecos: document.querySelectorAll('#aCampo svg g[onclick]').length };
  });
  ok('Fútbol 11: 10 + portero en 4-3-3', p11.tit === 11 && p11.formacion === '4-3-3' && p11.huecos === 11, JSON.stringify(p11));
  await page.evaluate(() => window.scrollTo(0, 0));
  await foto('5-acta-f11');
  const p3 = await page.evaluate(sid => {
    const r = D.registros.find(x => x.sesionId === sid && x.estado === 'titular' && x.jugadorId !== 'g1' && x.jugadorId !== 'g2');
    setActa(r.id, 'goles', '2');
    const s = D.sesiones.find(x => x.id === sid); s.resultado = '2-0'; s.fecha = hoyISO();
    const gk = D.registros.find(x => x.sesionId === sid && x.estado === 'titular' && (x.jugadorId === 'g1' || x.jugadorId === 'g2'));
    const P = puntosLiga(s.fecha, s.fecha);
    convocar(D.registros.find(x => x.sesionId === sid && x.estado === 'suplente').id, 0);
    const fuera = D.registros.filter(x => x.sesionId === sid && x.estado === 'no').length;
    return { goleador: P[r.jugadorId].total, portero: P[gk.jugadorId].total, fuera };
  }, p8.sid);
  // goleador: juega 1 + 2 goles×2 = 5 · portero titular con 2-0: juega 1 + cero 3 = 4
  ok('Liga del partido: goles y portería a cero', p3.goleador === 5 && p3.portero === 4, JSON.stringify(p3));
  ok('Desconvocar desde el banquillo', p3.fuera === 1);

  // 4) Clasificación y reglamento
  await page.evaluate(() => go('liga', false));
  await page.waitForTimeout(200);
  await foto('6-liga');
  const reg = await page.evaluate(() => {
    go('reglamento', false);
    reglaPuntos('gol', 5);
    document.getElementById('rgNombre').value = 'Recoge el material'; document.getElementById('rgPuntos').value = '2';
    reglaNueva();
    return { gol: ligaCfg().reglas.gol.puntos, propias: reglasLista().filter(r => r.propia).length };
  });
  ok('El reglamento se edita y admite normas nuevas', reg.gol === 5 && reg.propias === 1);
  await foto('7-reglamento');

  // 5) Uso de la app y ocultar del menú
  const uso = await page.evaluate(() => {
    go('mas'); go('gastos', false); go('mas'); go('uso', false);
    const filas = document.querySelectorAll('#usoLista .card').length;
    alternarOculta('gastos'); go('mas');
    const tiles = [...document.querySelectorAll('#masTiles .tile b')].map(b => b.textContent);
    const merged = fusionar(D, JSON.parse(JSON.stringify(Object.assign({}, D, { uso: { otro: { quien: 'H', desde: 1, v: { gastos: [3, Date.now()] } } } })))).datos;
    return { filas, sinGastos: !tiles.includes('Gastos'), conLiga: tiles.includes('Liga interna'), dispositivos: Object.keys(merged.uso).length, liga: !!merged.liga };
  });
  ok('Uso de la app lista todas las funciones', uso.filas >= 14, 'filas: ' + uso.filas);
  ok('Ocultar quita la función del menú', uso.sinGastos && uso.conLiga);
  ok('Al sincronizar se juntan el uso de los dispositivos y la liga', uso.dispositivos === 2 && uso.liga);
  await page.evaluate(() => go('uso', false));
  await foto('8-uso');

  // 6) Microconceptos del microciclo
  const mic = await page.evaluate(() => {
    const todos = D.plan.filter(p => p.micro && p.micro.cb && p.micro.mcb.length >= 3).length;
    const p5 = D.plan.find(p => p.mc === 5); delete p5.micro; p5.dominante = 'Otra cosa'; completarMicroconceptos();
    const vacioSiCambiado = !p5.micro.cb;
    irAMicrociclo(4);
    document.getElementById('mcMcb').value = 'Uno\n· Dos\n\nTres';
    guardarMicrociclo();
    const m4 = D.plan.find(p => p.mc === 4).micro;
    D.mc = 4; go('hoy');
    return { todos, vacioSiCambiado, lineas: m4.mcb, daniel: textoDaniel(4), hoy: !!document.querySelector('#hoyMicro details'), planMod: D.planMod > 0 };
  });
  ok('Los 44 microciclos traen objetivos y microconceptos', mic.todos === 44, 'con datos: ' + mic.todos);
  ok('Si cambiaste el contenido del microciclo, no se rellena', mic.vacioSiCambiado);
  ok('Microconceptos uno por línea', JSON.stringify(mic.lineas) === '["Uno","Dos","Tres"]' && mic.planMod);
  ok('Texto para Daniel y objetivos en Hoy', mic.daniel.includes('Con balón:') && mic.hoy, mic.daniel.replace(/\n/g, ' | '));
  await page.evaluate(() => document.querySelector('#hoyMicro details').open = true);
  await foto('9-hoy-objetivos');
  await page.evaluate(() => irAMicrociclo(4));
  await foto('10-microciclo');

  // 7) Lo que no se usaba ya no está
  const fuera = await page.evaluate(() => {
    go('hoy');
    const hoy = [...document.querySelectorAll('#hoyTiles .tile b')].map(b => b.textContent);
    go('mas');
    const mas = [...document.querySelectorAll('#masTiles .tile b')].map(b => b.textContent);
    return { hoy, mas, vistas: ['diario', 'pruebas', 'evaluar', 'comparar'].filter(v => document.getElementById('v-' + v)).length,
      tecnico: microDe(6).mcb[0] };
  });
  ok('Diario y Pruebas fuera de Hoy y de Más', !fuera.hoy.includes('Diario') && !fuera.hoy.includes('Prueba') &&
    !fuera.mas.includes('Diario') && !fuera.mas.includes('Pruebas') && fuera.vistas === 0, fuera.hoy.join(', '));
  ok('Microconceptos en formato técnico (concepto: criterio)', fuera.tecnico.includes(':'), fuera.tecnico);

  // 8) Arranque con el nombre ya puesto (como en el iPhone): debe abrir en Hoy sin errores
  const p2 = await navegador.newPage({ viewport: { width: 390, height: 844 } });
  const err2 = [];
  p2.on('pageerror', e => err2.push(e.message));
  await p2.addInitScript(() => { localStorage.setItem('huescaF8_yo', 'Ivan'); });
  await p2.goto(APP);
  await p2.waitForTimeout(900);
  const arranque = await p2.evaluate(() => ({ hoy: !!document.querySelector('#v-hoy.on'), error: /No se pudo abrir/.test(document.body.innerText) }));
  ok('Arranca en Hoy con el nombre ya guardado', arranque.hoy && !arranque.error && !err2.length, err2.join(' | '));
  await p2.evaluate(() => go('liga', false));
  await p2.close();

  ok('Sin errores de página', errores.length === 0, errores.join(' | '));
  await navegador.close();
  console.log(fallos ? '\n' + fallos + ' prueba(s) fallada(s)' : '\nTodas las pruebas pasan');
  process.exit(fallos ? 1 : 0);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
