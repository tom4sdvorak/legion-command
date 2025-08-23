import { UnitProps } from "../helpers/UnitProps";
import { UnitStates } from "../helpers/UnitStates";
import { PlayerBase } from "../PlayerBase";
import { Game } from "../scenes/Game";
import { Unit } from "./Unit";

export class SupportUnit extends Unit {

    proximityZone: Phaser.GameObjects.Zone;
    public alliesInRange: Unit[] = [];
    supportTimer: Phaser.Time.TimerEvent | null = null;
    meleeTarget: Unit | PlayerBase | null = null;

    constructor(scene: Game, texture: string) {
        super(scene, texture);

        // Create proximity zone for finding allies
        this.proximityZone = this.scene.add.zone(0, 0, 0, 0);
        this.proximityZone.setOrigin(0.5, 0.5);
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
        this.proximityZone.setSize(this.unitProps.specialRange*2,this.size);
        (this.proximityZone.body as Phaser.Physics.Arcade.Body).setSize(this.unitProps.specialRange*2, this.size);
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
        this.unitGroup = null;
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

    /* Support unit state handling
        WALKING: Plays a walking animation and checks if there are allies in range. If there are, it transitions to SUPPORTING state.
        SUPPORTING: Plays a supporting animation and checks if there are no allies in range. If there aren't, it transitions back to WALKING state.
        ATTACKING: Stops supporting, starts attacking a target, and plays an attack animation. If the target is invalid or inactive, it transitions back to WALKING state.
    */
    handleState(): void {
        switch (this.state) {
            case UnitStates.WALKING:
                this.play(`${this.unitType}_walk`, true);
                if (this.alliesInRange.length > 0) {
                    this.state = UnitStates.SUPPORTING;
                    this.startSupporting();
                }
                break;
            case UnitStates.SUPPORTING:
                this.play(`${this.unitType}_support`, true);
                if (this.alliesInRange.length === 0) {
                    this.state = UnitStates.WALKING;
                    this.stopSupporting();
                }
                break;
            case UnitStates.ATTACKING:
                this.stopSupporting();
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