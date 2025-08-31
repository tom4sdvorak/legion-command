import { Scene } from 'phaser';
import eventsCenter from '../EventsCenter';
import { Player } from '../Player';
import { UIComponent } from '../components/UIComponent';

export class UI extends Scene
{
    button: Phaser.GameObjects.Shape;
    unitSpawnButtons: Phaser.GameObjects.Container[] = [];
    player: Player;
    unitQueueGraphics: Phaser.GameObjects.Group;
    unitQueue: string[] = [];
    unitLimit: number = 10;
    moneyText: Phaser.GameObjects.Text;
    moneyImage: Phaser.GameObjects.Image;
    unitQueueUI: UIComponent;
    playedUnits: string[];

    constructor ()
    {
        super('UI');
    }

    init(data: { player: Player, playedUnits: string[] }): void {
        this.player = data.player;
        this.playedUnits = data.playedUnits;
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

        // Create unit spawning buttons based on selected units
        for(let i = -1; i < 2; i++) {
            const buttonHeight = 100;
            const buttonWidth = 100;
            const x = this.cameras.main.width/2 + i*(buttonWidth+50);
            const y = this.cameras.main.height - 100;
            const spawnButtonUI = new UIComponent(this, 0, 0, buttonWidth, buttonHeight, 1, undefined);
            const unitSprite = this.add.image(0, 0, this.playedUnits[i+1] + '_static');

            // Determine how to resize the unit sprite so it fits UI element
            const maxRatio = buttonWidth / buttonHeight;
            const originalRatio = unitSprite.texture.get().width / unitSprite.texture.get().height;
            let newWidth, newHeight;
            if (originalRatio > maxRatio) {
                // The original image is wider than the max container
                // Use the max width as the limiting factor
                newWidth = buttonWidth*0.7;
                newHeight = newWidth / originalRatio;
            } else {
                // The original image is taller than the max container
                // Use the max height as the limiting factor
                newHeight = buttonHeight*0.7;
                newWidth = newHeight * originalRatio;
            }
            unitSprite.setDisplaySize(newWidth,newHeight);
            unitSprite.preFX?.addGlow(0x000000, 1, 0, false);

            
            const spawnButtonContainer = this.add.container(x, y);
            spawnButtonContainer.setSize(buttonWidth, buttonHeight);
            spawnButtonContainer.add(spawnButtonUI);
            spawnButtonContainer.add(unitSprite);
            let currentGlow : any = null;
            spawnButtonContainer.setInteractive()
                .on('pointerover', () => {
                    if(currentGlow) unitSprite.preFX?.remove(currentGlow);
                    currentGlow = unitSprite.preFX?.addGlow(0xffffff, 1, 0, false);
                })
                .on('pointerout', () => {
                    if(currentGlow) unitSprite.preFX?.remove(currentGlow);
                    currentGlow =unitSprite.preFX?.addGlow(0x000000, 1, 0, false);
                })
                .on('pointerup', () => {
                    if(this.player.getUnitQueue().length >= this.unitLimit || !this.player.canAfford(this.player.getUnitCost(this.playedUnits[i+1]))) return;
                    eventsCenter.emit('spawn-red-unit', this.playedUnits[i+1]);
                });

            this.unitSpawnButtons.push(spawnButtonContainer);
            Phaser.Display.Align.In.Center(unitSprite, spawnButtonUI);
        }

        eventsCenter.on('money-changed', (faction: string, amount: number) => {
            if(faction != this.player.faction) return;
            this.moneyText.setText('Gold: ' + amount);
            this.unitSpawnButtons.forEach((button, i) => {
                let buttonUI : UIComponent= button.list[0] as UIComponent;
                buttonUI.changeBorderTint(this.player.canAfford(this.player.getUnitCost(this.playedUnits[i])) ? undefined : 0xff0000);
            });
        });

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
    }
}
