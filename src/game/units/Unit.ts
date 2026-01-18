import { UnitProps } from "../helpers/UnitProps";
import { UnitStates } from "../helpers/UnitStates";
import { PlayerBase } from "../PlayerBase";
import { HealthComponent } from "../components/HealthComponent";
import { Game } from "../scenes/Game";
import eventsCenter from "../EventsCenter";


export class Unit extends Phaser.Physics.Arcade.Sprite {
    protected unitProps: UnitProps;
    state: string = UnitStates.WAITING;
    protected actionCooldown: number = 0;
    protected specialCooldown: number = 0;
    protected direction: number = 1;
    protected unitType: string;
    protected unitGroup: Phaser.Physics.Arcade.Group | null = null;
    protected unitPool: Phaser.Physics.Arcade.Group | null = null;
    protected healthComponent: HealthComponent;
    declare scene: Game;
    protected meleeTarget: { target: Unit | PlayerBase | null, id: number} = {target: null, id: -1};
    protected colorMatrix: Phaser.FX.ColorMatrix;
    protected actionDisabled: boolean = false;
    protected burningDebuff : {timer: Phaser.Time.TimerEvent | null, ticks: number, damage: number} | null = null;
    protected petrifyDebuff : {timer: Phaser.Time.TimerEvent | null, duration: number} | null = null;
    protected buffDebuffGlow: {buffDebuff: string, glow: Phaser.FX.Glow | null} = {buffDebuff: '', glow: null};
    protected buffList: {buff: string, source: number}[] = [];
    protected outlineSprite: Phaser.GameObjects.Sprite | null = null;
    protected specialReady: boolean = false;
    protected rewardText: Phaser.GameObjects.BitmapText | null = null;

    constructor(scene: Game, unitType: string) {
        super(scene, -500, -500, unitType);
        this.colorMatrix = this.preFX!.addColorMatrix();
        this.unitType = unitType;
        this.setOrigin(0.5, 1);
        this.healthComponent = new HealthComponent(this, 100, true,32, 5, scene.cameras.main.height+this.scene.getGlobalOffset().y+10); // parent, maxHealth, visible?, width, height, yOffset, 

        // Listen to call of unit's death
        this.on('death', () => {
            this.onKilled(); 
        }, this);
    }

    // Reinitializes the unit like a constructor would
    spawn(unitProps: UnitProps, unitGroup: Phaser.Physics.Arcade.Group, unitPool: Phaser.Physics.Arcade.Group, _enemyGroup: Phaser.Physics.Arcade.Group, _baseGroup: Phaser.GameObjects.Group, _projectiles: Phaser.Physics.Arcade.Group, _projectilePool: Phaser.Physics.Arcade.Group | null): void{
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
        this.actionCooldown = 0;
        this.buffList = [];
        this.specialReady = false;
        this.meleeTarget = {target: null, id: -1};
        this.specialCooldown = this.unitProps.specialCooldown; // Reset special cooldown so cooldown based special is available instantly
        // Reinitialize the sprite's body
        this.setScale(unitProps.scale);        
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

        if(this.body){
            this.setBodySize(unitProps.bodyWidth/unitProps.scale, 128/unitProps.scale, true);

            /* Calculate offset of units body on Y axis by taking the bottom cooridinate of game screen 
            and minus current body location, height of the body, (negative) globatOffsetY defined in game scene
            and all adjusted for scale          
            */
            let bodyOffsetY = ((this.scene.camera.height-this.body.y-this.body.height+this.scene.getGlobalOffset().y)/this.unitProps.scale);
            this.body.setOffset(this.body.offset.x, bodyOffsetY);
            this.setInteractive(new Phaser.Geom.Rectangle(this.body.offset.x, this.body.offset.y, this.body.width, this.body.height), Phaser.Geom.Rectangle.Contains);
        }

        if (this.outlineSprite) {
            this.outlineSprite.destroy();
            this.outlineSprite = null;
        }

        // Create the permanent outline sprite
        this.outlineSprite = this.scene.add.sprite(this.x, this.y, this.texture.key, this.frame.name)
            .setOrigin(0.5, 1) 
            .setTint(0x000000)
            .setAlpha(0.5)
            .setDepth(this.depth - 0.1) 
            .setScale(this.unitProps.scale * 1.05)
            .setVisible(true)
            .setFlipX(this.direction === -1);
        this.scene.children.add(this.outlineSprite);

        // Add mouse/touch interaction
        let savedGlowConfig = {
            saved: false,
            color: 0,
            outerStrength: 0,
            innerStrength: 0
        };

        this.on('pointerover', () => {
            if(this.buffDebuffGlow.glow !== null){
                savedGlowConfig.saved = true;
                savedGlowConfig.color = this.buffDebuffGlow.glow.color;
                savedGlowConfig.outerStrength = this.buffDebuffGlow.glow.outerStrength;
                savedGlowConfig.innerStrength = this.buffDebuffGlow.glow.innerStrength;
                this.postFX.clear();
                this.postFX.addGlow(0xffff00, 10, 0, false, 1, 1);
            }
            
        }).on('pointerout', () => {
            this.postFX.clear();
            if(savedGlowConfig.saved) this.postFX.addGlow(savedGlowConfig.color, savedGlowConfig.outerStrength, savedGlowConfig.innerStrength);            
        });
        this.changeState(UnitStates.WALKING);
    }
    
