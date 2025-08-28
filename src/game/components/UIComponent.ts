    /**
     * Constructor for the UIComponent.
     * 
     * @param scene The Phaser Scene which owns this component.
     * @param x The central x position of the component.
     * @param y The central y position of the component.
     * @param width The width of the component.
     * @param height The height of the component.
     * @param background A number indicating the background image to use, 0 for the lighter one and 1 for the darker one.
     * @param tint An optional tint value to apply to the background. If not specified, no tint will be used.
     */
export class UIComponent extends Phaser.GameObjects.Container {
    private border: Phaser.GameObjects.NineSlice;
    private background: Phaser.GameObjects.Image;
    private sizeW: number;
    private sizeH: number;

    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, background: number, tint: number | undefined) {
        super(scene, x, y);
        this.sizeW = width;
        this.sizeH = height;
        let chosenBackground : string;
        switch (background) {
            case 0:
                chosenBackground = 'UI_bg_lighter';
                break;
            case 1:
                chosenBackground = 'UI_bg_darker';
                break;
            default:
                chosenBackground = 'UI_bg_lighter';
                break;
        }
        this.background = this.scene.add.image(-width/2, -height/2, chosenBackground);
        this.background.setOrigin(0, 0);
        this.background.setDisplaySize(width, height);
        this.add(this.background);

        this.border = this.scene.add.nineslice(-width/2, -height/2, 'UI_border', undefined, width, height, 8, 8, 6, 6);
        this.border.setOrigin(0, 0);
        if(tint !== undefined) this.border.setTint(tint);
        this.add(this.border);
    }

    public getWidth(): number {
        return this.sizeW;
    }

    public getHeight(): number {
        return this.sizeH;
    }
}
