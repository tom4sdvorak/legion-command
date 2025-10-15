export class FramedImage extends Phaser.GameObjects.Container {
    //private border: Phaser.GameObjects.Graphics;
    private shape: Phaser.GameObjects.Graphics | Phaser.GameObjects.Ellipse | Phaser.GameObjects.Rectangle;
    private inside: Phaser.GameObjects.Image | Phaser.GameObjects.BitmapText | Phaser.GameObjects.Text;
    private borderWidth: number = 2;
    public originX: number = 0.5;
    public originY: number = 0.5;
    public x: number = 0;
    public y: number = 0;
    public displayHeight: number = 0;
    public displayWidth: number = 0;
    public shapeType: string;
    public borderColor : number = 0x000000;
    public bgColor : number = 0x000000;
    public bgAlpha : number = 0.5;
    public cornerRadius : number = 10;

    /**
     * 
     * @param scene 
     * @param x 
     * @param y 
     * @param width 
     * @param height 
     * @param shapeType 'square' | 'squircle' | 'circle'
     */
    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, shapeType: 'square' | 'squircle' | 'circle' = 'square') {
        super(scene, x, y);
        this.x = x;
        this.y = y;
        this.height = height;
        this.width = width;
        this.shapeType = shapeType;

        /*this.border = this.scene.add.graphics();
        this.border.lineStyle(1, 0x000000);
        this.border.strokeRect(-width/2, -height/2, width, height);*/
        if(shapeType === 'circle') {
            this.shape = this.scene.add.ellipse(0, 0, width, height, this.bgColor, 0.5);
            this.shape.setStrokeStyle(this.borderWidth, this.borderColor);
            this.shape.setOrigin(0.5, 0.5);
        }
        else if (shapeType === 'squircle') {
            this.shape = this.scene.add.graphics();
            this.drawSquircle();
        }
        else {
            this.shape = this.scene.add.rectangle(0, 0, width, height, this.bgColor, 0.5);
            this.shape.setStrokeStyle(this.borderWidth, this.borderColor);
            this.shape.setOrigin(0.5, 0.5);
        }
        this.add(this.shape);
        this.setDisplaySize(width, height);
    }

    public drawSquircle(){
        if(this.shape instanceof Phaser.GameObjects.Graphics){
            this.shape.fillStyle(this.bgColor, this.bgAlpha);
            this.shape.lineStyle(this.borderWidth, this.borderColor);
            this.shape.fillRoundedRect(-this.width/2, -this.height/2, this.width, this.height, this.cornerRadius); 
            this.shape.strokeRoundedRect(-this.width/2, -this.height/2, this.width, this.height, this.cornerRadius);
        }  
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
        if(this.shapeType === 'round'){
            scaleFactor = scaleFactor * 0.75;
            if(this.inside instanceof Phaser.GameObjects.BitmapText || this.inside instanceof Phaser.GameObjects.Text){
                this.inside.x += scaleFactor*2;
            }
        }
        else{
            scaleFactor = scaleFactor * 0.9;
            if(this.inside instanceof Phaser.GameObjects.BitmapText || this.inside instanceof Phaser.GameObjects.Text){
                this.inside.x += scaleFactor;
            }
        }
        this.inside.setScale(scaleFactor);
        this.add(this.inside);
    }

    /**
     * 
     * @param size Width of the border
     * @param color Color of the border
     */
    public changeBorder(size: number = this.borderWidth, color: number = this.borderColor) : void {
        this.borderWidth = size;
        this.borderColor = color;
        if(this.shape instanceof Phaser.GameObjects.Graphics){
            this.shape.clear();
            this.drawSquircle();
        }
        else{
            this.shape.setStrokeStyle(size, color);
        }
        
    }

    public changeBackground(color: number = this.bgColor, alpha: number = this.bgAlpha) : void {
        this.bgColor = color;
        this.bgAlpha = alpha;
        if(this.shape instanceof Phaser.GameObjects.Graphics){
            this.shape.clear();
            this.drawSquircle();
        }
        else{
            this.shape.setFillStyle(color);
        }
    }
}
