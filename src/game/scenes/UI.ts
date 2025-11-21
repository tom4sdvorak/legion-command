import { Scene } from 'phaser';
import eventsCenter from '../EventsCenter';
import { Player } from '../Player';
import { UIComponent } from '../components/UIComponent';
import { AIPlayer } from '../AIPlayer';
import { devConfig } from '../helpers/DevConfig';
import { UnitProps } from '../helpers/UnitProps';
import { FramedImage } from '../components/FramedImage';

export class UI extends Scene
{
    button: Phaser.GameObjects.Shape | undefined;
    unitSpawnButtons: UIComponent[] = [];
    player: Player | undefined;
    enemyPlayer: AIPlayer | undefined;
    unitLimit: number = 1;
    moneyText: Phaser.GameObjects.BitmapText | undefined;
    moneyImage: Phaser.GameObjects.Sprite | undefined;
    hpBarUI: UIComponent | undefined;
    hpBar: Phaser.GameObjects.Graphics | undefined;
    enemyHPBarUI: UIComponent | undefined;
    enemyHPBar: Phaser.GameObjects.Graphics | undefined;
    hpBarWidth: number = 0;
    hpBarHeight: number = 0;
    isSpawning: boolean = false;
    enemyHPBarWidth: number = 0;
    enemyHPBarHeight: number = 0;
    timeText: Phaser.GameObjects.BitmapText | undefined;
    XPBarUI: Phaser.GameObjects.Rectangle | undefined;
    levelText: Phaser.GameObjects.BitmapText | undefined;
    levelPopUp: UIComponent | undefined;
    overlay: Phaser.GameObjects.Rectangle | undefined;
    settingsImage: Phaser.GameObjects.Image | undefined;
    elapsedTime: number = 0;
    timerEvent: Phaser.Time.TimerEvent | null = null;
    playerUnits: Map<string, UnitProps> = new Map<string, UnitProps>();
    

    constructor ()
    {
        super('UI');
    }

    /**
     * 
     * @param data Receives reference to human player and AI player classes
     */
    init(data: { player: Player, enemy: Player}): void {
        this.player = data.player;
        this.enemyPlayer = data.enemy;
        if(!this.player) throw new Error('Player is undefined');
        if(!this.enemyPlayer) throw new Error('Enemy player is undefined');

        // --- Recommended additions for a clean state ---
        this.unitSpawnButtons = [];
        this.unitLimit = 1;
        this.isSpawning = false;
        this.elapsedTime = 0;
        this.playerUnits = new Map<string, UnitProps>();

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
        if(!this.hpBar || !this.player) return;
        this.hpBar.clear();
        let hpRatio = this.player.getHealth(false);
        this.hpBar.fillGradientStyle(0xECEA45, 0xECEA45, 0x1CC949, 0x1CC949, 1);
        this.hpBar.lineStyle(2, 0x000000, 0.5);
        this.hpBar.fillRect(-this.hpBarWidth/2, -this.hpBarHeight/2, this.hpBarWidth*hpRatio, this.hpBarHeight);
        this.hpBar.strokeRect(-this.hpBarWidth/2, -this.hpBarHeight/2, this.hpBarWidth, this.hpBarHeight);
    }

    public updateEnemyHPBar(){
        if(!this.enemyHPBar || !this.enemyPlayer) return;
        this.enemyHPBar.clear();
        let hpRatio = this.enemyPlayer.getHealth(false);
        this.enemyHPBar.fillGradientStyle(0xec8845, 0xec8845, 0xc91c1c, 0xc91c1c, 1);
        this.enemyHPBar.lineStyle(2, 0x000000, 0.5);
        this.enemyHPBar.fillRect((-this.enemyHPBarWidth/2)+this.enemyHPBarWidth-this.enemyHPBarWidth * hpRatio, -this.enemyHPBarHeight/2, this.enemyHPBarWidth * hpRatio, this.enemyHPBarHeight);
        this.enemyHPBar.strokeRect(-this.enemyHPBarWidth/2, -this.enemyHPBarHeight/2, this.enemyHPBarWidth, this.enemyHPBarHeight);
    }

    public updateXPBar(newValue: number){
        if(!this.XPBarUI || !this.player) return;
        this.XPBarUI.scaleX = newValue/this.player.nextLevelXP();
        if(this.XPBarUI.scaleX > 1) this.XPBarUI.scaleX = 1;
    }

    public onLevelUp() {
        this.scene.launch('Pause', { player: this.player, situation: 'LevelUp' });
    }

    public onPause(){
        this.scene.launch('Pause', { player: this.player, situation: 'pause' });
    }

