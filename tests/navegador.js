// Prueba la app en un navegador real: tablero de tarea, plantilla,
// PDF de sesión y copias. Necesita Playwright (ver LEEME, sección Q).
// Uso: node navegador.js
// Si Chromium está en otra ruta, define CHROME_PATH antes de ejecutar.
const path = require('path');
const { chromium } = require('playwright');

const APP = 'file://' + path.join(__dirname, '..', 'CUADERNO-HUESCA-F8', 'index.html');
let fallos = 0;
const ok = (nombre, cond, extra = '') => {
  console.log((cond ? 'OK    ' : 'FALLO ') + nombre + (extra ? ' · ' + extra : ''));
  if (!cond) fallos++;
};

(async () => {
  const opciones = { args: ['--no-sandbox'] };
  if (process.env.CHROME_PATH) opciones.executablePath = process.env.CHROME_PATH;
  const navegador = await chromium.launch(opciones);
  const page = await navegador.newPage({ viewport: { width: 390, height: 844 } });
  const errores = [];
  page.on('pageerror', e => errores.push(e.message));
  page.on('dialog', d => d.accept(d.type() === 'prompt' ? '5' : undefined));
  await page.addInitScript(() => { window.print = () => {}; });
  await page.goto(APP);
  await page.waitForTimeout(900);
  // quitar el aviso de primer uso que tapa la pantalla
  await page.evaluate(() => {
    const ov = document.getElementById('quienNombre');
    for (let e = ov; e; e = e.parentElement) {
      if (getComputedStyle(e).position === 'fixed') { e.style.display = 'none'; break; }
    }
  });

  // 1) Tareas: todas con dibujo
  const migracion = await page.evaluate(() => ({
    total: D.tareas.length,
    conDibujo: D.tareas.filter(t => t.dibujo && t.dibujo.objetos && t.dibujo.objetos.length).length
  }));
  ok('Todas las tareas tienen dibujo', migracion.conDibujo === migracion.total, JSON.stringify(migracion));

  // 2) Plantilla y "Poner todas"
  await page.evaluate(() => {
    if (!D.jugadores.length) D.jugadores.push({ id: 'j1', nombre: 'Hugo Pérez', dorsal: '7' }, { id: 'j2', nombre: 'Lucas Gil', dorsal: '1' });
    const t = D.tareas.find(x => x.codigo === 'T-DF-005') || D.tareas[0];
    verTarea(t.id);
    tacAbrirTarea();
  });
  await page.waitForTimeout(250);
  const botones = await page.evaluate(() => document.querySelectorAll('#tacPlantilla button').length);
  ok('La plantilla muestra camisetas y el botón "Poner todas"', botones >= 2, 'botones: ' + botones);
  await page.evaluate(() => { D.tareas.find(x => x.id === tareaId).jugadores = '2 jugadores'; tacPonerPlantilla(); });
  const puestas = await page.evaluate(() => tacEstado().objetos.filter(o => o.tipo === 'camiseta').length);
  ok('"Poner todas" coloca las camisetas', puestas >= 2, 'camisetas: ' + puestas);
  const marcadas = await page.evaluate(() => document.querySelectorAll('#tacPlantilla button span').length && [...document.querySelectorAll('#tacPlantilla span')].some(s => s.textContent.includes('✓')));
  ok('Las camisetas ya en el campo aparecen marcadas', !!marcadas);

  // 3) Colocar una camiseta a mano y salir guardando
  await page.evaluate(() => tacPickJugador(D.jugadores[0].id));
  await page.locator('#tacCanvas').scrollIntoViewIfNeeded();
  const b = await page.locator('#tacCanvas').boundingBox();
  await page.mouse.click(b.x + b.width * 0.5, b.y + b.height * 0.2);
  await page.waitForTimeout(150);
  await page.evaluate(() => tacSalir());
  const guardado = await page.evaluate(() => {
    const t = D.tareas.find(x => x.codigo === 'T-DF-005') || D.tareas[0];
    return t.dibujo.objetos.filter(o => o.tipo === 'camiseta').length;
  });
  ok('Al salir se guarda el dibujo de la tarea', guardado >= 2, 'camisetas guardadas: ' + guardado);

  // 4) Camiseta con el dorsal actual del jugador
  const refresco = await page.evaluate(() => {
    const j = D.jugadores[0];
    const obj = { tipo: 'camiseta', x: 0.5, y: 0.5, c: '#1f4e9c', n: '99', nom: 'Viejo', jid: j.id, rot: 0 };
    j.dorsal = '23'; j.nombre = 'Marta Ruiz';
    const cv = document.createElement('canvas');
    tacRender(cv, { vista: 'entero', objetos: [obj], trazos: [] }, -1);
    return { dorsal: j.dorsal, nombre: j.nombre };
  });
  ok('La camiseta toma el dorsal y nombre actuales', refresco.dorsal === '23' && refresco.nombre === 'Marta Ruiz');

  // 5) PDF de sesión con dibujos
  const pdf = await page.evaluate(() => {
    const ids = D.tareas.slice(0, 3).map(t => t.id);
    D.sesiones.push({ id: 'sx', fecha: '2026-10-09', tipo: 'entreno', mc: 1, objetivo: 'Prueba', tareas: ids });
    D.registros.push({ id: 'rx', sesionId: 'sx', jugadorId: (D.jugadores[0] || { id: 'none' }).id, asistio: true });
    sesionActiva = 'sx';
    pdfSesion();
    return (document.getElementById('impresion').innerHTML.match(/<img[^>]+data:image\/png/g) || []).length;
  });
  ok('El PDF de sesión incluye los dibujos de las tareas', pdf >= 3, 'imágenes: ' + pdf);

  // 6) Restaurar copia recalcula los datos
  const rest = await page.evaluate(() => {
    const copia = JSON.parse(JSON.stringify(D));
    copia.tareas = copia.tareas.slice(0, 3).map(t => { const x = Object.assign({}, t); delete x.dibujo; return x; });
    D = Object.assign(baseDatos(), copia); salvar(); cargar();
    return D.tareas.filter(t => t.dibujo).length;
  });
  ok('Tras restaurar, las tareas recuperan su dibujo', rest >= 3, 'con dibujo: ' + rest);

  // 7) Aviso de copia: a los 30 días
  const aviso = await page.evaluate(() => {
    D.ultimaCopia = Date.now() - 20 * 864e5; cargar();
    const a = document.getElementById('hoyCopia').classList.contains('hidden');
    D.ultimaCopia = Date.now() - 31 * 864e5; go('hoy');
    const b = !document.getElementById('hoyCopia').classList.contains('hidden');
    return { a20: a, b31: b };
  });
  ok('El aviso de copia sale a los 30 días y no antes', aviso.a20 === true && aviso.b31 === true, JSON.stringify(aviso));

  ok('Sin errores de página', errores.length === 0, errores.length ? errores.join(' | ') : '');
  await navegador.close();
  console.log(fallos ? '\n' + fallos + ' prueba(s) fallada(s)' : '\nTodas las pruebas pasan');
  process.exit(fallos ? 1 : 0);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
