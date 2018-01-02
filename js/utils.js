import * as THREE from 'three';
import { global } from './global.js';

exports.projection = (player, s) => {
  const MAP_SIZE = global.MAP_SIZE;
  const MAP_HEIGHT = global.MAP_HEIGHT;
  const PLAYER_HEIGHT = global.PLAYER_HEIGHT;
  const SPRAY_HEIGHT = global.SPRAY_HEIGHT;
  const scale = global.SPRAY_SCALE;

  let position = player.mesh.position.clone();
  let direction = player.camera.getWorldDirection().clone().normalize();

  let spray = s.clone();
  spray.multiplyScalar(scale / global.INITIAL_DISTANCE);
  // spray.multiplyScalar(scale / (position.distanceTo(new THREE.Vector3(-MAP_SIZE / 2 + 0.01, 5, 0))));

  const z = new THREE.Vector3(0, 0, 1);
  const quat = new THREE.Quaternion().setFromEuler(player.mesh.rotation);
  z.applyQuaternion(quat);
  const y = new THREE.Vector3().crossVectors(direction, z);
  const u = new THREE.Vector3().addVectors(y.multiplyScalar(spray.y), z.multiplyScalar(spray.z));

  direction.add(u);

  if (player.velocity.lengthSq() >= 500) {
    direction.add(new THREE.Vector3(THREE.Math.randFloatSpread(0.3), THREE.Math.randFloatSpread(0.3), THREE.Math.randFloatSpread(0.3)));
  }

  const t1 = (MAP_SIZE / 2 - position.x) / direction.x;
  const t2 = (-MAP_SIZE / 2 - position.x) / direction.x;
  const t3 = (-PLAYER_HEIGHT + MAP_HEIGHT) / direction.y;
  const t4 = (-PLAYER_HEIGHT) / direction.y;
  const t5 = (MAP_SIZE / 2 - position.z) / direction.z;
  const t6 = (-MAP_SIZE / 2 - position.z) / direction.z;

  const pos = [t1, t2, t3, t4, t5, t6].filter(t => t >= 0);
  const t = Math.min(...pos);

  position.add(direction.multiplyScalar(t));

  return position;
};

exports.accuracy = (shots) => {
  return shots.reduce((acc, shot) => acc + shot, 0);
};

exports.rand = (arr) => arr[~~(Math.random() * arr.length)];