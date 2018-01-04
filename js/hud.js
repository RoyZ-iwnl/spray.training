import { weapons } from './weapons.js';

export default class HUD {
  constructor(game, weapon = 'ak47') {
    this.game = game;
    this.weapon = weapon;
  }

  init() {
    this.initCrosshair();
    this.initViewmodel();
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

  initViewmodel() {
    let frameIndex = 0;
    let tickCount = 0;
    
    const viewModelCanvas = $('#player-viewmodel')[0];
    viewModelCanvas.width = window.innerWidth;
    viewModelCanvas.height = window.innerHeight;

    const viewModelCtx = viewModelCanvas.getContext('2d');

    let viewModel = weapons[this.weapon].viewmodel.shoot;


    const resizeHud = () => {
      console.log('resizing hud');
      viewModelCanvas.width = window.innerWidth;
      viewModelCanvas.height = window.innerHeight;
    }
    
    window.addEventListener('resize', resizeHud, false);

    const render = () => {
      viewModelCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      viewModelCtx.drawImage(viewModel.img, frameIndex * viewModel.width / viewModel.frames, 0, viewModel.width / viewModel.frames, viewModel.height, 0, 0, window.innerWidth, window.innerHeight);
    };

    const update = () => {
      if (this.game.player.shoot && this.game.shot && !this.game.reloading) {
        frameIndex += (frameIndex < viewModel.frames - 1) ? 1 : -frameIndex;
      } else if (!this.game.shot) {
        frameIndex = 0;
      } else if (this.game.reloading) {
        frameIndex = 0;
        // viewModel = weapons[this.weapon].viewmodel.reload;
      }
    };

    const animate = () => {
      render();
      update();
      requestAnimationFrame(animate);
    };

    animate();
  }
}