    public updateUnitStats(){
        if(!this.player) return;
        this.player.selectedUnits.forEach((unit, unitType: string) => {
            const unitStats : UnitProps = this.player!.getUnitStats(unitType);
            this.playerUnits.set(unitType, unitStats);
        });
        this.updateButtonStates();
    }

    create ()
    {      
        this.events.once('shutdown', () => this.shutdown());

        // Get initial stats of played units
        this.updateUnitStats();

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
        this.enemyHPBarUI = new UIComponent(this, this.cameras.main.width-(desiredBarWidth/2+24), 48, desiredBarWidth, 48, 0);
        this.add.existing(this.enemyHPBarUI);
        this.enemyHPBarWidth = this.enemyHPBarUI.getWidth()-this.enemyHPBarUI.getBorderThickness()[0]*2;
        this.enemyHPBarHeight = this.enemyHPBarUI.getHeight()-this.enemyHPBarUI.getBorderThickness()[2]*2;
        this.enemyHPBar = this.add.graphics();
        this.enemyHPBarUI.add(this.enemyHPBar);
        this.updateEnemyHPBar();

        // Display resources
        this.moneyText = this.add.bitmapText(this.cameras.main.width/4-(32+50+24), this.cameras.main.height - (96), 'pixelFont', `${this.player!.getMoney()}`, 48).setOrigin(1, 0.5).setTintFill(0xffffff);
        this.moneyImage = this.add.sprite(this.cameras.main.width/4-50, this.cameras.main.height - (96), 'coin_silver').setOrigin(1, 0.5).setDisplaySize(40, 40);
        this.moneyImage.play('coin_silver_rotate');
        /*let moneyImageBorder = this.add.graphics();
        moneyImageBorder.lineStyle(1, 0xffffff, 1);
        moneyImageBorder.strokeCircle(this.cameras.main.width/4-(50+20), this.cameras.main.height - (96), 20);*/

        // Display settings/pause menu
        this.settingsImage = this.add.image(this.cameras.main.width/4*3+50, this.cameras.main.height - 96, 'cog').setOrigin(0, 0.5).setDisplaySize(64, 64).setInteractive();
        let settingsImageGlow = this.settingsImage.postFX.addGlow(0xA8A9AD, 10, 1, false, 1, 1);
        this.settingsImage.on('pointerup', () => {
            this.onPause()
        }).on('pointerover', () => {
            this.settingsImage?.postFX.remove(settingsImageGlow);
            this.settingsImage?.postFX.addGlow(0xffffff, 10, 0, false, 1, 1);
            this.input.setDefaultCursor('pointer');
        }).on('pointerout', () => {
            this.settingsImage?.postFX.clear();
            this.input.setDefaultCursor('default');
            settingsImageGlow = this.settingsImage!.postFX.addGlow(0xA8A9AD, 10, 1, false, 1, 1);
        })

        // Display elapsed time
        this.timeText = this.add.bitmapText(this.cameras.main.width/2, 48, 'pixelFont', `0:00`, 48).setOrigin(0.5, 0.5).setTintFill(0x000000);

        // Display level
        this.levelText = this.add.bitmapText(16, this.cameras.main.height-16, 'pixelFont', `Level ${this.player?.getLevel()}`, 48).setOrigin(0, 1).setTintFill(0xffd700);

        // Create XP bar
        this.XPBarUI = this.add.rectangle(0, this.cameras.main.height, this.cameras.main.width, 16, 0xffd700).setOrigin(0, 1).setDepth(999);
        this.XPBarUI.scaleX = 0;

        // Create unit spawning buttons based on selected units
        //const playedUnits = this.registry.get('playerUnits');
        let count = -1;
        this.playerUnits.forEach((stats: UnitProps, unitType: string) => {
            const x = this.cameras.main.width/2 + count*(96+48);
            const y = this.cameras.main.height - 96;
            const spawnButtonUI = new UIComponent(this, x, y, 96, 96, 1);
            spawnButtonUI.setData('unitType', unitType);
            const innerButtonHeight = 96 - spawnButtonUI.getBorderThickness()[2]*2;
            const innerButtonWidth = 96 - spawnButtonUI.getBorderThickness()[0]*2;
            //const unitSprite = this.add.image(0, 0, unitType + '_static');
            
            // Determine how to resize the unit sprite so it fits UI element
            /*const maxRatio = innerButtonWidth / innerButtonHeight;
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
            unitSprite.setDisplaySize(newWidth,newHeight);*/
            let currentGlow : any; 
            //unitSprite.postFX.addGlow(0x000000, 2, 0, false, 1, 5);
            const unitLoadingBar = this.add.rectangle(0, innerButtonHeight/2, innerButtonWidth, innerButtonHeight, 0xffffff).setAlpha(0.5).setOrigin(0.5,1);
            unitLoadingBar.scaleY = 0;
            //const spawnButtonContainer = this.add.container(x, y);
            //spawnButtonContainer.setSize(96, 96);
            spawnButtonUI.add(unitLoadingBar);
            //spawnButtonUI.insertElement(unitSprite);
            //spawnButtonContainer.add(spawnButtonUI);
            //spawnButtonContainer.add(unitLoadingBar);
            //spawnButtonContainer.add(unitSprite);
            const unit = new FramedImage(this, 0, 0, innerButtonWidth, innerButtonHeight, "square");
            unit.changeBackground(0xffffff, 0);
            unit.putInside(this.add.image(0, 0, unitType + '_static'));
            unit.putInside(this.add.bitmapText(0, 0, 'pixelFont', `${stats.cost}`, 32).setOrigin(0.5, 0.5).setTintFill(0x000000));
            spawnButtonUI.insertElement(unit);
            spawnButtonUI.setInteractive()
                .on('pointerover', () => {
                    let buttonBorder : Phaser.GameObjects.NineSlice = spawnButtonUI.getBorder();
                    if(currentGlow) buttonBorder.postFX.remove(currentGlow);
                    currentGlow = buttonBorder.postFX.addGlow(0xffff00, 10, 0, false, 1, 1);
                    this.input.setDefaultCursor('pointer');
                    unit.showAlt();
                })
                .on('pointerout', () => {
                    let buttonBorder : Phaser.GameObjects.NineSlice = spawnButtonUI.getBorder();
                    if(currentGlow) buttonBorder.postFX.remove(currentGlow);
                    this.input.setDefaultCursor('default');
                    unit.hideAlt();
                })
                .on('pointerup', () => {
                    if(this.isSpawning || this.player!.getUnitQueue().length >= this.unitLimit || !spawnButtonUI.getData('canAfford')) return;
                    eventsCenter.emit('spawn-red-unit', unitType);
                    this.isSpawning = true;
                    this.unitSpawnButtons.forEach((button : UIComponent) => {
                        this.updateButtonStates();
                    });
                    unitLoadingBar.scaleY = 1;
                    if(!this.playerUnits.get(unitType)) throw new Error(`Unit type ${unitType} does not exist`);
                    const unitSpawnTime = this.playerUnits.get(unitType)?.spawnTime || 0;
                    this.tweens.add({
                        targets: unitLoadingBar,
                        ease: 'Power1',
                        scaleY: 0,
                        duration: unitSpawnTime
                    });
                });

            //this.unitSpawnButtons.push(spawnButtonContainer);
            this.unitSpawnButtons.push(spawnButtonUI);
            this.add.existing(spawnButtonUI);
            //Phaser.Display.Align.In.Center(unitSprite, spawnButtonUI);
            count++;
        });

        // Keep record of time
        this.timerEvent = this.time.addEvent({
        delay: 1000,
        callback: () => {
            this.elapsedTime++;
            const formatedTime = [Math.floor(this.elapsedTime / 60), ((this.elapsedTime % 60).toFixed(0)).padStart(2, '0')].join(':');
            this.timeText?.setText(formatedTime);  
        },
        callbackScope: this,
        loop: true
        });
        
        // Bind event listeners with delay
        this.time.delayedCall(10, this.bindListeners, [], this);
        
        /*
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
                eventsCenter.emit('spawn-blue-unit', 'wizard');
            });
        const image2c = this.add.image(500, 300, 'wizard');
        Phaser.Display.Align.In.Center(image2c, this.button); // Center the image within the button.
        this.button.setData('parent', image2c);
        image2c.setData('parent', this.button);*/
    }

