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
        super.attackTarget();
        if(this.specialReady) this.doSpecial();
        
    }

    public doSpecial(): void {
        if(this.meleeTarget.target instanceof Unit && this.meleeTarget.target.isAlive() && this.meleeTarget.id === this.meleeTarget.target.unitProps.unitID){
            this.meleeTarget.target.applyDebuff('petrify');
            this.specialCooldown = 0;
            this.specialReady = false;                
        }
    }
}