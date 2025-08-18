import { UnitProps } from "../helpers/UnitProps";
import { UnitStates } from "../helpers/UnitStates";


export class Unit extends Phaser.Physics.Arcade.Sprite {
    unitProps: UnitProps;
    resumeTimer: Phaser.Time.TimerEvent | null = null;
    state: string = UnitStates.WAITING;
    attackingTimer: Phaser.Time.TimerEvent | null = null;
    direction: number = 1;
    unitType: string;
    size: number = 100;
    unitGroup: Phaser.Physics.Arcade.Group;
    unitPool: Phaser.Physics.Arcade.Group;

    constructor(scene: Phaser.Scene, unitType: string) {
        super(scene, 0, 0, unitType);
        this.unitType = unitType; 
        // Add to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setOrigin(0.5, 0.5); 
        if (this.body) {
            (this.body as Phaser.Physics.Arcade.Body).setSize(this.size, this.size);
            (this.body as Phaser.Physics.Arcade.Body).pushable = false;
        }        
    }

    // Reinitializes the unit like a constructor would
    spawn(unitProps: UnitProps, unitGroup: Phaser.Physics.Arcade.Group, unitPool: Phaser.Physics.Arcade.Group): void{
        this.direction = (unitProps.faction === 'blue') ? -1 : 1;
        this.setFlipX(this.direction === -1);
        this.unitProps = unitProps;
        this.unitProps.speed = Math.abs(unitProps.speed) * this.direction;
        this.setActive(true);
        this.setVisible(true);
        this.enableBody(true, this.unitProps.x, this.unitProps.y, true, true);
        this.state = UnitStates.WALKING;
        this.unitGroup = unitGroup;
        this.unitPool = unitPool;
    }
    
    die(): void {
        if(this.resumeTimer) this.resumeTimer.remove();
        this.resumeTimer = null;
        if(this.attackingTimer) this.attackingTimer.remove();
        this.attackingTimer = null;
        this.setVelocityX(0);
        this.unitGroup.remove(this);
        this.unitPool.killAndHide(this);
    }

    update(time: any, delta: number): void {
        super.update(time, delta);
        if(this.unitProps.health <= 0){
            this.state = UnitStates.DEAD;
        }
        this.handleState();
    }

    public takeDamage(damage: number): void {
        this.unitProps.health -= damage;
        console.log(`Took ${damage} damage, remaining health is ${this.unitProps.health}`);
        if(this.unitProps.health <= 0){
            this.state = UnitStates.DEAD;
        }
    }

    public handleCollision(target: Unit):void { 
        if(target instanceof Unit && target.unitProps.faction === this.unitProps.faction){
            if(this.unitProps.unitID < target.unitProps.unitID){
                return;
            }
            else{
                //console.log("Stopped moving ID: " + this.unitProps.unitID);
                this.stopMoving();
            }
        }
        if(target instanceof Unit && target.unitProps.faction !== this.unitProps.faction && this.unitProps.type === 'melee'){
            this.startAttackingTarget(target);
        }
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
            case UnitStates.DEAD:
                this.die();
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
            if (object.gameObject instanceof Unit) {
                //console.log(`Blocked by ${object}`);
                return true;
            }
            //console.log("Not blocked by", object);
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

    public startAttackingTarget(target: Unit): void {
        if (this.state !== UnitStates.ATTACKING) {
            this.state = UnitStates.ATTACKING;
            let timeScale = this.anims.duration / this.unitProps.attackSpeed;
            this.anims.timeScale = timeScale;

            this.attackingTimer = this.scene.time.addEvent({
                delay: this.unitProps.attackSpeed,
                callback: () => {
                    if (!this.active) {
                        return;
                    }
                    if(target.active && target.isAlive()){
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

    public stopAttacking(): void {
        if (this.attackingTimer) {
            this.attackingTimer.remove();
            this.attackingTimer = null;
        }
        this.state = UnitStates.WALKING;
        this.moveForward();
    }
}