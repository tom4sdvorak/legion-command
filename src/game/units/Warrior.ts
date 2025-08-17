import { UnitProps } from "../helpers/UnitProps";
import { Unit } from "./Unit";

export class Warrior extends Unit {
    constructor(scene: Phaser.Scene, unitProps: UnitProps) {
        super(scene, unitProps, "warrior");
    }
}