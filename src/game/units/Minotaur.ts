import { Game } from "../scenes/Game";
import { MeleeUnit } from "./MeleeUnit";

export class Minotaur extends MeleeUnit {
    constructor(scene: Game) {
        super(scene, "minotaur");
    }
}