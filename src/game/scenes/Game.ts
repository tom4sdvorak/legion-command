import { Scene } from 'phaser';
import eventsCenter from '../EventsCenter';
import { PlayerBase } from '../units/PlayerBase';
import { Warrior } from '../units/Warrior';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    ground: Phaser.GameObjects.Image;
    redBase: PlayerBase;
    blueBase: PlayerBase;
    redUnitsPhysics: Phaser.Physics.Arcade.Group;
    blueUnitsPhysics: Phaser.Physics.Arcade.Group;
    unitsPhysics: Phaser.Physics.Arcade.Group;
    redBasePhysics: Phaser.Physics.Arcade.Group;
    blueBasePhysics: Phaser.Physics.Arcade.Group;
    warriors: Warrior[] = [];
    resumeTimer: Phaser.Time.TimerEvent | null = null;
    unitCounter: number = 0;


    constructor ()
    {
        super('Game');
    }

    spawnUnit (unit: String, faction: String)
    {
        let warrior: Warrior;

        if(faction === 'red'){
            // x, y, speed, attack damage, health
            warrior = new Warrior(this, this.redBase.getPosition()[0], this.redBase.getPosition()[1]+70, 100, 10, 100, 'red', this.unitCounter);
            this.redUnitsPhysics.add(warrior.sprite);
            
        }
        else{
            warrior = new Warrior(this, this.blueBase.getPosition()[0], this.blueBase.getPosition()[1]+70, 100, 10, 100, 'blue', this.unitCounter);
            this.blueUnitsPhysics.add(warrior.sprite);
        }
        this.unitsPhysics.add(warrior.sprite);
        this.warriors.push(warrior);
        this.unitCounter++;
        warrior.moveForward();
    }

    createBases(){
        
        this.redBase = new PlayerBase(this, 'red', this.blueUnitsPhysics);
        this.blueBase = new PlayerBase(this, 'blue', this.redUnitsPhysics);
        
        this.redUnitsPhysics.add(this.redBase.sprite);
        this.blueUnitsPhysics.add(this.blueBase.sprite);

    }

    create ()
    {      
        this.scene.launch('UI');
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x00ff00);
        this.background = this.add.image(0,0, 'background');
        this.background.setOrigin(0,0);
        this.ground = this.add.image(0,650, 'ground');
        this.ground.setOrigin(0,0);
        this.blueUnitsPhysics = this.physics.add.group({allowGravity: false});
        this.redUnitsPhysics = this.physics.add.group({allowGravity: false});
        this.unitsPhysics = this.physics.add.group();
        this.physics.world.setBounds(0, 0, 500, 500);
        this.createBases();

        // Handles collision between all units (of all factions)
        this.physics.add.collider(this.unitsPhysics, this.unitsPhysics, (unit1, unit2) => {
            let parentUnit1, parentUnit2;
            if (unit1 instanceof Phaser.Physics.Arcade.Sprite){
                parentUnit1 = unit1.getData('parent');    
            }
            if (unit2 instanceof Phaser.Physics.Arcade.Sprite){
                parentUnit2 = unit2.getData('parent');
            }
            parentUnit1.handleCollision(parentUnit2);
            parentUnit2.handleCollision(parentUnit1);
        });

        this.physics.add.collider(this.redUnitsPhysics, this.blueUnitsPhysics);
        eventsCenter.on('spawn-red-warrior', () => {
            this.spawnUnit("warrior", "red");
        });
        eventsCenter.on('spawn-blue-warrior', () => {
            this.spawnUnit("warrior", "blue");
        });
    }

    update(){
        this.warriors = this.warriors.filter((warrior) => {
            if (!warrior.isAlive()) {
                warrior.destroy();
                return false;
            }
            return true;
        });

        
        this.warriors.forEach((warrior) => {
            warrior.handleState();
        });

    }
}
