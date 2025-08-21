import { UnitProps } from "../helpers/UnitProps";
import { UnitStates } from "../helpers/UnitStates";
import { PlayerBase } from "./PlayerBase";
import { HealthComponent } from "../components/HealthComponent";
import { devConfig } from "../helpers/devConfig";


export class Unit extends Phaser.Physics.Arcade.Sprite {
    unitProps: UnitProps;
    resumeTimer: Phaser.Time.TimerEvent | null = null;
    state: string = UnitStates.WAITING;
    attackingTimer: Phaser.Time.TimerEvent | null = null;
    direction: number = 1;
    unitType: string;
    size: number = 100;
    unitGroup: Phaser.Physics.Arcade.Group | null = null;
    unitPool: Phaser.Physics.Arcade.Group | null = null;
    protected enemyGroup: Phaser.Physics.Arcade.Group | null = null;
    baseGroup: Phaser.GameObjects.Group | null = null;
    healthComponent: HealthComponent;

    constructor(scene: Phaser.Scene, unitType: string) {
        super(scene, 0, 0, unitType);
        this.unitType = unitType;
        this.setOrigin(0.5, 0.5);
        
        this.healthComponent = new HealthComponent(this, this.size/2, 5, this.size/3, 100); // parent, width, height, yOffset, maxHealth

        // Listen to call of unit's death
        this.on('death', this.die, this);
    }

    // Reinitializes the unit like a constructor would
    spawn(unitProps: UnitProps, unitGroup: Phaser.Physics.Arcade.Group, unitPool: Phaser.Physics.Arcade.Group, enemyGroup: Phaser.Physics.Arcade.Group, baseGroup: Phaser.GameObjects.Group, projectiles: Phaser.Physics.Arcade.Group, projectilePool: Phaser.Physics.Arcade.Group): void{
        this.direction = (unitProps.faction === 'blue') ? -1 : 1;
        this.setFlipX(this.direction === -1);
        this.unitProps = unitProps;
        this.unitProps.speed = Math.abs(unitProps.speed) * this.direction;
        this.healthComponent.spawn(unitProps.health);

        // Reinitialize the sprite's body
        this.setActive(true);
        this.setVisible(true);
        this.setPosition(unitProps.x, unitProps.y);
        (this.body as Phaser.Physics.Arcade.Body).enable = true;
        (this.body as Phaser.Physics.Arcade.Body).reset(unitProps.x, unitProps.y);
        (this.body as Phaser.Physics.Arcade.Body).setSize(this.size, this.size);
        (this.body as Phaser.Physics.Arcade.Body).pushable = false;

        this.state = UnitStates.WALKING;
        this.unitGroup = unitGroup;
        this.unitPool = unitPool;
        this.enemyGroup = enemyGroup;
        this.unitGroup.add(this);
        this.baseGroup = baseGroup;
    }
    
    die(): void {
        this.state = UnitStates.DEAD;
        if(this.resumeTimer) this.resumeTimer.remove();
        this.resumeTimer = null;
        if(this.attackingTimer) this.attackingTimer.remove();
        this.attackingTimer = null;
        (this.body as Phaser.Physics.Arcade.Body).reset(0, 0);
        if(this.unitGroup) this.unitGroup.remove(this);
        if(this.unitPool) this.unitPool.killAndHide(this);
        this.healthComponent.deactivate();

        // Null the group references
        this.unitGroup = null;
        this.unitPool = null;
        this.enemyGroup = null;
    }

    update(time: any, delta: number): void {
        if (!this.active) {
            return;
        }
        super.update(time, delta);
        this.healthComponent.update();
        this.handleState();
    }

    public takeDamage(damage: number): void {
        this.healthComponent.takeDamage(damage);
    }

    public handleCollision(target: Unit | PlayerBase) : void { 
        // On collision with friendly unit stop if its the one behind
        if(target instanceof Unit && target.unitProps.faction === this.unitProps.faction){
            if(this.unitProps.unitID > target.unitProps.unitID){
                this.stopMoving();
            }
        }
        /*// On colision with enemy unit, melee unit should start attacking
        if(target instanceof Unit && target.unitProps.faction !== this.unitProps.faction && this.unitProps.type === 'melee'){
            this.startAttackingTarget(target);
        }
        // On collision with enemy base, melee unit should start attacking
        if(target instanceof PlayerBase && target.faction !== this.unitProps.faction && this.unitProps.type === 'melee'){
            this.startAttackingTarget(target);
        }*/
    }

    public handleState(): void {
        switch (this.state) {
            case UnitStates.IDLE:
                this.play(`${this.unitType}_idle`, true);
                break;
            case UnitStates.WALKING:
                this.play(`${this.unitType}_walk`, true);
                break;
            case UnitStates.ATTACKING:
                this.play(`${this.unitType}_attack`, true);
                break;
            default:
                break;
        }
    }

    isBlocked(): boolean {
        const detectionRectWidth = 5;
        const xOffset = (this.size * 0.5 + 1) * this.direction;
        const yOffset = -this.size * 0.5;

        // Use a physics overlap check to find a blocking unit in front
        let overlap = this.scene.physics.overlapRect(this.x + xOffset, this.y + yOffset, detectionRectWidth * this.direction, this.size);
        return overlap.some(object => {
            if (object.gameObject instanceof Unit && object.gameObject.active) {
                if(devConfig.consoleLog) console.log(`Blocked by ${object.gameObject.unitProps.unitID}`);
                return true;
            }
            return false;
        });
    }

    public stopMoving(): void {
        if(this.state === UnitStates.WALKING) this.state = UnitStates.IDLE;
        this.setVelocityX(0);
        this.resumeTimer = this.scene.time.addEvent({
            delay: 50,
            callback: () => {
                if (!this.active) {
                    return;
                }
                if(!this.isBlocked()){
                    this.resumeTimer?.remove();
                    this.resumeTimer = null;
                    this.moveForward();
                }
            },
            callbackScope: this,
            loop: true
        });
    } 
    

    public moveForward(): void {
        if(this.state === UnitStates.DEAD) return;
        if(this.state === UnitStates.IDLE) this.state = UnitStates.WALKING;
        this.setVelocityX(this.unitProps.speed);
    }

    public isAlive(): boolean {
        return this.state !== UnitStates.DEAD;
    }

    /*public startAttackingTarget(target: Unit | PlayerBase): void {
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
                console.log("Found player base ", target);
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
    }*/

    public stopAttacking(): void {
        if (this.attackingTimer) {
            this.attackingTimer.remove();
            this.attackingTimer = null;
        }
        this.state = UnitStates.WALKING;
        this.moveForward();
    }
}