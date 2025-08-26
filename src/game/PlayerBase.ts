import { Unit } from "./units/Unit";
import { Projectile } from "./projectiles/Projectile";
import { Scene } from "phaser";
import { ObjectPool } from "./helpers/ObjectPool";
import { Arrow } from "./projectiles/Arrow";
import eventsCenter from "./EventsCenter";

export class PlayerBase extends Phaser.Physics.Arcade.Sprite{
    health: number = 5000;
    maxHealth: number = 5000;
    faction: 'red' | 'blue';
    yOffset: number; // How high from groundLevel to spawn
    proximityZone: Phaser.GameObjects.Zone;
    enemiesInRange: Unit[] = [];
    attackDamage: number = 70;
    isShooting: boolean = false;
    attackSpeed: number = 1000;
    shootingTimer: Phaser.Time.TimerEvent | null = null;
    projectiles: Phaser.Physics.Arcade.Group;
    enemyUnitsPhysics: Phaser.Physics.Arcade.Group;
    range: number = 400;
    healthBar: Phaser.GameObjects.Rectangle;
    projectilePool: Phaser.Physics.Arcade.Group | null = null;
    scene: Scene;
    physicsBody: Phaser.Physics.Arcade.Body;
    sizeW: number = 150;
    sizeH: number = 300;

    constructor(scene: Scene, faction: 'red' | 'blue', spawnPosition: Phaser.Math.Vector2, enemyUnitsPhysics: Phaser.Physics.Arcade.Group, projectiles: Phaser.Physics.Arcade.Group, projectilePool: Phaser.Physics.Arcade.Group) {
        super(scene, spawnPosition.x, spawnPosition.y, 'single_pixel');
        const offsetX = (faction === 'blue') ? spawnPosition.x-this.sizeW : spawnPosition.x+100;
        this.setPosition(offsetX, spawnPosition.y-this.sizeH/2);
        this.setOrigin(0, 1);
        this.enemyUnitsPhysics = enemyUnitsPhysics;
        this.faction = faction;
        this.scene = scene;
        this.projectiles = projectiles;
        this.projectilePool = projectilePool;
        scene.physics.add.existing(this, true);
        this.setPushable(false);
        this.setImmovable(true);
        this.setBodySize(this.sizeW, this.sizeH, true);
        this.body?.setOffset(0,-this.sizeH/2);
        
        // Create proximity zone around base to detect units
        
        const zoneOffsetX = (faction === 'blue') ? this.x-this.range : this.x+this.sizeW;
        this.proximityZone = this.scene.add.zone(zoneOffsetX, this.y+this.sizeH/2, this.range, this.sizeH);
        this.proximityZone.setOrigin(0, 1);
        this.scene.physics.add.existing(this.proximityZone, true);
        (this.proximityZone.body as Phaser.Physics.Arcade.Body).pushable = false;
        (this.proximityZone.body as Phaser.Physics.Arcade.Body).allowGravity = false;

        // Add healthbar
        this.healthBar = this.scene.add.rectangle(this.x, this.y-this.height/2, this.width, 20, 0x00ff00).setDepth(1).setAlpha(1);       
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
        eventsCenter.emit('base-destroyed', this.faction);
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
        // Calculate projectile angle and launch it
        const projectileAngle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
        projectile.rotation = projectileAngle;
        projectile.enableBody(true, this.x, this.y, true, true);
        this.scene.physics.moveTo(projectile, target.x, target.y, 300);
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