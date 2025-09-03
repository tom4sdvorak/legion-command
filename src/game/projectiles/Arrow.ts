import { PlayerBase } from "../PlayerBase";
import { Unit } from "../units/Unit";
import { Projectile } from "./Projectile";

export class Arrow extends Projectile {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, "arrow");
    }

    onHit(target: Unit | PlayerBase): void {
        super.onHit(target);
        this.despawn();
    }
}