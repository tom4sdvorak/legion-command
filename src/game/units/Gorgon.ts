import { UnitStates } from "../helpers/UnitStates";
import { Game } from "../scenes/Game";
import { MeleeUnit } from "./MeleeUnit";
import { Unit } from "./Unit";

export class Gorgon extends MeleeUnit {
    constructor(scene: Game) {
        super(scene, "gorgon");
    }

    /* Apply petrify instead of regular attack if off cooldown */
    public attackTarget(): void {
        if (!this.active || this.state === UnitStates.DEAD || this.state === UnitStates.WAITING) {
            return;
        }
        
        // Check if cooldown is over
        if(this.unitProps.specialEnabled && this.specialCooldown >= this.unitProps.specialCooldown){
            // If our current target is Unit, apply petrify to it
            if(this.meleeTarget instanceof Unit && this.meleeTarget.active && this.meleeTarget.isAlive()){
                this.meleeTarget.applyDebuff('petrify');
                this.specialCooldown = 0;
            }
        }
        else{
            super.attackTarget();
        }
    }
}