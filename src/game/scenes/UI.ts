import { Scene } from 'phaser';
import eventsCenter from '../EventsCenter';
import { Player } from '../Player';
import { UIComponent } from '../components/UIComponent';

export class UI extends Scene
{
    button: Phaser.GameObjects.Shape;
    unitSpawnButtons: Phaser.GameObjects.Container[] = [];
    player: Player;
    unitLimit: number = 1;
    moneyText: Phaser.GameObjects.BitmapText
    moneyImage: Phaser.GameObjects.Image;
    hpBarUI: UIComponent;
    hpBar: Phaser.GameObjects.Graphics;
    playedUnits: string[];
    hpBarWidth: number = 0;
    hpBarHeight: number = 0;
    isSpawning: boolean = false;

    constructor ()
    {
        super('UI');
    }

    init(data: { player: Player, playedUnits: string[] }): void {
        this.player = data.player;
        this.playedUnits = data.playedUnits;
    }

    /*private renderUnitQueue():void{       
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
    }*/

    public updateHPBar(){
        this.hpBar.clear();
        let hpRatio = this.player.getHealth(false);
        this.hpBar.fillGradientStyle(0xECEA45, 0xECEA45, 0x1CC949, 0x1CC949, 1);
        this.hpBar.lineStyle(2, 0x000000, 0.5);
        this.hpBar.fillRect(-this.hpBarWidth/2, -this.hpBarHeight/2, this.hpBarWidth*hpRatio, this.hpBarHeight);
        this.hpBar.strokeRect(-this.hpBarWidth/2, -this.hpBarHeight/2, this.hpBarWidth, this.hpBarHeight);
    }

