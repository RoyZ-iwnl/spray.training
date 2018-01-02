import * as THREE from 'three';
import { Howl } from 'howler';
import TweenMax from 'gsap';
import movement from './movement.js';
import * as utils from './utils.js';
import Player from './player.js';
import { global } from './global.js';
import { settings } from './settings.js';
import Button from './button.js';
import { weapons } from './weapons.js';
import * as audio from './audio.js';

export default class Game {
  constructor() {
    this.cursorXY = {x: 0, y: 0};
    this.cmd = {
      forward: 0,
      right: 0,
      jump: false,
    };

    this.MAP_SIZE = global.MAP_SIZE;
    this.MAP_HEIGHT = global.MAP_HEIGHT;
    this.SPRAY_HEIGHT = global.SPRAY_HEIGHT;

    this.shot = false;

    this.ammo = 0;
    this.count = 0;
    this.sprayCount = 0;

    this.currentScore = 0;
    this.highScore = 0;

    this.SETTINGS_MIN_Z = -47;
    this.SETTINGS_MAX_Z = -33;

    this.shots = [];
    this.highscore = 0;

    this.currentWeapon = 'ak47';

    this.buttons = [];
    this.links = [];
  }

  init() {
    this.pointerlock();
    this.init3JS();
    this.drawWorld();
    this.initControls();
    this.animate();
  }

  pointerlock() {
    const moveCallback = (e) => {
      // prevent any abnormal mouse jumping
      if (Math.abs(e.movementX) <= 300 && Math.abs(e.movementY) <= 100) {
        this.cursorXY.x += e.movementX || e.mozMovementX || e.webkitMovementX || 0;
        this.cursorXY.y += e.movementY || e.mozMovementY || e.webkitMovementY || 0;
      }
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

    const aspect = window.innerWidth / window.innerHeight;
    // const hfovRad = 2 * Math.atan2(aspect, 4/3);
    // const vfovRad = 2 * Math.atan2(Math.tan(hfovRad/2), aspect);
    // const vfovDeg = vfovRad * 180 / Math.PI;
    const fov = 74;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 1, 1000);
    this.camera.position.set(0, 0, 0);
    this.camera.rotation.y = 0.5 * Math.PI;

    this.clock = new THREE.Clock();
    THREEx.WindowResize(this.renderer, this.camera);
    this.keyboard = new THREEx.KeyboardState();
    this.fontLoader = new THREE.FontLoader();
  }

