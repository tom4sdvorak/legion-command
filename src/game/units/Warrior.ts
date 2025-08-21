import { MeleeUnit } from "./MeleeUnit";

export class Warrior extends MeleeUnit {
    constructor(scene: Phaser.Scene) {
        super(scene, "warrior");
    }
}