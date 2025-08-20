import { Unit } from "./Unit";
import { Projectile } from "../projectiles/Projectile";
import { Scene } from "phaser";
import { ObjectPool } from "../helpers/ObjectPool";
import { Arrow } from "../projectiles/Arrow";

export class PlayerBase extends Phaser.Physics.Arcade.Sprite {
    health: number = 500;
    maxHealth: number = 500;
    faction: 'red' | 'blue';
    yOffset: number; // How high from groundLevel to spawn
    proximityZone: Phaser.GameObjects.Zone;
    enemiesInRange: Unit[] = [];
    attackDamage: number = 49;
    isShooting: boolean = false;
    attackSpeed: number = 1000;
    shootingTimer: Phaser.Time.TimerEvent | null = null;
    projectiles: Phaser.Physics.Arcade.Group;
    enemyUnitsPhysics: Phaser.Physics.Arcade.Group;
    range: number = 200;
    healthBar: Phaser.GameObjects.Rectangle;
    projectilePool: Phaser.Physics.Arcade.Group | null = null;

    constructor(scene: Scene, faction: 'red' | 'blue', spawnPosition: Phaser.Math.Vector2, enemyUnitsPhysics: Phaser.Physics.Arcade.Group, projectiles: Phaser.Physics.Arcade.Group, projectilePool: Phaser.Physics.Arcade.Group) {
        
        const texture = faction === 'red' ? 'tower_red' : 'tower_blue';
        const yOffset = -80;
        super(scene, spawnPosition.x, spawnPosition.y + yOffset, texture);
        this.enemyUnitsPhysics = enemyUnitsPhysics;
        this.faction = faction;
        this.yOffset = yOffset;
        this.projectiles = projectiles;
        this.projectilePool = projectilePool;
        scene.add.existing(this);
        scene.physics.add.existing(this, true);
        (this.body as Phaser.Physics.Arcade.Body).setSize(this.width+10, this.height);
        
        // Create proximity zone around base to detect units
        const zoneXOffset = (this.faction === 'blue') ? this.x-this.range : this.x;
        this.proximityZone = this.scene.add.zone(zoneXOffset, this.y, this.range, this.height);
        this.proximityZone.setOrigin(0, 0.5);
        this.scene.physics.add.existing(this.proximityZone, true);
        (this.proximityZone.body as Phaser.Physics.Arcade.Body).pushable = false;
        (this.proximityZone.body as Phaser.Physics.Arcade.Body).allowGravity = false;

        // Add healthbar
        this.healthBar = this.scene.add.rectangle(this.x, this.y-this.height/2, this.width, 20, 0x00ff00).setDepth(1).setAlpha(1);

        /*this.proximityZone = scene.add.circle(this.x, this.y, 200, 0xffffff, 0.5);
        scene.physics.add.existing(this.proximityZone, true); */

        // Check for overlap with units
        /*scene.physics.add.overlap(this.proximityZone, this.enemyUnitsPhysics, (zone, unit) => {
            if (unit instanceof Unit && unit.active) {
                if (!this.enemiesInRange.includes(unit)) {
                    this.enemiesInRange.push(unit);
                    if (!this.isShooting) this.startShooting();
                }
            }
        }, undefined, this);*/

        // Configure the physics body
        this.setImmovable(true);
        this.setPushable(false);
    }

    update(time: any, delta: number): void {
        if (!this.active) {
            return;
        }
        super.update(time, delta);
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
        this.updateHealthBar();
        this.checkForEnemies();

        // Clear dead enemies from range list
        for (let i = this.enemiesInRange.length - 1; i >= 0; i--) {
            if (!this.enemiesInRange[i].isAlive()) {
                this.enemiesInRange.splice(i, 1);
            }
        }

        // Sort list of enemies in range by distance
        if(this.faction  === 'red'){
            this.enemiesInRange.sort((a, b) => {
                return a.x - b.x;
            }); 
        }
        else{
            this.enemiesInRange.sort((a, b) => {
                return b.x - a.x;
            });
        }

        // Start attacking if there are enemies in range
        if(this.enemiesInRange.length > 0 && this.isShooting === false){
            this.startShooting();
        }

        // Stop attacking if there are no enemies in range
        if(this.enemiesInRange.length === 0 && this.isShooting === true){
            this.stopShooting();
        }

    }

