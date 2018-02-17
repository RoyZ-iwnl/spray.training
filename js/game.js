import * as THREE from 'three';
import { Howl } from 'howler';
import movement from './movement.js';
import * as utils from './utils.js';
import Player from './player.js';
import { global } from './global.js';
import { settings } from './settings.js';
import Button from './button.js';
import { weapons } from './weapons.js';
import * as audio from './audio.js';
import { colors } from './colors.js';

export default class Game {
  constructor(data) {
    this.hud = data.hud;
    this.inverted = data.inverted;

    this.cursorXY = {x: 0, y: 0};
    this.cmd = {
      forward: 0,
      right: 0,
      jump: false,
      crouch: false,
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
    this.resolutions = ['4x3', '16x9', '16x10'];
    this.options = ['audio-on', 'audio-off', 'viewmodel'];
    this.logos = ['reddit', 'github', 'bitcoin', 'paypal', 'email'];

    this.recoil = new THREE.Vector3(0, 0, 0);

    this.highScore = {
      'ak47': 0,
      'm4a1': 0,
      'm4a1_silencer': 0,
      'galilar': 0,
      'sg556': 0,
      'famas': 0,
      'aug': 0,
      'mac10': 0,
      'mp7': 0,
      'ump45': 0,
      'bizon': 0,
      'p90': 0,
      'mp9': 0,
      'm249': 0,
      'cz75a': 0,
    };
    this.currentScore = 0;
    this.newHighScore = false;

    this.crouch = 0;

    this.colorScheme = colors.default;

    this.beginTime = (performance || Date).now();
    this.prevTime = this.beginTime;
    this.frames = 0;
    this.fps = 0;

    this.playerDistance = 75;
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
      const factor = 1/9;
      // prevent any abnormal mouse jumping
      if (Math.abs(e.movementX) <= window.innerWidth * factor &&
          Math.abs(e.movementY) <= window.innerHeight * factor) {
        this.cursorXY.x += e.movementX ||
                           e.mozMovementX ||
                           e.webkitMovementX ||
                           0;
        this.cursorXY.y += e.movementY ||
                           e.mozMovementY ||
                           e.webkitMovementY ||
                           0;
      }
    };

    const pointerLockChange = (event) => {
      const element = document.body;
      if (document.pointerLockElement       === element ||
          document.mozPointerLockElement    === element ||
          document.webkitPointerLockElement === element) {
        document.addEventListener('mousemove', moveCallback, false);
      } else {
        document.removeEventListener('mousemove', moveCallback, false);
      }
    };

    const listener = (event) => {
      const havePointerLock = 'pointerLockElement'       in document ||
                              'mozPointerLockElement'    in document ||
                              'webkitPointerLockElement' in document;

      if (!havePointerLock) {
        return;
      }

      const element = document.body;
      element.requestPointerLock =  element.requestPointerLock ||
                                    element.mozRequestPointerLock ||
                                    element.webkitRequestPointerLock;
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
    this.scene.background = new THREE.Color(this.colorScheme.background);
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('game-page').appendChild(this.renderer.domElement);

    const aspect = window.innerWidth / window.innerHeight; // 16/9;
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
    const mapMaterial = new THREE.LineDashedMaterial({
      color: this.colorScheme.map,
      dashSize: 2,
      gapSize: 1,
      linewidth: 1
    });
    const mapGeometry = new THREE.Geometry().fromBufferGeometry(new THREE.EdgesGeometry(new THREE.BoxGeometry(this.MAP_SIZE, this.MAP_HEIGHT, this.MAP_SIZE)));
    mapGeometry.computeLineDistances();
    const map = new THREE.LineSegments(mapGeometry, mapMaterial);
    map.position.y = this.MAP_HEIGHT/2;

    this.scene.add(map);

    const crossMaterial = new THREE.LineDashedMaterial({color: 0xbfbfbf, dashSize: 0.75, gapSize: 0.75, linewidth: 1});
    const crossGeometry = new THREE.Geometry();
    crossGeometry.vertices.push(
      new THREE.Vector3(0, 0, 8),
      new THREE.Vector3(0, 0, -8),

      new THREE.Vector3(0, 8, 0),
      new THREE.Vector3(0, -8, 0),
    );
    crossGeometry.computeLineDistances();
    const cross = new THREE.LineSegments(crossGeometry, crossMaterial);
    cross.position.x = -this.MAP_SIZE / 2;
    cross.position.y = this.SPRAY_HEIGHT;

    this.scene.add(cross);

    const headMaterial = new THREE.LineDashedMaterial({color: 0xbfbfbf, dashSize: Math.PI/6, gapSize: Math.PI/12, linewidth: 1});
    const headGeometry = new THREE.Geometry();

    for (let i = 0; i < 32; i++) {
      headGeometry.vertices.push(new THREE.Vector3(0, Math.cos(Math.PI/16 * i), Math.sin(Math.PI/16 * i)))
      headGeometry.vertices.push(new THREE.Vector3(0, Math.cos(Math.PI/16 * (i+1)), Math.sin(Math.PI/16 * (i+1))));
    }

    headGeometry.computeLineDistances();
    const head = new THREE.LineSegments(headGeometry, headMaterial);
    head.position.x = -this.MAP_SIZE / 2;
    head.position.y = global.PLAYER_HEIGHT;

    this.scene.add(head);

    const worldGroup = new THREE.Group();
    this.scene.add(worldGroup);

    this.fontLoader.load('fonts/helvetiker_regular.typeface.json', (font) => {
      ['ghosthair', 'nospread', 'reset'].forEach((message, i) => {
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

    const btnGhostHair = new Button(new THREE.Vector3(-global.MAP_SIZE / 2, 16.5, -30), new THREE.Euler(0, Math.PI/2, 0), 'ghostHair', 0x00ff00, () => {
      settings.ghostHair = !settings.ghostHair;
    });

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

    this.resolutions.forEach((res, i) => {
      this.textureLoader.load(`img/icons/res${res}.png`, (resMap) => {
        const resMaterial = new THREE.MeshBasicMaterial({
          transparent: true,
          map: resMap,
          side: THREE.DoubleSide
        });
        const resGeometry = new THREE.PlaneBufferGeometry(4, 4, 32);
        const resMesh = new THREE.Mesh(resGeometry, resMaterial);
        resMesh.position.set(-global.MAP_SIZE / 2, 17.5, 35 - 5*i);
        resMesh.rotation.set(0, Math.PI/2, 0);
        worldGroup.add(resMesh);
      });
    });


    this.crosshairs.forEach((xhair, i) => {
      this.textureLoader.load(`img/icons/${xhair}.png`, (xhairMap) => {
        const xhairMaterial = new THREE.MeshBasicMaterial({
          transparent: true,
          map: xhairMap,
          side: THREE.DoubleSide
        });
        const xhairGeometry = new THREE.PlaneBufferGeometry(4, 4, 32);
        const xhairMesh = new THREE.Mesh(xhairGeometry, xhairMaterial);
        xhairMesh.position.set(-global.MAP_SIZE / 2, 12.5, 35 - 5*i);
        xhairMesh.rotation.set(0, Math.PI/2, 0);
        worldGroup.add(xhairMesh);
      });
    });

    this.options.forEach((logo, i) => {
      this.textureLoader.load(`img/icons/${logo}.png`, (iconMap) => {
        const iconMaterial = new THREE.MeshBasicMaterial({
          transparent: true,
          map: iconMap,
          side: THREE.DoubleSide
        });
        const iconGeometry = new THREE.PlaneBufferGeometry(4, 4, 32);
        const iconMesh = new THREE.Mesh(iconGeometry, iconMaterial);
        iconMesh.position.set(-global.MAP_SIZE / 2, 7.5, 35 - 5 * i);
        iconMesh.rotation.set(0, Math.PI/2, 0);
        worldGroup.add(iconMesh);
      });
    });

    this.logos.forEach((logo, i) => {
      this.textureLoader.load(`img/icons/${logo}.png`, (logoMap) => {
        logoMap.minFilter = THREE.LinearFilter;
        const logoMaterial = new THREE.MeshBasicMaterial({
          transparent: true,
          map: logoMap,
          side: THREE.DoubleSide
        });
        const logoGeometry = new THREE.PlaneBufferGeometry(4, 4, 32);
        const logoMesh = new THREE.Mesh(logoGeometry, logoMaterial);

        logoMesh.position.set(
          10* i - (this.logos.length - 1) * 5,
          13,
          -global.MAP_SIZE / 2
        );

        worldGroup.add(logoMesh);
      });
    });

    this.player = new Player(this.camera);
    this.scene.add(this.player.mesh);

    const targetGeometry = new THREE.Geometry();
    targetGeometry.vertices.push(new THREE.Vector3(-this.MAP_SIZE / 2 + 0.01, global.SPRAY_HEIGHT, 0));
    const targetMaterial = new THREE.PointsMaterial({
      color: 0xff0000,
      size: 1,
      sizeAttenuation: true
    });
    const target = new THREE.Points(targetGeometry, targetMaterial);
    target.name = 'target';
    this.scene.add(target);
  }

  initControls() {
    $(document).mouseup((e) => {
      switch (e.which) {
        case 1:
          this.player.shoot = false;
          this.count = 0;
          break;
      }
    }).mousedown((e) => {
      switch (e.which) {
        case 1:
          this.player.shoot = true;
          break;
        case 3: 
          if (this.currentWeapon === 'aug' || this.currentWeapon === 'sg556') {
            if (this.camera.fov === 74) {
              this.camera.fov = 59;
              this.hud.updateViewmodel('hide');
              audio.playScope();
            } else {
              this.camera.fov = 74;
              this.hud.updateViewmodel('show');
              audio.playUnscope();
            }
            this.camera.updateProjectionMatrix();
          }
          break;
      }
      
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

        audio.playReload(this.currentWeapon);
        this.hud.updateViewmodel('reload');
      }

      if (e.ctrlKey && (
        e.keyCode === 65 ||
        e.keyCode === 83 ||
        e.keyCode === 68 ||
        e.keyCode === 87
      )) { 
        e.preventDefault(); 
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

  update(delta) {
    this.hud.updateHud({
      player: this.player,
      playerDistance: this.playerDistance,
      camera: this.camera,
      currentWeapon: this.currentWeapon, 
      ammo: this.ammo, 
      highScore: this.highScore,
      currentScore: this.currentScore,
      newHighScore: this.newHighScore,
      aFrame: this.aFrame,
      fps: this.fps
    });
    this.setCmd();

    const sensitivity = global.SENS;
    const m_yaw = 0.022;
    const m_pitch = 0.022;
    const factor = 2.5;
    const yRot = -this.cursorXY.x * sensitivity * m_yaw * factor * delta;
    const xRot = (this.inverted ? 1 : -1) * this.cursorXY.y * sensitivity * m_pitch * factor * delta;

    this.player.mesh.rotateY(yRot);
    this.player.camera.rotateX(xRot);
    this.player.camera.rotation.y = Math.max(0, this.player.camera.rotation.y);

    this.playerDistance = Math.hypot(
      this.player.mesh.position.x + this.MAP_SIZE / 2,
      this.player.mesh.position.z
    );

    const dx = movement(this.player, this.cmd, delta);
    dx.multiplyScalar(delta);
    this.player.mesh.position.add(dx);
    this.player.mesh.position.x = THREE.Math.clamp(this.player.mesh.position.x, -this.MAP_SIZE / 2 + 2, this.MAP_SIZE / 2 - 2);
    this.player.mesh.position.z = THREE.Math.clamp(this.player.mesh.position.z, -this.MAP_SIZE / 2 + 2, this.MAP_SIZE / 2 - 2);

    if (Math.abs(this.player.mesh.position.x) === this.MAP_SIZE / 2) {
      this.player.velocity.x = 0;
    }
    if (Math.abs(this.player.mesh.position.z) === this.MAP_SIZE / 2) {
      this.player.velocity.z = 0;
    }

    if (this.newHighScore) {
      this.newHighScore = false;
    }

    if (this.player.shoot && !this.shot && !this.reloading) {
      const bulletGeometry = new THREE.Geometry();
      const projection = utils.projection(
        this.player,
        this.currentWeapon,
        settings.noSpread ? new THREE.Vector3(0, 0, 0) : weapons[this.currentWeapon].spray[this.count]
      );
      bulletGeometry.vertices.push(projection);

      const d = projection.distanceToSquared(new THREE.Vector3(-this.MAP_SIZE / 2, this.SPRAY_HEIGHT, 0));
      const bulletMaterial = new THREE.PointsMaterial({
        color: d <= 1 ? 0x19b5fe : 0xecf0f1,
        size: 0.5,
        sizeAttenuation: true
      });

      const bullet = new THREE.Points(bulletGeometry, bulletMaterial);
      this.scene.add(bullet);
      setTimeout(() => this.scene.remove(bullet), 5000);

      
      audio.playTap(this.currentWeapon);
      if (d <= 1) {
        audio.playHeadshot();
      }

      // accuracy = sum(d^err);
      // const err = 1;
      this.shots.push(d <= 1 ? 0 : d /* Math.pow(d, err) */);

      this.shot = true;
      if (this.ammo !== weapons[this.currentWeapon].magazine-1) {
        this.hud.updateViewmodel('shoot');
        setTimeout(() => this.shot = false, 60000/weapons[this.currentWeapon].rpm);
      } else {
        this.reloading = true;
        audio.playReload(this.currentWeapon);
        this.hud.updateViewmodel('reload');

        setTimeout(() => {
          this.shot = false;
          this.reloading = false;
        }, weapons[this.currentWeapon].reload);

        if (this.count === weapons[this.currentWeapon].magazine - 1 && !settings.noSpread) {
          this.currentScore = utils.score(utils.accuracy(this.shots)); // this.shots |> utils.accuracy |> utils.score;
          if (this.currentScore > this.highScore[this.currentWeapon]) {
            this.highScore[this.currentWeapon] = this.currentScore;
            this.newHighScore = true;
          }
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
            this.hud.updateViewmodel('select');
            console.log(`You are now holding the ${weapons[this.currentWeapon].name}. Your highest accuracy with this weapon was ${this.highScore[this.currentWeapon].toFixed(2)}%.`)
            this.currentScore = 0;
            audio.playDone();
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
                window.open('https://www.reddit.com/r/GlobalOffensive/comments/7xz3to/spraytraining_a_website_i_made_for_practicing/', '_blank');
                break;
              case 'github':
                window.open('https://github.com/15/spray.training', '_blank');
                break;
              case 'bitcoin':
                window.open('/donate.html', '_blank');
                break;
              case 'paypal':
                window.open('/donate.html', '_blank');
                break;
              case 'email':
                window.open('mailto:contact@spray.training', '_blank');
                break;
            }

            $(document).trigger('mouseup');
            this.player.mesh.rotation.set(0, 0, 0);
            this.player.mesh.position.set(-global.MAP_SIZE / 2 + global.INITIAL_DISTANCE, global.PLAYER_HEIGHT, 0);
          }
        }
      }

      if (Math.abs(projection.x + this.MAP_SIZE / 2) <= 0.01) {
        if (Math.abs(projection.y - 7.5) <= 2) {
          const u = (35 - projection.z) / 5;
          const x = ~~(u+0.5);
          if (Math.abs(u - x) <= 0.4 && x >= 0 && x < 3) {
            switch (this.options[x]) {
              case 'audio-on':
                if (!settings.audio) {
                  settings.audio = true;
                  audio.playSelect();
                }
                break;
              case 'audio-off':
                audio.playSelect();
                settings.audio = false;
                break;
              case 'viewmodel':
                audio.playSelect();
                this.hud.updateViewmodel('toggle');
                settings.viewmodel = !settings.viewmodel;
                break;
            }
          }
        }
      }

      if (Math.abs(projection.x + this.MAP_SIZE / 2) <= 0.01) {
        if (Math.abs(projection.y - 12.5) <= 2) {
          const u = (35 - projection.z) / 5;
          const x = ~~(u+0.5);
          if (Math.abs(u - x) <= 0.4 && x >= 0 && x < 3) {
            audio.playSelect();
            this.hud.updateCrosshair(this.crosshairs[x]);
          }
        }
      }

      if (Math.abs(projection.x + this.MAP_SIZE / 2) <= 0.01) {
        if (Math.abs(projection.y - 17.5) <= 2) {
          const u = (35 - projection.z) / 5;
          const x = ~~(u+0.5);
          if (Math.abs(u - x) <= 0.4 && x >= 0 && x < 3) {
            switch (this.resolutions[x]) {
              case '4x3':
                this.camera.aspect = 4/3;
                audio.playSelect();
                break;
              case '16x9':
                this.camera.aspect = 16/9;
                audio.playSelect();
                break;
              case '16x10':
                this.camera.aspect = 16/10;
                audio.playSelect();
                break;
            }

            this.camera.fov = 74;
            this.camera.updateProjectionMatrix();
          }
        }
      }

      const target = this.scene.getObjectByName('target');
      const targetPosition = weapons[this.currentWeapon]
                              .spray[this.sprayCount]
                              .clone()
                              .multiply(
                                new THREE.Vector3(0, -1, 1)
                                  .multiplyScalar(global.SPRAY_SCALE)
                                  .multiplyScalar(this.playerDistance / global.INITIAL_DISTANCE) // update ghosthair depending on player distance from target
                              )
                              .add(
                                new THREE.Vector3(
                                  -this.MAP_SIZE / 2 + 0.01,
                                  this.SPRAY_HEIGHT,
                                  0)
                              );
      target.geometry.vertices.pop();
      target.geometry.vertices.push(targetPosition);
      target.geometry.verticesNeedUpdate = true;
      target.material.visible = settings.ghostHair;
    }

    if (this.cmd.crouch) {
      if (this.crouch < ~~(10000 * this.delta)) {
        this.crouch++;
      }
    } else {
      if (this.crouch > 0) {
        this.crouch--;
      }
    }

    this.player.mesh.position.y = global.PLAYER_HEIGHT / 2 * (2 - THREE.Math.smootherstep(this.crouch, 0, 60));

    this.cursorXY = {x: 0, y: 0};
    this.cmd = {
      forward: 0,
      right: 0,
      jump: false,
      crouch: false,
    };

    this.frames++;
    const time = (performance || Date).now();
    const interval = 250;
    if (time >= this.prevTime + interval) {
      this.fps = (this.frames * 1000) / (time - this.prevTime);
      this.prevTime = time;
      this.frames = 0;
    }
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
    this.cmd.crouch = this.keyboard.pressed('ctrl'); // ctrl causes unwanted issues, e.g. ctrl + w
  }

  reset() {
    this.ammo = 0;
    this.count = 0;
    this.sprayCount = 0;
    this.shots = [];
  }
}
