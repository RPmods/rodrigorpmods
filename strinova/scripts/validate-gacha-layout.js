const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'css', 'styles.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'js', 'gacha_forecast.js'), 'utf8');
const tournament = fs.readFileSync(path.join(root, 'js', 'tournament.js'), 'utf8');

const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

expect(
  css.includes(':not(.view-menu):not(.view-tournament):not(.view-gacha) .setup-teams'),
  'La superficie genérica todavía puede limitar .view-gacha.'
);
expect(!css.includes(':not(.view-menu):not(.view-tournament) .setup-teams,'),
  'Quedó activa la regla antigua de ancho máximo para Gacha.');
expect(css.includes('gacha-surface-active'), 'Falta el aislamiento CSS gacha-surface-active.');
expect(tournament.includes("classList.toggle('gacha-surface-active', isGacha)"),
  'Falta activar/desactivar el estado gacha-surface-active.');
expect(html.includes('id="gacha-generate"'), 'Falta el botón Sortear.');
expect(html.includes('id="gacha-quick"'), 'Falta el botón Resultado rápido.');
expect(html.includes('id="gacha-reset"'), 'Falta el botón Reiniciar.');
expect(js.includes('const TOTAL_WHEEL_SLOTS = 24;'), 'Gacha no está configurado para 24 casilleros.');
expect(js.includes('Array.from({ length: TOTAL_WHEEL_SLOTS }, () => "refined")'),
  'Los 24 casilleros no inician en Fino.');
expect(js.includes('els.generate?.addEventListener("click"'), 'Sortear no tiene evento registrado.');
expect(js.includes('els.quick?.addEventListener("click"'), 'Resultado rápido no tiene evento registrado.');
expect(js.includes('els.reset?.addEventListener("click"'), 'Reiniciar no tiene evento registrado.');

if (failures.length) {
  console.error('Gacha layout validation failed:');
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log('Gacha layout validation OK: full-width isolation, 24 slots and controls verified.');
