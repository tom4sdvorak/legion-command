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

    constructor(scene: Phaser.Scene, unitProps: UnitProps, unitType: string) {
        const initialDirection = (unitProps.faction === 'blue') ? -1 : 1;
        const initialSpeed = Math.abs(unitProps.speed) * initialDirection;

        super(scene, unitProps.x, unitProps.y, unitType);

        // Set properties and add to scene
        this.unitProps = unitProps;
        this.unitType = unitType;
        this.direction = initialDirection;
        this.unitProps.speed = initialSpeed;

        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        if (this.body) {
            (this.body as Phaser.Physics.Arcade.Body).setSize(this.size, this.size);
            (this.body as Phaser.Physics.Arcade.Body).pushable = false;
        }

        this.setOrigin(0.5, 0.5);
        this.setFlipX(this.direction === -1);
    }
    
    public destroy(): void {
        if(this.resumeTimer) this.resumeTimer.remove();
        if(this.attackingTimer) this.attackingTimer.remove();
        super.destroy(); 
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
                this.stopMoving();
            }
        }
        if(target instanceof Unit && target.unitProps.faction !== this.unitProps.faction){
            this.startAttackingTarget(target);
        }
    }

    public handleState(): void {

    }

    isBlocked() {
        const detectionRectWidth = 5;
        const xOffset = (this.size * 0.5 + 1) * this.direction;
        const yOffset = -this.size * 0.5;

        // Use a physics overlap check to find a blocking unit in front
        let overlap = this.scene.physics.overlapRect(this.x + xOffset, this.y + yOffset, detectionRectWidth * this.direction, this.size);
        
        return overlap.length > 0;
    }

    public stopMoving(): void {
        if(this.state === UnitStates.WALKING){
            this.state = UnitStates.IDLE;
            this.setVelocityX(0);
            this.play(`${this.unitType}_idle`);

            this.resumeTimer = this.scene.time.addEvent({
                delay: 50,
                callback: () => {
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
    }

    public moveForward(): void {
        if(this.state === UnitStates.DEAD) return;
        this.state = UnitStates.WALKING;
        this.setVelocityX(this.unitProps.speed);
        this.play(`${this.unitType}_walk`);
    }

    public isAlive(): boolean {
        return this.state !== UnitStates.DEAD;
    }

    public startAttackingTarget(target: Unit): void {
        if (this.state !== UnitStates.ATTACKING) {
            this.state = UnitStates.ATTACKING;
            let timeScale = this.anims.duration / this.unitProps.attackSpeed;
            this.anims.timeScale = timeScale;
            this.play(`${this.unitType}_attack`);

            this.attackingTimer = this.scene.time.addEvent({
                delay: this.unitProps.attackSpeed,
                callback: () => {
                    if(target.isAlive()){
                       target.takeDamage(this.unitProps.attackDamage);
                    }
                    else{
                        this.state = UnitStates.WALKING;
                        this.moveForward(); 
                        this.attackingTimer?.remove();
                        this.attackingTimer = null;
                    }
                },
                callbackScope: this,
                loop: true
            });
        }
    }
}