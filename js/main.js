import * as ui from './ui.js';
import Game from './game.js';
import { global } from './global.js';
// import noUiSlider from 'nouislider';

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

  const ctx = $('#xhair')[0].getContext('2d');
  ctx.strokeStyle = '#39ff14';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(15, 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(15, 20);
  ctx.lineTo(15, 30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 15);
  ctx.lineTo(10, 15);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(20, 15);
  ctx.lineTo(30, 15);
  ctx.stroke();
});