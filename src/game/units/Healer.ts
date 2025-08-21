import { UnitStates } from "../helpers/UnitStates";
import { SupportUnit } from "./SupportUnit";
import { Unit } from "./Unit";

export class Healer extends SupportUnit {
    supportTimer: Phaser.Time.TimerEvent | null = null;

    constructor(scene: Phaser.Scene) {
        super(scene, "healer");
    }

    die(){
        if(this.supportTimer) this.supportTimer.remove();
        this.supportTimer = null;
        super.die();
    }

    update(time: any, delta: number) {
        if (!this.active) {
            return;
        }
        super.update(time, delta);

        // Clear dead and full health allies from range list
        this.alliesInRange = this.alliesInRange.filter(ally => 
            ally.isAlive() && ally.healthComponent.getHealth() < ally.healthComponent.getMaxHealth()
        );

        this.handleState();
    }

    handleState(): void {
        switch (this.state) {
            case UnitStates.WALKING:
                this.moveForward();
                if (this.alliesInRange.length > 0) {
                    this.state = UnitStates.SUPPORTING;
                    this.startSupporting();
                }
                break;
            case UnitStates.SUPPORTING:
                if (this.alliesInRange.length === 0) {
                    this.state = UnitStates.WALKING;
                    this.stopSupporting();
                }
                break;
            default:
                super.handleState();
                break;
        }
    }
    
    public startSupporting(): void {
        this.anims.timeScale = this.anims.duration / this.unitProps.specialSpeed;        
        this.supportTimer = this.scene.time.addEvent({
            delay: this.unitProps.specialSpeed,
            callback: () => {
                if (!this.active) {
                    this.stopSupporting();
                    return;
                }
                if(this.alliesInRange.length > 0 && this.alliesInRange[0].isAlive()){  // Support first target if its alive
                    this.support(this.alliesInRange[0]);
                }
                else{
                    this.stopSupporting();  
                }
            },
            callbackScope: this,
            loop: true
        });
    }
    support(target: Unit) {
        target.heal(this.unitProps.specialDamage);
    }

    stopSupporting() {
        if (this.supportTimer) {
            this.supportTimer.remove();
            this.supportTimer = null;
        }
    }
}