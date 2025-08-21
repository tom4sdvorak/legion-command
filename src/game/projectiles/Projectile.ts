
export class Projectile extends Phaser.Physics.Arcade.Sprite {
    damage: number = 0;
    projectilePool: Phaser.Physics.Arcade.Group | null = null;
    unitGroup: Phaser.Physics.Arcade.Group | null = null

    constructor(scene: Phaser.Scene, x: number, y: number, type: string) {
        super(scene, x, y, type);
    }

    spawn(unitGroup: Phaser.Physics.Arcade.Group, projectilePool: Phaser.Physics.Arcade.Group) {
        this.unitGroup = unitGroup;
        this.projectilePool = projectilePool;
        this.unitGroup.add(this);
    }
}