import { PlayerBase } from "./PlayerBase";
import { Unit } from "./units/Unit";
import { ObjectPool } from "./helpers/ObjectPool";
import { devConfig } from "./helpers/DevConfig";
import { UnitConfigLoader } from "./helpers/UnitConfigLoader";
import { ResourceComponent } from "./components/ResourceComponent";
import eventsCenter from './EventsCenter';
import { UnitProps } from "./helpers/UnitProps";
import { UnitUpgrade } from "./helpers/UnitUpgrade";

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
    //unitQueue: string[] = [];
    nextUnit: string = '';
    objectPool: ObjectPool;
    baseGroup: Phaser.GameObjects.Group;
    spawnTime: number = 0;
    spawnBarSize: number = 0;
    framesSinceSpawn: number = 0;
    configLoader: UnitConfigLoader;
    isSpawning: boolean = false;
    level: number = 0;
    public selectedUnits: Array<{unitType: string, unitConfig: UnitProps}> = [];
    public unitsUpgrades: Array<{unitType: string, upgrades: UnitUpgrade[]}> = [];

    constructor(scene: Phaser.Scene, faction: 'red' | 'blue', playerBase: PlayerBase, spawnPosition: Phaser.Math.Vector2, ownUnitsPhysics: Phaser.Physics.Arcade.Group,
        enemyUnitsPhysics: Phaser.Physics.Arcade.Group, projectiles: Phaser.Physics.Arcade.Group,
        objectPool: ObjectPool, baseGroup: Phaser.GameObjects.Group, configLoader: UnitConfigLoader, selectedUnits: string[]) {
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
        selectedUnits.forEach(unitType => {
            this.selectedUnits.push({
                unitType: unitType,
                unitConfig: this.configLoader.getUnitProps(unitType)
            });
            this.unitsUpgrades.push({
                unitType: unitType,
                upgrades: []
            })
        });

        eventsCenter.on('unit-died', (unitFaction: string) => {
            if(unitFaction !== this.faction) this.gainXP(50);
        }, this);
    }

    public addUnitToQueue(unitType: string) {
        //this.unitQueue.push(unitType);
        this.nextUnit = unitType;
        let cost = this.configLoader.getUnitProps(unitType).cost;
        this.deduceMoney(cost);     
    }

    public getUnitQueue() {
        return this.nextUnit;
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

    public getUnitSpawnTime(unitType: string) {
        return this.configLoader.getUnitProps(unitType).spawnTime;
    }

    public getHealth(absolute: boolean = true) {
        if(absolute) return this.playerBase.getCurrentHealth();
        else return this.playerBase.getCurrentHealth() / this.playerBase.getMaxHealth();
    }

    public getLevel() : number {
       return this.level;
    }

    public gainXP(amount: number) {
        this.resourceComponent.addXP(amount);
    }

    public nextLevelXP() : number{
        return this.resourceComponent.getMaxXP();
    }

    public setNextLevelXP(amount: number) : void {
        this.resourceComponent.setMaxXP(amount);
    }

    public levelUp(unit: string, upgrade: UnitUpgrade) : void {
        this.resourceComponent.setMaxXP(this.resourceComponent.getMaxXP() * 1.5); // Increase next level up xp by 50%
        this.level++;
        eventsCenter.emit('xp-changed', this.faction, this.resourceComponent.getXP());
        this.unitsUpgrades.find(unitUpgrades => unitUpgrades.unitType === unit)?.upgrades?.push(upgrade);
    }

    public getUnitStats(unitType: string) {
        // Get base stats of the chosen unit
        const baseStats : UnitProps = this.selectedUnits.find(unit => unit.unitType === unitType)!.unitConfig;

        interface UnitModifier {
            stat: keyof UnitProps; 
            type: 'flat' | 'percent'; 
            value: number;
        }

        // Get list of upgrades for specified unit then extract just the effect objects from it
        const unitUpgrades = this.unitsUpgrades.find(unitUpgrades => unitUpgrades.unitType === unitType)?.upgrades || [];
        const allUpgradeEffects = unitUpgrades.flatMap((upgrade: UnitUpgrade) => upgrade.effects);

        //Split extracted effects to flat bonuses and percentage bonuses
        const flatUpgrades : UnitModifier[]  = allUpgradeEffects.filter((effect: { stat: string; type: string; value: number; }) => effect.type === 'flat') as UnitModifier[]; 
        const percentUpgrades : UnitModifier[] = allUpgradeEffects.filter((effect: { stat: string; type: string; value: number; }) => effect.type === 'percent') as UnitModifier[];

        // Calculate new stats starting with base stats and increasing them directly by flat upgrades
        const newStats = flatUpgrades.reduce((acc, modifier : UnitModifier) => {
            const newAcc = {...acc};
            const currentStat = modifier.stat;
            const baseValue = (newAcc[currentStat] as number) ?? 0;

            if (typeof baseValue === 'number' && modifier.type === 'flat') {
                (newAcc[currentStat] as number) = baseValue + modifier.value;
            }

            return newAcc;
        }, {...baseStats});

        // Calculate percentage bonuses for each stat by adding them together
        const percentageTotals: Partial<Record<keyof UnitProps, number>> = {};
        percentUpgrades.forEach((modifier) => {
            const stat = modifier.stat;
            // Accumulate the percentage bonuses
            percentageTotals[stat] = (percentageTotals[stat] || 0) + modifier.value;
        });

        let finalStats: UnitProps = { ...newStats }; // Start with the flat-modified stats

        // Apply the percentage bonuses
        for (const stat in percentageTotals) {
            if (percentageTotals.hasOwnProperty(stat)) {
                const currentStat = stat as keyof UnitProps;
                const totalBonus = percentageTotals[currentStat]!;

                // The multiplier is 1 + totalBonus
                const multiplier = 1 + totalBonus; 
                
                const currentValue = (finalStats[currentStat] as number) ?? 0;

                if (typeof currentValue === 'number') {
                    // Apply the single multiplier and floor it down to next integer
                    (finalStats[currentStat] as number) = Math.floor(currentValue * multiplier);
                }
            }
        }
        return finalStats;
    }

    // Sets passive (per second) income to amount (if override is true) or by default it increases income by the amount (if override is false)
    public changePassiveIncome(amount: number, override: boolean = false): void {
        if(override) this.resourceComponent.setPassiveIncome(amount);
        else this.resourceComponent.setPassiveIncome(this.resourceComponent.getPassiveIncome() + amount);
    }

    public update(time: any, delta: number): void {

        // If we are spawning, reduce spawn timer by delta and increase counter of frames since last spawn
        if(this.isSpawning){
            this.spawnTime -= delta;
            if(this.spawnTime < 0) this.spawnTime = 0;
            if(this.framesSinceSpawn < 3) this.framesSinceSpawn++;
        }

        // If there is unit in queue and base is not busy spawning one, setup new spawn timer and start spawning
        if(this.nextUnit !== '' && !this.isSpawning){
            this.spawnTime = this.configLoader.getUnitProps(this.nextUnit).spawnTime;
            this.isSpawning = true;
            this.spawnBarSize = this.spawnTime;
        }
        
        // If spawntime has been reduced below zero and base is not blocked, release the unit
        if(!this.playerBase.isBlocked() && this.isSpawning && this.nextUnit !== '' && this.spawnTime <= 0 && this.framesSinceSpawn >= 3){
            if(devConfig.consoleLog) console.log(`Spawning ${this.faction} ${this.nextUnit} unit`);
            eventsCenter.emit('unit-spawned', this.faction, this.nextUnit);
            this.spawnUnit(this.nextUnit);
            this.nextUnit = '';
            this.spawnTime = 999999;
            this.framesSinceSpawn = 0;
            this.isSpawning = false;
        }

        
    }
    
    public spawnUnit (unitType: string) : Unit
    {
        let unit : Unit;
        let pool: Phaser.Physics.Arcade.Group;
        let projectilePool: Phaser.Physics.Arcade.Group | null;           
        switch (unitType) {
            case 'warrior':
                pool = this.objectPool.units.warriors;
                projectilePool = null;
                unit = pool.get();
                unit.setBodySize(64, 128, true);
                break;
            case 'archer':
                pool = this.objectPool.units.archers;
                projectilePool = this.objectPool.projectiles.arrows;
                unit = pool.get();
                unit.setBodySize(64, 128, true);
                break;
            case 'healer':
                pool = this.objectPool.units.healers;
                projectilePool = null;
                unit = pool.get();
                break;
            case 'fireWorm':
                pool = this.objectPool.units.fireWorms;
                projectilePool = this.objectPool.projectiles.fireballs;
                unit = pool.get();
                break;
            default:
                throw new Error(`Unknown unit type: ${unitType}`);
        }
        if(unit){
            // Load base unit properties from JSON
            let newUnitProps = this.getUnitStats(unitType);
            console.log("New unit stats: " + newUnitProps);
            
            // Add current data to unitProps to spawn unit correctly
   
            newUnitProps.x = this.spawnPosition.x;
            newUnitProps.y = this.spawnPosition.y;
            newUnitProps.faction = this.faction;
            newUnitProps.unitID = this.unitCounter;

            // Spawn unit
            unit.spawn(newUnitProps, this.ownUnitsPhysics, pool, this.enemyUnitsPhysics, this.baseGroup, this.projectiles, projectilePool);
            this.ownUnitsPhysics.add(unit);
            console.log("%cSpawning unit with  id: " + this.unitCounter, `color: ${this.faction}`);
            this.unitCounter++;
            unit.moveForward();
            return unit;
        }
        else{
            throw new Error(`Out of units`);
        }     
    }
}
