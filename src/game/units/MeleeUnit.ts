import { UnitStates } from "../helpers/UnitStates";
import { PlayerBase } from "./PlayerBase";
import { Unit } from "./Unit";

export class MeleeUnit extends Unit {
    meleeTarget: Unit | PlayerBase | null = null;    
    
    constructor(scene: Phaser.Scene, texture: string) {
        super(scene, texture);
    }

    /*  Melee unit state handling
        ATTACKING: Plays an attack animation. If there aren't targets, it transitions back to WALKING state.
    */
    handleState(): void {
        switch (this.state) {
            case UnitStates.ATTACKING:
                this.startAttackingTarget();
                this.play(`${this.unitType}_attack`, true);
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

    public handleCollision(target: Unit | PlayerBase) : void { 
        // On colision with enemy unit or base, unit should start attacking
        
        if(target instanceof Unit && target.unitProps.faction !== this.unitProps.faction){
            this.state = UnitStates.ATTACKING;
            this.meleeTarget = target;
        }
        else if(target instanceof PlayerBase && target.faction !== this.unitProps.faction){
            this.state = UnitStates.ATTACKING;
            this.meleeTarget = target;
        }
        else{
            super.handleCollision(target);
        }
    }

    public startAttackingTarget(): void {
        if (this.attackingTimer) return;
        if (!this.meleeTarget) return;
        
        let timeScale = this.anims.duration / this.unitProps.attackSpeed;
        this.anims.timeScale = timeScale;
        let targetID = null;
        if(this.meleeTarget instanceof Unit){
            targetID = this.meleeTarget.unitProps.unitID;
        }
        this.attackingTimer = this.scene.time.addEvent({
            delay: this.unitProps.attackSpeed,
            callback: () => {
                if (!this.active) {
                    return;
                }
                if(this.meleeTarget instanceof Unit && this.meleeTarget.unitProps.unitID === targetID && this.meleeTarget.active && this.meleeTarget.isAlive()){
                    this.meleeTarget.takeDamage(this.unitProps.attackDamage);
                }
                else if(this.meleeTarget instanceof PlayerBase && this.meleeTarget.active){
                    this.meleeTarget.takeDamage(this.unitProps.attackDamage);
                }
                else{
                    this.stopAttacking();
                    return;
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    public stopAttacking(): void {
        if (this.attackingTimer) {
            this.attackingTimer.remove();
            this.attackingTimer = null;
        }
        this.meleeTarget = null;
        this.state = UnitStates.WALKING;        
    }
}