    die(): void {
        this.shootingTimer?.remove();
        this.shootingTimer = null;
        this.updateHealthBar();
        this.active = false;
        this.isShooting = false;
    }

    public checkForEnemies(): void {
        if(!this.enemyUnitsPhysics) return;
        this.enemiesInRange = [];
        this.scene.physics.overlap(this.proximityZone, this.enemyUnitsPhysics, (object1, object2) => {
            if (object2 instanceof Unit && !this.enemiesInRange.includes(object2)) {
                this.enemiesInRange.push(object2);
                //console.log("Enemy in range: " + object2.unitProps.unitID);
            }
        }, undefined, this);
    }

    public takeDamage(damage: number): void {
        this.health -= damage
        console.log(`Base took ${damage} damage, remaining health is ${this.health}`);
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    public updateHealthBar():void {
        //console.log("Updating health bar to x: ", this.x);
        if (this.healthBar) {
            this.healthBar.x = this.x;
            this.healthBar.width = this.width * (this.health / this.maxHealth);
            if (this.healthBar.width > (this.width * 0.66)) {
                this.healthBar.setFillStyle(0x00ff00);
            }
            else if (this.healthBar.width > (this.width * 0.33)) {
                this.healthBar.setFillStyle(0xffa500);
            }
            else {
                this.healthBar.setFillStyle(0xff0000);
            }
        }
    }

    public getPosition(): number[] {
        return [this.x, this.y];
    }

    public startShooting(): void {
        console.log("Start shooting");
        this.isShooting = true;
        this.shootingTimer = this.scene.time.addEvent({
            delay: this.attackSpeed,
            callback: () => {
                        while (true) {
                            if (!this.active) {
                                return;
                            }
                            if(this.enemiesInRange.length === 0){  // No targets stop attacking
                                this.stopShooting();
                                break;
                            }
                            else if (this.enemiesInRange[0].isAlive()) { // First target is alive fire on it
                                this.fireProjectile(this.enemiesInRange[0]);
                                break;
                            }
                            else { // First target is dead, remove it and run from beginning of loop
                                this.enemiesInRange.shift();
                                continue;
                            }
                        }    
                    },
            callbackScope: this,
            loop: true
        });
    }

    private fireProjectile(target: Unit): void {
        
        if(!this.projectiles || !this.projectilePool) return;
        const projectile = this.projectilePool.get(this.x, this.y);
        if (!projectile) return;
        if(projectile instanceof Projectile){
            projectile.damage = this.attackDamage;
            projectile.spawn(this.projectiles, this.projectilePool);
        }
        else{
            console.log("Test: ", this.projectiles, projectile);
        }
        // Calculate projectile angle and launch it
        const projectileAngle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
        projectile.rotation = projectileAngle;
        //this.projectiles.add(projectile);
        projectile.enableBody(true, this.x, this.y, true, true);
        this.scene.physics.moveTo(projectile, target.x, target.y, 300);
        console.log("Shot projectile: ", projectile);
    }
    
    public isBlocked(): boolean {
        let overlap = this.scene.physics.overlapRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, true, false);
        //if (overlap.length > 0) console.log(overlap);
        return overlap.some(object => {
            if (object.gameObject instanceof Unit && object.gameObject.active) {
                //console.log(`Blocked by ${object.gameObject.unitProps.unitID}`);
                return true;
            }
            //console.log("Not blocked by", object);
            return false;
        });
    }

    public stopShooting(): void {
            if (this.shootingTimer) {
                this.shootingTimer.remove();
                this.shootingTimer = null;
            }
            this.isShooting = false;
    }
}