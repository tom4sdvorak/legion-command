import { Game } from "../scenes/Game";
import { RangedUnit } from "./RangedUnit";

export class FireWorm extends RangedUnit {
    constructor(scene: Game) {
        super(scene, "fireWorm");
    }
}