    stopEverything(): void { 
        this.stopMoving();
        this.stopSupporting();
        this.stopShooting();
        this.changeState(UnitStates.WAITING);
    }

    onKilled(skipDeathAnimation: boolean = false): void { 
        // Play death animation
        if(!skipDeathAnimation){
            this.play(`${this.unitType}_death`, true)
        }
        
        // Reward player
        if(this.unitProps.faction === 'blue') this.rewardText = this.scene.add.bitmapText(this.x, this.y-96, 'pixelFont', `+${this.unitProps.cost}`, 16).setOrigin(0.5, 0.5).setTintFill(0xffff00);
        this.scene.rewardPlayer(this.unitProps.faction, this.unitProps.cost);
        eventsCenter.emit('unit-died', this.unitProps.faction);
        this.die();
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
        if(this.buffDebuffGlow.glow !== null) {
            this.postFX.remove(this.buffDebuffGlow.glow);
            this.buffDebuffGlow = {buffDebuff: '', glow: null};
        }
        

        if (this.outlineSprite) {
            this.outlineSprite.destroy();
            this.outlineSprite = null;
        }
        
        this.setDepth(1);
        if(this.unitGroup) this.unitGroup.remove(this);
        this.anims.timeScale = 1;
        this.healthComponent.deactivate();
        this.meleeTarget = {target: null, id: -1};
       // (this.body as Phaser.Physics.Arcade.Body).setEnable(false);
        this.scene.time.delayedCall(5000, () => {
            (this.body as Phaser.Physics.Arcade.Body).reset(-500, -500);
            if(this.unitPool) this.unitPool.killAndHide(this);
            this.unitGroup = null;
            this.unitPool = null;
            this.removeInteractive();
            this.postFX.clear();
            this.rewardText?.destroy();
            this.rewardText = null;
        }, undefined, this);
        
    }

    update(_time: any, delta: number): void {
        if (!this.active) {
            return;
        }
        // Keep unit moving when not blocked
        if (this.state !== UnitStates.DEAD && this.state !== UnitStates.WALKING && !this.isBlocked()[0]) {
            this.changeState(UnitStates.WALKING);
        }

        if(this.state === UnitStates.ATTACKING || this.state === UnitStates.SHOOTING){
            this.actionCooldown += delta*this.scene.time.timeScale;
        }

        if(this.state === UnitStates.ATTACKING && this.meleeTarget.target){
            if(this.actionCooldown >= this.unitProps.actionSpeed){
                this.attackTarget();
                this.actionCooldown -= this.unitProps.actionSpeed; 
            }
        }

        // Sync outline sprite's position and animation
        if (this.outlineSprite) {
            this.outlineSprite.setPosition(this.x-this.direction, this.y+2);
            this.outlineSprite.setFlipX(this.flipX);
            if (this.anims.isPlaying) {
                this.outlineSprite.setFrame(this.anims.currentFrame!.frame.name);
            }
        }

        /* Special abilities logic
        * Count cooldown time if special is both enabled and units' set cooldown is above 0 (-1 means special is not using cooldown) up to 100s
        * Once accumulating enough for cooldown, set specialReady to true (unless units base cooldown is -1) so unit can trigger special when situation allows
        */
        if(this.unitProps.specialEnabled && this.unitProps.specialCooldown > 0 && this.specialCooldown <= 100000) this.specialCooldown += delta*this.scene.time.timeScale;
        if(this.unitProps.specialCooldown > 0 && this.specialCooldown >= this.unitProps.specialCooldown) this.specialReady = true;

        this.healthComponent.update();
        this.handleState();
        
    }

