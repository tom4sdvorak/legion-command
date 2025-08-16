import { Scene } from 'phaser';
import eventsCenter from '../EventsCenter';

export class UI extends Scene
{
    button: Phaser.GameObjects.Shape;

    constructor ()
    {
        super('UI');
    }

    create ()
    {
        this.button = this.add.circle(400, 500, 40, 0xffffff)
            .setStrokeStyle(2, 0x000000);
        this.button.setInteractive();
        this.button.on('pointerup', () => {
            eventsCenter.emit('spawn-red-unit');
        });

        this.button = this.add.circle(500, 500, 40, 0x000000)
            .setStrokeStyle(2, 0xffffff);
        this.button.setInteractive();
        this.button.on('pointerup', () => {
            eventsCenter.emit('spawn-blue-unit');
        });
    }
}
