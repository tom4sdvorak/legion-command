import { PlayerBase } from "../PlayerBase";
import { Unit } from "../units/Unit";

export class Projectile extends Phaser.Physics.Arcade.Sprite {
    damage: number = 0;
    projectilePool: Phaser.Physics.Arcade.Group | null = null;
    unitGroup: Phaser.Physics.Arcade.Group | null = null;
    penCap: number = 1; // How many targets the projectile can hit
    targetList: number[] = [];

    constructor(scene: Phaser.Scene, x: number, y: number, type: string) {
        super(scene, x, y, type);
    }

    spawn(unitGroup: Phaser.Physics.Arcade.Group, projectilePool: Phaser.Physics.Arcade.Group) {
        this.unitGroup = unitGroup;
        this.projectilePool = projectilePool;
        this.unitGroup.add(this);
        this.targetList = [];
    }

    onHit(target: Unit | PlayerBase): void {
        let targetID = -1;
        if(target instanceof Unit) targetID = target.unitProps.unitID;

        if(this.targetList.includes(targetID)){
            return;
        }
        target.takeDamage(this.damage);
        this.targetList.push(targetID);
        this.penCap--;
        if(targetID >= 0 && this.penCap > 0) return;
        this.setVelocity(0, 0);
        if(this.unitGroup) this.unitGroup.remove(this);
        this.despawn();
    }

    despawn(){
        (this.body as Phaser.Physics.Arcade.Body).reset(0, 0);
        if(this.projectilePool) this.projectilePool.killAndHide(this);
        this.unitGroup = null;
        this.projectilePool = null;
        this.penCap = 1;
    }
}