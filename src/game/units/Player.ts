import { PlayerBase } from "./PlayerBase";
import { Unit } from "./Unit";
import { UnitProps } from "../helpers/UnitProps";
import { ObjectPool } from "../helpers/ObjectPool";
import { devConfig } from "../helpers/devConfig";

export class Player {
    public playerBase: PlayerBase;
    public faction: 'red' | 'blue';
    public spawnPosition: Phaser.Math.Vector2;
    scene: Phaser.Scene;
    ownUnitsPhysics: Phaser.Physics.Arcade.Group;
    enemyUnitsPhysics: Phaser.Physics.Arcade.Group;
    projectiles: Phaser.Physics.Arcade.Group;
    unitCounter: number = 0;
    unitQueue: string[] = [];
    objectPool: ObjectPool;
    baseGroup: Phaser.GameObjects.Group;
    spawnTime: number = 0;
    spawnDelay: number = 1000;
    framesSinceSpawn: number = 0;

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

    public addUnitToQueue(unitType: string) {
        this.unitQueue.push(unitType);
    }

    public getUnitQueue() {
        return this.unitQueue;
    }

    public update(time: any, delta: number): void {
        // Release next unit from player's queue if spawn points are free and minimum cooldown along with minimum amount of frames has passed
        this.spawnTime -= delta;
        if(this.framesSinceSpawn < 3) this.framesSinceSpawn++;

        if(!this.playerBase.isBlocked() && this.unitQueue.length > 0 && this.spawnTime <= 0 && this.framesSinceSpawn >= 3){
            if(devConfig.consoleLog) console.log(`%cSpawning ${this.faction} ${this.unitQueue[0]} unit`, "color: red");
            this.spawnUnit(this.unitQueue[0]);
            this.unitQueue.shift();
            this.spawnTime = this.spawnDelay;
            this.framesSinceSpawn = 0;
        }
    }
    
    public spawnUnit (unitType: string) : Unit
    {
        let newUnitProps: UnitProps = {
            x: this.spawnPosition.x,
            y: this.spawnPosition.y, 
            speed: 100, 
            health: 100,
            maxHealth: 100,
            attackDamage: 34, 
            attackRange: 200,
            attackSpeed: 1000, //in ms
            specialDamage: 10,
            specialRange: 100,
            specialSpeed: 1000, //in ms
            faction: this.faction, 
            unitID: this.unitCounter,
        }
        let unit : Unit;
        let pool: Phaser.Physics.Arcade.Group;
        switch (unitType) {
            case 'warrior':
                pool = this.objectPool.units.warriors;
                unit = pool.get();
                break;
            case 'archer':
                pool = this.objectPool.units.archers;
                unit = pool.get();
                break;
            case 'healer':
                pool = this.objectPool.units.healers;
                unit = pool.get();
                break;
            default:
                throw new Error(`Unknown unit type: ${unitType}`);
        }
        if(unit){
            unit.spawn(newUnitProps, this.ownUnitsPhysics, pool, this.enemyUnitsPhysics, this.baseGroup, this.projectiles,this.objectPool.projectiles.arrows);
            this.ownUnitsPhysics.add(unit);
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
