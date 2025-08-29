import { PlayerBase } from "../PlayerBase";
import { Unit } from "../units/Unit";

export class Projectile extends Phaser.Physics.Arcade.Sprite {
    damage: number = 0;
    projectilePool: Phaser.Physics.Arcade.Group | null = null;
    unitGroup: Phaser.Physics.Arcade.Group | null = null

    constructor(scene: Phaser.Scene, x: number, y: number, type: string) {
        super(scene, x, y, type);
    }

    spawn(unitGroup: Phaser.Physics.Arcade.Group, projectilePool: Phaser.Physics.Arcade.Group) {
        this.unitGroup = unitGroup;
        this.projectilePool = projectilePool;
        this.unitGroup.add(this);
    }

    onHit(target: Unit | PlayerBase): void {
        this.setVelocity(0, 0);
        if(this.unitGroup) this.unitGroup.remove(this);
        target.takeDamage(this.damage);

        this.scene.time.delayedCall(1000, () => {
            (this.body as Phaser.Physics.Arcade.Body).reset(0, 0);
            if(this.projectilePool) this.projectilePool.killAndHide(this);
            this.unitGroup = null;
            this.projectilePool = null;
        }, undefined, this);
    }
}