import { Scene } from 'phaser';
import eventsCenter from '../EventsCenter';
import SaveManager from '../helpers/SaveManager';

export class GameOver extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameover_text : Phaser.GameObjects.Text;

    constructor ()
    {
        super('GameOver');
    }

    create ()
    {
        // Save game
        SaveManager.saveGame(this);

        // Clean up all listeners we were using in previous scenes
        eventsCenter.removeAllListeners();

        // Clean up temporary data
        this.registry.set('playerUnits', []);
        this.registry.set('playerPotion', '');
        console.log(this.registry.get('playerUnits'));

        this.camera = this.cameras.main
        this.camera.setBackgroundColor(0xff0000);

        this.background = this.add.image(512, 384, 'background');
        this.background.setAlpha(0.5);

        this.gameover_text = this.add.text(512, 384, 'Game Over', {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        });
        this.gameover_text.setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('PreGame');

        });
    }
}