    private updateButtonStates(): void {
        this.unitSpawnButtons.forEach((button: UIComponent) => {
            const unitType: string = button.getData('unitType');
            const stats = this.playerUnits.get(unitType);
            if (!stats) return;

            const canAfford = this.player!.canAfford(stats.cost);
            button.setData('canAfford', canAfford);

            /* Update displayed cost of the unit by getting the bitmap text inside FramedImage which is inside our UIComponent button*/
            const insideElement = button.getChildrenByType('FramedImage')[0] as FramedImage;
            if(insideElement){
                const insideElementCostText = insideElement.getInsideAlt();
                if (insideElementCostText && insideElementCostText instanceof Phaser.GameObjects.BitmapText) {
                    insideElementCostText.setText(`${stats.cost}`);
                }
                else{
                    console.error('Could not find bitmap text inside Framed Image');
                }
            }
            else{
                console.error('Could not find FramedImage inside UIComp');
            }

            if (!canAfford) {
                button.changeTint(devConfig.negativeColor, devConfig.negativeColorLight);
            } else if (this.isSpawning) {
                button.changeTint(0x808080, 0xbfbfbf);
            } else {
                button.changeTint(-1, -1); // Reset tint
            }
        });
    }

    bindListeners() {
        /** Event listener for player's money changes
         * updates money value in UI, renders UI buttons red if player cannot afford unit
         */
        eventsCenter.on('money-changed', (faction: string, amount: number) => {
            if(faction != this.player?.faction) return;
            this.moneyText?.setText(`${amount}`);
            this.updateButtonStates();
        });

        // Listens for player's unit spawn event in order to remove the grey tint
        eventsCenter.on('unit-spawned', (faction: string) => {
            if(faction != this.player?.faction) return;
            this.isSpawning = false;
            this.updateButtonStates();
        });

        // Listeners for basese damage to update each health bars
        eventsCenter.on('base-take-damage', (faction: string) => {
            if(faction != this.player!.faction) this.updateEnemyHPBar()
            else this.updateHPBar();
        });

        // Listener for XP accumulation events to update xp bar
        eventsCenter.on('xp-changed', (faction: string, amount: number) => {
            if(faction != this.player!.faction) return;
            this.updateXPBar(amount);
            this.levelText?.setText(`Level ${this.player!.getLevel()}`);
        });

        // Listener for player getting unit upgrade to update our cached unit stats
        eventsCenter.on('upgrade-added', (faction: string) => {
            if(faction != this.player!.faction) return;
            this.updateUnitStats();
        });

        // Listener for level up events to trigger level up screen
        eventsCenter.on('level-up', (faction: string) => {
            if(faction != this.player!.faction) return;
            this.onLevelUp();
        });

        eventsCenter.on('resume', (gameSpeed : number) => {
            this.tweens.timeScale = gameSpeed;
            this.physics.world.timeScale = 1 / gameSpeed;
            this.time.timeScale = gameSpeed;
        });

        // Listens to base destroyed event that is fired with losing faction
        eventsCenter.on('base-destroyed', (faction : string) => {
            const winner : string = (faction === this.player!.faction) ? this.enemyPlayer!.faction : this.player!.faction;
            this.gameOver(winner);
        });
    }

