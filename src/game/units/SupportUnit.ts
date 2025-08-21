import { UnitProps } from "../helpers/UnitProps";
import { UnitStates } from "../helpers/UnitStates";
import { PlayerBase } from "./PlayerBase";
import { Unit } from "./Unit";

export class SupportUnit extends Unit {

    proximityZone: Phaser.GameObjects.Zone;
    public alliesInRange: Unit[] = [];

    constructor(scene: Phaser.Scene, texture: string) {
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