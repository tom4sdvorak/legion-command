import { UnitProps } from "../helpers/UnitProps";
import { UnitStates } from "../helpers/UnitStates";
import { PlayerBase } from "../PlayerBase";
import { HealthComponent } from "../components/HealthComponent";
import { Game } from "../scenes/Game";


export class Unit extends Phaser.Physics.Arcade.Sprite {
    unitProps: UnitProps;
    resumeTimer: Phaser.Time.TimerEvent | null = null;
    state: string = UnitStates.WAITING;
    attackingTimer: Phaser.Time.TimerEvent | null = null;
    direction: number = 1;
    unitType: string;
    size: number = 64;
    unitGroup: Phaser.Physics.Arcade.Group | null = null;
    unitPool: Phaser.Physics.Arcade.Group | null = null;
    healthComponent: HealthComponent;
    declare scene: Game;

    constructor(scene: Game, unitType: string) {
        super(scene, 0, 0, unitType);
        this.unitType = unitType;
        this.setOrigin(0.5, 1);
        
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
        this.unitGroup = unitGroup;
        this.unitPool = unitPool;
   
        

        // Reinitialize the sprite's body
        this.setScale(unitProps.scale);
        this.setActive(true);
        this.setVisible(true);
        // Calculate spawn position of unit based on desired position, moved by offset (how many empty pixels are under feet of the sprite) timed by scale of the unit (which scales the empty pixels too)
        let newPositionY = unitProps.y + unitProps.offsetY*unitProps.scale;
        this.setPosition(unitProps.x, newPositionY);
        this.unitGroup.add(this);

        //this.setDisplaySize(this.sizeW, this.sizeH);
        //this.setBodySize(this.size, this.size, true);

        (this.body as Phaser.Physics.Arcade.Body).enable = true;
        (this.body as Phaser.Physics.Arcade.Body).reset(unitProps.x, newPositionY);
        (this.body as Phaser.Physics.Arcade.Body).pushable = false;
        //this.setBodySize(this.size, this.size);

        
        this.state = UnitStates.WALKING;
    }
    

    die(): void {
        this.state = UnitStates.DEAD;
        if(this.unitProps.faction === 'red') this.scene.rewardPlayer('blue', this.unitProps.cost);
        else this.scene.rewardPlayer('red', this.unitProps.cost);

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
    }

    update(time: any, delta: number): void {
        if (!this.active) {
            return;
        }
        super.update(time, delta);
        this.healthComponent.update();
        // Keep unit moving when not blocked
        if (this.state !== UnitStates.DEAD) {
            if (!this.isBlocked()) {
                this.moveForward();
            }
        }
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

                // If unit was in walking state, change to idle
                if(this.state === UnitStates.WALKING){
                    this.state = UnitStates.IDLE;
                }
            }
        }
    }

    /* General unit state handling
        IDLE, it plays an idle animation and transitions to WALKING if it's not blocked.
        WALKING, it plays a walking animation.
        DEAD, it does nothing.
        If the state is unknown, it throws an error.
    */ 
    public handleState(): void {
        switch (this.state) {
            case UnitStates.IDLE:
                this.play(`${this.unitType}_idle`, true);
                if (!this.isBlocked()) {
                    this.state = UnitStates.WALKING;
                }
                break;
            case UnitStates.WALKING:
                // Check if the 'run' animation exists before playing
                this.play(`${this.unitType}_run`, true);
                break;
            case UnitStates.DEAD:
                break;
            default:
                throw Error(`Unknown unit state: ${this.state}`);
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
                return true;
            }
            return false;
        });
    }

    public stopMoving(): void {
        this.setVelocityX(0);
    }

    public heal(amount: number): void {
        this.healthComponent.heal(amount);
    }

    public moveForward(): void {
        this.setVelocityX(this.unitProps.speed);
    }

    public isAlive(): boolean {
        return this.healthComponent.isAlive();
    }
}