    /**
     * Handles all saving and clean up after game over
     * @param faction Faction of the winner
     */
    gameOver(faction: string) {
        if(!this.player) throw new Error('Player is undefined');
        if(!this.enemyPlayer) throw new Error('Enemy player is undefined');
        // Save data about the game and player to register
        this.registry.set('playTime', this.registry.get('playTime') + this.elapsedTime);
        let rewardMoney = 0;
        if(faction === this.player!.faction) { // On player's victory
            this.registry.set('gamesWon', this.registry.get('gamesWon') + 1);
            this.registry.set('lastStageWon', this.registry.get('stage'));
            rewardMoney = 100 + this.player.getMoney() * 0.1; // Victory reward is always 100 + 10% of owned coins
            let totalMoney = this.registry.get('coins') + Math.floor(rewardMoney);
            this.registry.set('coins', totalMoney);
        } else { // On player's defeat
            let damageDealt = 1 - this.enemyPlayer?.getHealth(false); // Determine how much damage was dealt to AI (0 = no dmg, 1 = all damage);
            rewardMoney = this.player.getMoney() * (damageDealt/10); // Defeat reward is 0 to 10% of coins owned at the end
            let totalMoney = this.registry.get('coins') + Math.floor(rewardMoney);
            this.registry.set('coins', totalMoney);
        }
        this.scene.launch('GameOver', { winner: (faction === this.player.faction), playTime: this.elapsedTime, level: this.player.getLevel(), money: this.player.getMoney(), reward: Math.floor(rewardMoney), unitsKilled: this.player.unitsKilled, unitsSpawned: this.player.unitCounter });
        this.scene.stop('Game');
        this.scene.stop('UI');
    }

    update(time: number, delta: number) {
   
    }

    shutdown() {
        eventsCenter.removeAllListeners();
        this.input.removeAllListeners();
        this.timerEvent?.destroy();
        this.timerEvent = null;
        this.tweens.killAll();
        this.hpBarUI?.destroy();
        this.hpBarUI = undefined;
        this.enemyHPBarUI?.destroy();
        this.enemyHPBarUI = undefined;
        this.moneyText?.destroy();
        this.moneyText = undefined;
        this.moneyImage?.destroy();
        this.moneyImage = undefined;
        this.settingsImage?.destroy();
        this.settingsImage = undefined;
        this.timeText?.destroy();
        this.timeText = undefined;
        this.levelText?.destroy();
        this.levelText = undefined;
        this.XPBarUI?.destroy();
        this.XPBarUI = undefined;
        this.levelPopUp?.destroy();
        this.levelPopUp = undefined;
        this.overlay?.destroy();
        this.overlay = undefined;
        this.unitSpawnButtons.forEach(button => button.destroy());
        this.unitSpawnButtons = [];
    }
}
