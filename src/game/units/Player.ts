import { PlayerBase } from "./PlayerBase";
import { Unit } from "./Unit";
import { Warrior } from "./Warrior";
import { Archer } from "./Archer";
import { UnitProps } from "../helpers/UnitProps";

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

    constructor(scene: Phaser.Scene, faction: 'red' | 'blue', ownUnitsPhysics: Phaser.Physics.Arcade.Group, enemyUnitsPhysics: Phaser.Physics.Arcade.Group, projectiles: Phaser.Physics.Arcade.Group) {
        this.scene = scene;
        this.faction = faction;
        if(this.faction === 'blue') { this.spawnPosition = new Phaser.Math.Vector2(scene.scale.gameSize.width-100, 680);} 
        else{this.spawnPosition = new Phaser.Math.Vector2(100, 680);}
        this.ownUnitsPhysics = ownUnitsPhysics;
        this.enemyUnitsPhysics = enemyUnitsPhysics;
        this.projectiles = projectiles;
        this.playerBase = new PlayerBase(this.scene, this.faction, this.spawnPosition,this.enemyUnitsPhysics, this.projectiles);
        this.ownUnitsPhysics.add(this.playerBase.sprite);
        this.playerBase.sprite.setImmovable(true);
    }

    public addUnitToQueue(unitType: String) {
        this.unitQueue.push(unitType);
    }
    
    public spawnUnit (unitType: String)
    {
        let newUnitProps: UnitProps = {
            x: this.spawnPosition.x,
            y: this.spawnPosition.y, 
            speed: 100, 
            health: 100, 
            attackDamage: 34, 
            attackRange: 100,
            attackSpeed: 1000, //in ms
            faction: this.faction, 
            unitID: this.unitCounter
        }
        let unit;
        switch (unitType) {
            case 'warrior':
                unit = new Warrior(this.scene, newUnitProps);
                break;
            case 'archer':
                unit = new Archer(this.scene, newUnitProps);
                break;   
        }
        if(unit instanceof Unit){
            this.ownUnitsPhysics.add(unit);
            this.unitCounter++;
            console.log("%cSpawning unit with  id: " + this.unitCounter, `color: ${this.faction}`);
            unit.moveForward();
        }        
    }
}
