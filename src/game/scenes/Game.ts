import { Scene } from 'phaser';
import eventsCenter from '../EventsCenter';
import { Player } from '../units/Player';
import { Unit } from '../units/Unit';
import { Arrow } from '../projectiles/Arrow';
import { Projectile } from '../projectiles/Projectile';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    ground: Phaser.GameObjects.Image;
    playerRed: Player;
    playerBlue: Player;
    redUnitsPhysics: Phaser.Physics.Arcade.Group;
    blueUnitsPhysics: Phaser.Physics.Arcade.Group;
    unitsPhysics: Phaser.Physics.Arcade.Group;
    redArrows: Phaser.Physics.Arcade.Group;
    blueArrows: Phaser.Physics.Arcade.Group;
    redSpawnTime: number = 0;
    blueSpawnTime: number = 0;
    spawnDelay: number = 1000;
    framesSinceRedSpawn: number = 0;
    framesSinceBlueSpawn: number = 0;


    constructor ()
    {
        super('Game');
    }

    createPlayers(){  
        this.blueUnitsPhysics = this.physics.add.group({allowGravity: false});
        this.redUnitsPhysics = this.physics.add.group({allowGravity: false});
        this.unitsPhysics = this.physics.add.group({allowGravity: false});
        this.playerRed = new Player(this, 'red', this.redUnitsPhysics, this.blueUnitsPhysics, this.redArrows);
        this.playerBlue = new Player(this, 'blue', this.blueUnitsPhysics, this.redUnitsPhysics, this.blueArrows);
    }

    handleUnitCollision(unit1: any, unit2: any){
        let parentUnit1, parentUnit2;
            if (unit1 instanceof Phaser.Physics.Arcade.Sprite){
                parentUnit1 = unit1.getData('parent');    
            }
            if (unit2 instanceof Phaser.Physics.Arcade.Sprite){
                parentUnit2 = unit2.getData('parent');
            }
            if(parentUnit1 instanceof Unit && parentUnit2 instanceof Unit){
                parentUnit1.handleCollision(parentUnit2);
                parentUnit2.handleCollision(parentUnit1);
            }
            
    }

    beforeRedProjectileHit(projectile: Projectile, unit: Phaser.Physics.Arcade.Sprite) : boolean{
        if(projectile.x+projectile.width/2 < unit.x) return false;
        return true;     
    }

    beforeBlueProjectileHit(projectile: Projectile, unit: Phaser.Physics.Arcade.Sprite) : boolean{
        if(projectile.x-projectile.width/2 > unit.x) return false;
        return true;     
    }

    onProjectileHit(projectile: Projectile, unit: Phaser.Physics.Arcade.Sprite) : void{
        projectile.disableBody(true, true);
        let parentUnit;
        if (unit instanceof Phaser.Physics.Arcade.Sprite){
                parentUnit = unit.getData('parent');
                if(parentUnit instanceof Unit){
                    parentUnit.takeDamage(projectile.damage);                    
                }
        }
    }

    create ()
    {       
        // Setup the game screen
        this.scene.launch('UI'); // Starts the UI scene on top of the game scene
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x00ff00);
        this.background = this.add.image(0,0, 'background');
        this.background.setOrigin(0,0);
        this.ground = this.add.image(0,650, 'ground');
        this.ground.setOrigin(0,0);
        //this.physics.world.setBounds(0, 0, 500, 500);

        // Create the Arrow pool for each side
        this.redArrows = this.physics.add.group({
            classType: Arrow,
            maxSize: 50,
            runChildUpdate: true
        });
        this.blueArrows = this.physics.add.group({
            classType: Arrow,
            maxSize: 50,
            runChildUpdate: true
        });

        this.createPlayers();

        // Add collision between Arrows and opposing units
        this.physics.add.overlap(this.redArrows, this.blueUnitsPhysics, this.onProjectileHit as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, this.beforeRedProjectileHit as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, this);
        this.physics.add.overlap(this.blueArrows, this.redUnitsPhysics, this.onProjectileHit as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, this.beforeBlueProjectileHit as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, this);

        // Add collision between friendly units
        this.physics.add.collider(this.redUnitsPhysics, this.redUnitsPhysics, this.handleUnitCollision, undefined, this);
        this.physics.add.collider(this.blueUnitsPhysics, this.blueUnitsPhysics, this.handleUnitCollision, undefined, this);
        // Add collision when hostile
        this.physics.add.collider(this.redUnitsPhysics, this.blueUnitsPhysics, this.handleUnitCollision, undefined, this);

        //Listen to events from UI scene
        eventsCenter.on('spawn-red-unit', (unitType : string) => {
            console.log(`%cTrying to spawn red ${unitType}`, "color: red");
            this.playerRed.addUnitToQueue(unitType);
            
        });
        eventsCenter.on('spawn-blue-unit', (unitType : string) => {
            console.log(`%cTrying to spawn blue ${unitType}`, "color: blue");
            this.playerBlue.addUnitToQueue(unitType);
        });
    }

    update(time: any, delta: number){
        // Every update look thru all units in the game and remove dead ones
        this.redUnitsPhysics.getChildren().forEach((child) => {
            const unit = child as Unit;
            if (!unit.isAlive()) {
                unit.destroy();
            }
        });

        // Clean up the blue units group
        this.blueUnitsPhysics.getChildren().forEach((child) => {
            const unit = child as Unit;
            if (!unit.isAlive()) {
                unit.destroy();
            }
        });

        // Release next unit from each player's queue if spawn points are free and minimum cooldown along with minimum amount of frames has passed
        this.redSpawnTime -= delta;
        if(this.framesSinceRedSpawn < 3) this.framesSinceRedSpawn++;
        this.blueSpawnTime -= delta;
        if(this.framesSinceBlueSpawn < 3) this.framesSinceBlueSpawn++;

        if(!this.playerRed.playerBase.isBlocked() && this.playerRed.unitQueue.length > 0 && this.redSpawnTime <= 0 && this.framesSinceRedSpawn >= 3){
            console.log("%cSpawning red unit", "color: red");
            this.playerRed.spawnUnit(this.playerRed.unitQueue[0]);
            this.playerRed.unitQueue.shift();
            this.redSpawnTime = this.spawnDelay;
            this.framesSinceRedSpawn = 0;
        }
        if(!this.playerBlue.playerBase.isBlocked() && this.playerBlue.unitQueue.length > 0 && this.blueSpawnTime <= 0 && this.framesSinceBlueSpawn >= 3){
            console.log("%cSpawning blue unit", "color: blue");
            this.playerBlue.spawnUnit(this.playerBlue.unitQueue[0]);
            this.playerBlue.unitQueue.shift();
            this.blueSpawnTime = this.spawnDelay;
            this.framesSinceBlueSpawn = 0;
        }
    }
}
