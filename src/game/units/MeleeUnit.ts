import { UnitStates } from "../helpers/UnitStates";
import { PlayerBase } from "../PlayerBase";
import { Game } from "../scenes/Game";
import { Unit } from "./Unit";

export class MeleeUnit extends Unit {
    meleeTarget: Unit | PlayerBase | null = null;    
    
    constructor(scene: Game, texture: string) {
        super(scene, texture);
        this.setScale(0.8);
    }

    /*  Melee unit state handling
        ATTACKING: Plays an attack animation. If there aren't targets, it transitions back to WALKING state.
    */
    handleState(): void {
        switch (this.state) {
            case UnitStates.ATTACKING:
                this.startAttackingTarget();
                this.play(`${this.unitType}_attack`, true);
                let timeScale = (this.anims?.currentAnim?.duration ?? 1) / this.unitProps.attackSpeed
                this.anims.timeScale = timeScale;
                if(!this.meleeTarget || !this.meleeTarget.active){
                    this.state = UnitStates.WALKING;
                    this.stopAttacking();
                }
                break;
            default:
                super.handleState();
                break;
        }
    }
}

