import { PlayerController } from "./components/PlayerController";
import { ObjectPool } from "./helpers/ObjectPool";
import { UnitConfigLoader } from "./helpers/UnitConfigLoader";
import { PlayerBase } from "./PlayerBase";


export class AIPlayer extends PlayerController {

    constructor(scene: Phaser.Scene, playerBase: PlayerBase, spawnPosition: Phaser.Math.Vector2, ownUnitsPhysics: Phaser.Physics.Arcade.Group,
                enemyUnitsPhysics: Phaser.Physics.Arcade.Group, projectiles: Phaser.Physics.Arcade.Group,
                objectPool: ObjectPool, baseGroup: Phaser.GameObjects.Group, configLoader: UnitConfigLoader)
    {
        super(scene, playerBase, spawnPosition, ownUnitsPhysics, enemyUnitsPhysics, projectiles, objectPool, baseGroup, configLoader);

        /* Save base stats of all selected units */
        let selectedUnits : string[] = this.scene.registry.get('allUnits'); // currently AI has all units
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

        this.faction = 'blue';
    }
}
