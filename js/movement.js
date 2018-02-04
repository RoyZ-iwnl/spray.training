import * as THREE from 'three';
import { global } from './global.js';

export default function(player, cmd, delta) {
  let position = player.mesh.position;
  let velocity = player.velocity;
  let rotation = player.mesh.rotation;
  let cRotation = player.camera.rotation;

  const accelerate = (wishDir, wishSpeed, accel) => {
    let currentSpeed = velocity.dot(wishDir);
    let addSpeed = wishSpeed - currentSpeed;
    if (addSpeed <= 0) return;

    let accelSpeed = accel * delta * wishSpeed;
    accelSpeed = Math.min(accelSpeed, addSpeed);

    velocity.x += accelSpeed * wishDir.x;
    velocity.z += accelSpeed * wishDir.z;
  };

  const applyFriction = (t) => {
    let copy = velocity.clone();
    copy.y = 0;

    let speedF = copy.length();
    let controlF;
    let dropF = 0;

    if (position.y <= global.PLAYER_HEIGHT) {
      controlF = Math.max(speedF, 10);
      dropF = controlF * 10 * delta * t;
    }

    let newSpeedF = speedF - dropF;
    let playerF = newSpeedF;
    newSpeedF = Math.max(newSpeedF, 0);
    if (speedF > 0) {
      newSpeedF /= speedF;
    }
    velocity.multiplyScalar(newSpeedF);
  };

  const groundMove = () => {
    applyFriction(1);

    let wishDir = new THREE.Vector3(-cmd.forward, 0, -cmd.right);
    wishDir.normalize();
    let wishSpeed = wishDir.length() * ((cmd.crouch || (position.y < global.PLAYER_HEIGHT)) ? 17 : 50);

    accelerate(wishDir, wishSpeed, 10);
    velocity.y = 0;
  };

  groundMove();

  const v1 = new THREE.Vector3(1, 0, 0);
  const v2 = new THREE.Vector3(0, 1, 0);
  const v3 = new THREE.Vector3(0, 0, 1);
  const quat = new THREE.Quaternion().setFromEuler(rotation);

  v1.applyQuaternion(quat);
  v2.applyQuaternion(quat);
  v3.applyQuaternion(quat);

  return (new THREE.Vector3()).add(v1.multiplyScalar(velocity.x))
                              .add(v2.multiplyScalar(velocity.y))
                              .add(v3.multiplyScalar(velocity.z));
};
