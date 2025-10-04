import { UnitProps } from "../helpers/UnitProps";
import { UnitStates } from "../helpers/UnitStates";
import { PlayerBase } from "../PlayerBase";
import { HealthComponent } from "../components/HealthComponent";
import { Game } from "../scenes/Game";
import eventsCenter from "../EventsCenter";


export class Unit extends Phaser.Physics.Arcade.Sprite {
    unitProps: UnitProps;
    state: string = UnitStates.WAITING;
    attackingTimer: Phaser.Time.TimerEvent | null = null;
    direction: number = 1;
    unitType: string;
    unitGroup: Phaser.Physics.Arcade.Group | null = null;
    unitPool: Phaser.Physics.Arcade.Group | null = null;
    healthComponent: HealthComponent;
    declare scene: Game;
    meleeTarget: Unit | PlayerBase | null = null;
    glow: Phaser.FX.Glow;
    colorMatrix: Phaser.FX.ColorMatrix;
    actionDisabled: boolean = false;
    burningDebuff : {timer: Phaser.Time.TimerEvent | null, ticks: number, damage: number} | null = null;
    petrifyDebuff : {timer: Phaser.Time.TimerEvent | null, duration: number} | null = null;

    constructor(scene: Game, unitType: string) {
        super(scene, -500, -500, unitType);
        this.colorMatrix = this.preFX!.addColorMatrix();
        this.unitType = unitType;
        this.setOrigin(0.5, 1);
        this.healthComponent = new HealthComponent(this, 100, true,32, 5, scene.cameras.main.height+this.scene.getGlobalOffset().y+10); // parent, maxHealth, visible?, width, height, yOffset, 
        
        // Listen to call of unit's death
        this.on('death', this.die, this);
    }

    // Reinitializes the unit like a constructor would
    spawn(unitProps: UnitProps, unitGroup: Phaser.Physics.Arcade.Group, unitPool: Phaser.Physics.Arcade.Group, enemyGroup: Phaser.Physics.Arcade.Group, baseGroup: Phaser.GameObjects.Group, projectiles: Phaser.Physics.Arcade.Group, projectilePool: Phaser.Physics.Arcade.Group | null): void{
        this.direction = (unitProps.faction === 'blue') ? -1 : 1;
        this.setFlipX(this.direction === -1);
        this.unitProps = unitProps;
        this.unitProps.speed = Math.abs(unitProps.speed) * this.direction;
        this.healthComponent.spawn(unitProps.maxHealth);
        this.unitGroup = unitGroup;
        this.unitPool = unitPool;
        this.setDepth(5);
        this.actionDisabled = false;
        this.state = UnitStates.WAITING;
        this.colorMatrix.reset();
        this.actionDisabled = false;
        // Reinitialize the sprite's body
        this.setScale(unitProps.scale);
        
        this.glow = this.postFX?.addGlow(0x000000, 1, 0, false);
        
        this.setActive(true);
        this.setVisible(true);
        // Calculate spawn position of unit based on desired position, moved by offset (how many empty pixels are under feet of the sprite) timed by scale of the unit (which scales the empty pixels too)
        let newPositionX = unitProps.x - this.direction * 64;
        this.setPosition(newPositionX, unitProps.y);
        this.unitGroup.add(this);

        //this.setDisplaySize(this.sizeW, this.sizeH);
        //this.setBodySize(this.size, this.size, true);
        
        (this.body as Phaser.Physics.Arcade.Body).enable = true;
        (this.body as Phaser.Physics.Arcade.Body).reset(newPositionX, unitProps.y);
        (this.body as Phaser.Physics.Arcade.Body).pushable = false;
        console.log("Unit spawned at: " + this.x + " " + this.y);
        if(this.body){
            this.setBodySize(unitProps.bodyWidth/unitProps.scale, unitProps.bodyHeight/unitProps.scale, true);

            /* Calculate offset of units body on Y axis by taking the bottom cooridinate of game screen 
            and minus current body location, height of the body, (negative) globatOffsetY defined in game scene
            and all adjusted for scale          
            */
            let bodyOffsetY = ((this.scene.camera.height-this.body.y-this.body.height+this.scene.getGlobalOffset().y)/this.unitProps.scale);
            this.body.setOffset(this.body.offset.x, bodyOffsetY);
        }

        // Add mouse/touch interaction
        this.setInteractive();
        this.on('pointerover', () => {
            this.postFX.remove(this.glow);
            this.glow = this.postFX.addGlow(0xffff00, 10, 0, false, 1, 1);
        }).on('pointerout', () => {
            this.postFX.remove(this.glow);
            this.glow = this.postFX?.addGlow(0x000000, 1, 0, false);
        }).on('pointerup', () => {
            console.log(this.unitProps);
        })
        this.changeState(UnitStates.WALKING);
    }
    
    stopEverything(): void { 
        this.stopMoving();
        this.stopSupporting();
        this.stopShooting();
        this.changeState(UnitStates.WAITING);
        if(this.attackingTimer) this.attackingTimer.remove();
        this.attackingTimer = null;
    }

