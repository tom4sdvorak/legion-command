import { RangedUnit } from "./RangedUnit";

export class Archer extends RangedUnit {
    constructor(scene: Phaser.Scene) {
        super(scene, "archer");
    }
}