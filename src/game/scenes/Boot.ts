import { Scene } from 'phaser';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {

    }

    create ()
    {
        // Save list of all unit types
        this.registry.set('allUnits', ['warrior', 'archer', 'wizard', 'minotaur', 'kitsune', 'fireWorm', 'gorgon']);
        this.scene.start('Preloader');
    }
}
