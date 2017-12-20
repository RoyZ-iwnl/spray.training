import * as THREE from 'three';
import { Howl } from 'howler';
import movement from './movement.js';
import * as utils from './utils.js';
import Player from './player.js';

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
    this.camera.position.set(0, 2, 0);
    this.camera.rotation.y = 0.5 * Math.PI;
    this.clock = new THREE.Clock();
    THREEx.WindowResize(this.renderer, this.camera);
    this.keyboard = new THREEx.KeyboardState();
  }

  initAudio() {
    this.sound = new Howl({
      src: ['audio/ak47_01.wav'],
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

  update(delta) {
    this.setCmd();
    this.player.mesh.rotateY(-this.cursorXY.x * 0.3 * delta);
    this.player.camera.rotateX(-this.cursorXY.y * 0.3 * delta);
    this.player.camera.rotation.y = Math.max(0, this.player.camera.rotation.y);
    
    const dv = movement(this.player, this.cmd, delta);
    this.player.mesh.position.add(dv.multiplyScalar(delta));

    if (this.player.shoot && !this.shot) {
      const dotGeometry = new THREE.Geometry();
      dotGeometry.vertices.push(utils.projection(this.player));
      const dotMaterial = new THREE.PointsMaterial({size: 1, sizeAttenuation: true});
      const dot = new THREE.Points(dotGeometry, dotMaterial);

      this.sound.play();
      
      this.scene.add(dot);
      setTimeout(() => this.scene.remove(dot), 3000);

      this.shot = true;
      setTimeout(() => this.shot = false, 100);
      
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