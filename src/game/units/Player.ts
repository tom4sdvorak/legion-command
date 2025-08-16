import { PlayerBase } from "./PlayerBase";
import { Unit } from "./Unit";

export class Player {
    public playerBase: PlayerBase;
    public units: Unit[] = [];
    public faction: 'red' | 'blue';
    public spawnPosition: Phaser.Math.Vector2;
    scene: Phaser.Scene;
    ownUnitsPhysics: Phaser.Physics.Arcade.Group;
    enemyUnitsPhysics: Phaser.Physics.Arcade.Group;
    unitCounter: number = 0;
    unitQueue: String[] = [];

    constructor(scene: Phaser.Scene, faction: 'red' | 'blue', ownUnitsPhysics: Phaser.Physics.Arcade.Group, enemyUnitsPhysics: Phaser.Physics.Arcade.Group) {
        this.scene = scene;
        this.faction = faction;
        if(this.faction === 'blue') { this.spawnPosition = new Phaser.Math.Vector2(scene.scale.gameSize.width-100, 680);} 
        else{this.spawnPosition = new Phaser.Math.Vector2(100, 680);}
        this.ownUnitsPhysics = ownUnitsPhysics;
        this.enemyUnitsPhysics = enemyUnitsPhysics;
        this.playerBase = new PlayerBase(this.scene, this.faction, this.spawnPosition,this.enemyUnitsPhysics);
        this.ownUnitsPhysics.add(this.playerBase.sprite);
        this.playerBase.sprite.setImmovable(true);
        this.units = [];
    }

    public addUnitToQueue(unitType: String) {
        this.unitQueue.push(unitType);
    }
    
    public spawnUnit (unitType: String)
    {
        // main game scene, x, y, speed, attackDamage, health, faction, unitID
        let unit = new Unit(this.scene, this.spawnPosition.x, this.spawnPosition.y, 100, 25, 100, this.faction, this.unitCounter);
        this.ownUnitsPhysics.add(unit.sprite);
        this.units.push(unit);
        this.unitCounter++;
        console.log("%cSpawning unit with  id: " + this.unitCounter, `color: ${this.faction}`);
        unit.moveForward();
    }
}
