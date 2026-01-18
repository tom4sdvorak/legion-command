import { Game } from "../scenes/Game";
import { Unit } from "./Unit";

export class MeleeUnit extends Unit { 
    
    constructor(scene: Game, texture: string) {
        super(scene, texture);
    }
}

