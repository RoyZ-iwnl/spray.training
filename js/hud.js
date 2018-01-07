import { weapons } from './weapons.js';

export default class HUD {
  constructor(weapon = 'ak47') {
    this.weapon = weapon;
    this.video = document.getElementById('video');
  }

  init() {
    this.updateCrosshair('cross');
  }


  updateCrosshair(type) {
    const crosshairCtx = $('#xhair')[0].getContext('2d');
    crosshairCtx.strokeStyle = '#39ff14';
    crosshairCtx.fillStyle = '#39ff14';
    crosshairCtx.lineWidth = 2;

    switch (type) {
      case 'dot':
        crosshairCtx.clearRect(0, 0, 30, 30);
        crosshairCtx.fillRect(13, 13, 4, 4);
        break;
      case 'cross':
        crosshairCtx.clearRect(0, 0, 30, 30);
        crosshairCtx.beginPath();
        crosshairCtx.moveTo(15, 5);
        crosshairCtx.lineTo(15, 25);
        crosshairCtx.stroke();
        crosshairCtx.beginPath();
        crosshairCtx.moveTo(5, 15);
        crosshairCtx.lineTo(25, 15);
        crosshairCtx.stroke();
        break;
      default:
        crosshairCtx.clearRect(0, 0, 30, 30);
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
        break;
    }
  }

  updateHud(command) {
    const playVideo = (src) => {
      this.video.src = src;
      this.video.currentTime = 0;
      this.video.play();
    };

    if (command === 'toggle') {
      if (this.video.style.display === 'block') {
        this.video.style.display = 'none';
      } else {
        this.video.style.display = 'block';
      }
    }
    
    if (command === 'shoot') {
      playVideo(`img/weapons/${this.weapon}/${this.weapon}-tap.webm`);
    } else if (command === 'reload') {
      playVideo(`img/weapons/${this.weapon}/${this.weapon}-reload.webm`);
    } else if (command === 'select') {
      this.video.src = `img/weapons/${this.weapon}/${this.weapon}-tap.webm`;
      this.video.currentTime = 0;
    }
  }
}
