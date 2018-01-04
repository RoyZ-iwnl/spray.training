import * as ui from './ui.js';
import Game from './game.js';
import { global } from './global.js';
import HUD from './hud.js';

const sensitivitySlider = document.getElementById('sens-slider');

noUiSlider.create(sensitivitySlider, {
	start: [ 3.5 ],
  connect: true,
  tooltips: true,
	range: {
    'min': [0.1],
		'max': [8],
	}
});

const sensitivityInput = document.getElementById('sens-input');

sensitivitySlider.noUiSlider.on('update', (values, handle) => {
  const value = values[handle];
  sensitivityInput.value = value;
});

sensitivityInput.addEventListener('change', () => {
  sensitivitySlider.noUiSlider.set([sensitivityInput.value]);
});


$('#main-button').on('click', () => {
  global.SENS = sensitivityInput.value;
  ui.fadeFromTo($('#main-page'), $('#game-page'), 0.5);
  const game = new Game();
  game.init();

  const hud = new HUD(game);
  hud.init();

  // const crosshairCtx = $('#xhair')[0].getContext('2d');
  // crosshairCtx.strokeStyle = '#39ff14';
  // crosshairCtx.lineWidth = 2;
  // crosshairCtx.beginPath();
  // crosshairCtx.moveTo(15, 0);
  // crosshairCtx.lineTo(15, 10);
  // crosshairCtx.stroke();
  // crosshairCtx.beginPath();
  // crosshairCtx.moveTo(15, 20);
  // crosshairCtx.lineTo(15, 30);
  // crosshairCtx.stroke();
  // crosshairCtx.beginPath();
  // crosshairCtx.moveTo(0, 15);
  // crosshairCtx.lineTo(10, 15);
  // crosshairCtx.stroke();
  // crosshairCtx.beginPath();
  // crosshairCtx.moveTo(20, 15);
  // crosshairCtx.lineTo(30, 15);
  // crosshairCtx.stroke();

});