import { Game } from "../scenes/Game";
import { MeleeUnit } from "./MeleeUnit";
import { Unit } from "./Unit";

export class Gorgon extends MeleeUnit {
    constructor(scene: Game) {
        super(scene, "gorgon");
    }

    /* Apply petrify before resuming normal melee attack routine*/
    public startAttackingTarget(): void {
            if (this.attackingTimer) return;
            if (!this.meleeTarget) return;
            if(this.meleeTarget instanceof Unit){
                this.meleeTarget.applyDebuff('petrify');
            }
            super.startAttackingTarget();            
        }
}