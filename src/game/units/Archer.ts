import { Game } from "../scenes/Game";
import { RangedUnit } from "./RangedUnit";

export class Archer extends RangedUnit {
    constructor(scene: Game) {
        super(scene, "archer");
    }
}