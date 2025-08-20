import { UnitProps } from "../helpers/UnitProps";
import { UnitStates } from "../helpers/UnitStates";
import { PlayerBase } from "./PlayerBase";


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
    healthBar: Phaser.GameObjects.Rectangle | null = null;
    baseGroup: Phaser.GameObjects.Group | null = null;

    constructor(scene: Phaser.Scene, unitType: string) {
        super(scene, 0, 0, unitType);
        this.unitType = unitType;
        this.setOrigin(0.5, 0.5);
        // Add to scene
        /*scene.add.existing(this);
        this.scene.physics.add.existing(this);
        if (this.body) {
            (this.body as Phaser.Physics.Arcade.Body).setSize(this.size, this.size);
            (this.body as Phaser.Physics.Arcade.Body).pushable = false;
        } */
        
        //console.log("Unit consturctor called");       
    }

    // Reinitializes the unit like a constructor would
    spawn(unitProps: UnitProps, unitGroup: Phaser.Physics.Arcade.Group, unitPool: Phaser.Physics.Arcade.Group, enemyGroup: Phaser.Physics.Arcade.Group, baseGroup: Phaser.GameObjects.Group, projectiles: Phaser.Physics.Arcade.Group, projectilePool: Phaser.Physics.Arcade.Group): void{
        //console.log("Spawning " + unitProps.unitID);
        this.direction = (unitProps.faction === 'blue') ? -1 : 1;
        this.setFlipX(this.direction === -1);
        this.unitProps = unitProps;
        this.unitProps.speed = Math.abs(unitProps.speed) * this.direction;
        this.healthBar = this.scene.add.rectangle(this.unitProps.x, this.unitProps.y+this.size/3, this.size/2, 5, 0x00ff00).setDepth(1).setAlpha(0.5);

        // Reinitialize the sprite's body
        this.setActive(true);
        this.setVisible(true);
        this.setPosition(unitProps.x, unitProps.y);
        (this.body as Phaser.Physics.Arcade.Body).enable = true;
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
        if(this.resumeTimer) this.resumeTimer.remove();
        this.resumeTimer = null;
        if(this.attackingTimer) this.attackingTimer.remove();
        this.attackingTimer = null;
        this.setVelocityX(0);
        if(this.unitGroup) this.unitGroup.remove(this);
        if(this.unitPool) this.unitPool.killAndHide(this);
        this.healthBar?.destroy();
        // Null the group references
        this.unitGroup = null;
        this.unitPool = null;
        this.enemyGroup = null;
        //console.log("Unit is killed off");
    }

    update(time: any, delta: number): void {
        if (!this.active) {
            return;
        }
        super.update(time, delta);
        //console.log("Health: " + this.unitProps.health);
        if(this.unitProps.health <= 0){
            this.state = UnitStates.DEAD;
            //console.log("Unit is dead");
            this.die();
            return;
        }
        this.updateHealthBar();
        this.handleState();
    }

    public takeDamage(damage: number): void {
        this.unitProps.health -= damage;
        console.log(`Took ${damage} damage, remaining health is ${this.unitProps.health}`);
        if(this.unitProps.health <= 0){
            //console.log("Unit is supposed to be dead");
            this.state = UnitStates.DEAD;
            //this.die();
        }
    }

    public updateHealthBar():void {
        //console.log("Updating health bar to x: ", this.x);
        if (this.healthBar) {
            this.healthBar.x = this.x;
            this.healthBar.width = this.size/2 * (this.unitProps.health / this.unitProps.maxHealth);
            if (this.healthBar.width > (this.size/2 * 0.66)) {
                this.healthBar.setFillStyle(0x00ff00);
            }
            else if (this.healthBar.width > (this.size/2 * 0.33)) {
                this.healthBar.setFillStyle(0xffa500);
            }
            else {
                this.healthBar.setFillStyle(0xff0000);
            }
        }
    }

    public handleCollision(target: Unit | PlayerBase) : void { 
        // On collision with friendly unit stop the one behind
        if(target instanceof Unit && target.unitProps.faction === this.unitProps.faction){
            if(this.unitProps.unitID < target.unitProps.unitID){
                return;
            }
            else{
                //console.log("Stopped moving ID: " + this.unitProps.unitID);
                this.stopMoving();
            }
        }
        // On colision with enemy unit, melee unit should start attacking
        if(target instanceof Unit && target.unitProps.faction !== this.unitProps.faction && this.unitProps.type === 'melee'){
            this.startAttackingTarget(target);
        }
        // On collision with enemy base, melee unit should start attacking
        if(target instanceof PlayerBase && target.faction !== this.unitProps.faction && this.unitProps.type === 'melee'){
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
                console.log("Unit is dead");
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
        //console.log("Overlap: ", overlap);
        return overlap.some(object => {
            if (object.gameObject instanceof Unit && object.gameObject.active) {
                //console.log(`Blocked by ${object.gameObject.unitProps.unitID}`);
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

    public startAttackingTarget(target: Unit | PlayerBase): void {
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