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
    private tint: number | undefined;
    private borderStroke: Phaser.GameObjects.Graphics;

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

        this.borderStroke = this.scene.add.graphics();
        this.borderStroke.lineStyle(2, 0x000000);
        this.borderStroke.strokeRect(-width/2, -height/2, width, height);
        this.add(this.borderStroke);

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

    /**
     * Returns the thickness of the border of this UI component in pixels.
     * @returns A number array with size of border in pixels: [left, right, top, bottom]
     */
    public getBorderThickness(): number[] {
        return [8,8,6,6]
    }

    public changeBorderTint(tint: number | undefined): void {
        if(tint === undefined){
            if(this.tint === undefined){
                this.border.clearTint();
                return;
            }
            this.border.setTint(this.tint);
        }
        else{
            this.border.setTint(tint);
        }
    }
}
