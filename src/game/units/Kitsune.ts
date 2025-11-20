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
        this.stacksSprite = this.scene.add.sprite(0, 0, "kitsune");
    }

    update(time: any, delta: number) {
        super.update(time, delta);
        this.stacksSprite?.setPosition(this.x+(this.direction*-16), this.y-16);
    }

    spawn(unitProps: UnitProps, unitGroup: Phaser.Physics.Arcade.Group, unitPool: Phaser.Physics.Arcade.Group, enemyGroup: Phaser.Physics.Arcade.Group, baseGroup: Phaser.GameObjects.Group, projectiles: Phaser.Physics.Arcade.Group, projectilePool: Phaser.Physics.Arcade.Group):void{
        super.spawn(unitProps, unitGroup, unitPool, enemyGroup, baseGroup, projectiles, projectilePool);
        this.stacksSprite?.setActive(true);
        this.stacksSprite?.setVisible(true);
        this.stacksSprite?.setOrigin(0.5, 1);
        this.stacksSprite?.setFrame(40);
        this.stacks = 0;
    }

    die() {
        this.stacksSprite?.setActive(false);
        this.stacksSprite?.setVisible(false);
        this.stacks = 0;
        super.die();
    }

    public attackTarget(): void {
        super.attackTarget();
        if(this.specialReady) this.doSpecial(this.meleeTarget.target);
    }

    fireProjectile(target: Unit | PlayerBase){
        super.fireProjectile(target);
        // Increase stack count every projectile until 9
        if(this.stacks < 9){
            this.stacks += this.unitProps.specialValue;
            this.stacksSprite?.setFrame(40+this.stacks);
            if(this.stacks >= 9){
                this.specialReady = true;
            }
        }
        // At max stacks, do special ability to target on top of firing projectile at it
        if(this.specialReady) this.doSpecial(target);
    }

    doSpecial(target: any): void {
        if(target instanceof Unit && target.active && target.isAlive()){
            this.stacks = 0;
            this.stacksSprite?.setFrame(40);
            target.applyDebuff('curse');
        }
    }

}