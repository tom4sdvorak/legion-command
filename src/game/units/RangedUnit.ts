import { UnitProps } from "../helpers/UnitProps";
import { UnitStates } from "../helpers/UnitStates";
import { Unit } from "./Unit";
import { Projectile } from "../projectiles/Projectile";
import { PlayerBase } from "../PlayerBase";
import { Game } from "../scenes/Game";

export class RangedUnit extends Unit {

    proximityZone: Phaser.GameObjects.Zone;
    public enemiesInRange: Unit[] = [];
    baseInRange: PlayerBase | null = null;
    projectiles: Phaser.Physics.Arcade.Group | null = null;
    projectilePool: Phaser.Physics.Arcade.Group | null = null;
    protected enemyGroup: Phaser.Physics.Arcade.Group | null = null;
    protected baseGroup: Phaser.GameObjects.Group | null = null;

    constructor(scene: Game, texture: string) {
        super(scene, texture);

        // Create proximity zone for finding enemies
        this.proximityZone = this.scene.add.zone(0, 0, 0, 0);
        this.proximityZone.setOrigin(0, 1);
        this.scene.physics.add.existing(this.proximityZone);
        (this.proximityZone.body as Phaser.Physics.Arcade.Body).pushable = false;
        (this.proximityZone.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    }

    spawn(unitProps: UnitProps, unitGroup: Phaser.Physics.Arcade.Group, unitPool: Phaser.Physics.Arcade.Group, enemyGroup: Phaser.Physics.Arcade.Group, baseGroup: Phaser.GameObjects.Group, projectiles: Phaser.Physics.Arcade.Group, projectilePool: Phaser.Physics.Arcade.Group):void{
        super.spawn(unitProps, unitGroup, unitPool, enemyGroup, baseGroup, projectiles, projectilePool);
        this.enemiesInRange = [];
        this.baseInRange = null;
        this.projectiles = projectiles;
        this.projectilePool = projectilePool;
        this.enemyGroup = enemyGroup;
        this.baseGroup = baseGroup;
        
        // Reinitialize proximity zone
        const zoneXOffset = (this.direction === -1) ? this.x-this.unitProps.attackRange-this.width/2 : this.x+this.width/2;
        this.proximityZone.setPosition(zoneXOffset, 0);
        this.proximityZone.setSize(this.unitProps.attackRange, this.unitProps.bodyHeight);
        (this.proximityZone.body as Phaser.Physics.Arcade.Body).setSize(this.unitProps.attackRange, this.unitProps.bodyHeight);
        this.proximityZone.setActive(true);
        this.proximityZone.setVisible(true);
        (this.proximityZone.body as Phaser.Physics.Arcade.Body).enable = true;
        (this.proximityZone.body as Phaser.Physics.Arcade.Body).reset(zoneXOffset, 0);
    }

    die() {
        // Deactivate proximity zone
        this.proximityZone.setActive(false);
        this.proximityZone.setVisible(false);
        (this.proximityZone.body as Phaser.Physics.Arcade.Body).enable = false;
        (this.proximityZone.body as Phaser.Physics.Arcade.Body).reset(0, 0);
        
        // Null all temporary information
        this.projectiles = null;
        this.projectilePool = null;
        this.enemiesInRange = [];
        this.baseInRange = null;
        this.enemyGroup = null;
        this.baseGroup  = null;
        super.die();
    }

    update(time: any, delta: number) {
        super.update(time, delta);
        if (!this.active) {
            return;
        }
        
        // Move proximity zone in front of the unit
        const zoneXOffset = (this.direction === -1) ? this.x-this.unitProps.attackRange : this.x;
        this.proximityZone.setPosition(zoneXOffset, this.y);

        this.checkForEnemies();
        
        // Clear dead enemies from range list
        this.enemiesInRange = this.enemiesInRange.filter(enemy => enemy.isAlive());

        // Sort list of enemies in range by distance
        if(this.unitProps.faction  === 'red'){
            this.enemiesInRange.sort((a, b) => {
                return a.x - b.x;
            }); 
        }
        else{
            this.enemiesInRange.sort((a, b) => {
                return b.x - a.x;
            });
        }

        if(this.state === UnitStates.SHOOTING){
            if(this.actionCooldown >= this.unitProps.actionSpeed){
                this.shootTarget();
                this.actionCooldown -= this.unitProps.actionSpeed;
            }
        }

        //this.handleState();      
    }

    handleState(): void {
        if(this.state === UnitStates.IDLE){
            if (this.baseInRange || this.enemiesInRange.length > 0) {
                this.changeState(UnitStates.SHOOTING);
            }
        }
        else if(this.state === UnitStates.SHOOTING){
            if (!this.baseInRange && this.enemiesInRange.length === 0) {
                this.changeState(UnitStates.IDLE);
            }
        }
        super.handleState();
    }

    public checkForEnemies(): void {
        
        if (!this.enemyGroup || !this.unitGroup) return;
        this.enemiesInRange = [];
        this.baseInRange = null;

        this.scene.physics.overlap(this.proximityZone, this.enemyGroup, (object1, object2) => {
            if (object2 instanceof Unit && object2.active && !this.enemiesInRange.includes(object2)) {
                this.enemiesInRange.push(object2);
            }
        }, undefined, this);
        if (!this.baseGroup) return;
        
        this.scene.physics.overlap(this.proximityZone, this.baseGroup, (object1, object2) => {
            if (object2 instanceof PlayerBase && object2.active && object2.faction !== this.unitProps.faction) {
                this.baseInRange = object2;
            }
        }, undefined, this);
    }

    public shootTarget(): void {
        if (!this.active) {
            return;
        }
        this.anims.timeScale = (this.anims?.currentAnim?.duration ?? 1) / (this.unitProps.actionSpeed + 100);

        if (this.baseInRange instanceof PlayerBase && this.baseInRange.active) {
            this.fireProjectile(this.baseInRange);
        }
        else if (this.enemiesInRange.length > 0 && this.enemiesInRange[0] instanceof Unit && this.enemiesInRange[0].active && this.enemiesInRange[0].isAlive()) { 
            this.fireProjectile(this.enemiesInRange[0]);
        }
        else{
            this.stopShooting();
            return;
        }
        
    }

    /*public startShooting(): void {
        if (this.shootingTimer) return;
        this.shootingTimer = this.scene.time.addEvent({
                delay: this.unitProps.actionSpeed,
                callback: () => {
                    if (!this.active) {
                        this.stopShooting();
                        return;
                    }
                    this.anims.timeScale = (this.anims?.currentAnim?.duration ?? 1) / (this.unitProps.actionSpeed + 100);
                    let target: Unit | PlayerBase | null = null;
                    if (this.baseInRange) { // Attack base in range ignoring any targets
                        target = this.baseInRange;
                    }
                    else if (this.enemiesInRange.length > 0) { // otherwise attack first target
                        target = this.enemiesInRange[0];
                    }

                    if (target) {
                        this.fireProjectile(target);
                    }
                    else{
                        this.stopShooting();
                    }
                },
                callbackScope: this,
                loop: true
        });
        
    }*/
    


    private fireProjectile(target: Unit | PlayerBase): void {
        // Calculate Y position of sprite from which projectile should originate
        let yPos = this.y+this.unitProps.projectileOffsetY*this.unitProps.scale;
        let xPos = this.x+this.unitProps.bodyWidth/2;
        if(!this.projectiles || !this.projectilePool || !this.unitGroup) return;
        const projectile = this.projectilePool.get(xPos, yPos) as Projectile;
        projectile.setFlipX(this.direction === -1);
        if (!projectile) return;
        if(projectile instanceof Projectile){
            projectile.damage = this.unitProps.damage;
            projectile.spawn(this.projectiles, this.projectilePool);
        }        
        // Calculate projectile angle and launch it
        //const projectileAngle = Phaser.Math.Angle.Between(this.x, yPos, target.x, yPos);
        //projectile.rotation = projectileAngle;
        projectile.enableBody(true, xPos, yPos, true, true);
        projectile.setVelocityX(this.unitProps.projectileVelocity * this.direction);
        //projectile.setVelocityY(10);
        //this.scene.physics.moveTo(projectile, target.x, yPos, 300);
    }

    public stopShooting(): void {
        this.actionCooldown = 0;
    }

}