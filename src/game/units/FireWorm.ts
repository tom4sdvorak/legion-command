import { UnitStates } from "../helpers/UnitStates";
import { Game } from "../scenes/Game";
import { RangedUnit } from "./RangedUnit";
import { Unit } from "./Unit";

export class FireWorm extends RangedUnit {
    constructor(scene: Game) {
        super(scene, "fireWorm");
    }

    /* Do special suicide attack that burns enemy target if meeting melee target */
    public attackTarget(): void {
        if (!this.active || this.state === UnitStates.DEAD || this.state === UnitStates.WAITING) {
            return;
        }
        
        // If suicide attack is enabled
        if(this.unitProps.specialEnabled){
            // If our current target is Unit, do special
            if(this.meleeTarget instanceof Unit && this.meleeTarget.active && this.meleeTarget.isAlive()){
                this.doSpecial(this.meleeTarget);
            }
            else{
                super.attackTarget();
            }
        }
        else{
            super.attackTarget();
        }
    }

    public doSpecial(target: Unit): void {
        this.play(`${this.unitType}_death_special`, true);
        target?.applyDebuff('burn');
        target?.takeDamage(this.unitProps.damage);
        super.onKilled(true);
    }
}