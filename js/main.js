import * as ui from './ui.js';
import Game from './game.js';

// $('#main-button').on('click', () => {
//   ui.fadeFromTo($('#main-page'), $('#menu-page'), 0.5);
// });

// $('#recoil').on('click', () => {
//   ui.fadeFromTo($('#menu-page'), $('#game-page'), 0.5);
//   const game = new Game();
//   game.init();
// });


$('#main-button').on('click', () => {
  ui.fadeFromTo($('#main-page'), $('#game-page'), 0.5);
  const game = new Game();
  game.init();

  const ctx = $('#xhair')[0].getContext('2d');
  ctx.strokeStyle = 'green';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(15, 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 15);
  ctx.lineTo(30, 15);
  ctx.stroke();
});