    die(): void {
        this.stopEverything();
        this.changeState(UnitStates.DEAD);
        this.actionDisabled = true;

        // Clear any ongoing debuffs
        this.colorMatrix.reset();
        this.burningDebuff?.timer?.remove();
        this.burningDebuff = null;
        this.petrifyDebuff?.timer?.remove();
        this.petrifyDebuff = null;
        
        this.setDepth(1);
        if(this.unitProps.faction === 'red') this.scene.rewardPlayer('blue', 10);
        else this.scene.rewardPlayer('red', this.unitProps.cost);
        if(this.unitGroup) this.unitGroup.remove(this);
        this.play(`${this.unitType}_death`, true);
        this.anims.timeScale = 1;
        eventsCenter.emit('unit-died', this.unitProps.faction);
        
        //this.disableBody();
       // (this.body as Phaser.Physics.Arcade.Body).setEnable(false);
        this.scene.time.delayedCall(5000, () => {
            this.healthComponent.deactivate();
            (this.body as Phaser.Physics.Arcade.Body).reset(-500, -500);
            if(this.unitPool) this.unitPool.killAndHide(this);
            this.unitGroup = null;
            this.unitPool = null;
            this.removeInteractive();
            this.postFX.remove(this.glow);
        }, undefined, this);
        
    }

    update(time: any, delta: number): void {
        if (!this.active) {
            return;
        }
        super.update(time, delta);
        // Keep unit moving when not blocked
        if (this.state !== UnitStates.DEAD) {
            if (this.state !== UnitStates.SHOOTING && !this.isBlocked()[0]) {
                this.moveForward();
            }
        }
        this.healthComponent.update();
        this.handleState();
        
        
    }

