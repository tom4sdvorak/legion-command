import { PlayerBase } from "../PlayerBase";
import { Unit } from "../units/Unit";
import { ObjectPool } from "../helpers/ObjectPool";
import { devConfig } from "../helpers/DevConfig";
import { UnitConfigLoader } from "../helpers/UnitConfigLoader";
import { ResourceComponent } from "./ResourceComponent";
import eventsCenter from '../EventsCenter';
import { UnitProps } from "../helpers/UnitProps";
import { TotalEffect, UpgradeManager } from "../helpers/UpgradeManager";

export class PlayerController {   
    public playerBase: PlayerBase;
    public spawnPosition: Phaser.Math.Vector2;
    protected resourceComponent: ResourceComponent;
    protected unitQueueMaxSize: number = 10;
    public faction : 'red' | 'blue';
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
    public selectedUnits: Map<string, {unitConfig: UnitProps, upgrades: string[]}> = new Map();
    upgradeManager: UpgradeManager;
    potionID: string | undefined = undefined;
    //public unitsUpgrades: Array<{unitType: string, upgrades: UnitUpgrade[]}> = [];

    constructor(scene: Phaser.Scene, playerBase: PlayerBase, spawnPosition: Phaser.Math.Vector2, ownUnitsPhysics: Phaser.Physics.Arcade.Group,
        enemyUnitsPhysics: Phaser.Physics.Arcade.Group, projectiles: Phaser.Physics.Arcade.Group,
        objectPool: ObjectPool, baseGroup: Phaser.GameObjects.Group, configLoader: UnitConfigLoader, selectedUnits: string[]) {
        this.configLoader = configLoader;
        this.spawnPosition = spawnPosition;
        this.scene = scene;
        this.ownUnitsPhysics = ownUnitsPhysics;
        this.enemyUnitsPhysics = enemyUnitsPhysics;
        this.projectiles = projectiles;
        this.objectPool = objectPool;
        this.baseGroup = baseGroup;
        this.playerBase = playerBase;
        this.resourceComponent = new ResourceComponent(this);
        this.upgradeManager = UpgradeManager.getInstance();

        /* Save base stats of all selected units */
        selectedUnits.forEach(unitType => {
            this.selectedUnits.set(unitType, {unitConfig: this.configLoader.getUnitProps(unitType), upgrades: []});
        });
    }

    destroy() {

    }

    public addUnitToQueue(unitType: string) {
        if(this.unitQueue.length >= this.unitQueueMaxSize) return;
        this.unitQueue.push(unitType);
        let cost = this.getUnitCost(unitType);
        this.deduceMoney(cost);     
    }

    public addUpgrade(unitType: string, upgrade: string | string[]) {
        if(unitType === null || unitType === undefined) return;
        const upgradeIDs = Array.isArray(upgrade) ? upgrade : [upgrade]; // If just one upgradeID, turn it to array of single string
        if(unitType === 'ALL'){
            this.selectedUnits.forEach((value, key) => {
                value.upgrades.push(...upgradeIDs); 
            });
        }
        else{
            this.selectedUnits.get(unitType)?.upgrades.push(...upgradeIDs);
        }
    }

    public addMoney(amount: number) {
        this.resourceComponent.addMoney(amount);
    }

    public deduceMoney(amount: number) {
        this.resourceComponent.removeMoney(amount);
    }    

    public getUnitStats(unitType: string) {
        // Get base stats of the chosen unit
        const baseStats : UnitProps = this.selectedUnits.get(unitType)?.unitConfig || this.configLoader.getUnitProps(unitType);
        // Get all upgrades of the chosen unit
        const unitUpgrades : Record<string, TotalEffect> = this.upgradeManager.calculateEffects(this.selectedUnits.get(unitType)?.upgrades || [], 'unit', this.potionID);
        const newStats : UnitProps = {...baseStats};
        for (const stat in unitUpgrades) {
            const statEffect = unitUpgrades[stat] ?? { flat: 0, percent: 0, specialValue: undefined };
            if(stat in newStats && typeof newStats[stat as keyof UnitProps] !== null){
                if(typeof newStats[stat as keyof UnitProps] === 'number'){
                    (newStats[stat as keyof UnitProps] as number) = Math.floor(((newStats[stat as keyof UnitProps] as number) + statEffect.flat) * (1+statEffect.percent));
                }
                else if(typeof newStats[stat as keyof UnitProps] === 'boolean'){
                    if (statEffect.specialValue === 'special') {
                        (newStats[stat as keyof UnitProps] as boolean) = true;
                    }
                }
            }
        }

        return newStats;

        /*interface UnitModifier {
            stat: keyof UnitProps; 
            type: 'flat' | 'percent'; 
            value: number;
        }

        // Get list of upgrades for specified unit then extract just the effect objects from it
        const unitUpgrades = this.unitsUpgrades.find(unitUpgrades => unitUpgrades.unitType === unitType)?.upgrades || [];
        const allUpgradeEffects = unitUpgrades.flatMap((upgrade: UnitUpgrade) => upgrade.effects);

        // 💡 DEBUGGING CODE: Add this block temporarily
        for (let i = 0; i < allUpgradeEffects.length; i++) {
            const effect = allUpgradeEffects[i];
            if (effect === null || effect === undefined) {
                // This will print the exact location of the invalid data
                console.error(`ERROR: Null/Undefined found at index ${i} in allUpgradeEffects!`);
                console.log("Full array for context:", allUpgradeEffects);
                console.log("Full map for the context:", unitUpgrades);
                console.log("Current potion for the context:", typeof this.scene.registry.get('playerPotion'));
                // You can also add a debugger breakpoint here:
                // debugger; 
            }
        }
        // 💡 END DEBUGGING CODE

        //Split extracted effects to flat bonuses and percentage bonuses
        const flatUpgrades : UnitModifier[]  = allUpgradeEffects.filter((effect: { stat: string; type: string; value: number; }) => effect && effect.type === 'flat') as UnitModifier[]; 
        const percentUpgrades : UnitModifier[] = allUpgradeEffects.filter((effect: { stat: string; type: string; value: number; }) => effect && effect.type === 'percent') as UnitModifier[];

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
        return finalStats;*/
    }

