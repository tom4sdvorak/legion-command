import { Scene } from 'phaser';
import eventsCenter from '../EventsCenter';
import { Player } from '../Player';
import { Unit } from '../units/Unit';
import { Arrow } from '../projectiles/Arrow';
import { Projectile } from '../projectiles/Projectile';
import { ObjectPool } from '../helpers/ObjectPool';
import { PlayerBase } from '../PlayerBase';
import { Archer } from '../units/Archer';
import { Warrior } from '../units/Warrior';
import { Healer } from '../units/Healer';
import { UnitConfigLoader } from '../helpers/UnitConfigLoader';
import { AIController } from '../components/AIController';
import { devConfig } from '../helpers/DevConfig';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    worldWidth: number = 2200;
    worldHeight: number = 800;
    ground: Phaser.GameObjects.Image;
    playerRed: Player;
    playerBlue: Player;
    baseRed: PlayerBase;
    baseBlue: PlayerBase;
    redUnitsPhysics: Phaser.Physics.Arcade.Group;
    blueUnitsPhysics: Phaser.Physics.Arcade.Group;
    redProjectiles: Phaser.Physics.Arcade.Group;
    blueProjectiles: Phaser.Physics.Arcade.Group;
    objectPool: ObjectPool;
    blueCollider: Phaser.Physics.Arcade.Collider;
    redCollider: Phaser.Physics.Arcade.Collider;
    hostileCollider: Phaser.Physics.Arcade.Collider;
    baseGroup: Phaser.GameObjects.Group;
    redConfigLoader: UnitConfigLoader;
    blueConfigLoader: UnitConfigLoader;
    AIController: AIController;
    controls: Phaser.Cameras.Controls.SmoothedKeyControl;
    isDragging: boolean = false;
    lastPointerPosition : Phaser.Math.Vector2;
    


    constructor ()
    {
        super('Game');
    }

    createPlayers(){  
        this.blueUnitsPhysics = this.physics.add.group({
            classType: Unit,
            runChildUpdate: true,
            allowGravity: false,
        });
        this.redUnitsPhysics = this.physics.add.group({
            classType: Unit,
            runChildUpdate: true,
            allowGravity: false,
        });
        this.baseGroup = this.add.group({
            classType: PlayerBase,
            runChildUpdate: true,
        });
        this.redProjectiles = this.physics.add.group({
            maxSize: 50,
            runChildUpdate: true
        });
        this.blueProjectiles = this.physics.add.group({
            maxSize: 50,
            runChildUpdate: true
        });

        const unitDataJson = this.cache.json.get('unitData');
        this.redConfigLoader = new UnitConfigLoader(unitDataJson);
        const AIUnitDataJson = this.cache.json.get('AIUnitData');
        this.blueConfigLoader = new UnitConfigLoader(AIUnitDataJson);

        // Create and setup main player
        const redPos = new Phaser.Math.Vector2(0, this.worldHeight);
        const redSprites = [
            this.add.sprite(100, this.worldHeight, 'tower_red').setOrigin(0,1)
        ];
        this.baseRed = new PlayerBase(this, 'red', redPos, this.blueUnitsPhysics, this.redProjectiles, this.objectPool.projectiles.arrows);
        this.playerRed = new Player(this, 'red', this.baseRed, redPos, this.redUnitsPhysics, this.blueUnitsPhysics, this.redProjectiles, this.objectPool, this.baseGroup, this.redConfigLoader);
        this.playerRed.changePassiveIncome(1, true);

        // Create and setup AI player
        const bluePos = new Phaser.Math.Vector2(this.worldWidth, this.worldHeight);
        const blueSprites = [
            this.add.sprite(this.worldWidth-10, this.worldHeight, 'mineBase', 'hill').setOrigin(1,1).setScale(1.1),
            this.add.sprite(this.worldWidth-10, this.worldHeight, 'mineBase', 'dark_hill').setOrigin(1,1).setScale(1.1),
            this.add.sprite(this.worldWidth-10, this.worldHeight, 'mineBase', 'mine_bg').setOrigin(1,1).setScale(1.1),
            this.add.sprite(this.worldWidth-10, this.worldHeight, 'mineBase', 'mine_fg').setOrigin(1,1).setDepth(10).setScale(1.1),
        ];
        this.baseBlue = new PlayerBase(this, 'blue', bluePos, this.redUnitsPhysics, this.blueProjectiles, this.objectPool.projectiles.arrows);
        this.playerBlue = new Player(this, 'blue', this.baseBlue, bluePos, this.blueUnitsPhysics, this.redUnitsPhysics, this.blueProjectiles, this.objectPool, this.baseGroup, this.blueConfigLoader);
        this.playerBlue.changePassiveIncome(1, true);
        if(devConfig.AI) this.AIController = new AIController(this.playerBlue, this.playerRed);

        this.baseGroup.add(this.baseRed);
        this.baseGroup.add(this.baseBlue);
    }

    onUnitRemoved(unit: Unit){
        this.redCollider.update();
    }

    handleUnitCollision(unit1: Unit, unit2: Unit){
        //console.log("Collision between " + unit1.unitProps.unitID + " and " + unit2.unitProps.unitID);
        unit1.handleCollision(unit2);
        unit2.handleCollision(unit1);            
    }

    handleBaseCollision(base: PlayerBase, unit: Unit){
        if(base.faction !== unit.unitProps.faction){
            unit.handleCollision(base);
        }
        
        
    }

    beforeRedProjectileHit(target: Unit | PlayerBase, projectile: Projectile) : boolean{
        if(projectile.x+projectile.width/2 < target.x) return false;
        return true;     
    }

    beforeBlueProjectileHit(target: Unit | PlayerBase, projectile: Projectile) : boolean{
        if(projectile.x-projectile.width/2 > target.x) return false;
        return true;     
    }

    onProjectileHit(target: Unit | PlayerBase, projectile: Projectile) : void{
        projectile.disableBody(true, true);
        projectile.body?.reset(0, 0);
        this.redProjectiles.remove(projectile);
        this.blueProjectiles.remove(projectile);
        target.takeDamage(projectile.damage);
    }

    setupObjectPools(){
        this.objectPool= {
            units: {// Unit pools
                archers: this.physics.add.group({
                    classType: Archer,
                    maxSize: 50,
                    runChildUpdate: true
                }),
                warriors: this.physics.add.group({
                    classType: Warrior,
                    maxSize: 50,
                    runChildUpdate: true
                }),
                healers: this.physics.add.group({
                    classType: Healer,
                    maxSize: 50,
                    runChildUpdate: true
                }),
            },
            projectiles: {// Projectile pools
                arrows: this.physics.add.group({
                    classType: Arrow,
                    maxSize: 50,
                    runChildUpdate: true
                }),
            }
        }
        
    }

 
    setupColliders(){
        // Add collision between Projectiles and opposing units/bases
        this.physics.add.overlap(this.blueUnitsPhysics, this.redProjectiles,  this.onProjectileHit as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, this.beforeRedProjectileHit as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, this);
        this.physics.add.overlap(this.redUnitsPhysics, this.blueProjectiles, this.onProjectileHit as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, this.beforeBlueProjectileHit as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, this);
        this.physics.add.overlap(this.baseBlue, this.redProjectiles, this.onProjectileHit as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, this.beforeRedProjectileHit as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, this);
        this.physics.add.overlap(this.baseRed,this.blueProjectiles, this.onProjectileHit as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, this.beforeBlueProjectileHit as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, this);
        
        // Add collision between friendly units
        this.redCollider = this.physics.add.collider(this.redUnitsPhysics, this.redUnitsPhysics, this.handleUnitCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
        this.blueCollider = this.physics.add.collider(this.blueUnitsPhysics, this.blueUnitsPhysics, this.handleUnitCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
        
        // Add collision when hostile
        this.hostileCollider = this.physics.add.collider(this.redUnitsPhysics, this.blueUnitsPhysics, this.handleUnitCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);

        // Add collision with hostile base
        this.physics.add.collider(this.redUnitsPhysics, this.baseBlue, this.handleBaseCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
        this.physics.add.collider(this.blueUnitsPhysics, this.baseRed, this.handleBaseCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
    }

    gameOver(faction: string){
        this.scene.stop('UI');
        this.scene.start('GameOver', {"faction" : faction});
    }

    rewardPlayer(faction: string, money: number = 0, xp: number = 0){
        if(faction === 'red') this.playerRed.addMoney(money);
        else this.playerBlue.addMoney(money);
    }

    create ()
    {       
        // Setup the game screen
        this.camera = this.cameras.main;
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
        this.camera.setBackgroundColor(0x76B9E3);
        this.lastPointerPosition = new Phaser.Math.Vector2();

        this.add.image(0, this.worldHeight, 'bglayer1').setScrollFactor(0).setOrigin(0,1).setDisplaySize(this.camera.width, this.worldHeight);
        this.add.image(0, this.worldHeight, 'bglayer2').setScrollFactor(0.2).setOrigin(0,1).setDisplaySize(this.worldWidth-(1-0.2)*(this.worldWidth-(this.game.config.width as number)), this.worldHeight);
        this.add.image(0, this.worldHeight, 'bglayer3').setScrollFactor(0.5).setOrigin(0,1).setDisplaySize(this.worldWidth-(1-0.5)*(this.worldWidth-(this.game.config.width as number)), this.worldHeight);
        this.add.tileSprite(0, this.worldHeight, this.worldWidth, 0, 'bglayer4').setScrollFactor(0.8).setOrigin(0,1).setScale(1.8);
        const foreGround = this.add.tileSprite(0, this.worldHeight, this.worldWidth, 0, 'bglayer5').setOrigin(0,1).setDepth(9);
        foreGround.setDisplaySize(foreGround.width, 65);
        

        // Create unit and projectile pools
        this.setupObjectPools();
        this.createPlayers();
        this.setupColliders();

        this.scene.launch('UI', { player: this.playerRed }); // Starts the UI scene on top of the game scene

        if(this.input.keyboard){
            const cursors = this.input.keyboard.createCursorKeys();
            const controlConfig = {
                camera: this.cameras.main,
                left: cursors.left,
                right: cursors.right,
                up: cursors.up,
                down: cursors.down,
                acceleration: 0.04,
                drag: 0.0005,
                maxSpeed: 0.7
            };
        this.controls = new Phaser.Cameras.Controls.SmoothedKeyControl(controlConfig);
        }

        this.input.on('pointerdown',  (pointer: any) => {
            this.isDragging = true;
            this.lastPointerPosition.x = pointer.x;
            this.lastPointerPosition.y = pointer.y;
        });

        this.input.on('pointerup',  () => {
            this.isDragging = false;
        });
        
        
        //Listen to events
        eventsCenter.on('spawn-red-unit', (unitType : string) => {
            console.log(`%cTrying to spawn red ${unitType}`, "color: red");
            this.playerRed.addUnitToQueue(unitType);
            
        });
        eventsCenter.on('spawn-blue-unit', (unitType : string) => {
            console.log(`%cTrying to spawn blue ${unitType}`, "color: blue");
            this.playerBlue.addUnitToQueue(unitType);
        });
        eventsCenter.on('base-destroyed', (faction : string) => {
            this.gameOver(faction);
        });


    }

    update(time: any, delta: number){
        this.controls.update(delta);
        if (this.isDragging) {
            let deltaX = this.lastPointerPosition.x - this.input.activePointer.x;
            let deltaY = this.lastPointerPosition.y - this.input.activePointer.y;
            
            this.cameras.main.scrollX += deltaX;
            this.cameras.main.scrollY += deltaY;

            this.lastPointerPosition.x = this.input.activePointer.x;
            this.lastPointerPosition.y = this.input.activePointer.y;
        }
        // Run update methods of each player
        this.playerBlue.update(time, delta);
        if(devConfig.AI) this.AIController.update(time, delta);
        this.playerRed.update(time, delta);
        
    }
}
