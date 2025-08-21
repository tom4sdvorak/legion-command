import { Scene } from 'phaser';
import eventsCenter from '../EventsCenter';
import { Player } from '../units/Player';
import { Unit } from '../units/Unit';
import { Arrow } from '../projectiles/Arrow';
import { Projectile } from '../projectiles/Projectile';
import { ObjectPool } from '../helpers/ObjectPool';
import { PlayerBase } from '../units/PlayerBase';
import { Archer } from '../units/Archer';
import { Warrior } from '../units/Warrior';
import { Healer } from '../units/Healer';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    ground: Phaser.GameObjects.Image;
    playerRed: Player;
    playerBlue: Player;
    redUnitsPhysics: Phaser.Physics.Arcade.Group;
    blueUnitsPhysics: Phaser.Physics.Arcade.Group;
    redProjectiles: Phaser.Physics.Arcade.Group;
    blueProjectiles: Phaser.Physics.Arcade.Group;
    objectPool: ObjectPool;
    blueCollider: Phaser.Physics.Arcade.Collider;
    redCollider: Phaser.Physics.Arcade.Collider;
    hostileCollider: Phaser.Physics.Arcade.Collider;
    baseGroup: Phaser.GameObjects.Group;
    


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

        //this.unitsPhysics = this.physics.add.group({allowGravity: false});
        this.playerRed = new Player(this, 'red', this.redUnitsPhysics, this.blueUnitsPhysics, this.redProjectiles, this.objectPool, this.baseGroup);
        this.playerBlue = new Player(this, 'blue', this.blueUnitsPhysics, this.redUnitsPhysics, this.blueProjectiles, this.objectPool, this.baseGroup);
        this.baseGroup.add(this.playerRed.playerBase);
        this.baseGroup.add(this.playerBlue.playerBase);
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
        if(base instanceof PlayerBase && unit instanceof Unit){
            unit.handleCollision(base);
        }
        else{
            throw new Error(`Collision between unfamiliar types ${base} and ${unit}`);
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
        this.physics.add.overlap(this.playerBlue.playerBase, this.redProjectiles, this.onProjectileHit as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, this.beforeRedProjectileHit as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, this);
        this.physics.add.overlap(this.playerRed.playerBase,this.blueProjectiles, this.onProjectileHit as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, this.beforeBlueProjectileHit as unknown as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, this);
        
        // Add collision between friendly units
        this.redCollider = this.physics.add.collider(this.redUnitsPhysics, this.redUnitsPhysics, this.handleUnitCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
        this.blueCollider = this.physics.add.collider(this.blueUnitsPhysics, this.blueUnitsPhysics, this.handleUnitCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
        
        // Add collision when hostile
        this.hostileCollider = this.physics.add.collider(this.redUnitsPhysics, this.blueUnitsPhysics, this.handleUnitCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);

        // Add collision with hostile base
        this.physics.add.collider(this.redUnitsPhysics, this.playerBlue.playerBase, this.handleBaseCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
        this.physics.add.collider(this.blueUnitsPhysics, this.playerRed.playerBase, this.handleBaseCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
    }

    gameOver(faction: string){
        this.scene.stop('UI');
        this.scene.start('GameOver', {"faction" : faction});
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

        // Create unit and projectile pools
        this.setupObjectPools();
        this.createPlayers();
        this.setupColliders();
        
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
        })
    }

    update(time: any, delta: number){

        // Run update methods of each player
        this.playerBlue.update(time, delta);
        this.playerRed.update(time, delta);
    }
}
