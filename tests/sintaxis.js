// Comprueba que el JavaScript de index.html no tiene errores de sintaxis.
// No necesita instalar nada: node sintaxis.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const html = path.join(__dirname, '..', 'CUADERNO-HUESCA-F8', 'index.html');
const texto = fs.readFileSync(html, 'utf8');
const bloques = [...texto.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const salida = path.join(os.tmpdir(), 'cuaderno-sintaxis.js');
fs.writeFileSync(salida, bloques.join('\n;\n'));

try {
  execFileSync(process.execPath, ['--check', salida], { stdio: 'pipe' });
  console.log('Sintaxis OK (' + bloques.length + ' bloques de script)');
} catch (e) {
  console.error('ERROR de sintaxis:\n' + (e.stderr || e.message).toString());
  process.exit(1);
}
