import { UnitProps } from "../helpers/UnitProps";
import { UnitStates } from "../helpers/UnitStates";
import { Unit } from "./Unit";
import { Projectile } from "../projectiles/Projectile";

export class Archer extends Unit {

    proximityZone: Phaser.GameObjects.Zone;
    zoneBody: Phaser.Physics.Arcade.Body;
    range: number = 1000;
    
    public projectiles: Phaser.GameObjects.Group; 
    private isShooting: boolean = false;
    public shootingTimer: Phaser.Time.TimerEvent | null = null;
    public enemiesInRange: Unit[] = [];


    constructor(scene: Phaser.Scene, unitProps: UnitProps) {
        super(scene, unitProps, "archer");
        
        // Create proximtiy zone that checks for targets in front of archer
        const zoneXOffset = (this.direction === -1) ? this.x - this.range : this.x;
        this.proximityZone = this.scene.add.zone(zoneXOffset, this.y, this.range, this.height);
        
        this.scene.physics.add.existing(this.proximityZone);
        this.zoneBody = this.proximityZone.body as Phaser.Physics.Arcade.Body;
        this.zoneBody.setAllowGravity(false);
    }
    
    /*public override startAttackingTarget(target: Unit): void {
        // Only start attacking if we are not already in the ATTACKING state
        if (this.state !== UnitStates.ATTACKING) {
            this.state = UnitStates.ATTACKING;
            this.anims.timeScale = this.anims.duration / this.unitProps.attackSpeed;
            this.play(`${this.unitType}_attack`);

            this.attackingTimer = this.scene.time.addEvent({
                delay: this.unitProps.attackSpeed,
                callback: () => {
                    // This is the core attack logic
                    if (target.isAlive()) {
                        this.fireProjectile(target);
                    } else {
                        // Stop attacking if the target is dead
                        this.stopAttacking();
                    }
                },
                callbackScope: this,
                loop: true
            });
        }
    }

    private fireProjectile(target: Unit): void {
        // Use the projectile group from a shared source (e.g., the main scene)
        const projectile = this.projectiles.get(this.x, this.y) as Projectile; 
        if (!projectile) return;

        projectile.damage = this.unitProps.attackDamage;
        projectile.owner = this;

        // Calculate projectile angle and launch it
        const projectileAngle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
        projectile.rotation = projectileAngle;
        projectile.enableBody(true, this.x, this.y, true, true);
        this.scene.physics.moveTo(projectile, target.x, target.y, 300);
    }

    private stopAttacking(): void {
        if (this.attackingTimer) {
            this.attackingTimer.remove();
            this.attackingTimer = null;
        }
        this.state = UnitStates.WALKING;
        this.moveForward();
    }*/
}