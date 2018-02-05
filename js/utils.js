import * as THREE from 'three';
import { global } from './global.js';
import { settings } from './settings.js';
import { weapons } from './weapons.js';

const accurateMaxSpeedSq = 500;

exports.projection = (player, currentWeapon, s) => {
  const MAP_SIZE = global.MAP_SIZE;
  const MAP_HEIGHT = global.MAP_HEIGHT;
  const PLAYER_HEIGHT = global.PLAYER_HEIGHT;
  const SPRAY_HEIGHT = global.SPRAY_HEIGHT;
  const scale = global.SPRAY_SCALE;

  const position = player.mesh.position.clone();
  const direction = player.camera.getWorldDirection().clone().normalize();

  const spray = s.clone();
  spray.multiplyScalar(scale / global.INITIAL_DISTANCE);

  const z = new THREE.Vector3(0, 0, 1);
  const quat = new THREE.Quaternion().setFromEuler(player.mesh.rotation);
  z.applyQuaternion(quat);
  const y = new THREE.Vector3().crossVectors(direction, z);
  const u = new THREE.Vector3().subVectors(
    y.multiplyScalar(spray.y),
    z.multiplyScalar(spray.z)
  );

  direction.add(u);

  const velocitySq = player.velocity.lengthSq();
  const factorStanding = 1/2000;
  const factorCrouching = 1/2000;
  const factorRunning = Math.pow(velocitySq, 1/2) * 1/20000;
  const inaccuracyValues = weapons[currentWeapon].inaccuracy;
  const [inaccuracyStanding, inaccuracyCrouching, inaccuracyRunning] = Object.keys(inaccuracyValues).map((key) => inaccuracyValues[key]);;

  if (!settings.noSpread) {
    if (velocitySq >= accurateMaxSpeedSq) {
      direction.add(
        new THREE.Vector3(
          THREE.Math.randFloatSpread(inaccuracyRunning),
          THREE.Math.randFloatSpread(inaccuracyRunning),
          THREE.Math.randFloatSpread(inaccuracyRunning)
        ).multiplyScalar(factorRunning)
      );
    } else if (position.y === PLAYER_HEIGHT) {
      direction.add(
        new THREE.Vector3(
          THREE.Math.randFloatSpread(inaccuracyStanding),
          THREE.Math.randFloatSpread(inaccuracyStanding),
          THREE.Math.randFloatSpread(inaccuracyStanding)
        ).multiplyScalar(factorStanding)
      );
    } else if (position.y < PLAYER_HEIGHT) {
      direction.add(
        new THREE.Vector3(
          THREE.Math.randFloatSpread(inaccuracyCrouching),
          THREE.Math.randFloatSpread(inaccuracyCrouching),
          THREE.Math.randFloatSpread(inaccuracyCrouching)
        ).multiplyScalar(factorCrouching)
      );
    }
  }

  const t1 = (MAP_SIZE / 2 - position.x) / direction.x;
  const t2 = (-MAP_SIZE / 2 - position.x) / direction.x;
  const t3 = (-position.y + MAP_HEIGHT) / direction.y;
  const t4 = (-position.y) / direction.y;
  const t5 = (MAP_SIZE / 2 - position.z) / direction.z;
  const t6 = (-MAP_SIZE / 2 - position.z) / direction.z;

  const pos = [t1, t2, t3, t4, t5, t6].filter(t => t >= 0);
  const t = Math.min(...pos);

  position.add(direction.multiplyScalar(t));

  return position;
};

exports.accuracy = (shots) => shots.reduce((acc, shot) => acc + shot/shots.length, 0);

exports.score = (acc) => 100 / (acc / 20 + 1);

exports.rand = (arr) => arr[~~(Math.random() * arr.length)];