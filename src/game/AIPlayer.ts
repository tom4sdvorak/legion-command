import { PlayerController } from "./components/PlayerController";
import eventsCenter from "./EventsCenter";
import { ObjectPool } from "./helpers/ObjectPool";
import { UnitConfigLoader } from "./helpers/UnitConfigLoader";
import { PlayerBase } from "./PlayerBase";


export class AIPlayer extends PlayerController {

    constructor(scene: Phaser.Scene, playerBase: PlayerBase, spawnPosition: Phaser.Math.Vector2, ownUnitsPhysics: Phaser.Physics.Arcade.Group,
                enemyUnitsPhysics: Phaser.Physics.Arcade.Group, projectiles: Phaser.Physics.Arcade.Group,
                objectPool: ObjectPool, baseGroup: Phaser.GameObjects.Group, configLoader: UnitConfigLoader, selectedUnits: string[])
    {
        super(scene, playerBase, spawnPosition, ownUnitsPhysics, enemyUnitsPhysics, projectiles, objectPool, baseGroup, configLoader, selectedUnits);
        this.faction = 'blue';
    }
}