    // Sets passive (per second) income to amount (if override is true) or by default it increases income by the amount (if override is false)
    public changePassiveIncome(amount: number, override: boolean = false): void {
        if(override) this.resourceComponent.setPassiveIncome(amount);
        else this.resourceComponent.setPassiveIncome(this.resourceComponent.getPassiveIncome() + amount);
    }

    public setPotion(potionID: string): void {
        this.potionID = potionID;
    }

    public update(time: any, delta: number): void {
        
        // If we are spawning, reduce spawn timer by delta and increase counter of frames since last spawn
        if(this.isSpawning){
            this.spawnTime -= delta*this.scene.time.timeScale;
            if(this.spawnTime < 0) this.spawnTime = 0;
            if(this.framesSinceSpawn < 3) this.framesSinceSpawn++;
        }

        // If there is unit in queue and base is not busy spawning one, setup new spawn timer and start spawning
        if(this.unitQueue.length > 0 && !this.isSpawning){
            this.spawnTime = this.configLoader.getUnitProps(this.unitQueue[0]).spawnTime;
            this.isSpawning = true;
            this.spawnBarSize = this.spawnTime;
        }
        
        // If spawntime has been reduced below zero and base is not blocked, release the unit
        if(!this.playerBase.isBlocked() && this.isSpawning && this.unitQueue.length > 0 && this.spawnTime <= 0 && this.framesSinceSpawn >= 3){
            if(devConfig.consoleLog) console.log(`Spawning ${this.faction} ${this.unitQueue[0]} unit`);
            eventsCenter.emit('unit-spawned', this.faction, this.unitQueue[0]);
            this.spawnUnit(this.unitQueue[0]);
            this.unitQueue.shift();
            this.spawnTime = 999999;
            this.framesSinceSpawn = 0;
            this.isSpawning = false;
        }        
    }
    
    public spawnUnit (unitType: string) : Unit
    {
        let unit : Unit | null = null;
        let pool: Phaser.Physics.Arcade.Group;
        let projectilePool: Phaser.Physics.Arcade.Group | null;           
        switch (unitType) {
            case 'warrior':
                pool = this.objectPool.units.warriors;
                projectilePool = null;
                break;
            case 'archer':
                pool = this.objectPool.units.archers;
                projectilePool = this.objectPool.projectiles.arrows;
                break;
            case 'wizard':
                pool = this.objectPool.units.wizards;
                projectilePool = this.objectPool.projectiles.purpleBalls;
                break;
            case 'fireWorm':
                pool = this.objectPool.units.fireWorms;
                projectilePool = this.objectPool.projectiles.fireballs;
                break;
            case 'gorgon':
                pool = this.objectPool.units.gorgons;
                projectilePool = null;
                break;
            case 'minotaur':
                pool = this.objectPool.units.minotaurs;
                projectilePool = null;
                break;
            case 'kitsune':
                pool = this.objectPool.units.kitsunes;
                projectilePool = this.objectPool.projectiles.purpleBalls;
                break;
            default:
                throw new Error(`Unknown unit type: ${unitType}`);
        }
        while(!unit){
            unit = pool.get();
        }
        if(unit){
            // Load updated unit stats
            let newUnitProps = this.getUnitStats(unitType);
            
            // Add current data to unitProps to spawn unit correctly
            newUnitProps.x = this.spawnPosition.x;
            newUnitProps.y = this.spawnPosition.y;
            newUnitProps.faction = this.faction;
            newUnitProps.unitID = this.unitCounter;

            // Spawn unit
            unit.spawn(newUnitProps, this.ownUnitsPhysics, pool, this.enemyUnitsPhysics, this.baseGroup, this.projectiles, projectilePool);
            this.ownUnitsPhysics.add(unit);
            if(devConfig.consoleLog) console.log("%cSpawning unit with  id: " + this.unitCounter, `color: ${this.faction}`);
            this.unitCounter++;
            unit.moveForward();
            return unit;
        }
        else{
            throw new Error(`Out of units`);
        }     
    }

    /* All simple getters below */
    public canAfford(amount: number) {
        return this.resourceComponent.hasEnoughMoney(amount);
    }

    public getUnitCost(unitType: string) {
        const tempProps : UnitProps = this.getUnitStats(unitType);
        return tempProps.cost;
    }

    public getUnitSpawnTime(unitType: string) {
        const tempProps : UnitProps = this.getUnitStats(unitType);
        return tempProps.spawnTime;
    }

    

    /**
     * @param absolute true for current health, false for hp ratio
     * @returns Returns value of current health or ratio current/max
     */
    public getHealth(absolute: boolean = true) : number {
        if(absolute) return this.playerBase.getCurrentHealth();
        else return this.playerBase.getCurrentHealth() / this.playerBase.getMaxHealth();
    }

    public getUnitQueue() : string[] {
        return this.unitQueue;
    }

    public getMoney() : number {
        return this.resourceComponent.getMoney();
    }
}
