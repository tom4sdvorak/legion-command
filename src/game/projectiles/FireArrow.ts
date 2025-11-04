import { PlayerBase } from "../PlayerBase";
import { Unit } from "../units/Unit";
import { Projectile } from "./Projectile";

export class FireArrow extends Projectile {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, "fireArrow");
    }
}