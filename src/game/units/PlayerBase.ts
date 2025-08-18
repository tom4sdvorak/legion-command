import { Unit } from "./Unit";
import { Projectile } from "../projectiles/Projectile";
import { Scene } from "phaser";

export class PlayerBase extends Phaser.Physics.Arcade.Sprite {
    health: number;
    faction: 'red' | 'blue';
    yOffset: number; // How high from groundLevel to spawn
    proximityZone: Phaser.GameObjects.Shape;
    enemiesInRange: Unit[] = [];
    attackDamage: number = 50;
    isShooting: boolean = false;
    attackSpeed: number = 1000;
    shootingTimer: Phaser.Time.TimerEvent | null = null;
    projectiles: Phaser.Physics.Arcade.Group;

    constructor(scene: Scene, faction: 'red' | 'blue', spawnPosition: Phaser.Math.Vector2, unitsPhysics: Phaser.Physics.Arcade.Group, projectiles: Phaser.Physics.Arcade.Group) {
        
        const texture = faction === 'red' ? 'tower_red' : 'tower_blue';
        const yOffset = -80;
        super(scene, spawnPosition.x, spawnPosition.y + yOffset, texture);
        this.scene = scene;
        this.health = 1000;
        this.faction = faction;
        this.yOffset = yOffset;
        this.projectiles = projectiles;
        scene.add.existing(this);
        scene.physics.add.existing(this, true);
        this.setData('parent', this);
        
        // Create circle around base to detect units
        this.proximityZone = scene.add.circle(this.x, this.y, 200, 0xffffff, 0.5);
        scene.physics.add.existing(this.proximityZone, true); 

        // Check for overlap with units
        scene.physics.add.overlap(this.proximityZone, unitsPhysics, (zone, unit) => {
            if (unit instanceof Unit) {
                if (!this.enemiesInRange.includes(unit)) {
                    this.enemiesInRange.push(unit);
                    if (!this.isShooting) this.startShooting();
                }
            }
        }, undefined, this);

        // Configure the physics body
        this.setImmovable(true);
        this.setPushable(false);
    }

    public takeDamage(damage: number): void {
        this.health -= damage;
        if (this.health < 0) this.health = 0;
    }

    public getPosition(): number[] {
        return [this.x, this.y];
    }

    public startShooting(): void {
        console.log("Start shooting");
        this.isShooting = true;
        this.shootingTimer = this.scene.time.addEvent({
            delay: this.attackSpeed,
            callback: this.shoot,
            callbackScope: this,
            loop: true
        });
    }

    public shoot(): void {
        if (this.enemiesInRange.length > 0) {
            const projectile = this.projectiles.get(this.x, this.y) as Projectile; // Get first projectile from our pool
            if (projectile) {
                projectile.damage = this.attackDamage;
                //console.log(this.enemiesInRange[0]);
                let projectileAngle = Phaser.Math.Angle.Between(this.x, this.y, this.enemiesInRange[0].x, this.enemiesInRange[0].y);
                projectile.rotation = projectileAngle;
                projectile.enableBody(true, this.x, this.y, true, true); // Reset it and set it to active and visible
                this.scene.physics.moveTo(projectile, this.enemiesInRange[0].x, this.enemiesInRange[0].y, 100); // Release projectiles at the position of nearest target
                
                if (!this.enemiesInRange[0].isAlive()) {
                    this.enemiesInRange.shift();
                }
            }
        } else {
            this.isShooting = false;
            this.shootingTimer?.remove();
            this.shootingTimer = null;
            console.log("Stopped shooting");
        }
    }
    
    public isBlocked(): boolean {
        let overlap = this.scene.physics.overlapRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height, true, false);
        return overlap.length > 0;
    }
}