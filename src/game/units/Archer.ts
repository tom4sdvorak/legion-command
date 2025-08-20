import { UnitProps } from "../helpers/UnitProps";
import { UnitStates } from "../helpers/UnitStates";
import { Unit } from "./Unit";
import { Projectile } from "../projectiles/Projectile";
import { PlayerBase } from "./PlayerBase";
import { ObjectPool } from "../helpers/ObjectPool";
import { Arrow } from "../projectiles/Arrow";

export class Archer extends Unit {

    proximityZone: Phaser.GameObjects.Zone;
    range: number = 200;
    public enemiesInRange: Unit[] = [];
    baseInRange: PlayerBase | null = null;
    projectiles: Phaser.Physics.Arcade.Group | null = null;
    projectilePool: Phaser.Physics.Arcade.Group;

    constructor(scene: Phaser.Scene) {
        super(scene, "archer");

        // Create proximity zone for finding enemies
        this.proximityZone = this.scene.add.zone(0, 0, this.range, this.size);
        this.proximityZone.setOrigin(0, 0.5);
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
        //console.log("Emptied list ", this.enemiesInRange.length);
        
        // Reinitialize proximity zone
        const zoneXOffset = (this.direction === -1) ? this.x-this.range : this.x;
        this.proximityZone.setPosition(zoneXOffset, this.y);
        this.proximityZone.setActive(true);
        this.proximityZone.setVisible(true);
        (this.proximityZone.body as Phaser.Physics.Arcade.Body).enable = true;
        //console.log("Spawned unit");  
    }

    die() {
        // Deactivate proximity zone
        //this.proximityZone.destroy();
        this.proximityZone.setActive(false);
        this.proximityZone.setVisible(false);
        (this.proximityZone.body as Phaser.Physics.Arcade.Body).enable = false;

        //console.log("Zone disabled");
        this.projectiles = null;
        super.die();
    }

    update(time: any, delta: number) {
        super.update(time, delta);
        if (!this.active) {
            return;
        }
        
        //console.log("Run update");
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

        // Start attacking if enemy base is in range
        if(this.baseInRange !== null && this.state !== UnitStates.ATTACKING){
            this.startShooting();
        }

        // Start attacking if there are enemies in range
        if(this.enemiesInRange.length > 0 && this.state !== UnitStates.ATTACKING){
            //console.log("Found targets: ", this.enemiesInRange.length);
            this.startShooting();
        }

        // Stop attacking if there are no enemies in range
        if(this.enemiesInRange.length === 0 && this.baseInRange === null && this.state === UnitStates.ATTACKING){
            this.stopAttacking();
        }        
    }

    public checkForEnemies(): void {
        
        if (!this.enemyGroup || !this.unitGroup) return;
        this.enemiesInRange = [];
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

    public startShooting(): void {
        if (this.state !== UnitStates.ATTACKING) {
            this.state = UnitStates.ATTACKING;
            this.anims.timeScale = this.anims.duration / this.unitProps.attackSpeed;        
            this.attackingTimer = this.scene.time.addEvent({
                    delay: this.unitProps.attackSpeed,
                    callback: () => {
                        while (true) {
                            if (!this.active) {
                                return;
                            }
                            if(this.enemiesInRange.length === 0 && this.baseInRange === null){  // No targets stop attacking
                                console.log("No targets to attack");
                                this.stopAttacking();
                                break;
                            }
                            else if (this.baseInRange !== null) { // Attack base in range ignoring any targets
                                console.log("Attacking base");
                                this.fireProjectile(this.baseInRange);
                                break;
                            }
                            else if (this.enemiesInRange[0].isAlive()) { // First target is alive fire on it
                                console.log("Attacking target");
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
    


    private fireProjectile(target: Unit | PlayerBase): void {
        //console.log(this.projectiles, this.projectilePool, this.unitGroup);
        if(!this.projectiles || !this.projectilePool || !this.unitGroup) return;
        const projectile = this.projectilePool.get(this.x, this.y) as Arrow;
        //console.group("Projectile: ", projectile);
        if (!projectile) return;
        if(projectile instanceof Projectile){
            projectile.damage = this.unitProps.attackDamage;
            projectile.spawn(this.projectiles, this.projectilePool);
        }        
        console.log("Projectile: ", projectile);
        // Calculate projectile angle and launch it
        const projectileAngle = Phaser.Math.Angle.Between(this.x, this.y, target.x, this.y);
        projectile.rotation = projectileAngle;
        projectile.enableBody(true, this.x, this.y, true, true);
        this.scene.physics.moveTo(projectile, target.x, this.y, 300);
        console.log("Projectile: ", projectile);
        console.groupEnd();
    }

}