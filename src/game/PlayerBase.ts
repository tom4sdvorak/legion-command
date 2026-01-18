import { Unit } from "./units/Unit";
import { Projectile } from "./projectiles/Projectile";
import eventsCenter from "./EventsCenter";
import { Game } from "./scenes/Game";
import { HealthComponent } from "./components/HealthComponent";

export class PlayerBase extends Phaser.Physics.Arcade.Sprite{
    faction: 'red' | 'blue';
    yOffset: number; // How high from groundLevel to spawn
    proximityZone: Phaser.GameObjects.Zone;
    enemiesInRange: Unit[] = [];
    damage: number = 0;
    isShooting: boolean = false;
    attackSpeed: number = 1000;
    shootingTimer: Phaser.Time.TimerEvent | null = null;
    projectiles: Phaser.Physics.Arcade.Group;
    enemyUnitsPhysics: Phaser.Physics.Arcade.Group;
    range: number = 400;
    projectilePool: Phaser.Physics.Arcade.Group | null = null;
    scene: Game;
    physicsBody: Phaser.Physics.Arcade.Body;
    sizeW: number = 150;
    sizeH: number = 300;
    healthComponent : HealthComponent;
    shootingSprite: Phaser.GameObjects.Sprite;
    watchtowerEnabled: boolean = false;
    spawnPosition: Phaser.Math.Vector2;
    watchTowerProjectileSpawnPoint: Phaser.Math.Vector2;

    constructor(scene: Game, faction: 'red' | 'blue', maxHealth: number, spawnPosition: Phaser.Math.Vector2, enemyUnitsPhysics: Phaser.Physics.Arcade.Group, projectiles: Phaser.Physics.Arcade.Group) {
        super(scene, spawnPosition.x, spawnPosition.y, 'single_pixel');
        this.spawnPosition = spawnPosition;
        const offsetX = (faction === 'blue') ? spawnPosition.x-this.sizeW-48 : spawnPosition.x+48;
        this.setPosition(offsetX, spawnPosition.y-this.sizeH/2);
        this.setOrigin(0, 1);
        this.enemyUnitsPhysics = enemyUnitsPhysics;
        this.faction = faction;
        this.scene = scene;
        this.projectiles = projectiles;
        scene.physics.add.existing(this, true);
        this.setPushable(false);
        this.setImmovable(true);
        this.setBodySize(this.sizeW, this.sizeH, true);
        this.body?.setOffset(0,-this.sizeH/2);

        // Add healthbar
        this.healthComponent = new HealthComponent(this, maxHealth, false, this.sizeW, 20, spawnPosition.y-this.sizeH/2);
        this.on('death', this.die, this);       
    }

    update(time: any, delta: number): void {
        if (!this.active) {
            return;
        }
        super.update(time, delta);
        this.healthComponent.update();
        
        if(this.watchtowerEnabled){
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
    }

    die(): void {
        this.shootingTimer?.remove();
        this.shootingTimer = null;
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
            }
        }, undefined, this);
    }

    public enableWatchtower(dmg: number, range: number, projectilePool: Phaser.Physics.Arcade.Group): void {
        this.projectilePool = projectilePool;
        this.damage = dmg;
        this.range = range;
        this.watchTowerProjectileSpawnPoint = new Phaser.Math.Vector2(60, this.spawnPosition.y-165-60);

        
        this.scene.add.sprite(10, this.spawnPosition.y-15, 'tower').setOrigin(0,1).setScale(0.8).setDepth(2);
        this.shootingSprite = this.scene.add.sprite(0, this.spawnPosition.y-185, 'archer').setDepth(2).setAngle(10).setOrigin(0,1);
        this.scene.add.sprite(10, this.spawnPosition.y-15, 'tower_frontlayer').setOrigin(0,1).setScale(0.8).setDepth(2);
        this.shootingSprite.play(`${this.shootingSprite.texture.key}_idle`);

        // Create proximity zone around base to detect units
        const zoneOffsetX = (this.faction === 'blue') ? this.x-this.range : this.x+this.sizeW;
        this.proximityZone = this.scene.add.zone(zoneOffsetX, this.y+this.sizeH/2, this.range, this.sizeH);
        this.proximityZone.setOrigin(0, 1);
        this.scene.physics.add.existing(this.proximityZone, true);
        (this.proximityZone.body as Phaser.Physics.Arcade.Body).pushable = false;
        (this.proximityZone.body as Phaser.Physics.Arcade.Body).allowGravity = false;

        this.watchtowerEnabled = true;
    }

    public buildWalls(): void {
        this.scene.add.tileSprite(0, this.spawnPosition.y-16, 32*8, 0, 'poles').setOrigin(0,1).setDepth(1);
    }

    public setMaxHealth(maxHealth: number): void {
        this.healthComponent.setHealth(maxHealth);
    }

    public takeDamage(damage: number): void {
        this.healthComponent.takeDamage(damage);
        eventsCenter.emit('base-take-damage', this.faction);
    }

    public getCurrentHealth(): number {
        return this.healthComponent.getHealth();
    }

    public getMaxHealth(): number {
        return this.healthComponent.getMaxHealth();
    }

    public getPosition(): number[] {
        return [this.x, this.y];
    }

    public startShooting(): void {
        this.isShooting = true;
        this.shootingSprite.play(`${this.shootingSprite.texture.key}_shoot`, true);
        this.shootingSprite.anims.timeScale = (this.shootingSprite.anims?.currentAnim?.duration ?? 1) / this.attackSpeed;
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
        const projectile = this.projectilePool.get(this.watchTowerProjectileSpawnPoint.x, this.watchTowerProjectileSpawnPoint.y);
        if (!projectile) return;
        if(projectile instanceof Projectile){
            projectile.damage = this.damage;
            projectile.spawn(this.projectiles, this.projectilePool);
        }
        // Calculate projectile angle and launch it
        const projectileAngle = Phaser.Math.Angle.Between(this.watchTowerProjectileSpawnPoint.x, this.watchTowerProjectileSpawnPoint.y, target.x, target.y-target.height/2);
        projectile.rotation = projectileAngle;
        projectile.enableBody(true, this.watchTowerProjectileSpawnPoint.x, this.watchTowerProjectileSpawnPoint.y, true, true);
        this.scene.physics.moveTo(projectile, target.x, target.y-target.body!.height/2, 300);
    }
    
    public isBlocked(): boolean {
        //Check if there are units 100px off screen
        let overlap;
        if(this.faction === 'red'){
            overlap = this.scene.physics.overlapRect(-100, 0, 100, this.scene.getWorldSize().y, true, false);
        }
        else{
            overlap = this.scene.physics.overlapRect(this.scene.getWorldSize().x, 0, 100, this.scene.getWorldSize().y, true, false);
        }
        
        return overlap.some(object => {
            if (object.gameObject instanceof Unit && object.gameObject.active) {
                return true;
            }
            return false;
        });
    }

    public stopShooting(): void {
            if (this.shootingTimer) {
                this.shootingTimer.remove();
                this.shootingTimer = null;
            }
            this.isShooting = false;
            this.shootingSprite.play(`${this.shootingSprite.texture.key}_idle`, true);
            this.shootingSprite.anims.timeScale = 1;
    }
}