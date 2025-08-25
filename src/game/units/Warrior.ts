import { Game } from "../scenes/Game";
import { MeleeUnit } from "./MeleeUnit";

export class Warrior extends MeleeUnit {
    constructor(scene: Game) {
        super(scene, "warrior");
    }
}