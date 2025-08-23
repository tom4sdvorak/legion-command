import { PlayerBase } from "./PlayerBase";
import { Unit } from "./units/Unit";
import { UnitProps } from "./helpers/UnitProps";
import { ObjectPool } from "./helpers/ObjectPool";
import { devConfig } from "./helpers/DevConfig";
import { UnitConfigLoader } from "./helpers/unitConfigLoader";
import { ResourceComponent } from "./components/ResourceComponent";

export class Player {
    public playerBase: PlayerBase;
    public faction: 'red' | 'blue';
    public spawnPosition: Phaser.Math.Vector2;
    private resourceComponent: ResourceComponent;
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
    configLoader: UnitConfigLoader;

    constructor(scene: Phaser.Scene, faction: 'red' | 'blue', ownUnitsPhysics: Phaser.Physics.Arcade.Group,
            enemyUnitsPhysics: Phaser.Physics.Arcade.Group, projectiles: Phaser.Physics.Arcade.Group,
            objectPool: ObjectPool, baseGroup: Phaser.GameObjects.Group, configLoader: UnitConfigLoader) {
        this.configLoader = configLoader;
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
        this.resourceComponent = new ResourceComponent(this);
    }

    public addUnitToQueue(unitType: string) {
        //this.unitQueue.push(unitType);
        this.unitQueue.push(unitType);
        let cost = this.configLoader.getUnitProps(unitType).cost;
        this.deduceMoney(cost);     
    }

    public getUnitQueue() {
        return this.unitQueue;
    }

    public getMoney() {
        return this.resourceComponent.getMoney();
    }

    public addMoney(amount: number) {
        this.resourceComponent.addMoney(amount);
    }

    public deduceMoney(amount: number) {
        this.resourceComponent.removeMoney(amount);
    }

    public canAfford(amount: number) {
        return this.resourceComponent.hasEnoughMoney(amount);
    }

    public getUnitCost(unitType: string) {
        return this.configLoader.getUnitProps(unitType).cost;
    }

    public getHealth(absolute: boolean = true) {
        if(absolute) return this.playerBase.health;
        else return this.playerBase.health / this.playerBase.maxHealth;
    }

    // Sets passive (per second) income to amount (if override is true) or by default it increases income by the amount (if override is false)
    public changePassiveIncome(amount: number, override: boolean = false): void {
        if(override) this.resourceComponent.setPassiveIncome(amount);
        else this.resourceComponent.setPassiveIncome(this.resourceComponent.getPassiveIncome() + amount);
    }

    public update(time: any, delta: number): void {
        // Release next unit from player's queue if spawn points are free and minimum cooldown along with minimum amount of frames has passed
        this.spawnTime -= delta;
        if(this.framesSinceSpawn < 3) this.framesSinceSpawn++;

        this.resourceComponent.update(time, delta);

        if(!this.playerBase.isBlocked() && this.unitQueue.length > 0 && this.spawnTime <= 0 && this.framesSinceSpawn >= 3){
            if(devConfig.consoleLog) console.log(`Spawning ${this.faction} ${this.unitQueue[0]} unit`);
            this.spawnUnit(this.unitQueue[0]);
            this.unitQueue.shift();
            this.spawnTime = this.spawnDelay;
            this.framesSinceSpawn = 0;
        }
    }
    
    public spawnUnit (unitType: string) : Unit
    {
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
            // Load base unit properties from JSON
            let newUnitProps = this.configLoader.getUnitProps(unitType);
            
            /* Add current data to unitProps to spawn unit correctly:
                x: this.spawnPosition.x,
                y: this.spawnPosition.y, 
                faction: this.faction, 
                unitID: this.unitCounter,
            */
            newUnitProps.x = this.spawnPosition.x;
            newUnitProps.y = this.spawnPosition.y;
            newUnitProps.faction = this.faction;
            newUnitProps.unitID = this.unitCounter;

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
