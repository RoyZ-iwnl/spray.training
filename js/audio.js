import { Howl } from 'howler';
import { weapons } from './weapons.js';
import { rand } from './utils.js';

const done = new Howl({
  src: ['audio/general/bell1.wav'],
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

exports.playReload = (name) => {
  // const weapon = weapons[name];
  const audio = weapons[name].audio;
  audio.reload[0].play();
  audio.audioDelay.forEach((delay, i) => {
    setTimeout(() => {
      audio.reload[i].play();
    }, delay);
  });
};

exports.playTap = (name) => {
  const audio = weapons[name].audio;
  rand(audio.shoot).play();
};

exports.playDone = () => {
  done.play();
};

exports.playHeadshot = () => {
  headshot.play();
};

exports.playSetting = () => {
  setting.play();
};

exports.playError = () => {
  error.play();
};