    create ()
    {      

        // Create player healthbar
        this.hpBarUI = new UIComponent(this, this.cameras.main.width/2, 50, this.cameras.main.width/2, 48, 0);
        this.add.existing(this.hpBarUI);
        this.hpBarWidth = this.hpBarUI.getWidth()-this.hpBarUI.getBorderThickness()[0]*2;
        this.hpBarHeight = this.hpBarUI.getHeight()-this.hpBarUI.getBorderThickness()[2]*2;
        this.hpBar = this.add.graphics();
        this.hpBarUI.add(this.hpBar);
        this.updateHPBar();

        // Display resources
        this.moneyText = this.add.bitmapText(this.cameras.main.width/4-(32+50+24), 50, 'pixelFont', `${this.player.getMoney()}`, 48).setOrigin(1, 0.5);
        this.moneyImage = this.add.image(this.cameras.main.width/4-50, 50, 'coin').setOrigin(1, 0.5).setDisplaySize(48, 48);
        let moneyImageBorder = this.add.graphics();
        moneyImageBorder.lineStyle(2, 0x000000, 1);
        moneyImageBorder.strokeCircle(this.cameras.main.width/4-(50+24), 50, 24);


        // Create unit spawning buttons based on selected units
        for(let i = -1; i < 2; i++) {
            const spawnButtonUI = new UIComponent(this, 0, 0, 96, 96, 1);
            const innerButtonHeight = 96 - spawnButtonUI.getBorderThickness()[2]*2;
            const innerButtonWidth = 96 - spawnButtonUI.getBorderThickness()[0]*2;
            const x = this.cameras.main.width/2 + i*(96+48);
            const y = this.cameras.main.height - 96;
            const unitSprite = this.add.image(0, 0, this.playedUnits[i+1] + '_static');
            
            // Determine how to resize the unit sprite so it fits UI element
            const maxRatio = innerButtonWidth / innerButtonHeight;
            const originalRatio = unitSprite.texture.get().width / unitSprite.texture.get().height;
            let newWidth, newHeight;
            if (originalRatio > maxRatio) {
                // The original image is wider than the max container
                // Use the max width as the limiting factor
                newWidth = innerButtonWidth-8;
                newHeight = newWidth / originalRatio;
            } else {
                // The original image is taller than the max container
                // Use the max height as the limiting factor
                newHeight = innerButtonHeight-8;
                newWidth = newHeight * originalRatio;
            }
            unitSprite.setDisplaySize(newWidth,newHeight);
            let currentGlow : any;
            unitSprite.postFX.addGlow(0x000000, 1, 0, false);
            const unitLoadingBar = this.add.rectangle(0, innerButtonHeight/2, innerButtonWidth, innerButtonHeight, 0xffffff).setAlpha(0.5).setOrigin(0.5,1);
            unitLoadingBar.scaleY = 0;
            const spawnButtonContainer = this.add.container(x, y);
            spawnButtonContainer.setSize(96, 96);
            spawnButtonContainer.add(spawnButtonUI);
            spawnButtonContainer.add(unitLoadingBar);
            spawnButtonContainer.add(unitSprite);
            spawnButtonContainer.setInteractive()
                .on('pointerover', () => {
                    let buttonBorder : Phaser.GameObjects.NineSlice = spawnButtonUI.list[2] as Phaser.GameObjects.NineSlice;
                    if(currentGlow) buttonBorder.postFX.remove(currentGlow);
                    currentGlow = buttonBorder.postFX.addGlow(0xffffff, 1, 0, false);
                })
                .on('pointerout', () => {
                    let buttonBorder : Phaser.GameObjects.NineSlice = spawnButtonUI.list[2] as Phaser.GameObjects.NineSlice;
                    if(currentGlow) buttonBorder.postFX.remove(currentGlow);
                })
                .on('pointerup', () => {
                    if(this.isSpawning || this.player.getUnitQueue().length >= this.unitLimit || !this.player.canAfford(this.player.getUnitCost(this.playedUnits[i+1]))) return;
                    eventsCenter.emit('spawn-red-unit', this.playedUnits[i+1]);
                    this.isSpawning = true;
                    this.unitSpawnButtons.forEach((button) => {
                        let buttonUI : UIComponent= button.list[0] as UIComponent;
                        if(button.getData('canAfford') === true) buttonUI.changeTint(0x808080, 0xbfbfbf);
                    });
                    unitLoadingBar.scaleY = 1;
                    this.tweens.add({
                        targets: unitLoadingBar,
                        ease: 'Power1',
                        scaleY: 0,
                        duration: this.player.getUnitSpawnTime(this.playedUnits[i+1])
                    });
                });

            this.unitSpawnButtons.push(spawnButtonContainer);
            Phaser.Display.Align.In.Center(unitSprite, spawnButtonUI);
        }

        /** Event listener for player's money changes
         * updates money value in UIrenders UI buttons red if player cannot afford
         * or removes tint if they can afford it (and )
         */
        eventsCenter.on('money-changed', (faction: string, amount: number) => {
            if(faction != this.player.faction) return;
            this.moneyText.setText(`${amount}`);
            this.unitSpawnButtons.forEach((button, i) => {
                let buttonUI : UIComponent= button.list[0] as UIComponent;
                if(this.player.canAfford(this.player.getUnitCost(this.playedUnits[i])) === false){
                    button.setData('canAfford', false);
                    buttonUI.changeTint(0xff0000, 0xfa756b);
                }
                else{
                    button.setData('canAfford', true);
                    if(this.isSpawning){
                        buttonUI.changeTint(0x808080, 0xbfbfbf);
                    }
                    else{
                        buttonUI.changeTint(-1,-1);
                    }
                }
            });
        });

        eventsCenter.on('unit-spawned', (faction: string) => {
            if(faction != this.player.faction) return;
            this.isSpawning = false;
            this.unitSpawnButtons.forEach((button) => {
                let buttonUI : UIComponent= button.list[0] as UIComponent;
                if(button.getData('canAfford') === true) buttonUI.changeTint(-1,-1);
            });
        });


        eventsCenter.on('base-take-damage', (faction: string) => {
            if(faction != this.player.faction) return;
            this.updateHPBar();
        })


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

    update() {
        
    }
}
