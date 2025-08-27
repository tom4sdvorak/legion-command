import { UnitProps } from "../helpers/UnitProps";
import { UnitStates } from "../helpers/UnitStates";
import { PlayerBase } from "../PlayerBase";
import { Game } from "../scenes/Game";
import { Unit } from "./Unit";

export class SupportUnit extends Unit {

    proximityZone: Phaser.GameObjects.Zone;
    public alliesInRange: Unit[] = [];
    supportTimer: Phaser.Time.TimerEvent | null = null;

    constructor(scene: Game, texture: string) {
        super(scene, texture);

        // Create proximity zone for finding allies
        this.proximityZone = this.scene.add.zone(0, 0, 0, 0);
        this.proximityZone.setOrigin(0.5, 1);
        this.scene.physics.add.existing(this.proximityZone);
        (this.proximityZone.body as Phaser.Physics.Arcade.Body).pushable = false;
        (this.proximityZone.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    }

    spawn(unitProps: UnitProps, unitGroup: Phaser.Physics.Arcade.Group, unitPool: Phaser.Physics.Arcade.Group, enemyGroup: Phaser.Physics.Arcade.Group, baseGroup: Phaser.GameObjects.Group, projectiles: Phaser.Physics.Arcade.Group, projectilePool: Phaser.Physics.Arcade.Group):void{
        super.spawn(unitProps, unitGroup, unitPool, enemyGroup, baseGroup, projectiles, projectilePool);
        this.alliesInRange = [];
        this.meleeTarget = null;
        
        // Reinitialize proximity zone
        this.proximityZone.setPosition(this.x, this.y);
        this.proximityZone.setSize(this.unitProps.specialRange*2,this.height);
        (this.proximityZone.body as Phaser.Physics.Arcade.Body).setSize(this.unitProps.specialRange*2, this.height);
        this.proximityZone.setActive(true);
        this.proximityZone.setVisible(true);
        (this.proximityZone.body as Phaser.Physics.Arcade.Body).enable = true;
        (this.proximityZone.body as Phaser.Physics.Arcade.Body).reset(this.x, this.y);

    }

    die() {        
        // Deactivate proximity zone
        this.proximityZone.setActive(false);
        this.proximityZone.setVisible(false);
        (this.proximityZone.body as Phaser.Physics.Arcade.Body).enable = false;
        (this.proximityZone.body as Phaser.Physics.Arcade.Body).reset(0, 0);
        
        // Null all temporary information
        if(this.supportTimer) this.supportTimer.remove();
        this.supportTimer = null;
        this.meleeTarget = null;
        this.alliesInRange = [];
        super.die();
    }

    update(time: any, delta: number) {
        super.update(time, delta);
        if (!this.active) {
            return;
        }
        
        // Move proximity zone with unit
        this.proximityZone.setPosition(this.x, this.y);

        this.checkForAllies();

        // Sort list of allies in range by distance to this unit
        this.alliesInRange.sort((a, b) => {
            return Math.abs(a.x - this.x) - Math.abs(b.x - this.x);
        });
    }

    handleState(): void {
        if(this.state === UnitStates.WALKING || this.state === UnitStates.IDLE){
            if (this.alliesInRange.length > 0) {
                this.changeState(UnitStates.SUPPORTING);
            }
        }
        else if(this.state === UnitStates.SUPPORTING){
            if (this.alliesInRange.length === 0) {
                this.changeState(UnitStates.IDLE);
            }
        }
        super.handleState();
    }

    startSupporting() {
    }

    stopSupporting() {
        if (this.supportTimer) {
            this.supportTimer.remove();
            this.supportTimer = null;
        }
    }

    public checkForAllies(): void {
        
        if (!this.unitGroup) return;
        this.alliesInRange = [];
        this.scene.physics.overlap(this.proximityZone, this.unitGroup, (object1, object2) => {
            if (object2 instanceof Unit && object2.active && !this.alliesInRange.includes(object2)) {
                this.alliesInRange.push(object2);
            }
        }, undefined, this);

    }

}