import { Game } from "../scenes/Game";
import { MeleeUnit } from "./MeleeUnit";

export class Minotaur extends MeleeUnit {
    constructor(scene: Game) {
        super(scene, "minotaur");
    }

    public attackTarget(): void {
        if(this.unitProps.specialEnabled){
            super.attackTarget(true);
        }
        else{
            super.attackTarget(false);
        }
    }
}