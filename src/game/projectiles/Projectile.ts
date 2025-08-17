export class Projectile extends Phaser.Physics.Arcade.Sprite {
    damage: number = 0;
    constructor(scene: Phaser.Scene, x: number, y: number, type: string) {
        super(scene, x, y, type);
        this.scene.physics.add.existing(this);
    }
}