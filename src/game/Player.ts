import { PlayerBase } from "./PlayerBase";
import { Unit } from "./units/Unit";
import { ObjectPool } from "./helpers/ObjectPool";
import { devConfig } from "./helpers/DevConfig";
import { UnitConfigLoader } from "./helpers/UnitConfigLoader";
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
    spawnBarSize: number = 0;
    framesSinceSpawn: number = 0;
    configLoader: UnitConfigLoader;
    isSpawning: boolean = false;
    spawnTimerRectangle: Phaser.GameObjects.Rectangle;

    constructor(scene: Phaser.Scene, faction: 'red' | 'blue', playerBase: PlayerBase, spawnPosition: Phaser.Math.Vector2, ownUnitsPhysics: Phaser.Physics.Arcade.Group,
        enemyUnitsPhysics: Phaser.Physics.Arcade.Group, projectiles: Phaser.Physics.Arcade.Group,
        objectPool: ObjectPool, baseGroup: Phaser.GameObjects.Group, configLoader: UnitConfigLoader) {
        this.configLoader = configLoader;
        this.spawnPosition = spawnPosition;
        this.scene = scene;
        this.faction = faction;
        this.ownUnitsPhysics = ownUnitsPhysics;
        this.enemyUnitsPhysics = enemyUnitsPhysics;
        this.projectiles = projectiles;
        this.objectPool = objectPool;
        this.baseGroup = baseGroup;
        this.playerBase = playerBase;
        this.resourceComponent = new ResourceComponent(this);
    }

    public addUnitToQueue(unitType: string) {
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
        this.resourceComponent.update(time, delta);

        // If we are spawning, reduce spawn timer by delta and increase counter of frames since last spawn
        if(this.isSpawning){
            this.spawnTime -= delta;
            if(this.spawnTime < 0) this.spawnTime = 0;
            if(this.framesSinceSpawn < 3) this.framesSinceSpawn++;
            this.spawnTimerRectangle.setScale(this.spawnTime/this.spawnBarSize, 1);
        }

        // If there is unit in queue and base is not busy spawning one, setup new spawn timer and start spawning
        if(this.unitQueue.length > 0 && !this.isSpawning){
            this.spawnTime = this.configLoader.getUnitProps(this.unitQueue[0]).spawnTime;
            this.isSpawning = true;
            this.spawnBarSize = this.spawnTime;
            if(!this.spawnTimerRectangle) { // Add loading bar if it doesn't exist that shows the spawn timer
                this.spawnTimerRectangle = this.scene.add.rectangle(this.playerBase.x, this.playerBase.y-50, this.playerBase.width/2, 10, 0xff0000).setDepth(1).setAlpha(1);
            }
        }
        
        // If spawntime has been reduced below zero and base is not blocked, release the unit
        if(!this.playerBase.isBlocked() && this.isSpawning &&this.unitQueue.length > 0 && this.spawnTime <= 0 && this.framesSinceSpawn >= 3){
            if(devConfig.consoleLog) console.log(`Spawning ${this.faction} ${this.unitQueue[0]} unit`);
            this.spawnUnit(this.unitQueue[0]);
            this.unitQueue.shift();
            this.spawnTime = 999999;
            this.framesSinceSpawn = 0;
            this.isSpawning = false;
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
                unit.setBodySize(64, 128, true);
                break;
            case 'archer':
                pool = this.objectPool.units.archers;
                unit = pool.get();
                unit.setBodySize(64, 128, true);
                break;
            case 'healer':
                pool = this.objectPool.units.healers;
                unit = pool.get();
                break;
            case 'fireWorm':
                pool = this.objectPool.units.fireWorms;
                unit = pool.get();
                break;
            default:
                throw new Error(`Unknown unit type: ${unitType}`);
        }
        if(unit){
            // Load base unit properties from JSON
            let newUnitProps = this.configLoader.getUnitProps(unitType);
            
            // Add current data to unitProps to spawn unit correctly
   
            newUnitProps.x = this.spawnPosition.x;
            newUnitProps.y = this.spawnPosition.y;
            newUnitProps.faction = this.faction;
            newUnitProps.unitID = this.unitCounter;

            // Spawn unit
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