    public takeDamage(damage: number, armorIgnore: number = 0): void {
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        }, undefined, this);
        this.setTintFill(0xffffff);
        let armor = this.unitProps.armor - armorIgnore;
        if(armor < 0) armor = 0;
        const damageToTake = Math.round(damage * (1 - armor / 100.0));
        this.healthComponent.takeDamage(damageToTake);
    }

    public applyBuff(buff: string, source: number, multiplier: number = 1) : void {
        const buffExistsFromSource = this.buffList.some(item => 
            item.buff === buff && item.source === source
        );
        const buffExistsAtAll = this.buffList.some(item => 
            item.buff === buff
        );

        
        if(buffExistsFromSource) return; // Do nothing if source already applied equal buff

        switch(buff){
            case 'speed':
                this.buffList.push({buff: buff, source: source});
                if(buffExistsAtAll) return; // Skip rest if any instance of the buff exists
                if(this.buffDebuffGlow.glow === null){
                    this.buffDebuffGlow = {buffDebuff: buff, glow: this.postFX.addGlow(0x976EFF, 5, 0, false)};
                }
                this.unitProps.speed = this.unitProps.speed * (1+multiplier);
                this.unitProps.actionSpeed = this.unitProps.actionSpeed / (1+multiplier);
                break;
        }
    }

    /**
     * 
     * @param buff String name of buff
     * @param source ID of the unit trying to remove its applied buff
     */
    public removeBuff(buff: string, source: number) : void {
        const buffIndex = this.buffList.findIndex(item => 
            item.buff === buff && item.source === source
        );

        if (buffIndex === -1) return; // Do nothing if source target doesnt even have this buff from this source
        this.buffList.splice(buffIndex, 1); // Remove buff from list

        // Check if there are still instances of the buff from other sources and do nothing if yes
        const buffStillExists = this.buffList.some(item => item.buff === buff);
        if(buffStillExists) return;

        switch(buff){
            case 'speed':
                this.unitProps.speed /= 2;
                this.unitProps.actionSpeed *= 2;
                if(this.buffDebuffGlow.buffDebuff === buff && this.buffDebuffGlow.glow !== null){
                    this.postFX.remove(this.buffDebuffGlow.glow);
                    this.buffDebuffGlow = {buffDebuff: '', glow: null};
                }
                break;
        }
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
                // Slow current animation considerably
                this.stopAfterRepeat();
                this.scene.tweens.add({
                    targets: this.anims,
                    timeScale: 0.01,
                    duration: 500,      // Time to complete the slow-down (in ms)
                    ease: 'Sine.easeOut',
                    callbackScope: this
                });

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
                        this.anims.timeScale = 1; 
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
            case 'curse':
                if(this.buffDebuffGlow.buffDebuff !== 'curse'){
                    if(this.buffDebuffGlow.glow !== null) this.postFX.remove(this.buffDebuffGlow.glow);
                    this.buffDebuffGlow = {buffDebuff: 'curse', glow: this.postFX.addGlow(0xF00A0E1, 5, 0, false)};
                    this.unitProps.damage = Math.round(this.unitProps.damage * 0.25);
                }
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
            this.meleeTarget.target = target;
            this.meleeTarget.id = target.unitProps.unitID;
            this.changeState(UnitStates.ATTACKING);            
        }
        else if(target instanceof PlayerBase && target.getFaction() !== this.unitProps.faction){
            this.meleeTarget.target = target;
            this.meleeTarget.id = -1;
            if(this.unitProps.tags.includes('melee')){
                this.changeState(UnitStates.ATTACKING); 
            }
            else{
                this.stopMoving();
                if(this.state === UnitStates.WALKING){
                    this.changeState(UnitStates.IDLE);
                }
            }         
        }
    }

    public attackTarget(): void {
        if (!this.active || this.state === UnitStates.DEAD || this.state === UnitStates.WAITING) {
            return;
        }
        if(!this.meleeTarget.target || !this.meleeTarget.target.active){
            this.meleeTarget = {target: null, id: -1};
            this.stopAttacking();
            return;
        }

        this.anims.timeScale = (this.anims?.currentAnim?.duration ?? 1) / (this.unitProps.actionSpeed + 100);
        if(this.meleeTarget.target instanceof Unit && this.meleeTarget.target.isAlive() && this.meleeTarget.id === this.meleeTarget.target.unitProps.unitID){
            let damage = this.unitProps.damage * this.unitProps.meleeMultiplier;
            this.meleeTarget.target.takeDamage(damage, this.unitProps.armorIgnore);
        }
        else if(this.meleeTarget.target instanceof PlayerBase){
            this.meleeTarget.target.takeDamage(this.unitProps.damage);
        }
        else{
            this.meleeTarget = {target: null, id: -1};
            this.stopAttacking();
            return;
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
                let blockingSituation : [boolean, Unit | PlayerBase | null] = this.isBlocked();
                // Try to walk if not blocked
                if(!blockingSituation[0]){
                    this.changeState(UnitStates.WALKING);
                }
                else{
                    // If blocked, check if its enemy and trigger collision
                    if(blockingSituation[1] instanceof Unit && blockingSituation[1].unitProps.faction !== this.unitProps.faction){
                        this.handleCollision(blockingSituation[1]);
                    }
                    else if(blockingSituation[1] instanceof PlayerBase && blockingSituation[1].getFaction() !== this.unitProps.faction){
                        this.handleCollision(blockingSituation[1]);
                    }
                }
                break;
            case UnitStates.ATTACKING:                              
                if(!this.meleeTarget.target || !this.meleeTarget.target.active){
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

        // Handle state changes based on previous
        switch (this.state){
            case UnitStates.SUPPORTING:
                if(this.scene.anims.exists(`${this.unitType}_support_end`)){
                    this.play(`${this.unitType}_support_end`, true);
                }
                this.stopSupporting();
                break;
            default:
                break;
        }

        this.state = newState;

        // Handle state changes based on new
        switch (newState) {
            case UnitStates.SUPPORTING:
                this.startSupporting();
                //this.stopMoving();
                if(this.scene.anims.exists(`${this.unitType}_support_start`)){
                    this.play(`${this.unitType}_support_start`, true);
                }
                else{
                    this.play(`${this.unitType}_support`, true);
                }
                this.anims.timeScale = (this.anims?.currentAnim?.duration ?? 1) / (this.unitProps.actionSpeed + 100);
                break;
            case UnitStates.SHOOTING:
                this.actionCooldown = 0;
                //this.stopMoving();
                this.play(`${this.unitType}_shoot`, true);
                this.anims.timeScale = (this.anims?.currentAnim?.duration ?? 1) / (this.unitProps.actionSpeed + 100);
                break;
            case UnitStates.ATTACKING:
                this.actionCooldown = 0;
                this.play(`${this.unitType}_attack`, true);
                this.anims.timeScale = (this.anims?.currentAnim?.duration ?? 1) / (this.unitProps.actionSpeed + 100);
                break;
            case UnitStates.IDLE:  
                this.play(`${this.unitType}_idle`, true);
                this.anims.timeScale = 1;
                break;
            case UnitStates.WALKING:
                this.moveForward();
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

    isBlocked(): [boolean, Unit | PlayerBase | null] {
        if (!this.body) return [false, null];

        const detectionRectWidth = 20;
        const xOffset = (this.body.width * 0.5 + 1) * this.direction;
        const yOffset = -this.body.height * 0.5;
        // Use a physics overlap check to find a blocking unit in front
        let overlap = this.scene.physics.overlapRect(this.x + xOffset, this.y + yOffset, detectionRectWidth * this.direction, this.body.height, true, true);

        // Should really find at most 2 things but loop just in case
        for (const object of overlap) {
            if (object.gameObject) {
                const gameObject = object.gameObject;
                if (gameObject instanceof Unit && gameObject !== this && gameObject.isAlive()) {
                    return [true, gameObject];
                }
                else if (gameObject instanceof PlayerBase && gameObject.getFaction() !== this.unitProps.faction) {
                    return [true, gameObject];
                }
            }
        }
        return [false, null];
        
    }

    public stopAttacking(): void {
        this.actionCooldown = 0;
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

    public getUnitProps(): UnitProps {
        return this.unitProps;
    }
}