    public takeDamage(damage: number): void {
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        }, undefined, this);
        this.setTintFill(0xffffff);
        const damageToTake = Math.round(damage * (1 - this.unitProps.armor / 100.0));
        this.healthComponent.takeDamage(damageToTake);
    }

    public applyDebuff(debuff: string) : void {
        switch(debuff){
            case 'petrify':
                // set sprite to greyscale
                this.colorMatrix.grayscale(1);
                // give sprite temporary antiarmor
                const prevArmor = this.unitProps.armor;
                this.unitProps.armor = -100;
                // set it to unable to move or attack
                this.changeState(UnitStates.WAITING);
                this.stop();
                this.actionDisabled = true;
                // add timer to remove petrification
                if(this.petrifyDebuff?.timer) this.petrifyDebuff.timer.remove();
                this.petrifyDebuff = {timer: null, duration: 5};
                this.petrifyDebuff.timer = this.scene.time.addEvent({
                    delay: this.petrifyDebuff!.duration * 1000,
                    callback: () => {
                        if (!this.active) {
                            return;
                        }
                        this.actionDisabled = false;
                        this.colorMatrix.grayscale(0);
                        this.changeState(UnitStates.IDLE);
                        this.unitProps.armor = prevArmor;
                        this.petrifyDebuff!.timer?.remove();
                        this.petrifyDebuff = null;
                    },
                    callbackScope: this,
                    loop: false
                });
                break;
            case 'burn':
                // extend current burn debuff or create new one if none exists
                if(this.burningDebuff){
                    this.burningDebuff.ticks = 5;
                    return;
                }
                this.burningDebuff = {timer: null, ticks: 5, damage: 10};

                // set to tint/glow redish
                this.colorMatrix.saturate(1.2, true).brightness(1.2, true).brown(true);

                // remove health over time
                this.burningDebuff.timer = this.scene.time.addEvent({
                    delay: 1000, // Apply burn damage every 1s
                    callback: () => {
                        if (!this.active || this.state === UnitStates.DEAD || this.burningDebuff === null) {
                            return;
                        }
                        this.takeDamage(this.burningDebuff.damage); // How much damage
                        if(this.burningDebuff !== null){
                            this.burningDebuff.ticks--; // Reduce ticks by 1
                            if (this.burningDebuff.ticks <= 0) {
                                this.colorMatrix.reset();
                                this.burningDebuff.timer?.remove();
                                this.burningDebuff = null;
                            }
                        }
                    },
                    callbackScope: this,
                    loop: true
                });
                break;
            default:
                throw new Error(`Unknown debuff: ${debuff}`);
        }
    }

    public handleCollision(target: Unit | PlayerBase) : void { 
        // On collision with friendly unit stop if its the one behind
        if(target instanceof Unit && target.unitProps.faction === this.unitProps.faction){
            if(this.unitProps.unitID > target.unitProps.unitID){
                this.stopMoving();

                // If unit was in walking state, change to idle
                if(this.state === UnitStates.WALKING){
                    this.changeState(UnitStates.IDLE);
                }
            }
        } // On colision with enemy unit or base, unit should start attacking
        else if(target instanceof Unit && target.unitProps.faction !== this.unitProps.faction){
            this.meleeTarget = target;
            this.changeState(UnitStates.ATTACKING);            
        }
        else if(target instanceof PlayerBase && target.faction !== this.unitProps.faction){
            this.meleeTarget = target;
            this.changeState(UnitStates.ATTACKING);
            
        }
    }

    public startAttackingTarget(): void {
        if (this.attackingTimer) return;
        if (!this.meleeTarget) return;

        this.attackingTimer = this.scene.time.addEvent({
            delay: this.unitProps.actionSpeed,
            callback: () => {
                if (!this.active || this.state === UnitStates.DEAD || this.state === UnitStates.WAITING) {
                    return;
                }
                this.anims.timeScale = (this.anims?.currentAnim?.duration ?? 1) / (this.unitProps.actionSpeed + 100);
                if(this.meleeTarget instanceof Unit && this.meleeTarget.active && this.meleeTarget.isAlive()){
                    this.meleeTarget.takeDamage(this.unitProps.damage);
                }
                else if(this.meleeTarget instanceof PlayerBase && this.meleeTarget.active){
                    this.meleeTarget.takeDamage(this.unitProps.damage);
                }
                else{
                    this.meleeTarget = null;
                    this.stopAttacking();
                    return;
                }
            },
            callbackScope: this,
            loop: true
        });
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
                let blockingSituation : [boolean, Unit | null] = this.isBlocked();
                // Try to walk if not blocked
                if(!blockingSituation[0]){
                    this.changeState(UnitStates.WALKING);
                }
                else{
                    // If blocked, check if its enemy and trigger collision
                    if(blockingSituation[1] instanceof Unit && blockingSituation[1].unitProps.faction !== this.unitProps.faction){
                        this.handleCollision(blockingSituation[1]);
                    }
                }
                break;
            case UnitStates.ATTACKING:                              
                if(!this.meleeTarget || !this.meleeTarget.active){
                    this.stopAttacking();
                    this.changeState(UnitStates.IDLE);
                }
                break;
            default:
                break;
        }
    }

    public changeState(newState: string): void {
        if(newState === this.state) return;
        if(this.state === UnitStates.DEAD) return;
        if(this.actionDisabled) return;
        console.log("Changing state from " + this.state + " to " + newState);
        this.state = newState;

        switch (newState) {
            case UnitStates.SUPPORTING:
                this.startSupporting();
                this.play(`${this.unitType}_support`, true);
                this.anims.timeScale = (this.anims?.currentAnim?.duration ?? 1) / this.unitProps.actionSpeed;
                break;
            case UnitStates.SHOOTING:
                this.stopMoving();
                this.startShooting();
                this.play(`${this.unitType}_shoot`, true);
                this.anims.timeScale = (this.anims?.currentAnim?.duration ?? 1) / this.unitProps.actionSpeed;
                break;
            case UnitStates.ATTACKING:
                this.stopSupporting();
                this.stopShooting();
                this.startAttackingTarget();
                this.play(`${this.unitType}_attack`, true);
                this.anims.timeScale = (this.anims?.currentAnim?.duration ?? 1) / (this.unitProps.actionSpeed + 100);
                break;
            case UnitStates.IDLE:
                this.stopShooting();
                this.stopSupporting();
                this.play(`${this.unitType}_idle`, true);
                this.anims.timeScale = 1;
                break;
            case UnitStates.WALKING:
                this.play(`${this.unitType}_run`, true);
                this.anims.timeScale = 1;
                break;
            case UnitStates.DEAD:
                this.stopMoving();
                break;
            case UnitStates.WAITING:
                this.stopEverything();
                break;
            default:
                throw Error(`Unknown unit state: ${this.state}`);
        }
    }

    startSupporting() :void {
        return;
    }
    stopSupporting() :void {
        return;
    }

    startShooting() :void {
        return;
    }
    stopShooting() :void {
        return;
    }

    isBlocked(): [boolean, Unit | null] {
        const detectionRectWidth = 20;
        if(this.body){
            const xOffset = (this.body.width * 0.5 + 1) * this.direction;
            const yOffset = -this.body.height * 0.5;
            // Use a physics overlap check to find a blocking unit in front
            let overlap = this.scene.physics.overlapRect(this.x + xOffset, this.y + yOffset, detectionRectWidth * this.direction, this.body.height);

            // Should really find at most 2 things but loop just in case
            for (const object of overlap) {
                if (object.gameObject) {
                    const gameObject = object.gameObject;
                    if (gameObject instanceof Unit && gameObject !== this && gameObject.isAlive()) {
                        return [true, gameObject];
                    }
                }
            }
            /*return overlap.some(object => {
                if (object.gameObject instanceof Unit && object.gameObject.isAlive()) {
                    return [true, object.gameObject];
                }
                return [false, null];
            });*/
        }
        return [false, null];
        
    }

    public stopAttacking(): void {
        if (this.attackingTimer) {
            this.attackingTimer.remove();
            this.attackingTimer = null;
        }
        this.changeState(UnitStates.IDLE);
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