  drawWorld() {
    const mapMaterial = new THREE.LineDashedMaterial({color: 0xffaa00, dashSize: 2, gapSize: 1, linewidth: 1});
    const mapGeometry = new THREE.Geometry().fromBufferGeometry(new THREE.EdgesGeometry(new THREE.BoxGeometry(this.MAP_SIZE, this.MAP_HEIGHT, this.MAP_SIZE)));
    mapGeometry.computeLineDistances();
    const map = new THREE.LineSegments(mapGeometry, mapMaterial);
    map.position.y = this.MAP_HEIGHT/2;

    this.scene.add(map);

    const lineMaterial = new THREE.LineDashedMaterial({color: 0xecf0f1, dashSize: 0.75, gapSize: 0.75, linewidth: 1});
    const lineGeometry = new THREE.Geometry();
    lineGeometry.vertices.push(
      new THREE.Vector3(-this.MAP_SIZE/2, 0, 8),
      new THREE.Vector3(-this.MAP_SIZE/2, 0, -8),

      new THREE.Vector3(-this.MAP_SIZE/2, 8, 0),
      new THREE.Vector3(-this.MAP_SIZE/2, -8, 0),
    );
    lineGeometry.computeLineDistances();
    const line = new THREE.LineSegments(lineGeometry, lineMaterial);
    line.position.y = this.SPRAY_HEIGHT;

    this.scene.add(line);

    const textGroup = new THREE.Group();
    this.scene.add(textGroup);

    this.fontLoader.load('fonts/helvetiker_regular.typeface.json', (font) => {
      ['bullet time', 'ghosthair', 'infinite ammo', 'nospread', 'reset'].forEach((message, i) => {
        const color = 0xecf0f1;
        const material = new THREE.LineBasicMaterial({
          color: color,
          side: THREE.DoubleSide,
        });
        const shape = new THREE.BufferGeometry();
        const shapes = font.generateShapes(message, 1.5, 2);
        const geometry = new THREE.ShapeGeometry(shapes);
        geometry.computeBoundingBox();
        geometry.translate(-0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x), 0, 0);
        shape.fromGeometry(geometry);
        const text = new THREE.Mesh(shape, material);
        text.position.x = -this.MAP_SIZE / 2;
        text.position.y = 20 - 3.5*i;
        text.position.z = -40;
        text.rotation.y = Math.PI / 2;
        text.name = message;
        textGroup.add(text);
        // this.scene.add(text);
      });

      Object.keys(weapons).forEach((k, i) => {
        const message = weapons[k].name;
        const color = 0xecf0f1;
        const material = new THREE.LineBasicMaterial({
          color: color,
          side: THREE.DoubleSide,
        })
        const shape = new THREE.BufferGeometry();
        const shapes = font.generateShapes(message, 1.5, 2)
        const geometry = new THREE.ShapeGeometry(shapes);
        geometry.computeBoundingBox();
        geometry.translate(-0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x), 0, 0);
        shape.fromGeometry(geometry);
        const text = new THREE.Mesh(shape, material);
        text.position.x = 30 - 20 * (~~(i/4));
        text.position.y = 20 - 5*(i%4);
        text.position.z = this.MAP_SIZE / 2;
        text.rotation.y = Math.PI;
        text.name = message;
        textGroup.add(text);
        // this.scene.add(text);
      });

      ['s p r a y . t r a i n i n g'].forEach((message, i) => {
        const color = 0xecf0f1;
        const material = new THREE.LineBasicMaterial({
          color: color,
          side: THREE.DoubleSide,
        })
        const shape = new THREE.BufferGeometry();
        const shapes = font.generateShapes(message, 4, 2)
        const geometry = new THREE.ShapeGeometry(shapes);
        geometry.computeBoundingBox();
        geometry.translate(-0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x), 0, 0);
        shape.fromGeometry(geometry);
        const text = new THREE.Mesh(shape, material);
        text.position.x = this.MAP_SIZE / 2;
        text.position.y = 10;
        text.position.z = 0;
        text.rotation.y = -Math.PI / 2;
        text.name = message;
        textGroup.add(text);
        // this.scene.add(text);
      });
    });

    // command buttons

    const btnBulletTime = new Button(new THREE.Vector3(-global.MAP_SIZE / 2, 20, -30), new THREE.Euler(0, Math.PI/2, 0), 'bulletTime', 0xecf0f1, () => {
      settings.bulletTime = !settings.bulletTime;
    });
    const btnGhostHair = new Button(new THREE.Vector3(-global.MAP_SIZE / 2, 16.5, -30), new THREE.Euler(0, Math.PI/2, 0), 'ghostHair', 0x00ff00, () => {
      settings.ghostHair = !settings.ghostHair;
    });
    const btnInfiniteAmmo = new Button(new THREE.Vector3(-global.MAP_SIZE / 2, 13, -30), new THREE.Euler(0, Math.PI/2, 0), 'infiniteAmmo', 0xecf0f1, () => {
      settings.infiniteAmmo = !settings.infiniteAmmo;
    });
    const btnNoSpread = new Button(new THREE.Vector3(-global.MAP_SIZE / 2, 9.5, -30), new THREE.Euler(0, Math.PI/2, 0), 'noSpread', 0xecf0f1, () => {
      settings.noSpread = !settings.noSpread;
    });
    const btnReset = new Button(new THREE.Vector3(-global.MAP_SIZE / 2, 6, -30), new THREE.Euler(0, Math.PI/2, 0), 'reset', 0xecf0f1, () => {
      this.reset();
    });

    // TODO: link buttons

    // const btnGithub = new Button({x: -30, y: 0, z: -global.MAP_SIZE / 2}, 'github', 0xffffff, () => {
    //   console.log('github');
    // }, new THREE.Mesh(new THREE.CircleGeometry(5, 32), new THREE.MeshBasicMaterial({color: 0xecf0f1, side: THREE.DoubleSide})));


    this.buttons = [btnBulletTime, btnGhostHair, btnInfiniteAmmo, btnNoSpread, btnReset];
    this.buttons.forEach((button) => {
      this.scene.add(button.mesh);
    });

    // this.links = [btnGithub];
    // this.links.forEach((link) => {
    //   this.scene.add(link.mesh);
    // })

    this.player = new Player(this.camera);
    this.scene.add(this.player.mesh);

    const targetGeometry = new THREE.Geometry();
    targetGeometry.vertices.push(new THREE.Vector3(-this.MAP_SIZE / 2 + 0.01, global.SPRAY_HEIGHT, 0));
    const targetMaterial = new THREE.PointsMaterial({color: 0xff0000, size: 0.6, sizeAttenuation: true});
    const target = new THREE.Points(targetGeometry, targetMaterial);
    target.name = 'target';
    this.scene.add(target);
  }

  initControls() {
    $(document).mouseup(() => {
      this.player.shoot = false;
      this.count = 0;
    }).mousedown(() => {
      this.player.shoot = true;
    });

    let locked = false;

    $(document).keydown((e) => {
      if (e.which === 82 && this.ammo !== 0) {
        if (locked) {
          return;
        }

        locked = true;

        this.ammo = 0;
        this.count = 0;
        this.shot = true;
        setTimeout(() => this.shot = false, weapons[this.currentWeapon].reload);

        audio.playReload(this.currentWeapon);
      }

      setTimeout(() => {locked = false;}, weapons[this.currentWeapon].reload);
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

    // $('#player-velocity').html(`speed: ${Math.hypot(this.player.velocity.x, this.player.velocity.z).toFixed(2)}`);

    $('#player-velocity').html(`fov: ${(2*Math.atan2(Math.tan(this.camera.fov/2 * Math.PI/180), 1/this.camera.aspect) * 180 / Math.PI).toFixed(1)}`);

    $('#player-ammo').html(`${weapons[this.currentWeapon].magazine - this.ammo}/${weapons[this.currentWeapon].magazine}`);

    if (this.aFrame % weapons[this.currentWeapon].magazine < 3) {
      $('#player-fps').html(`fps: ${(1/this.delta).toFixed(0)}`);
    }
  }

  update(delta) {
    this.updateHud();
    this.setCmd();

    const sensitivity = global.SENS;
    const m_yaw = 0.022;
    const m_pitch = 0.022;
    const factor = 2.5;

    this.player.mesh.rotateY(-this.cursorXY.x * sensitivity * m_yaw * factor * delta);
    this.player.camera.rotateX(-this.cursorXY.y * sensitivity * m_pitch * factor * delta);
    this.player.camera.rotation.y = Math.max(0, this.player.camera.rotation.y);

    const dv = movement(this.player, this.cmd, delta);
    this.player.mesh.position.add(dv.multiplyScalar(delta));

    if (this.player.shoot && !this.shot) {
      const bulletGeometry = new THREE.Geometry();
      const projection = utils.projection(this.player, settings.noSpread ? new THREE.Vector3(0, 0, 0) : weapons[this.currentWeapon].spray[this.count]);
      bulletGeometry.vertices.push(projection);
      const bulletMaterial = new THREE.PointsMaterial({color: 0xecf0f1, size: 0.3, sizeAttenuation: true});
      const bullet = new THREE.Points(bulletGeometry, bulletMaterial);
      this.scene.add(bullet);
      setTimeout(() => this.scene.remove(bullet), 3000);

      const d = projection.distanceToSquared(new THREE.Vector3(-this.MAP_SIZE / 2, this.SPRAY_HEIGHT, 0));
      this.shots.push(d);

      audio.playTap(this.currentWeapon);
      if (d <= 1) {
        audio.playHeadshot();
      }

      this.shot = true;
      if (this.ammo !== weapons[this.currentWeapon].magazine-1) {
        setTimeout(() => this.shot = false, 60000/weapons[this.currentWeapon].rpm);
      } else {
        setTimeout(() => this.shot = false, weapons[this.currentWeapon].reload);

        audio.playReload(this.currentWeapon);

        if (!settings.noSpread && !settings.infiniteAmmo) {
          const score = 100/(utils.accuracy(this.shots)/100+1);
          this.highScore = Math.max(score, this.highScore);
        }

        this.shots = [];
      }

      this.ammo = settings.infiniteAmmo ? 0 : (this.ammo + 1) % weapons[this.currentWeapon].magazine;
      this.count = (this.count + 1) % weapons[this.currentWeapon].magazine;
      this.sprayCount = (this.sprayCount + 1) % weapons[this.currentWeapon].magazine;

      if (this.sprayCount === 0) {
        audio.playDone();
      }

      this.buttons.forEach((button) => {
        if (Math.abs(projection.x + this.MAP_SIZE / 2) <= 0.01 && Math.abs(projection.y - button.position.y) <= 1 && Math.abs(projection.z - button.position.z) <= 1) {
          button.action();
          button.mesh.material.color.setHex(settings[button.name] ? 0x00ff00 : 0xecf0f1);
          audio.playSetting();
        }
      });

      const target = this.scene.getObjectByName('target');
      const targetPosition = weapons[this.currentWeapon].spray[this.sprayCount].clone().multiplyScalar(-global.SPRAY_SCALE).add(new THREE.Vector3(-this.MAP_SIZE / 2 + 0.01, this.SPRAY_HEIGHT, 0))
      target.geometry.vertices.pop();
      target.geometry.vertices.push(targetPosition);
      target.geometry.verticesNeedUpdate = true;
      target.material.visible = settings.ghostHair;
    }

    this.cursorXY = {x: 0, y: 0};
    this.cmd = {
      forward: 0,
      right: 0,
      jump: false,
    };
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
    this.ammo = 0;
    this.count = 0;
    this.sprayCount = 0;
    this.shots = [];
    this.player.mesh.position.set(-global.MAP_SIZE / 2 + global.INITIAL_DISTANCE, global.PLAYER_HEIGHT, 0);
  }
}
