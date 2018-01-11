import { weapons } from './weapons.js';

export default class HUD {
  constructor(weapon = 'ak47') {
    this.weapon = weapon;
    this.video = document.getElementById('video');
    this.enabled = true;
  }

  init() {
    this.updateCrosshair();
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
    if (command === 'toggle') {
      if (this.video.style.display === 'block') {
        this.video.style.display = 'none';
        this.enabled = false;
      } else {
        this.video.style.display = 'block';
        this.enabled = true;
      }
    }
    
    if (this.enabled) {
      if (command === 'shoot') {
        this.video.currentTime = 0;
        this.video.play();
        this.video.addEventListener('ended', () => {
          this.video.currentTime = 0;
        });
      } else if (command === 'reload') {
        this.video.src = `img/weapons/${this.weapon}/${this.weapon}-reload.webm`;
        this.video.currentTime = 0;
        this.video.play();
        setTimeout(() => {
          this.video.src = `img/weapons/${this.weapon}/${this.weapon}-tap.webm`;
          this.video.currentTime = 0;
        }, weapons[this.weapon].reload);
      } 
    }

    if (command === 'select') {
      this.video.src = `img/weapons/${this.weapon}/${this.weapon}-tap.webm`;
      this.video.currentTime = 0;
    }
  }
}
