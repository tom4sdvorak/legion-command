import Phaser from 'phaser';

export class OverlayComponent extends Phaser.Events.EventEmitter {
    private scene: Phaser.Scene;
    private tintRect: Phaser.GameObjects.Rectangle;
    private blurEffect: Phaser.FX.Blur | null = null;
    private overlayDepth: number = 999;
    private sharpCamera: Phaser.Cameras.Scene2D.Camera | null = null;
    private sharpObject: Phaser.GameObjects.GameObject | null = null;

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

        this.tintRect.on('pointerup', () => {
            this.emit('overlay-clicked');
        });
    }

    /** Show the overlay and blur everything below it
     * 
     * @param blurred True if everything (but sharpObject) should be blurred
     * @param sharpObject Object to show sharply
     * */
    public show(blurred: boolean = false, sharpObject: Phaser.GameObjects.GameObject | null= null) {
        const mainCamera = this.scene.cameras.main;
        this.tintRect.setVisible(true);
        if(!blurred) {
            return;
        }
        // Create second camera
        this.sharpCamera = this.scene.cameras.add(
            0, 0, 
            mainCamera.width, 
            mainCamera.height
        );
        this.sharpCamera.setScroll(mainCamera.scrollX, mainCamera.scrollY);
        this.sharpCamera.setZoom(mainCamera.zoom);

        // If given object to show sharply, remove it from main camera while removing all but it from second camera
        if (sharpObject) {
            mainCamera.ignore(sharpObject);
            this.sharpCamera.ignore(mainCamera.renderList);
            this.sharpObject = sharpObject;
        }
        // Blur main camera
        if (!this.blurEffect) {
            this.blurEffect = mainCamera.postFX.addBlur(0.5, 4, 4);
        }
        
    }

    public destroy(): void {
        this.hide();
        if (this.tintRect) {
            this.tintRect.removeAllListeners();
            this.tintRect.destroy();
        }
        this.sharpCamera = null;
        this.sharpObject = null;
        super.destroy();
    }

    public changeDepth(depth: number) {
        this.overlayDepth = depth;
        this.tintRect.setDepth(depth);
    }

    // Hide the overlay, remove blur and destroy second camera
    public hide() {
        const mainCamera = this.scene.cameras.main;
        if (mainCamera && mainCamera.postFX && this.blurEffect) {
            mainCamera.postFX.remove(this.blurEffect);
            this.blurEffect = null;
        }
        // Remove second camera
        if (this.sharpCamera) {
            this.scene.cameras.remove(this.sharpCamera);
            this.sharpCamera = null;
        }

        // If object to show sharply was given, add it back to main camera
        if (this.sharpObject) {
            this.sharpObject.cameraFilter = 0;
            this.sharpObject = null;
        }

        this.tintRect.setVisible(false);
    }
}