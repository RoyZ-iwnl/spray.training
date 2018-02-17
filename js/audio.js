import { Howl } from 'howler';
import { weapons } from './weapons.js';
import { rand } from './utils.js';
import { settings } from './settings.js';

const done = new Howl({
  src: ['audio/general/bell1.wav'],
  volume: 0.2,
});

const select = new Howl({
  src: ['audio/general/button14.wav'],
  volume: 0.2,
});

const headshot = new Howl({
  src: ['audio/general/headshot1.wav'],
  volume: 0.02,
});

const setting = new Howl({
  src: ['audio/general/blip1.wav'],
  volume: 0.2,
});

const error = new Howl({
  src: ['audio/general/button10.wav'],
  volume: 0.2,
});

const scope = new Howl({
  src: ['audio/weapons/aug/aug_zoom_in.wav'],
  volume: 0.2,
});

const unscope = new Howl({
  src: ['audio/weapons/aug/aug_zoom_out.wav'],
  volume: 0.2,
});

exports.playReload = (name) => {
  if (settings.audio) {
    // const weapon = weapons[name];
    const audio = weapons[name].audio;
    audio.audioDelay.forEach((delay, i) => {
      setTimeout(() => {
        audio.reload[i].play();
      }, delay);
    });
  }
};

exports.playTap = (name) => {
  if (settings.audio) {
    const audio = weapons[name].audio;
    rand(audio.shoot).play();
  }
};

exports.playDone = () => {
  if (settings.audio) {
    done.play();
  }
};

exports.playSelect = () => {
  if (settings.audio) {
    select.play();
  }
};

exports.playHeadshot = () => {
  if (settings.audio) {
    headshot.play();
  }
};

exports.playSetting = () => {
  if (settings.audio) {
    setting.play();
  }
};

exports.playError = () => {
  if (settings.audio) {
    error.play();
  }
};

exports.playScope = () => {
  if (settings.audio) {
    scope.play();
  }  
}

exports.playUnscope = () => {
  if (settings.audio) {
    unscope.play();
  }  
}