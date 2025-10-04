import Phaser from "phaser";

export type ObjectPool = {
    units: {
        archers: Phaser.Physics.Arcade.Group;
        warriors: Phaser.Physics.Arcade.Group;
        wizards: Phaser.Physics.Arcade.Group;
        fireWorms: Phaser.Physics.Arcade.Group;
        gorgons: Phaser.Physics.Arcade.Group;
    },
    projectiles: {
        arrows: Phaser.Physics.Arcade.Group;
        fireArrows: Phaser.Physics.Arcade.Group;
        fireballs: Phaser.Physics.Arcade.Group;
        purpleBalls: Phaser.Physics.Arcade.Group;
    }
}