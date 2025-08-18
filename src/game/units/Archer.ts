import { UnitProps } from "../helpers/UnitProps";
import { UnitStates } from "../helpers/UnitStates";
import { Unit } from "./Unit";
import { Projectile } from "../projectiles/Projectile";

export class Archer extends Unit {

    proximityZone: Phaser.GameObjects.Zone;
    //zoneBody: Phaser.Physics.Arcade.Body;
    range: number = 200;
    
    public readonly projectiles: Phaser.GameObjects.Group; 
    public enemiesInRange: Unit[] = [];


    constructor(scene: Phaser.Scene, projectiles: Phaser.Physics.Arcade.Group) {
        super(scene, "archer");
        this.projectiles = projectiles;
        // Create proximtiy zone that checks for targets in front of archer
        
        this.proximityZone = this.scene.add.zone(0, 0, this.range, this.size);
        this.proximityZone.setOrigin(0, 0.5);
        /*this.scene.physics.add.existing(this.proximityZone);
        this.zoneBody = this.proximityZone.body as Phaser.Physics.Arcade.Body;*/
    }

    spawn(unitProps: UnitProps, unitGroup: Phaser.Physics.Arcade.Group, unitPool: Phaser.Physics.Arcade.Group):void{
        super.spawn(unitProps, unitGroup, unitPool);
        this.enemiesInRange = [];

        //Reinitialize proximity zone
        this.proximityZone.setActive(true);
        this.proximityZone.setVisible(true);
        const zoneXOffset = (this.direction === -1) ? this.x-this.range : this.x;
        this.proximityZone.x = zoneXOffset;
        this.proximityZone.y = this.y;
        
    }

    die() {
        // Deactivate proximity zone
        this.proximityZone.setActive(false);
        this.proximityZone.setVisible(false);
        super.die();
    }

    update(time: any, delta: number) {
        super.update(time, delta);
        
        // Move proximity zone in front of the unit
        const zoneXOffset = (this.direction === -1) ? this.x-this.range : this.x;
        this.proximityZone.setPosition(zoneXOffset, this.y);

        this.checkForEnemies();

        // Clear dead enemies from range list
        for (let i = this.enemiesInRange.length - 1; i >= 0; i--) {
            if (!this.enemiesInRange[i].isAlive()) {
                this.enemiesInRange.splice(i, 1);
            }
        }

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

        // Start attacking if there are enemies in range
        if(this.enemiesInRange.length > 0 && this.state !== UnitStates.ATTACKING){
            this.startShooting();
        }

        // Stop attacking if there are no enemies in range
        if(this.enemiesInRange.length === 0 && this.state === UnitStates.ATTACKING){
            this.stopAttacking();
        }        
    }

    public checkForEnemies(): void {
        this.scene.physics.overlap(this.proximityZone, this.scene.enemies, (object1, object2) => {
            if (object2 instanceof Unit && !this.enemiesInRange.includes(object2)) {
                this.enemiesInRange.push(object2);
            }
        });
    }

    public startShooting(): void {
        if (this.state !== UnitStates.ATTACKING) {
            this.state = UnitStates.ATTACKING;
            this.anims.timeScale = this.anims.duration / this.unitProps.attackSpeed;
            this.play(`${this.unitType}_attack`);
        
            this.attackingTimer = this.scene.time.addEvent({
                    delay: this.unitProps.attackSpeed,
                    callback: () => {
                        while (true) {
                            if(this.enemiesInRange.length === 0){  // No targets stop attacking
                                this.stopAttacking();
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
    }
    


    private fireProjectile(target: Unit): void {
        const projectile = this.projectiles.get(this.x, this.y) as Projectile; 
        if (!projectile) return;

        projectile.damage = this.unitProps.attackDamage;

        // Calculate projectile angle and launch it
        const projectileAngle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
        projectile.rotation = projectileAngle;
        projectile.enableBody(true, this.x, this.y, true, true);
        this.scene.physics.moveTo(projectile, target.x, target.y, 300);
    }

}