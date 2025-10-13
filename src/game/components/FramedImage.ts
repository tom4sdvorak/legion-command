export class FramedImage extends Phaser.GameObjects.Container {
    //private border: Phaser.GameObjects.Graphics;
    private shape: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Ellipse;
    private inside: Phaser.GameObjects.Image | Phaser.GameObjects.BitmapText | Phaser.GameObjects.Text;
    private borderWidth: number = 2;
    public originX: number = 0.5;
    public originY: number = 0.5;
    public x: number = 0;
    public y: number = 0;
    public displayHeight: number = 0;
    public displayWidth: number = 0;
    public shapeType: string;

    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, shapeType: 'square' | 'round' = 'square') {
        super(scene, x, y);
        this.x = x;
        this.y = y;
        this.height = height;
        this.width = width;
        this.shapeType = shapeType;

        /*this.border = this.scene.add.graphics();
        this.border.lineStyle(1, 0x000000);
        this.border.strokeRect(-width/2, -height/2, width, height);*/
        if(shapeType === 'round') this.shape = this.scene.add.ellipse(0, 0, width, height, 0x000000, 0.5);
        else this.shape = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.5);
        this.shape.setStrokeStyle(this.borderWidth, 0x000000);
        this.shape.setOrigin(0.5, 0.5);
        this.add(this.shape);
        this.setDisplaySize(width, height);
    }

    /**
     * 
     * @param obj Image, BitmapText or Text to insert inside the frame
     */
    public putInside(obj : Phaser.GameObjects.Image | Phaser.GameObjects.BitmapText | Phaser.GameObjects.Text) : void {
        this.inside = obj;
        this.inside.setOrigin(0.5, 0.5);
        this.inside.setScale(1.0);
        const scaleX = this.width / this.inside.width;
        const scaleY = this.height / this.inside.height;
        let scaleFactor = Math.max(scaleX, scaleY);
        if(this.shapeType === 'round') scaleFactor = scaleFactor * 0.75;
        this.inside.setScale(scaleFactor);
        if(this.inside instanceof Phaser.GameObjects.BitmapText || this.inside instanceof Phaser.GameObjects.Text){
            this.inside.x += scaleFactor*2;
        }
        this.add(this.inside);
    }

    /**
     * 
     * @param size Width of the border
     * @param color Color of the border
     */
    public changeBorder(size: number = this.borderWidth, color: number = this.shape.strokeColor) : void {
        this.shape.setStrokeStyle(size, color);
    }

    public changeBackground(color: number = this.shape.fillColor, alpha: number = this.shape.alpha) : void {
        this.shape.setFillStyle(color);
    }
}
