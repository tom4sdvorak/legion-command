import { Scene } from 'phaser';
import eventsCenter from '../EventsCenter';
import { Player } from '../Player';
import { UIComponent } from '../components/UIComponent';

export class UI extends Scene
{
    button: Phaser.GameObjects.Shape;
    player: Player;
    unitQueueGraphics: Phaser.GameObjects.Group;
    unitQueue: string[] = [];
    unitLimit: number = 10;
    moneyText: Phaser.GameObjects.Text;
    moneyImage: Phaser.GameObjects.Image;
    unitQueueUI: UIComponent;

    constructor ()
    {
        super('UI');
    }

    init(data: { player: Player }): void {
        this.player = data.player;
    }

    create ()
    {      
        
        this.unitQueueGraphics = this.add.group({
            defaultKey: 'warrior_static', 
            visible: false,
            active: false
        });

        this.unitQueueUI = new UIComponent(this, 50, (this.game.config.height as number)/2, 50, (this.game.config.height as number)*0.7, 1, 0xffffff);
        this.add.existing(this.unitQueueUI);


        this.moneyText = this.add.text(50, 50, 'Gold: ' + this.player.getMoney(), { fontSize: 24, color: '#000000' });
        this.moneyImage = this.add.image(25, 50, 'gold');
        this.moneyImage.setScale(0.8);
        this.moneyImage.setOrigin(0.5, 0.5); 
        
        this.button = this.add.circle(400, 500, 40, 0xffffff)
            .setStrokeStyle(2, 0x000000)
            .setInteractive()
            .on('pointerup', () => {
                if(this.unitQueue.length >= this.unitLimit || !this.player.canAfford(this.player.getUnitCost('warrior'))) return;
                eventsCenter.emit('spawn-red-unit', 'warrior');
            });
        const image1 = this.add.image(400, 500, 'warrior');
        Phaser.Display.Align.In.Center(image1, this.button); // Center the image within the button.
        this.button.setData('parent', image1);
        image1.setData('parent', this.button);

        this.button = this.add.circle(400, 400, 40, 0xffffff)
            .setStrokeStyle(2, 0x000000)
            .setInteractive()
            .on('pointerup', () => {
                if(this.unitQueue.length >= this.unitLimit || !this.player.canAfford(this.player.getUnitCost('archer'))) return;
                eventsCenter.emit('spawn-red-unit', 'archer');
            });
        const image1b = this.add.image(400, 400, 'archer');
        Phaser.Display.Align.In.Center(image1b, this.button); // Center the image within the button.
        this.button.setData('parent', image1b);
        image1b.setData('parent', this.button);

        this.button = this.add.circle(400, 300, 40, 0xffffff)
            .setStrokeStyle(2, 0x000000)
            .setInteractive()
            .on('pointerup', () => {
                if(this.unitQueue.length >= this.unitLimit || !this.player.canAfford(this.player.getUnitCost('healer'))) return;
                eventsCenter.emit('spawn-red-unit', 'healer');
            });
        const image1c = this.add.image(400, 300, 'healer');
        Phaser.Display.Align.In.Center(image1c, this.button); // Center the image within the button.
        this.button.setData('parent', image1c);
        image1c.setData('parent', this.button);

        this.button = this.add.circle(400, 200, 40, 0xffffff)
            .setStrokeStyle(2, 0x000000)
            .setInteractive()
            .on('pointerup', () => {
                if(this.unitQueue.length >= this.unitLimit || !this.player.canAfford(this.player.getUnitCost('fireWorm'))) return;
                eventsCenter.emit('spawn-red-unit', 'fireWorm');
            });
        const image1d = this.add.image(400, 200, 'fireWorm');
        Phaser.Display.Align.In.Center(image1d, this.button); // Center the image within the button.
        this.button.setData('parent', image1d);
        image1d.setData('parent', this.button);

        this.button = this.add.circle(500, 500, 40, 0x000000)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive()
            .on('pointerup', () => {
                eventsCenter.emit('spawn-blue-unit', 'warrior');
            });
        const image2 = this.add.image(500, 500, 'warrior');
        Phaser.Display.Align.In.Center(image2, this.button); // Center the image within the button.
        this.button.setData('parent', image2);
        image2.setData('parent', this.button);

        this.button = this.add.circle(500, 400, 40, 0x000000)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive()
            .on('pointerup', () => {
                eventsCenter.emit('spawn-blue-unit', 'archer');
            });
        const image2b = this.add.image(500, 400, 'archer');
        Phaser.Display.Align.In.Center(image2b, this.button); // Center the image within the button.
        this.button.setData('parent', image2b);
        image2b.setData('parent', this.button);

        this.button = this.add.circle(500, 300, 40, 0x000000)
            .setStrokeStyle(2, 0xffffff)
            .setInteractive()
            .on('pointerup', () => {
                eventsCenter.emit('spawn-blue-unit', 'healer');
            });
        const image2c = this.add.image(500, 300, 'healer');
        Phaser.Display.Align.In.Center(image2c, this.button); // Center the image within the button.
        this.button.setData('parent', image2c);
        image2c.setData('parent', this.button);
    }

    private renderUnitQueue():void{       
        this.unitQueueGraphics.clear(true, true);

        
        const spriteMaxWidth = this.unitQueueUI.getWidth()/2;
        const spriteMaxHeight = (this.unitQueueUI.getHeight()-12)/10
        const maxRatio = spriteMaxWidth / spriteMaxHeight;
        let yPos = (this.unitQueueUI.getHeight()/2) - spriteMaxHeight/2 - 6;
        for (const unit of this.unitQueue) {
            const sprite = this.unitQueueGraphics.get(0, 0, `${unit}_static`);
            const originalRatio = sprite.texture.get().width / sprite.texture.get().height;
            let newWidth, newHeight;
            // Update the sprite properties
            this.unitQueueUI.add(sprite);
            sprite.setOrigin(0.5, 0.5);

            if (originalRatio > maxRatio) {
                // The original image is wider than the max container
                // Use the max width as the limiting factor
                newWidth = spriteMaxWidth;
                newHeight = newWidth / originalRatio;
            } else {
                // The original image is taller than the max container
                // Use the max height as the limiting factor
                newHeight = spriteMaxHeight;
                newWidth = newHeight * originalRatio;
            }
            sprite.setDisplaySize(newWidth,newHeight);
            sprite.y = yPos;
            sprite.setVisible(true);
            sprite.setActive(true);
            yPos -= spriteMaxHeight;
        }
    }

    update(time: any, delta: number) {
        this.unitQueue = this.player.getUnitQueue();
        this.renderUnitQueue();
        this.moneyText.setText('Money: ' + Math.floor(this.player.getMoney()));

    }
}
