import { PlayerBase } from "../PlayerBase";
import { Unit } from "../units/Unit";
import { Projectile } from "./Projectile";

export class Fireball extends Projectile {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, "fireball");
    }

    spawn(unitGroup: Phaser.Physics.Arcade.Group, projectilePool: Phaser.Physics.Arcade.Group) {
        super.spawn(unitGroup, projectilePool);
        this.play(`fireball_move`, true);
    }

    onHit(target: Unit | PlayerBase): void {
        this.play(`fireball_explode`, true);
        super.onHit(target);
        this.scene.time.delayedCall(1000, () => {
            this.despawn();
        }, undefined, this);     
    }
}