import { Scene } from 'phaser';
import eventsCenter from '../EventsCenter';
import { Player } from '../Player';
import { UIComponent } from '../components/UIComponent';
import { AIPlayer } from '../AIPlayer';

export class UI extends Scene
{
    button: Phaser.GameObjects.Shape;
    unitSpawnButtons: Phaser.GameObjects.Container[] = [];
    player: Player;
    enemyPlayer: AIPlayer;
    unitLimit: number = 1;
    moneyText: Phaser.GameObjects.BitmapText
    moneyImage: Phaser.GameObjects.Image;
    hpBarUI: UIComponent;
    hpBar: Phaser.GameObjects.Graphics;
    enemyHPBar: Phaser.GameObjects.Graphics;
    hpBarWidth: number = 0;
    hpBarHeight: number = 0;
    isSpawning: boolean = false;
    enemyHPBarWidth: number = 0;
    enemyHPBarHeight: number = 0;
    timeText: Phaser.GameObjects.BitmapText;
    XPBarUI: Phaser.GameObjects.Rectangle;
    levelText: Phaser.GameObjects.BitmapText;
    levelPopUp: UIComponent;
    overlay: Phaser.GameObjects.Rectangle;
    settingsImage: Phaser.GameObjects.Image;
    elapsedTime: number = 0;
    timerEvent: Phaser.Time.TimerEvent | null = null;

    constructor ()
    {
        super('UI');
    }

