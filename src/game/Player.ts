import { PlayerController } from "./components/PlayerController";
import eventsCenter from "./EventsCenter";
import { ObjectPool } from "./helpers/ObjectPool";
import { UnitConfigLoader } from "./helpers/UnitConfigLoader";
import { PlayerBase } from "./PlayerBase";


export class Player extends PlayerController {
    private level: number = 0;
    public unitsKilled: number = 0;

    constructor(scene: Phaser.Scene, playerBase: PlayerBase, spawnPosition: Phaser.Math.Vector2, ownUnitsPhysics: Phaser.Physics.Arcade.Group,
                enemyUnitsPhysics: Phaser.Physics.Arcade.Group, projectiles: Phaser.Physics.Arcade.Group,
                objectPool: ObjectPool, baseGroup: Phaser.GameObjects.Group, configLoader: UnitConfigLoader, selectedUnits: string[])
    {
        super(scene, playerBase, spawnPosition, ownUnitsPhysics, enemyUnitsPhysics, projectiles, objectPool, baseGroup, configLoader, selectedUnits);

        this.faction = 'red';
        this.unitQueueMaxSize = 1;
        /*// Listener for units dying, awarding human player XP
        eventsCenter.on('unit-died', (unitFaction: string) => {
            if(unitFaction !== this.faction){
                this.unitsKilled++;
                this.gainXP(50);
            }
        }, this);*/
    }

    public levelUp(unit: string, upgrade: string) : void {
        this.resourceComponent.setMaxXP(this.resourceComponent.getMaxXP() * 1.5); // Increase next level up xp by 50%
        this.level++;
        eventsCenter.emit('xp-changed', this.faction, this.resourceComponent.getXP());
        this.addUpgrade(unit, upgrade);
        eventsCenter.emit('upgrade-added', this.faction);
    }

    /* All setters below */
    public gainXP(amount: number) {
        this.resourceComponent.addXP(amount);
    }

    public setNextLevelXP(amount: number) : void {
        this.resourceComponent.setMaxXP(amount);
    }

    /* All getters below */
    public getLevel() : number {
       return this.level;
    }

    public nextLevelXP() : number{
        return this.resourceComponent.getMaxXP();
    }
}
