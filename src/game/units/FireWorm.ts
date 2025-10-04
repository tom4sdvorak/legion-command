import { Game } from "../scenes/Game";
import { RangedUnit } from "./RangedUnit";
import { Unit } from "./Unit";

export class FireWorm extends RangedUnit {
    constructor(scene: Game) {
        super(scene, "fireWorm");
    }

    public startAttackingTarget(): void {
        if (!this.meleeTarget) return;

        // Do special suicide attack that burns enemy target if meeting melee target
        if(this.meleeTarget instanceof Unit){
            this.takeDamage(9999999999);
            this.meleeTarget.applyDebuff('burn');
            this.meleeTarget.takeDamage(this.unitProps.damage*5);
        }        
    }
}