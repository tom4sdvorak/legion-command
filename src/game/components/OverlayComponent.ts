import Phaser from 'phaser';

export class OverlayComponent extends Phaser.Events.EventEmitter {
    private scene: Phaser.Scene;
    private tintRect: Phaser.GameObjects.Rectangle;
    private blurEffect: Phaser.FX.Blur | null = null;
    private overlayDepth: number = 999;

    constructor(scene: Phaser.Scene, tintColor: number = 0x000000, tintAlpha: number = 0.5) {
        super();
        this.scene = scene;
        const width = scene.game.config.width as number;
        const height = scene.game.config.height as number;

        this.tintRect = scene.add.rectangle(
            width / 2, height / 2, width, height, tintColor, tintAlpha
        )
        .setScrollFactor(0)
        .setDepth(this.overlayDepth)
        .setVisible(false)
        .setInteractive();
        this.blurEffect = this.tintRect.postFX.addBlur(0.5, 4, 4);
        this.tintRect.on('pointerup', () => {
            this.emit('overlay-clicked'); 
        });
    }

    // Public method to show the overlay
    public show() {
        /*if (!this.blurEffect) {
            this.blurEffect = this.tintRect.postFX.addBlur(0.5, 4, 4);
        }*/
        this.tintRect.setVisible(true);
    }

    // Public method to hide the overlay
    public hide() {
        if (this.blurEffect) {
            this.tintRect.postFX.remove(this.blurEffect);
        }
        this.tintRect.setVisible(false);
    }
}