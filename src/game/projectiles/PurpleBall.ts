import { PlayerBase } from "../PlayerBase";
import { Unit } from "../units/Unit";
import { Projectile } from "./Projectile";

export class PurpleBall extends Projectile {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, "purpleBall");
    }

    spawn(unitGroup: Phaser.Physics.Arcade.Group, projectilePool: Phaser.Physics.Arcade.Group) {
        super.spawn(unitGroup, projectilePool);
        this.play(`purpleBall_move`, true);
    }

    onHit(target: Unit | PlayerBase): void {
        this.play(`purpleBall_explode`, true);
        super.onHit(target);
        this.scene.time.delayedCall(1000, () => {
            this.despawn();
        }, undefined, this);     
    }
}