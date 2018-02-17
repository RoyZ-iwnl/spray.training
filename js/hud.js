import { weapons } from './weapons.js';

export default class HUD {
  constructor(data) {
    this.weapon = 'ak47';
    this.video = document.getElementById('video');
    this.viewmodel = document.getElementById('player-weapon');
    this.enabled = true;
    this.chrome = data.isChrome;
    this.shootingAnimation = true;
  }

  init() {
    this.updateCrosshair();

    if (!this.chrome) {
      this.viewmodel.style.display = 'none';
      this.enabled = false;
    }
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

  updateViewmodel(command) {
    if (this.chrome) {
      if (command === 'toggle') {
        if (this.viewmodel.style.display === 'block') {
          this.viewmodel.style.display = 'none';
          this.enabled = false;
        } else {
          this.viewmodel.style.display = 'block';
          this.enabled = true;
        }
      }

      if (command === 'hide') {
        this.viewmodel.style.display = 'none';
      }

      if (command === 'show' && this.enabled) {
        this.viewmodel.style.display = 'block';
      }

      if (this.enabled) {
        if (command === 'shoot') {
          this.video.pause();
          if (!this.shootingAnimation) {
            this.video.src = `img/weapons/${this.weapon}/${this.weapon}-tap.webm`;
            this.shootingAnimation = true;
          }
          this.video.currentTime = 0;
          this.video.play();
          
          setTimeout(() => {
            this.video.pause();
            this.video.currentTime = 0;
          }, 60000 / weapons[this.weapon].rpm);
        } else if (command === 'reload') {
          this.shootingAnimation = false;
          this.video.pause();
          this.video.src = `img/weapons/${this.weapon}/${this.weapon}-reload.webm`;
          this.video.currentTime = 0;
          this.video.play();

          // setTimeout(() => {
          //   this.video.pause();
          //   this.video.src = `img/weapons/${this.weapon}/${this.weapon}-tap.webm`;
          //   this.video.currentTime = 0;
          // }, weapons[this.weapon].reload);
        }
      }

      if (command === 'select') {
        this.video.pause();
        this.video.src = `img/weapons/${this.weapon}/${this.weapon}-tap.webm`;
        this.video.currentTime = 0;
      }
    }
  }

  updateHud(data) {
    // $('#player-position').html(`pos: ${player.mesh.position.x.toFixed(2)}, ${player.mesh.position.z.toFixed(2)}`);

    $('#player-position').html(
      `dist: ${data.playerDistance.toFixed(2)}`
    );

    $('#player-fov').html(
      `fov: ${(2*Math.atan2(
        Math.tan(data.camera.fov/2 * Math.PI/180),
        1/data.camera.aspect
      ) * 180 / Math.PI).toFixed(1)}`
    );

    $('#player-ammo').html(
      `${weapons[data.currentWeapon].magazine - data.ammo}/${weapons[data.currentWeapon].magazine}`
    );

    $('#player-highscore').html(
      `highest acc: ${data.highScore[data.currentWeapon].toFixed(2)}%  (${weapons[data.currentWeapon].name})`
    );

    $('#player-highscore-new').html(
      `highest acc: ${data.highScore[data.currentWeapon].toFixed(2)}% (${weapons[data.currentWeapon].name})`
    );

    $('#player-score').html(
      `accuracy: ${data.currentScore.toFixed(2)}% (${weapons[data.currentWeapon].name})`
    );

    if (data.aFrame % weapons[data.currentWeapon].magazine < 3) {
      $('#player-fps').html(`fps: ${Math.round(data.fps)}`);
    }

    if (data.newHighScore) {
      // flicker high score
      // $('#player-highscore').css('color', '#ffff00').animate({color: '#ffffff'}, 1000);
      $('#player-highscore-new').show();
      setTimeout(() => {
        $('#player-highscore-new').fadeOut(500);
      }, 5000);
    }
  }
}
