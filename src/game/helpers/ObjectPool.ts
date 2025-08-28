import Phaser from "phaser";

export type ObjectPool = {
    units: {
        archers: Phaser.Physics.Arcade.Group;
        warriors: Phaser.Physics.Arcade.Group;
        healers: Phaser.Physics.Arcade.Group;
        fireWorms: Phaser.Physics.Arcade.Group;
    },
    projectiles: {
        arrows: Phaser.Physics.Arcade.Group;
    }
}