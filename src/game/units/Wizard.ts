import { Game } from "../scenes/Game";
import { SupportUnit } from "./SupportUnit";
import { Unit } from "./Unit";

export class Wizard extends SupportUnit {
    

    constructor(scene: Game) {
        super(scene, "wizard");
    }

    update(time: any, delta: number) {
        if (!this.active) {
            return;
        }
        super.update(time, delta);

        // Clear dead allies from range list
        this.alliesInRange = this.alliesInRange.filter(ally => ally.isAlive());

        this.handleState();
    }
    
    
    support(target: Unit) {
        target.applyBuff('speed', this.unitProps.unitID);
        if (!this.buffedAllies.includes(target)) {
            this.buffedAllies.push(target);
        }
    }

    unsupport(target: Unit) {
        target.removeBuff('speed', this.unitProps.unitID);
    }

}