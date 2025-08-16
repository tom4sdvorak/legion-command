import { Scene } from 'phaser';
import eventsCenter from '../EventsCenter';
import { Player } from '../units/Player';
import { Unit } from '../units/Unit';

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
        this.playerRed = new Player(this, 'red', this.redUnitsPhysics, this.blueUnitsPhysics);
        this.playerBlue = new Player(this, 'blue', this.blueUnitsPhysics, this.redUnitsPhysics);
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

    create ()
    {       
        // Setup the game screen
        this.scene.launch('UI');
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x00ff00);
        this.background = this.add.image(0,0, 'background');
        this.background.setOrigin(0,0);
        this.ground = this.add.image(0,650, 'ground');
        this.ground.setOrigin(0,0);
        this.physics.world.setBounds(0, 0, 500, 500);
        this.createPlayers();
        //this.unitsPhysics = this.physics.add.group();

        // Add collision between friendly units
        this.physics.add.collider(this.redUnitsPhysics, this.redUnitsPhysics, this.handleUnitCollision, undefined, this);
        this.physics.add.collider(this.blueUnitsPhysics, this.blueUnitsPhysics, this.handleUnitCollision, undefined, this);
        // Add collision when hostile
        this.physics.add.collider(this.redUnitsPhysics, this.blueUnitsPhysics, this.handleUnitCollision, undefined, this);

        //Listen to events from UI scene
        eventsCenter.on('spawn-red-unit', () => {
            console.log("%cTrying to spawn red unit", "color: red");
            this.playerRed.addUnitToQueue("unit");
            
        });
        eventsCenter.on('spawn-blue-unit', () => {
            console.log("%cTrying to spawn blue unit", "color: blue");
            this.playerBlue.addUnitToQueue("unit");
        });
    }

    update(time: any, delta: number){
        // Every update look thru all units in the game and remove dead ones
        this.playerRed.units = this.playerRed.units.filter((unit) => {
            if (!unit.isAlive()) {
                unit.destroy();
                return false;
            }
            return true;
        });
        this.playerBlue.units = this.playerBlue.units.filter((unit) => {
            if (!unit.isAlive()) {
                unit.destroy();
                return false;
            }
            return true;
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
