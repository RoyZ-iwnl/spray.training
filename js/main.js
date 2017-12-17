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
});
