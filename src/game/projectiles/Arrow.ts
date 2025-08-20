import { Projectile } from "./Projectile";

export class Arrow extends Projectile {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, "arrow");
    }
}