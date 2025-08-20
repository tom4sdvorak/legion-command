import { PlayerBase } from "./PlayerBase";
import { Unit } from "./Unit";
import { Warrior } from "./Warrior";
import { Archer } from "./Archer";
import { UnitProps } from "../helpers/UnitProps";
import { ObjectPool } from "../helpers/ObjectPool";

export class Player {
    public playerBase: PlayerBase;
    public faction: 'red' | 'blue';
    public spawnPosition: Phaser.Math.Vector2;
    scene: Phaser.Scene;
    ownUnitsPhysics: Phaser.Physics.Arcade.Group;
    enemyUnitsPhysics: Phaser.Physics.Arcade.Group;
    projectiles: Phaser.Physics.Arcade.Group;
    unitCounter: number = 0;
    unitQueue: String[] = [];
    objectPool: ObjectPool;
    baseGroup: Phaser.GameObjects.Group;

    constructor(scene: Phaser.Scene, faction: 'red' | 'blue', ownUnitsPhysics: Phaser.Physics.Arcade.Group, enemyUnitsPhysics: Phaser.Physics.Arcade.Group, projectiles: Phaser.Physics.Arcade.Group, objectPool: ObjectPool, baseGroup: Phaser.GameObjects.Group) {
        this.scene = scene;
        this.faction = faction;
        if(this.faction === 'blue') { this.spawnPosition = new Phaser.Math.Vector2(scene.scale.gameSize.width-100, 680);} 
        else{this.spawnPosition = new Phaser.Math.Vector2(100, 680);}
        this.ownUnitsPhysics = ownUnitsPhysics;
        this.enemyUnitsPhysics = enemyUnitsPhysics;
        this.projectiles = projectiles;
        this.objectPool = objectPool;
        this.baseGroup = baseGroup;
        this.playerBase = new PlayerBase(this.scene, this.faction, this.spawnPosition,this.enemyUnitsPhysics, this.projectiles, this.objectPool.projectiles.arrows);
    }

    public addUnitToQueue(unitType: String) {
        this.unitQueue.push(unitType);
    }
    
    public spawnUnit (unitType: String) : Unit
    {
        let newUnitProps: UnitProps = {
            x: this.spawnPosition.x,
            y: this.spawnPosition.y, 
            speed: 100, 
            health: 100,
            maxHealth: 100,
            attackDamage: 34, 
            attackRange: 100,
            attackSpeed: 1000, //in ms
            faction: this.faction, 
            unitID: this.unitCounter,
            type: 'melee'
        }
        let unit : Unit;
        let pool: Phaser.Physics.Arcade.Group;
        switch (unitType) {
            case 'warrior':
                pool = this.objectPool.units.warriors;
                unit = pool.get();
                break;
            case 'archer':
                newUnitProps.type = 'ranged';
                pool = this.objectPool.units.archers;
                unit = pool.get();
                break;
            default:
                throw new Error(`Unknown unit type: ${unitType}`);
        }
        if(unit){
            unit.spawn(newUnitProps, this.ownUnitsPhysics, pool, this.enemyUnitsPhysics, this.baseGroup, this.projectiles,this.objectPool.projectiles.arrows);
            console.log("%cSpawning unit with  id: " + this.unitCounter, `color: ${this.faction}`);
            this.unitCounter++;
            unit.moveForward();
            return unit;
        }
        else{
            throw new Error(`No units left`);
        }     
    }
}
