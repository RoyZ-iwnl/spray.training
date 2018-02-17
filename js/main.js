import * as ui from './ui.js';
import Game from './game.js';
import { global } from './global.js';
import HUD from './hud.js';


// check browser

const isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
const isFirefox = typeof InstallTrigger !== 'undefined';
const isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));
const isIE = false || !!document.documentMode;
const isEdge = !isIE && !!window.StyleMedia;
const isChrome = !!window.chrome && !!window.chrome.webstore;

const sensitivitySlider = document.getElementById('sens-slider');

noUiSlider.create(sensitivitySlider, {
	start: [ 1.0 ],
  connect: true,
  tooltips: true,
	range: {
    'min': [0.0],
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
  
  const inverted = $('#inverted').is(":checked");

  const hud = new HUD({
    isChrome: isChrome,
  });
  hud.init();

  const game = new Game({
    hud: hud,
    inverted: inverted,
  });
  game.init();
});