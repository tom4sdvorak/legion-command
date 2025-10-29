import { UnitProps } from "../helpers/UnitProps";
import { PlayerBase } from "../PlayerBase";
import { Game } from "../scenes/Game";
import { RangedUnit } from "./RangedUnit";
import { Unit } from "./Unit";

export class Kitsune extends RangedUnit {

    private stacks: number = 0;
    private stacksSprite: Phaser.GameObjects.Sprite | null;

    constructor(scene: Game) {
        super(scene, "kitsune");
        this.stacksSprite = this.scene.add.sprite(0, 0, "kitsune").setOrigin(0.5, 1);
    }

    update(time: any, delta: number) {
        super.update(time, delta);
        this.stacksSprite?.setPosition(this.x, this.y);
    }

    spawn(unitProps: UnitProps, unitGroup: Phaser.Physics.Arcade.Group, unitPool: Phaser.Physics.Arcade.Group, enemyGroup: Phaser.Physics.Arcade.Group, baseGroup: Phaser.GameObjects.Group, projectiles: Phaser.Physics.Arcade.Group, projectilePool: Phaser.Physics.Arcade.Group):void{
        super.spawn(unitProps, unitGroup, unitPool, enemyGroup, baseGroup, projectiles, projectilePool);
        this.stacksSprite?.setActive(true);
        this.stacksSprite?.setVisible(true);
        this.stacksSprite?.setFrame(40);
        this.stacks = 0;
    }

    die() {
        this.stacksSprite?.setActive(false);
        this.stacksSprite?.setVisible(false);
        this.stacks = 0;
        super.die();
    }

    fireProjectile(target: Unit | PlayerBase){
        super.fireProjectile(target);
        if(this.stacks < 9){
            this.stacks += 1;
            this.stacksSprite?.setFrame(40+this.stacks);
        }
    }

}