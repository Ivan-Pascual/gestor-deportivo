# Cuaderno del entrenador
![CI](https://github.com/Ivan-Pascual/gestor-deportivo/actions/workflows/ci.yml/badge.svg)
Aplicación web para gestionar un equipo de fútbol base: asistencia, sesiones de entrenamiento, partidos, plantilla, pizarra táctica y gastos del entrenador.

**Demo:** https://ivan-pascual.github.io/gestor-deportivo/CUADERNO-HUESCA-F8/

## Qué incluye

- Pasar lista en entrenos y partidos, con notas del 0 al 10
- Plantilla con fichas de jugador, disponibilidad (lesión, sanción, etc.) y estadísticas
- Banco de tareas con dibujo sobre el campo
- Pizarra táctica con herramientas de dibujo y exportación a PDF
- Preparación de partidos: alineación, cambios y reparto de minutos
- Alineación sobre el campo en fútbol 8 o fútbol 11: se toca cada hueco para poner al jugador
- Equipos (petos) para cada tarea de la sesión, igualados por nota y asistencia, y quién gana
- Liga interna con reglamento editable: suma por competir y por acciones del partido, y resta por conductas
- Uso de la app: mide qué funciones se usan y permite quitar del menú las que no
- Notas de gastos con cálculo de kilometraje
- Exportación a PDF de fichas, actas e informes

## Tecnologías

- HTML, CSS y JavaScript sin frameworks
- Service Worker y manifest para instalarla como app en el móvil
- Google Apps Script y Google Sheets para la sincronización opcional

## Ejecutar en local

La versión publicada funciona directamente en la demo. Para probarla en local, sirve la carpeta con un servidor sencillo, por ejemplo `npx serve CUADERNO-HUESCA-F8`, porque el Service Worker y la instalación como app requieren un servidor y no abrir el archivo desde el disco.

## Privacidad

La app está pensada para registrar datos de menores de un equipo de fútbol base. Por eso:

- Los datos se guardan solo en el dispositivo donde se usa la app. No hay servidor propio ni base de datos central.
- Se puede activar un PIN que cifra los datos guardados en el navegador. Sin el PIN, los datos no se pueden recuperar.
- La sincronización con Google Sheets es opcional y usa una clave que se introduce en la propia app, nunca en el código.
- El código del repositorio no incluye datos de jugadores. Los datos de ejemplo que usan las pruebas son ficticios.

Esta app no sustituye el consentimiento informado de las familias ni las obligaciones del club en materia de protección de datos.

## Autor

Iván Pascual López · Junior AI & FullStack Developer.

## Autor

Iván Pascual López · Junior AI & FullStack Developer
