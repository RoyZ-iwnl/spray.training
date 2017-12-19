import * as THREE from 'three';
import movement from './movement.js';

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
  }

  init() {
    this.pointerlock();
    this.init3JS();
    this.drawWorld();
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
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100);
    this.camera.position.set(0, 2, 0);
    this.camera.rotation.y = 0.5 * Math.PI;
    this.clock = new THREE.Clock();
    THREEx.WindowResize(this.renderer, this.camera);
    this.keyboard = new THREEx.KeyboardState();
  }

  drawWorld() {
    const mapMaterial = new THREE.LineDashedMaterial({color: 0xffaa00, dashSize: 2, gapSize: 1, linewidth: 5});
    const mapGeometry = new THREE.Geometry().fromBufferGeometry(new THREE.EdgesGeometry(new THREE.BoxGeometry(this.MAP_SIZE, this.MAP_HEIGHT, this.MAP_SIZE)));
    mapGeometry.computeLineDistances();
    const map = new THREE.LineSegments(mapGeometry, mapMaterial);
    map.position.y = this.MAP_HEIGHT/2;
    
    this.scene.add(map);

    const playerMaterial = new THREE.MeshBasicMaterial({color: 0x00aaff, visible: true});
    const playerGeometry = new THREE.SphereGeometry(2, 32, 32);
    const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
    playerMesh.add(this.camera);
    this.playerMesh = playerMesh;
    this.scene.add(playerMesh);
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
    this.playerMesh.rotateY(-this.cursorXY.x * 0.3 * delta);
    this.camera.rotateX(-this.cursorXY.y * 0.3 * delta);
    this.camera.rotation.y = Math.max(0, this.camera.rotation.y);

    const df = movement(this.playerMesh.position, this.cmd);
    this.playerMesh.translateX(df.x * delta);
    this.playerMesh.translateY(df.y * delta);
    this.playerMesh.translateZ(df.z * delta);
    
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