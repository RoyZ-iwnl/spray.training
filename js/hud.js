import { weapons } from './weapons.js';

export default class HUD {
  constructor(weapon = 'ak47') {
    this.weapon = weapon;
    this.video = document.getElementById('video');
  }

  init() {
    this.initCrosshair();
  }

  initCrosshair() {
    const crosshairCtx = $('#xhair')[0].getContext('2d');
    crosshairCtx.strokeStyle = '#39ff14';
    crosshairCtx.lineWidth = 2;
    crosshairCtx.beginPath();
    crosshairCtx.moveTo(15, 0);
    crosshairCtx.lineTo(15, 10);
    crosshairCtx.stroke();
    crosshairCtx.beginPath();
    crosshairCtx.moveTo(15, 20);
    crosshairCtx.lineTo(15, 30);
    crosshairCtx.stroke();
    crosshairCtx.beginPath();
    crosshairCtx.moveTo(0, 15);
    crosshairCtx.lineTo(10, 15);
    crosshairCtx.stroke();
    crosshairCtx.beginPath();
    crosshairCtx.moveTo(20, 15);
    crosshairCtx.lineTo(30, 15);
    crosshairCtx.stroke();
  }

  updateHud(command) {
    const playVideo = (src) => {
      this.video.src = src;
      this.video.currentTime = 0;
      this.video.play();
    };

    if (command === 'shoot') {
      playVideo(`img/weapons/${this.weapon}/tap.webm`);
    } else if (command === 'reload') {
      playVideo(`img/weapons/${this.weapon}/reload.webm`);
    }
  }
}