import { PlayerBase } from "./PlayerBase";

const UnitStates = {
    WAITING: 'waiting',
    IDLE: 'idle',
    WALKING: 'walking',
    ATTACKING: 'attacking',
    DEAD: 'dead'
};
export class Warrior {
    speed: number;
    attackDamage: number;
    health: number;
    sprite: Phaser.Physics.Arcade.Sprite;
    faction: 'red' | 'blue';
    resumeTimer: Phaser.Time.TimerEvent | null = null;
    scene: Phaser.Scene;
    state: string = UnitStates.WAITING;
    attackSpeed: number = 1000;
    attackingTimer: Phaser.Time.TimerEvent | null = null;
    unitID: number;
    size: number = 100;
    direction: number = 1;

    constructor(scene: Phaser.Scene,x: number, y: number, speed: number, attackDamage: number, health: number, faction: 'red' | 'blue', unitID: number) {
        this.scene = scene;
        this.attackDamage = attackDamage;
        this.health = health;
        this.sprite = scene.physics.add.sprite(x, y, `warrior_${faction}`);
        this.unitID = unitID;
        this.faction = faction;
        if(this.faction === 'blue') {    
            this.sprite.flipX = true;
            this.direction = -1;
        }
        this.speed = speed*this.direction;
        this.sprite.setData('parent', this);
        this.sprite.setOrigin(0.5);
        this.sprite.setCollideWorldBounds(true);
        //this.sprite.setBounce(1);
        if (this.sprite.body) {
            this.sprite.body.setSize(this.size, this.size);
            this.sprite.body.pushable = false;
        }        
    }

    public destroy(): void {
        this.sprite.destroy();
        if(this.resumeTimer) this.resumeTimer.remove();
        if(this.attackingTimer) this.attackingTimer.remove();
    }

    public takeDamage(damage: number): void {
        this.health -= damage;
        console.log(`Took ${damage} damage, remaining health is ${this.health}`);
        if(this.health <= 0){
            this.state = UnitStates.DEAD;
        }
    }

    public handleCollision(target: Warrior):void {  
        //Do nothing if we collided with friendly unit behind us, otherwise stop walking
        console.log(`${this.unitID} collided with ${target.unitID}`);
        if(target instanceof Warrior && target.faction === this.faction){
            if(this.unitID < target.unitID){
                return;
            }
            else{
                this.stopMoving();
            }
        }

        // On collision with enemy, attack.
        if(target instanceof Warrior && target.faction !== this.faction){
            this.startAttackingTarget(target);
        }
    }

    public handleState(): void {

    }


    isBlocked() {
        // Check for an object right in front of the unit
        let overlap = this.scene.physics.overlapRect((this.sprite.x + this.size*0.5 + 1)*this.direction, this.sprite.y, 5, this.sprite.height);
        console.log(overlap);
        if(overlap.length > 0 && overlap[0].gameObject.getData('parent') instanceof PlayerBase){
            if(overlap[0].gameObject.getData('parent').faction === this.faction){
                return overlap.length-1 > 0;
            }
        }
        return overlap.length > 0;
    }

    public stopMoving(): void {
        if(this.state === UnitStates.WALKING){
            this.state = UnitStates.IDLE;
            this.sprite.setVelocityX(0);
            this.sprite.play(`warrior_${this.faction}_idle`);

            //Add timer to check every 50ms if unit is blocked and move if not
            this.resumeTimer = this.scene.time.addEvent({
            delay: 50,
            callback: () => {
                if(!this.isBlocked()){
                    this.resumeTimer?.remove();
                    this.resumeTimer = null;
                    this.moveForward();
                    console.log(this.unitID + "Resuming movement");
                }
                else{
                    console.log(this.unitID + "Blocked");
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
        this.sprite.setVelocityX(this.speed);
        this.sprite.play(`warrior_${this.faction}_walk`);
    }

    public isAlive(): boolean {
        if(this.state === UnitStates.DEAD) return false;
        return true;
    }

    public startAttackingTarget(target: Warrior): void {
        if (this.state !== UnitStates.ATTACKING) {
            this.sprite.play(`warrior_${this.faction}_attack`);
            this.state = UnitStates.ATTACKING;
            this.attackingTimer = this.scene.time.addEvent({
                delay: this.attackSpeed,
                callback: () => {
                    if(target.isAlive()){
                       target.takeDamage(this.attackDamage);
                    }
                    else{
                        this.state = UnitStates.WALKING;
                        this.moveForward(); 
                        this.attackingTimer?.remove();
                        this.attackingTimer = null;
                        console.log(this.unitID + "Stopped attacking");
                    }
                },
                callbackScope: this,
                loop: true
            });
        }
    }
}
