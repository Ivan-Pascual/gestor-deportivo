/**
 * CUADERNO DEL ENTRENADOR — puente con Google Sheets
 *
 * Este código va DENTRO de tu hoja de Google
 * (Extensiones → Apps Script), no en la app.
 *
 * La clave NO va en este archivo. Ponla en Configuración del proyecto
 * → Propiedades del script, con el nombre CLAVE.
 */

var HOJA  = 'datos';
var CLAVE = PropertiesService.getScriptProperties().getProperty('CLAVE') || '';


/* Comprueba la clave. No depende de ningún texto de ejemplo,
   así que no se puede romper al editarla. */
function _autorizado(e) {
  if (!CLAVE || CLAVE.length < 8) return false;
  var enviada = (e && e.parameter && e.parameter.clave) || '';
  if (enviada.length !== CLAVE.length) return false;
  var igual = 0;
  for (var i = 0; i < CLAVE.length; i++) {
    igual |= CLAVE.charCodeAt(i) ^ enviada.charCodeAt(i);
  }
  return igual === 0;
}

function _hoja() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var h = libro.getSheetByName(HOJA);
  if (!h) {
    h = libro.insertSheet(HOJA);
    h.getRange('A1').setValue('datos');
    h.getRange('B1').setValue('fecha');
  }
  return h;
}

/* Responde en JSON normal, o envuelto en una función si la app
   lo pide con ?callback=... Eso evita los bloqueos del navegador. */
function _responder(obj, e) {
  var txt = JSON.stringify(obj);
  var cb = e && e.parameter && e.parameter.callback;
  if (cb && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(cb)) {
    return ContentService
      .createTextOutput(cb + '(' + txt + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(txt)
    .setMimeType(ContentService.MimeType.JSON);
}


/** Traer los datos guardados */
function doGet(e) {
  if (!_autorizado(e)) {
    return _responder({ ok: false, error: 'Clave incorrecta o sin configurar' }, e);
  }
  try {
    /* la app tambien puede GUARDAR por aqui, si el navegador
       le bloquea el envio normal */
    if (e && e.parameter && e.parameter.accion === 'guardar' && e.parameter.datos) {
      var d = JSON.parse(e.parameter.datos);
      var hg = _hoja();
      hg.getRange('A2').setValue(e.parameter.datos);
      hg.getRange('B2').setValue(new Date());
      _volcarRegistros(d);
      return _responder({ ok: true, guardado: true }, e);
    }
    var h = _hoja();
    var txt = h.getRange('A2').getValue();
    if (!txt) return _responder({ ok: true, datos: null }, e);
    return _responder({
      ok: true,
      datos: JSON.parse(txt),
      fecha: h.getRange('B2').getValue()
    }, e);
  } catch (err) {
    return _responder({ ok: false, error: String(err) }, e);
  }
}


/** Guardar los datos que envía la app */
function doPost(e) {
  if (!_autorizado(e)) {
    return _responder({ ok: false, error: 'Clave incorrecta o sin configurar' });
  }
  try {
    var cuerpo = JSON.parse(e.postData.contents);
    if (cuerpo.accion !== 'guardar') {
      return _responder({ ok: false, error: 'accion desconocida' });
    }
    var h = _hoja();
    h.getRange('A2').setValue(JSON.stringify(cuerpo.datos));
    h.getRange('B2').setValue(new Date());

    _volcarRegistros(cuerpo.datos);

    return _responder({ ok: true });
  } catch (err) {
    return _responder({ ok: false, error: String(err) });
  }
}


/** Pestaña legible con los registros, para filtrar y hacer gráficos */
function _volcarRegistros(D) {
  try {
    var libro = SpreadsheetApp.getActiveSpreadsheet();
    var h = libro.getSheetByName('registros');
    if (!h) h = libro.insertSheet('registros');
    h.clear();

    var filas = [['Fecha', 'Tipo', 'Objetivo', 'Dorsal', 'Jugador',
                  'Asistio', 'Nota', 'Minutos', 'Goles', 'Asistencias']];

    (D.registros || []).forEach(function (r) {
      var s = (D.sesiones || []).filter(function (x) { return x.id === r.sesionId; })[0];
      var j = (D.jugadores || []).filter(function (x) { return x.id === r.jugadorId; })[0];
      if (!s || !j) return;
      filas.push([s.fecha, s.tipo, s.objetivo || '', j.dorsal || '', j.nombre,
                  r.asistio ? 'Si' : 'No', r.nota || '', r.minutos || '',
                  r.goles || '', r.asistencias || '']);
    });

    if (filas.length > 1) {
      h.getRange(1, 1, filas.length, filas[0].length).setValues(filas);
      h.getRange(1, 1, 1, filas[0].length).setFontWeight('bold');
      h.setFrozenRows(1);
    }
  } catch (err) {
    // Si falla el volcado, la copia principal ya se ha guardado
  }
}


/** Comprobar que la clave está bien. Ejecútala y mira el registro. */
function comprobarClave() {
  Logger.log('Clave: [' + CLAVE + ']  ·  ' + CLAVE.length + ' caracteres');
  Logger.log(CLAVE.length >= 8 ? 'Correcta' : 'Demasiado corta');
}
