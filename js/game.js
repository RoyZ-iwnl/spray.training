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
  constructor(hud) {
    this.hud = hud;

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
    this.reloading = false;

    this.ammo = 0;
    this.count = 0;
    this.sprayCount = 0;

    this.shots = [];

    this.currentWeapon = 'ak47';

    this.buttons = [];
    this.crosshairs = ['default', 'cross', 'dot'];
    this.options = ['audio-on', 'audio-off', 'viewmodel'];
    this.logos = ['reddit', 'github', 'bitcoin', 'paypal', 'email'];

    this.recoil = new THREE.Vector3(0, 0, 0);
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
      if (Math.abs(e.movementX) <= window.innerWidth * 1/9 && Math.abs(e.movementY) <= window.innerHeight * 1/9) {
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
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
    this.camera.position.set(0, 0, 0);
    this.camera.rotation.y = 0.5 * Math.PI;

    this.clock = new THREE.Clock();
    THREEx.WindowResize(this.renderer, this.camera);
    this.keyboard = new THREEx.KeyboardState();
    this.fontLoader = new THREE.FontLoader();
    this.textureLoader = new THREE.TextureLoader();
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

    const worldGroup = new THREE.Group();
    this.scene.add(worldGroup);

    this.fontLoader.load('fonts/helvetiker_regular.typeface.json', (font) => {
      [/*'bullet time', */'ghosthair', /*'infinite ammo', */'nospread', 'reset'].forEach((message, i) => {
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
        text.position.y = 16.5 - 3.5*i;
        text.position.z = -40;
        text.rotation.y = Math.PI / 2;
        text.name = message;
        worldGroup.add(text);
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
        worldGroup.add(text);
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
        worldGroup.add(text);
      });
    });

    // command buttons

    /*const btnBulletTime = new Button(new THREE.Vector3(-global.MAP_SIZE / 2, 20, -30), new THREE.Euler(0, Math.PI/2, 0), 'bulletTime', 0xecf0f1, () => {
      settings.bulletTime = !settings.bulletTime;
    }); */
    const btnGhostHair = new Button(new THREE.Vector3(-global.MAP_SIZE / 2, 16.5, -30), new THREE.Euler(0, Math.PI/2, 0), 'ghostHair', 0x00ff00, () => {
      settings.ghostHair = !settings.ghostHair;
    });
    /* const btnInfiniteAmmo = new Button(new THREE.Vector3(-global.MAP_SIZE / 2, 13, -30), new THREE.Euler(0, Math.PI/2, 0), 'infiniteAmmo', 0xecf0f1, () => {
      settings.infiniteAmmo = !settings.infiniteAmmo;
    }); */
    const btnNoSpread = new Button(new THREE.Vector3(-global.MAP_SIZE / 2, 13, -30), new THREE.Euler(0, Math.PI/2, 0), 'noSpread', 0xecf0f1, () => {
      settings.noSpread = !settings.noSpread;
    });
    const btnReset = new Button(new THREE.Vector3(-global.MAP_SIZE / 2, 9.5, -30), new THREE.Euler(0, Math.PI/2, 0), 'reset', 0xecf0f1, () => {
      this.reset();
      this.player.mesh.position.set(-global.MAP_SIZE / 2 + global.INITIAL_DISTANCE, global.PLAYER_HEIGHT, 0);
    });

    this.buttons = [/*btnBulletTime, */btnGhostHair, /*btnInfiniteAmmo, */btnNoSpread, btnReset];
    this.buttons.forEach((button) => {
      worldGroup.add(button.mesh);
    });

    this.crosshairs.forEach((xhair, i) => {
      this.textureLoader.load(`img/icons/xhair${xhair}.png`, (xhairMap) => {
        const xhairMaterial = new THREE.MeshBasicMaterial({transparent: true, map: xhairMap, side: THREE.DoubleSide});
        const xhairGeometry = new THREE.PlaneBufferGeometry(4, 4, 32);
        const xhairMesh = new THREE.Mesh(xhairGeometry, xhairMaterial);
        xhairMesh.position.set(-global.MAP_SIZE / 2, 15, 35 - 5*i);
        xhairMesh.rotation.set(0, Math.PI/2, 0);
        worldGroup.add(xhairMesh);
      });
    });

    this.options.forEach((logo, i) => {
      this.textureLoader.load(`img/icons/${logo}.svg`, (iconMap) => {
        const iconMaterial = new THREE.MeshBasicMaterial({transparent: true, map: iconMap, side: THREE.DoubleSide});
        const iconGeometry = new THREE.PlaneBufferGeometry(4, 4, 32);
        const iconMesh = new THREE.Mesh(iconGeometry, iconMaterial);
        iconMesh.position.set(-global.MAP_SIZE / 2, 10, 35 - 5 * i);
        iconMesh.rotation.set(0, Math.PI/2, 0);
        worldGroup.add(iconMesh);
      });
    });

    this.logos.forEach((logo, i) => {
      this.textureLoader.load(`img/icons/${logo}.svg`, (logoMap) => {
        logoMap.minFilter = THREE.LinearFilter;
        const logoMaterial = new THREE.MeshBasicMaterial({transparent: true, map: logoMap, side: THREE.DoubleSide});
        const logoGeometry = new THREE.PlaneBufferGeometry(4, 4, 32);
        const logoMesh = new THREE.Mesh(logoGeometry, logoMaterial);
        logoMesh.position.set(10* i - (this.logos.length - 1) * 5, 13, -global.MAP_SIZE / 2);
        worldGroup.add(logoMesh);
      });
    });

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
        this.reloading = true;
        setTimeout(() => {
          this.reloading = false;
        }, weapons[this.currentWeapon].reload);

        if (settings.audio) {
          audio.playReload(this.currentWeapon);
        }
        this.hud.updateHud('reload');
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

    if (this.player.shoot && !this.shot && !this.reloading) {
      const bulletGeometry = new THREE.Geometry();
      const projection = utils.projection(this.player, settings.noSpread ? new THREE.Vector3(0, 0, 0) : weapons[this.currentWeapon].spray[this.count]);
      bulletGeometry.vertices.push(projection);
      const bulletMaterial = new THREE.PointsMaterial({color: 0xecf0f1, size: 0.3, sizeAttenuation: true});
      const bullet = new THREE.Points(bulletGeometry, bulletMaterial);
      this.scene.add(bullet);
      setTimeout(() => this.scene.remove(bullet), 3000);

      const d = projection.distanceToSquared(new THREE.Vector3(-this.MAP_SIZE / 2, this.SPRAY_HEIGHT, 0));
      this.shots.push(d);

      if (settings.audio) {
        audio.playTap(this.currentWeapon);
        if (d <= 1) {
          audio.playHeadshot();
        }
      }

      this.shot = true;
      if (this.ammo !== weapons[this.currentWeapon].magazine-1) {
        this.hud.updateHud('shoot');
        setTimeout(() => this.shot = false, 60000/weapons[this.currentWeapon].rpm);
      } else {
        this.reloading = true;
        if (settings.audio) {
          audio.playReload(this.currentWeapon);
        }
        this.hud.updateHud('reload');

        setTimeout(() => {
          this.shot = false;
          this.reloading = false;
        }, weapons[this.currentWeapon].reload);

        this.shots = [];
      }

      this.ammo = settings.infiniteAmmo ? 0 : (this.ammo + 1) % weapons[this.currentWeapon].magazine;
      this.count = (this.count + 1) % weapons[this.currentWeapon].magazine;
      this.sprayCount = (this.sprayCount + 1) % weapons[this.currentWeapon].magazine;

      if (this.sprayCount === 0 && settings.audio) {
        audio.playDone();
      }

      this.buttons.forEach((button) => {
        if (Math.abs(projection.x + this.MAP_SIZE / 2) <= 0.01 && Math.abs(projection.y - button.position.y) <= 1 && Math.abs(projection.z - button.position.z) <= 1) {
          button.action();
          button.mesh.material.color.setHex(settings[button.name] ? 0x00ff00 : 0xecf0f1);
          if (settings.audio) {
            audio.playSetting();
          }
        }
      });

      if (Math.abs(projection.z - this.MAP_SIZE / 2) <= 0.01) {
        const u = 3 - (projection.x + 30) / 20;
        const v = (-projection.y + 20) / 5;
        const x = ~~(u+0.5);
        const y = ~~(v+0.5);
        const w = 4*x + y;
        if (Math.abs(u - x) <= 0.25 && Math.abs(v - y) <= 0.5 && w >= 0 && w <= 14 && x >= 0 && x <= 3 && y >= 0 && y <= 3) {
          const newWeapon = Object.keys(weapons)[w];

          if (this.currentWeapon !== newWeapon) {
            this.currentWeapon = newWeapon;
            this.hud.weapon = newWeapon;
            this.hud.updateHud('select');
            if (settings.audio) {
              audio.playDone();
            }
            this.reset();
          }
        }
      }

      if (Math.abs(projection.z + this.MAP_SIZE / 2) <= 0.01) {
        if (Math.abs(projection.y - 13) <= 2) {
          const u = (projection.x + 20)/10;
          const x = ~~(u+0.5);
          if (Math.abs(u - x) <= 0.2 && x >= 0 && x < 5) {
            switch (this.logos[x]) {
              case 'reddit':
                window.open('https://reddit.com/r/globaloffensive', '_blank');
                break;
              case 'github':
                window.open('https://github.com/15/spray.training', '_blank');
                break;
              case 'bitcoin':
                window.open('/donate', '_blank');
                break;
              case 'paypal':
                window.open('/donate', '_blank');
                break;
              case 'email':
                window.open('mailto:help@spray.training', '_blank');
                break;
            }

            $(document).trigger('mouseup');
            this.player.mesh.rotation.set(0, 0, 0);
            this.player.mesh.position.set(-global.MAP_SIZE / 2 + global.INITIAL_DISTANCE, global.PLAYER_HEIGHT, 0);
          }
        }
      }

      if (Math.abs(projection.x + this.MAP_SIZE / 2) <= 0.01) {
        if (Math.abs(projection.y - 10) <= 2) {
          const u = (35 - projection.z) / 5;
          const x = ~~(u+0.5);
          if (Math.abs(u - x) <= 0.4 && x >= 0 && x < 3) {
            switch (this.options[x]) {
              case 'audio-on':
                if (!settings.audio) {
                  audio.playDone();
                }
                settings.audio = true;
                break;
              case 'audio-off':
                if (settings.audio) {
                  audio.playDone();
                }
                settings.audio = false;
                break;
              case 'viewmodel':
                audio.playDone();
                this.hud.updateHud('toggle');
                settings.viewmodel = !settings.viewmodel;
                break;
            }
          }
        }
      }

      if (Math.abs(projection.x + this.MAP_SIZE / 2) <= 0.01) {
        if (Math.abs(projection.y - 15) <= 2) {
          const u = (35 - projection.z) / 5;
          const x = ~~(u+0.5);
          if (Math.abs(u - x) <= 0.4 && x >= 0 && x < 3) {
            if (settings.audio) {
              audio.playDone();
            }
            this.hud.updateCrosshair(this.crosshairs[x]);
          }
        }
      }

      const target = this.scene.getObjectByName('target');
      const targetPosition = weapons[this.currentWeapon].spray[this.sprayCount].clone().multiply(new THREE.Vector3(0, -1, 1).multiplyScalar(global.SPRAY_SCALE)).add(new THREE.Vector3(-this.MAP_SIZE / 2 + 0.01, this.SPRAY_HEIGHT, 0))
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
  }
}