    init(data: { player: Player, enemy: Player, playedUnits: string[] }): void {
        this.player = data.player;
        this.enemyPlayer = data.enemy;
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

    public updateEnemyHPBar(){
        this.enemyHPBar.clear();
        let hpRatio = this.player.getHealth(false);
        this.enemyHPBar.fillGradientStyle(0xec8845, 0xec8845, 0xc91c1c, 0xc91c1c, 1);
        this.enemyHPBar.lineStyle(2, 0x000000, 0.5);
        this.enemyHPBar.fillRect(-this.enemyHPBarWidth/2, -this.enemyHPBarHeight/2, this.enemyHPBarWidth*hpRatio, this.enemyHPBarHeight);
        this.enemyHPBar.strokeRect(-this.enemyHPBarWidth/2, -this.enemyHPBarHeight/2, this.enemyHPBarWidth, this.enemyHPBarHeight);
    }

    public updateXPBar(newValue: number){
        this.XPBarUI.scaleX = newValue/this.player.nextLevelXP();
        if(this.XPBarUI.scaleX > 1) this.XPBarUI.scaleX = 1;
    }

    public onLevelUp() {
        this.scene.launch('Pause', { player: this.player, situation: 'LevelUp' });
    }

    public onPause(){
        this.scene.launch('Pause', { player: this.player, situation: 'pause' });
    }

    create ()
    {      

        // Create player healthbar
        let desiredBarWidth = this.cameras.main.width/4;
        this.hpBarUI = new UIComponent(this, desiredBarWidth/2+24, 48, desiredBarWidth, 48, 0);
        this.add.existing(this.hpBarUI);
        this.hpBarWidth = this.hpBarUI.getWidth()-this.hpBarUI.getBorderThickness()[0]*2;
        this.hpBarHeight = this.hpBarUI.getHeight()-this.hpBarUI.getBorderThickness()[2]*2;
        this.hpBar = this.add.graphics();
        this.hpBarUI.add(this.hpBar);
        this.updateHPBar();

        // Create hp bar for AI opponent
        let enemyHPBarUI = new UIComponent(this, this.cameras.main.width-(desiredBarWidth/2+24), 48, desiredBarWidth, 48, 0);
        this.add.existing(enemyHPBarUI);
        this.enemyHPBarWidth = enemyHPBarUI.getWidth()-enemyHPBarUI.getBorderThickness()[0]*2;
        this.enemyHPBarHeight = enemyHPBarUI.getHeight()-enemyHPBarUI.getBorderThickness()[2]*2;
        this.enemyHPBar = this.add.graphics();
        enemyHPBarUI.add(this.enemyHPBar);
        this.updateEnemyHPBar();

        // Display resources
        this.moneyText = this.add.bitmapText(this.cameras.main.width/4-(32+50+24), this.cameras.main.height - (96), 'pixelFont', `${this.player.getMoney()}`, 48).setOrigin(1, 0.5).setTintFill(0xffffff);
        this.moneyImage = this.add.image(this.cameras.main.width/4-50, this.cameras.main.height - (96), 'coin').setOrigin(1, 0.5).setDisplaySize(40, 40);
        let moneyImageBorder = this.add.graphics();
        moneyImageBorder.lineStyle(1, 0xffffff, 1);
        moneyImageBorder.strokeCircle(this.cameras.main.width/4-(50+20), this.cameras.main.height - (96), 20);

        // Display settings/pause menu
        this.settingsImage = this.add.image(this.cameras.main.width/4*3+50, this.cameras.main.height - 96, 'cog').setOrigin(0, 0.5).setDisplaySize(64, 64).setInteractive();
        this.settingsImage.postFX.addGlow(0xA8A9AD, 1, 1, false, 1, 5);
        this.settingsImage.on('pointerup', () => {
            this.onPause()
        }).on('pointerover', () => {
            this.settingsImage.postFX.addGlow(0xffffff, 4, 1, false, 1, 5);
        }).on('pointerout', () => {
            this.settingsImage.postFX.clear();
            this.settingsImage.postFX.addGlow(0xA8A9AD, 1, 1, false, 1, 5);
        })

        // Display elapsed time
        this.timeText = this.add.bitmapText(this.cameras.main.width/2, 48, 'pixelFont', `0:00`, 48).setOrigin(0.5, 0.5).setTintFill(0x000000);

        // Display level
        this.levelText = this.add.bitmapText(16, this.cameras.main.height-16, 'pixelFont', `Level ${this.player.getLevel()}`, 48).setOrigin(0, 1).setTintFill(0xffd700);

        // Create XP bar
        this.XPBarUI = this.add.rectangle(0, this.cameras.main.height, this.cameras.main.width, 16, 0xffd700).setOrigin(0, 1).setDepth(999);
        this.XPBarUI.scaleX = 0;

        // Create unit spawning buttons based on selected units
        const playedUnits = this.registry.get('playerUnits');
        for(let i = -1; i < 2; i++) {
            const spawnButtonUI = new UIComponent(this, 0, 0, 96, 96, 1);
            const innerButtonHeight = 96 - spawnButtonUI.getBorderThickness()[2]*2;
            const innerButtonWidth = 96 - spawnButtonUI.getBorderThickness()[0]*2;
            const x = this.cameras.main.width/2 + i*(96+48);
            const y = this.cameras.main.height - 96;
            const unitSprite = this.add.image(0, 0, playedUnits[i+1] + '_static');
            
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
                    currentGlow = buttonBorder.postFX.addGlow(0xffffff, 4, 0, false, 1, 5);
                })
                .on('pointerout', () => {
                    let buttonBorder : Phaser.GameObjects.NineSlice = spawnButtonUI.list[2] as Phaser.GameObjects.NineSlice;
                    if(currentGlow) buttonBorder.postFX.remove(currentGlow);
                })
                .on('pointerup', () => {
                    if(this.isSpawning || this.player.getUnitQueue().length >= this.unitLimit || !this.player.canAfford(this.player.getUnitCost(playedUnits[i+1]))) return;
                    eventsCenter.emit('spawn-red-unit', playedUnits[i+1]);
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
                        duration: this.player.getUnitSpawnTime(playedUnits[i+1])
                    });
                });

            this.unitSpawnButtons.push(spawnButtonContainer);
            Phaser.Display.Align.In.Center(unitSprite, spawnButtonUI);
        }

        /** Event listener for player's money changes
         * updates money value in UI, renders UI buttons red if player cannot afford unit
         */
        eventsCenter.on('money-changed', (faction: string, amount: number) => {
            if(faction != this.player.faction) return;
            this.moneyText.setText(`${amount}`);
            this.unitSpawnButtons.forEach((button, i) => {
                let buttonUI : UIComponent= button.list[0] as UIComponent;
                if(this.player.canAfford(this.player.getUnitCost(playedUnits[i])) === false){
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

        // Listens for player's unit spawn event in order to remove the grey tint
        eventsCenter.on('unit-spawned', (faction: string) => {
            if(faction != this.player.faction) return;
            this.isSpawning = false;
            this.unitSpawnButtons.forEach((button) => {
                let buttonUI : UIComponent= button.list[0] as UIComponent;
                if(button.getData('canAfford') === true) buttonUI.changeTint(-1,-1);
            });
        });

        // Listeners for abse damage to update each health bars
        eventsCenter.on('base-take-damage', (faction: string) => {
            if(faction != this.player.faction) return;
            this.updateHPBar();
        });

        eventsCenter.on('base-take-damage', (faction: string) => {
            if(faction === this.player.faction) return;
            this.updateEnemyHPBar();
        });

        // Listener for XP accumulation events to update xp bar
        eventsCenter.on('xp-changed', (faction: string, amount: number) => {
            if(faction != this.player.faction) return;
            this.updateXPBar(amount);
            this.levelText.setText(`Level ${this.player.getLevel()}`);
        });

        // Listener for level up events to update level bar
        eventsCenter.on('level-up', (faction: string) => {
            if(faction != this.player.faction) return;
            this.onLevelUp();
        });

        eventsCenter.on('resume', (gameSpeed : number) => {
            this.tweens.timeScale = gameSpeed;
            this.physics.world.timeScale = 1 / gameSpeed;
            this.time.timeScale = gameSpeed;
        });

        // Listens to base destroyed event that is fired with losing faction
        eventsCenter.on('base-destroyed', (faction : string) => {
            const winner : string = (faction === this.player.faction) ? this.enemyPlayer.faction : this.player.faction;
            this.gameOver(winner);
        });

        // Keep record of time
        this.timerEvent = this.time.addEvent({
        delay: 1000,
        callback: () => {
            this.elapsedTime++;
            const formatedTime = [Math.floor(this.elapsedTime / 60), ((this.elapsedTime % 60).toFixed(0)).padStart(2, '0')].join(':');
            this.timeText.setText(formatedTime);  
        },
        callbackScope: this,
        loop: true
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

    /**
     * Handles all saving and clean up after game over
     * @param faction Faction of the winner
     */
    gameOver(faction: string) {
        // Save data about the game and player to register
        this.registry.set('playTime', this.registry.get('playTime') + this.elapsedTime);
        if(faction === this.player.faction) this.registry.set('gamesWon', this.registry.get('gamesWon') + 1);
        this.scene.stop('UI');
        this.scene.start('GameOver');
    }

    update(time: number, delta: number) {
   
    }

    shutdown() {
        this.timerEvent?.destroy;
        this.timerEvent = null;
        this.tweens.killAll();
        this.player.destroy();
        this.enemyPlayer.destroy();
    }
}
