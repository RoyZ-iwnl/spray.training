import * as THREE from 'three';
import { Howl } from 'howler';
import movement from './movement.js';
import * as utils from './utils.js';
import Player from './player.js';
import { spray } from './spray.js';

export default class Game {
  constructor() {
    this.cursorXY = {x: 0, y: 0};
    this.cmd = {
      forward: 0,
      right: 0,
      jump: false,
    };
    
    this.MAP_SIZE = 100;
    this.MAP_HEIGHT = 25;

    this.shot = false;
    this.count = 0;
  }

  init() {
    this.pointerlock();
    this.init3JS();
    this.initAudio();
    this.drawWorld();
    this.initControls();
    this.animate();
  }

  pointerlock() {
    const moveCallback = (e) => {
      this.cursorXY.x += e.movementX || e.mozMovementX || e.webkitMovementX || 0;
      this.cursorXY.y += e.movementY || e.mozMovementY || e.webkitMovementY || 0;
    };

    const pointerLockChange = (event) => {
      const element = document.body;
      if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
        document.addEventListener('mousemove', moveCallback, false);
      } else {
        document.removeEventListener('mousemove', moveCallback, false);
      }
    };

    const listener = (event) => {
      let havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
      if (!havePointerLock) {
        return;
      }

      let element = document.body;
      element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
      element.requestPointerLock();

      document.addEventListener(      'pointerlockchange', pointerLockChange, false);
      document.addEventListener(   'mozpointerlockchange', pointerLockChange, false);
      document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
    };

    this.listener = listener;
    document.addEventListener('click', listener, false);
  }

  init3JS() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    $('#game-page')[0].append(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    this.camera.position.set(0, 0, 0);
    this.camera.rotation.y = 0.5 * Math.PI;
    this.clock = new THREE.Clock();
    THREEx.WindowResize(this.renderer, this.camera);
    this.keyboard = new THREEx.KeyboardState();
  }

  initAudio() {
    this.weaponSound = new Howl({
      src: ['audio/ak47_01.wav'],
      volume: 0.2,
    });
    this.reloadSound1 = new Howl({
      src: ['audio/ak47_clipout.wav'],
      volume: 0.2,
    });
    this.reloadSound2 = new Howl({
      src: ['audio/ak47_clipin.wav'],
      volume: 0.2,
    });
    this.reloadSound3 = new Howl({
      src: ['audio/ak47_boltpull.wav'],
      volume: 0.2,
    });
  }

  drawWorld() {
    const mapMaterial = new THREE.LineDashedMaterial({color: 0xffaa00, dashSize: 2, gapSize: 1, linewidth: 5});
    const mapGeometry = new THREE.Geometry().fromBufferGeometry(new THREE.EdgesGeometry(new THREE.BoxGeometry(this.MAP_SIZE, this.MAP_HEIGHT, this.MAP_SIZE)));
    mapGeometry.computeLineDistances();
    const map = new THREE.LineSegments(mapGeometry, mapMaterial);
    map.position.y = this.MAP_HEIGHT/2;
    
    this.scene.add(map);

    this.player = new Player(this.camera);
    this.scene.add(this.player.mesh);

    const targetGeometry = new THREE.Geometry();
    targetGeometry.vertices.push(new THREE.Vector3(-49.9, 12.5, 0));
    const targetMaterial = new THREE.PointsMaterial({color: 0xff0000, size: 1, sizeAttenuation: true});
    const target = new THREE.Points(targetGeometry, targetMaterial);
    target.name = 'target';
    this.scene.add(target);
  }

  initControls() {
    $(document).mouseup(() => {
      this.player.shoot = false;
    }).mousedown(() => {
      this.player.shoot = true;
    });
  }

  animate() {
    this.render();
    this.delta = this.clock.getDelta();
    this.update(this.delta);
    this.aFrame = requestAnimationFrame(this.animate.bind(this));
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  updateHud() {
    $('#player-position').html(`pos: ${this.player.mesh.position.x.toFixed(2)}, ${this.player.mesh.position.z.toFixed(2)}`);
    
    $('#player-ammo').html(`${30 - this.count}/30`);

    if (this.aFrame % 240 < 3) {
      $('#player-fps').html(`fps: ${(1/this.delta).toFixed(0)}`);
    }
  }

  update(delta) {
    this.updateHud();
    this.setCmd();
    this.player.mesh.rotateY(-this.cursorXY.x * 0.3 * delta);
    this.player.camera.rotateX(-this.cursorXY.y * 0.3 * delta);
    this.player.camera.rotation.y = Math.max(0, this.player.camera.rotation.y);
    
    const dv = movement(this.player, this.cmd, delta);
    this.player.mesh.position.add(dv.multiplyScalar(delta));

    if (this.player.shoot && !this.shot) {
      const bulletGeometry = new THREE.Geometry();
      bulletGeometry.vertices.push(utils.projection(this.player));
      const bulletMaterial = new THREE.PointsMaterial({size: 1, sizeAttenuation: true});
      const bullet = new THREE.Points(bulletGeometry, bulletMaterial);

      this.scene.add(bullet);
      setTimeout(() => this.scene.remove(bullet), 3000);

      this.shot = true;
      if (this.count !== 29) {
        setTimeout(() => this.shot = false, 100);
      } else {
        setTimeout(() => this.shot = false, 2500);

        // terrible

        this.reloadSound1.play();
        this.reloadSound1.on('end', () => {
          setTimeout(() => {
            this.reloadSound2.play();
            this.reloadSound2.on('end', () => {
              setTimeout(() => {
                this.reloadSound3.play();
              }, 500);
            });
          }, 500);
        });
      }
    
      const target = this.scene.getObjectByName('target');

      target.geometry.vertices.pop();
      target.geometry.vertices.push(spray['ak47'][this.count].clone().multiplyScalar(-0.03).add(new THREE.Vector3(-49.9, 12.5, 0)));
      target.geometry.verticesNeedUpdate = true;

      this.weaponSound.play();
      this.count = (this.count + 1) % 30;
    }

    this.reset();
  }

  setCmd() {
    if (this.keyboard.pressed('W')) {
      this.cmd.forward++;
    }
    if (this.keyboard.pressed('S')) {
      this.cmd.forward--;
    }
    if (this.keyboard.pressed('A')) {
      this.cmd.right--;
    }
    if (this.keyboard.pressed('D')) {
      this.cmd.right++;
    }
    this.cmd.jump = this.keyboard.pressed('space');
  }

  reset() {
    this.cursorXY = {x: 0, y: 0};
    this.cmd = {
      forward: 0,
      right: 0,
      jump: false,
    };
  }
}

