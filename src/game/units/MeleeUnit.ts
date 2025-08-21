import { UnitStates } from "../helpers/UnitStates";
import { PlayerBase } from "./PlayerBase";
import { Unit } from "./Unit";

export class MeleeUnit extends Unit {
    constructor(scene: Phaser.Scene, texture: string) {
        super(scene, texture);
    }

    public handleCollision(target: Unit | PlayerBase) : void { 
        
        // On colision with enemy unit or base, melee unit should start attacking
        if(target instanceof Unit && target.unitProps.faction !== this.unitProps.faction){
            this.startAttackingTarget(target);
        }
        else if(target instanceof PlayerBase && target.faction !== this.unitProps.faction){
            this.startAttackingTarget(target);
        }
        else{
            super.handleCollision(target);
        }
    }

    public startAttackingTarget(target: Unit | PlayerBase): void {
            if (this.state !== UnitStates.ATTACKING) {
                this.state = UnitStates.ATTACKING;
                let timeScale = this.anims.duration / this.unitProps.attackSpeed;
                this.anims.timeScale = timeScale;
                if(target instanceof Unit){
                    let targetID = target.unitProps.unitID;
                    this.attackingTimer = this.scene.time.addEvent({
                        delay: this.unitProps.attackSpeed,
                        callback: () => {
                            if (!this.active) {
                                return;
                            }
                            if(target.unitProps.unitID === targetID && target.active && target.isAlive()){
                            target.takeDamage(this.unitProps.attackDamage);
                            }
                            else{
                                this.stopAttacking();
                            }
                        },
                        callbackScope: this,
                        loop: true
                    });
                }
                else if(target instanceof PlayerBase){
                    this.attackingTimer = this.scene.time.addEvent({
                        delay: this.unitProps.attackSpeed,
                        callback: () => {
                            if (!this.active) {
                                return;
                            }
                            if (target.active){
                                target.takeDamage(this.unitProps.attackDamage);
                            }
                            else{
                                this.stopAttacking();
                            }                        
                        },
                        callbackScope: this,
                        loop: true
                    });
                }
                
            }
    }
}

