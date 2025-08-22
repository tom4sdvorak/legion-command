import { Scene } from 'phaser';
import eventsCenter from '../EventsCenter';
import { Player } from '../units/Player';

export class UI extends Scene
{
    button: Phaser.GameObjects.Shape;
    player: Player;
    unitQueueGraphics: Phaser.GameObjects.Group;
    unitQueue: string[] = [];
    unitLimit: number = 10;

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
            defaultKey: 'warrior', 
            visible: false,
            active: false
        });
        
        
        
        this.button = this.add.circle(400, 500, 40, 0xffffff)
            .setStrokeStyle(2, 0x000000)
            .setInteractive()
            .on('pointerup', () => {
                if(this.unitQueue.length > this.unitLimit) return;
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
                if(this.unitQueue.length > this.unitLimit) return;
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
                if(this.unitQueue.length > this.unitLimit) return;
                eventsCenter.emit('spawn-red-unit', 'healer');
            });
        const image1c = this.add.image(400, 300, 'healer');
        Phaser.Display.Align.In.Center(image1c, this.button); // Center the image within the button.
        this.button.setData('parent', image1c);
        image1c.setData('parent', this.button);

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

        let offsetY = this.scale.height*0.8;
        for (const unit of this.unitQueue) {
            const sprite = this.unitQueueGraphics.get(0, 0, unit);
            
            // Update the sprite properties
            sprite.setOrigin(0.5, 0.5);
            sprite.setScale(0.5);
            sprite.y = offsetY;
            sprite.x = sprite.x+30;
            sprite.setVisible(true);
            sprite.setActive(true);
            offsetY -= sprite.displayHeight/2;
        }
    }

    update(time: any, delta: number) {
        this.unitQueue = this.player.getUnitQueue();
        this.renderUnitQueue();

    }
}
