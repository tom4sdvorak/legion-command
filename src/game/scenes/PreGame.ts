import { Scene, GameObjects } from 'phaser';
import { UIComponent } from '../components/UIComponent';
import SaveManager from '../helpers/SaveManager';
import { devConfig } from '../helpers/DevConfig';
import { ConstructionUpgrade, Potion, UpgradeManager } from '../helpers/UpgradeManager';
import { FramedImage } from '../components/FramedImage';
import { ICON_FRAMES } from '../helpers/IconKeys';
import { GameLevel, GameManager } from '../helpers/GameManager';

export class PreGame extends Scene
{
    unitsToTake : string[] = [];
    readyCheck: UIComponent | undefined;
    gameWidth : number;
    gameHeight : number;
    levelButton: Phaser.GameObjects.BitmapText| undefined;
    selectedLevel: number;
    overlay: GameObjects.Rectangle| undefined;
    potionsMenu: UIComponent| undefined;
    constructionMenu: UIComponent| undefined;
    potionSelected: boolean = false;
    largeWindowSize: {w: number, h: number} = {w: 0, h: 0};
    upgradeManager: UpgradeManager;
    gameManager: GameManager;
    builtConstructions: string[] = [];
    campfire: Phaser.GameObjects.Sprite| undefined;
    alchemist: Phaser.GameObjects.Sprite| undefined;
    sawmill: Phaser.GameObjects.Sprite| undefined;
    settingsImage: GameObjects.Image;
    playerMoney: number = 0;
    playerMoneyText: GameObjects.BitmapText;
    moneyImage: GameObjects.Sprite;
    exitButton: GameObjects.BitmapText;
    levelButtonTween: Phaser.Tweens.Tween;
    topY: number = 0;
    botY: number = 0;
    conBuyButton: FramedImage;
    levelMenu: UIComponent | undefined;
    readyButton: GameObjects.BitmapText;
    readyButtonTween: Phaser.Tweens.Tween;
    stageSelectButton: FramedImage;

    constructor ()
    {
        super('PreGame');
    }

    init(){
        this.unitsToTake = [];
        this.potionSelected = false;
        this.gameWidth = this.game.config.width as number;
        this.gameHeight = this.game.config.height as number;
        this.topY = this.gameHeight/2 - 64;
        this.botY = this.gameHeight/2 + 192;
        this.largeWindowSize.w = (this.gameWidth/4*3);
        this.largeWindowSize.h = this.gameHeight-256;
        this.upgradeManager = UpgradeManager.getInstance();
        this.gameManager = GameManager.getInstance();
        this.selectedLevel = 0;
        this.builtConstructions = [];
    }

    create ()
    {     
        this.events.once('shutdown', () => this.shutdown());
        //Save game on entering pregame
        SaveManager.saveGame(this);
        

        this.add.image(0, 0, 'pregamelayer3').setDisplaySize(this.gameWidth, this.gameHeight).setOrigin(0, 0);
        this.add.image(0, 0, 'pregamelayer1').setDisplaySize(this.gameWidth, this.gameHeight).setOrigin(0, 0);
        this.add.image(0, 0, 'pregamelayer2').setDisplaySize(this.gameWidth, this.gameHeight).setOrigin(0, 0);
        this.add.image(0, 0, 'pregamelayer4').setDisplaySize(this.gameWidth, this.gameHeight).setOrigin(0, 0);
        this.add.image(0, 0, 'pregamelayer5').setDisplaySize(this.gameWidth, this.gameHeight).setOrigin(0, 0);
        this.gameLevelSelector();
        this.readyCheckLogic();

        // Display UI elements
        const layoutX = 64
        const layoutY = 64;
        this.add.rectangle(0, layoutY, this.gameWidth, 64, 0x000000).setOrigin(0, 0).setAlpha(0.5);
        this.playerMoneyText = this.add.bitmapText(layoutX, layoutY, 'pixelFont', `    `, 64).setOrigin(0, 0).setTintFill(0xFFFF00).setDropShadow(3, 3, 0x000000, 1);
        this.updateMoney();
        this.moneyImage = this.add.sprite(layoutX+this.playerMoneyText.width, layoutY+14, 'coin_gold').setOrigin(0, 0).setDisplaySize(36, 36);
        this.moneyImage.play('coin_gold_rotate');
        this.levelButton = this.add.bitmapText(this.gameWidth/2, layoutY, 'pixelFont', 'Select Stage', 64).setOrigin(0.5, 0).setTintFill(0xFFFF00).setDropShadow(3, 3, 0x000000, 1).setInteractive()
            .on('pointerover', () => {
                this.levelButton?.setTintFill(devConfig.positiveColor);
                this.input.setDefaultCursor('pointer');
            })
            .on('pointerout', () => {
                this.levelButton?.setTintFill(0xFFFF00);
                this.input.setDefaultCursor('default');
            })
            .on('pointerup', () => {
                this.overlay?.setVisible(true);
                this.levelMenu?.setVisible(true);
        });
        this.levelButtonTween = this.tweens.add({
            targets: this.levelButton,
            ease: 'power2.inOut',
            duration: 200,
            scaleX: { start: 1.0, to: 1.05 }, 
            scaleY: { start: 1.0, to: 1.05 },
            yoyo: true,
            repeat: -1
        });
        this.exitButton = this.add.bitmapText(this.gameWidth-layoutX, layoutY, 'pixelFont', 'QUIT', 64).setOrigin(1, 0).setTintFill(0xFFFF00).setDropShadow(3, 3, 0x000000, 1).setInteractive()
            .on('pointerup', () => {
                this.handleQuit();
            })
            .on('pointerover', () => {
                this.tweens.killTweensOf(this.exitButton);
                this.input.setDefaultCursor('pointer');
                this.exitButton.setTintFill(devConfig.negativeColor);
                this.tweens.add({
                    targets: this.exitButton,
                    ease: 'power2.inOut',
                    duration: 200,
                    scaleX: { start: 1.0, to: 1.1 }, 
                    scaleY: { start: 1.0, to: 1.1 },
                    yoyo: true,
                    repeat: -1
                });
            })
            .on('pointerout', () => {
                this.exitButton.setTintFill(0xFFFF00);
                this.input.setDefaultCursor('default');
                this.tweens.killTweensOf(this.exitButton);
            });

        this.add.rectangle(0, this.gameHeight-layoutY, this.gameWidth, 64, 0x000000).setOrigin(0, 1).setAlpha(0.5);
        this.readyButton = this.add.bitmapText(this.gameWidth/2, this.gameHeight-layoutY, 'pixelFont', 'Units selected (0/3)', 64).setOrigin(0.5, 1).setTintFill(0xFFFF00).setDropShadow(3, 3, 0x000000, 1).setInteractive()
            .on('pointerover', () => {
                if(this.unitsToTake.length < 3 || this.selectedLevel < 1) return;
                this.readyButton?.setTintFill(devConfig.positiveColor);
                this.input.setDefaultCursor('pointer');
            })
            .on('pointerout', () => {
                this.readyButton?.setTintFill(0xFFFF00);
                this.input.setDefaultCursor('default');
            })
            .on('pointerup', () => {
                if(this.unitsToTake.length < 3 || this.selectedLevel < 1) return;
                this.overlay?.setVisible(true);
                this.readyCheck?.setVisible(true);
        });
        
        /* Coordinates where selected units go*/
        interface PlacementSlot {
            id: number; 
            x: number;
            y: number;
            isOccupied: boolean;
            sprite: Phaser.GameObjects.Sprite | null;
        }
        type PlacementSlotList = Record<string, PlacementSlot>;
        const unitPlacements: PlacementSlotList = {
            'TOP': { 
                id: 0, 
                x: this.gameWidth-128, 
                y: this.topY,
                isOccupied: false,
                sprite: null
            },
            'CENTER': { 
                id: 1, 
                x: this.gameWidth-128,  
                y: Math.floor((this.botY + this.topY)/2),
                isOccupied: false,
                sprite: null
            },
            'BOT': { 
                id: 2, 
                x: this.gameWidth-128,  
                y: this.botY,
                isOccupied: false,
                sprite: null
            }
        };

        const unitList : string[] = this.registry.get('allUnits');
        unitList.forEach(unit => {
            const mySprite = this.add.sprite(200, 400, unit, 0).setScale(1).setRandomPosition(128, this.gameHeight/2-64, this.gameWidth*0.6, 256).setOrigin(0.5, 1).setInteractive({ pixelPerfect: true });
            mySprite.on('pointerup', () => { 
                this.tweens.killTweensOf(mySprite);
                let destX, destY, direction;
                const foundSlot = Object.values(unitPlacements).find(slot => slot.sprite === mySprite);
                if(foundSlot){ 
                    destX = Phaser.Math.Between(128, (this.gameWidth*0.6)+128);
                    destY = Phaser.Math.Between(this.gameHeight/2-64, this.gameHeight/2-64+256);
                    direction = -1;
                    Phaser.Utils.Array.Remove(this.unitsToTake, unit);
                    foundSlot.isOccupied = false;
                    foundSlot.sprite = null;
                }
                else{
                    if(this.unitsToTake.length >= 3) return;
                    const freeSlot = Object.values(unitPlacements).find(slot => !slot.isOccupied);
                    if(!freeSlot) return;
                    destX = freeSlot.x;
                    destY = freeSlot.y;
                    direction = 1;
                    freeSlot.isOccupied = true;
                    freeSlot.sprite = mySprite;
                    direction = 1;
                    Phaser.Utils.Array.Add(this.unitsToTake, unit, 3);                    
                }
                mySprite.setDepth(destY);
                mySprite.flipX = direction === -1;
                mySprite.play(`${mySprite.texture.key}_run`, true);
                this.tweens.add({
                    targets: mySprite,
                    x: destX,
                    y: destY,
                    duration: 3000,
                    ease: 'Power2.InOut',
                    onComplete: () => {
                        if (mySprite.x === destX && mySprite.y === destY) {
                            mySprite.play(`${mySprite.texture.key}_idle`);   
                        }                                 
                    }
                });
            });
            mySprite.on('pointerover', () => {
                mySprite.postFX.clear();
                this.input.setDefaultCursor('pointer');
                mySprite.postFX.addGlow(0xffff00, 10, 0, false, 1, 1);
            }).on('pointerout', () => {
                mySprite.postFX.clear();
                this.input.setDefaultCursor('default');
                mySprite.postFX.addGlow(0x000000, 2, 0, false, 1, 2);
            });
            mySprite.postFX.addGlow(0x000000, 2, 0, false, 1, 2);
            mySprite.play(`${unit}_idle`);
            mySprite.setDepth(mySprite.y);
            
        });
        this.builtConstructions = this.registry.get('builtConstructions') ?? [];
        this.alchemistLogic();
        this.redoPregameConstruction();
        this.sawmill = this.add.sprite(100, this.topY, 'sawmill').play('sawmill_work').setDisplaySize(96, 96).setOrigin(0.5, 1);
        this.sawmill?.postFX.addGlow(0x000000, 2, 0, false, 1, 2);
        this.sawmill.setInteractive({ pixelPerfect: true }).on('pointerup', () => {
            this.showConstructionMenu();
            this.overlay?.setVisible(true);
        });
        this.sawmill.on('pointerover', () => {
            this.sawmill?.postFX.clear();
            this.input.setDefaultCursor('pointer');
            this.sawmill?.postFX.addGlow(0x00FFFF, 10, 0, false, 1, 1);
        }).on('pointerout', () => {
            this.sawmill?.postFX.clear();
            this.input.setDefaultCursor('default');
            this.sawmill?.postFX.addGlow(0x000000, 2, 0, false, 1, 2);
        });

        

        /*this.settingsImage = this.add.image(this.cameras.main.width/4*3+50, this.cameras.main.height - 96, 'cog').setOrigin(0, 0.5).setDisplaySize(80, 80).setInteractive();
        this.settingsImage.postFX.addGlow(0xA8A9AD, 10, 1, false, 1, 1);
        this.settingsImage.setTint(0xA9A9A9);
        this.settingsImage.on('pointerup', () => {
            this.scene.start('MainMenu');
        }).on('pointerover', () => {
            this.settingsImage?.postFX.clear();
            this.settingsImage?.postFX.addGlow(0xffffff, 10, 0, false, 1, 1);
        }).on('pointerout', () => {
            this.settingsImage?.postFX.clear();
            this.settingsImage.postFX.addGlow(0xA8A9AD, 10, 1, false, 1, 1);
        })*/
        
        

        this.overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000).setOrigin(0, 0).setAlpha(0.5).setInteractive().setDepth(1000).setVisible(false);
        this.overlay.on('pointerdown', () => {
            this.overlay?.setVisible(false);
            this.readyCheck?.setVisible(false);
            this.potionsMenu?.setVisible(false);
            this.constructionMenu?.destroy();
            this.conBuyButton?.setVisible(false);
            this.stageSelectButton?.setVisible(false);
            this.levelMenu?.setVisible(false);
        });
    }

    updateMoney(){
        this.playerMoney = this.registry.get('coins');
        let moneyString = this.playerMoney.toString();
        while (moneyString.length < 5) {
            moneyString = ' ' + moneyString;
        }
        this.playerMoneyText.setText(moneyString);
    }
    async handleQuit() {
        try {
            await SaveManager.saveGame(this); 
            this.scene.start('MainMenu');

        } catch (error) {
            console.error('Save failed:', error);
            this.scene.start('MainMenu');
        }
    }

    shutdown() {
        this.readyCheck?.destroy();
        this.readyCheck = undefined;
        this.levelButton?.destroy();
        this.levelButton = undefined;
        this.overlay?.destroy();
        this.overlay = undefined;
        this.potionsMenu?.destroy();
        this.potionsMenu = undefined;
        this.constructionMenu?.destroy();
        this.constructionMenu = undefined;
        this.levelMenu?.destroy();
        this.levelMenu = undefined;
        this.conBuyButton?.destroy();
        this.stageSelectButton?.destroy();
        this.campfire?.destroy();
        this.campfire = undefined;
        this.alchemist?.destroy();
        this.alchemist = undefined;
        this.sawmill?.destroy();
        this.sawmill = undefined;
        this.tweens.killAll();
        this.input.removeAllListeners();  
    }

    redoPregameConstruction(){
        if(this.builtConstructions.includes('campfire_basic_0')){
            if(!this.campfire){
                this.campfire = this.add.sprite(this.gameWidth/2, this.gameHeight/2, 'campfire').setDisplaySize(64,64);
                this.campfire.play('campfire_burning');
            }
        }
        if(this.builtConstructions.includes('campfire_cauldron_0')){
            if(this.campfire) this.campfire.setTexture('campfire_pot');
            else this.campfire = this.add.sprite(this.gameWidth/2, this.gameHeight/2, 'campfire_pot').setDisplaySize(64,64);
            this.campfire.play('campfire_pot_burning');
        }
    }

    /* Game Level Selector */
    gameLevelSelector(){
        this.levelMenu = new UIComponent(this, this.gameWidth/2, this.gameHeight/2, this.gameWidth-128, this.gameHeight/2, 1, true).setVisible(false).setDepth(1001);
        this.levelMenu.setInteractive();
        this.add.existing(this.levelMenu);
        const lastStageWon = this.registry.get('lastStageWon') || 0;
        const title = this.add.bitmapText(0, 0, 'pixelFont', 'Select Stage', 64);
        const unitText = this.add.bitmapText(0, 0, 'pixelFont', 'Enemy units: ', 48).setVisible(false);
        const divider = this.add.line(0, 0, 0, 0, this.levelMenu.width-16*2, 0, 0x000000).setLineWidth(8);
        const units : Phaser.GameObjects.Image[] = [this.add.image(0, 0, 'single_pixel').setDisplaySize(16,16), this.add.image(0, 0, 'single_pixel'), this.add.image(0, 0, 'single_pixel'), this.add.image(0, 0, 'single_pixel'), this.add.image(0, 0, 'single_pixel'), this.add.image(0, 0, 'single_pixel')];
        const empty = this.add.rectangle(0, 0, 16, 16, 0x000000).setVisible(false);
        this.stageSelectButton = new FramedImage(this, this.gameWidth/2, this.levelMenu.y+this.levelMenu.height/2+36, 256, 64, 'square').setInteractive();
        this.stageSelectButton.setVisible(false);
        this.stageSelectButton.changeBorder(4, devConfig.positiveColor);
        this.stageSelectButton.changeBackground(devConfig.positiveColorLight, 0.5);
        this.stageSelectButton.setDepth(1002);
        this.add.existing(this.stageSelectButton);
        this.stageSelectButton.putInside(this.add.bitmapText(0, 0, 'pixelFont', 'Confirm', 48));
        this.stageSelectButton.on('pointerup', () => {
            this.selectedLevel = lastClicked?.getData('level');
            this.levelButton?.setText(`Stage ${this.selectedLevel}`);
            this.levelMenu?.setVisible(false);
            this.stageSelectButton.setVisible(false);
            this.overlay?.setVisible(false);
        })
        .on('pointerover', () => {
            this.input.setDefaultCursor('pointer');
            this.stageSelectButton.changeBackground(undefined, 1);
        })
        .on('pointerout', () => {
            this.input.setDefaultCursor('default');
            this.stageSelectButton.changeBackground(undefined, 0.5);
        });

        let tempArray : any[] = [];
        let lastClicked : FramedImage | undefined;
        this.gameManager.getAllLevels().forEach(level => {
            const levelIcon = new FramedImage(this, 0, 0, 64, 64, "circle");
            levelIcon.changeBorder(4, devConfig.negativeColor);
            levelIcon.changeBackground(devConfig.negativeColorLight, 0.5);
            const line : Phaser.GameObjects.Line = this.add.line(0, 0, 0, 0, 64, 0, devConfig.negativeColor).setLineWidth(8);
            
            if(level.level <= lastStageWon){
                levelIcon.changeBorder(4, 0x000000);
                levelIcon.changeBackground(0x000000, 0.5);
                levelIcon.setData('playable', true);
                line.strokeColor = 0x000000;
            }
            else if(level.level <= lastStageWon+10){
                levelIcon.changeBorder(4, devConfig.positiveColor);
                levelIcon.changeBackground(devConfig.positiveColorLight, 0.5);
                levelIcon.setData('playable', true);
                line.strokeColor = devConfig.positiveColor;
            }
            else{
                levelIcon.setData('playable', false);
            }
            levelIcon.putInside(this.add.bitmapText(0, 0, 'pixelFont', `${level.level}`, 64).setOrigin(0.5, 0.5));
            levelIcon.setInteractive();
            levelIcon.on('pointerup', () => {
                if (this.constructionMenu?.getWasDragged()) {
                    return;
                }
                if(lastClicked && lastClicked !== levelIcon){
                    lastClicked.changeBorder(4);
                }
                levelIcon.setData('level', level.level);
                lastClicked = levelIcon;
                levelIcon.changeBorder(8);
                unitText.setVisible(true);
                title.setText(`Stage ${level.level} (${level.difficulty})`);
                level.units.forEach((unit, index) => {
                    units[index].setTexture(`${unit}_static`).setOrigin(0.5, 1);
                    units[index].setScale(0.8);
                });
                if(levelIcon.getData('playable')){
                    this.stageSelectButton.setVisible(true);
                }
                else{
                    this.stageSelectButton.setVisible(false);
                }
                this.levelMenu?.positionElements(['center', 'top'], 0, 16, 16);
            })
            .on('pointerover', () => {
                this.input.setDefaultCursor('pointer');
                levelIcon.changeBackground(undefined, 1);
            })
            .on('pointerout', () => {
                this.input.setDefaultCursor('default');
                levelIcon.changeBackground(undefined, 0.5);
            });
            tempArray.push(line, levelIcon);
        });
        //tempArray.splice(0,1);
        this.levelMenu.insertElement(title, true);
        this.levelMenu.insertElement([unitText, ...units], true);
        this.levelMenu.insertElement(empty, true);
        this.levelMenu.insertElement(divider, true);
        this.levelMenu.insertElement(empty);
        this.levelMenu.insertElement(tempArray);
        
        if(this.levelMenu.getContentLength() <= 0) return;
        this.levelMenu.positionElements(['center', 'top'], 0, 16, 16);
    }

    /* Handles ready check window */
    readyCheckLogic(){
        this.readyCheck = new UIComponent(this, this.gameWidth/2, this.gameHeight/2, this.gameWidth/2, this.gameHeight/2, 1);
        const readyText = this.add.bitmapText(0, 0, 'pixelFont', 'Ready?', 80).setOrigin(0.5, 0.5);
        let yesNoTween : Phaser.Tweens.Tween | undefined;
        const noText = this.add.bitmapText(0, 0, 'pixelFont', ' No ', 64).setOrigin(0.5, 0.5).setInteractive()
            .on('pointerup', () => {
                this.overlay?.setVisible(false);
                this.readyCheck?.setVisible(false);
            })
            .on('pointerover', () => {
                this.tweens.killTweensOf([noText, yesText]);
                this.input.setDefaultCursor('pointer');
                noText.setScale(1.0); 
                yesNoTween = this.tweens.add({
                    targets: noText,
                    ease: 'power2.inOut',
                    duration: 200,
                    scaleX: { start: 1.0, to: 1.2 }, 
                    scaleY: { start: 1.0, to: 1.2 },
                    yoyo: true,
                    repeat: -1
                });
                this.readyCheck?.changeTint(devConfig.negativeColor);
            })
            .on('pointerout', () => {
                if (yesNoTween && yesNoTween.isPlaying()) {
                    yesNoTween.stop();
                }
                this.input.setDefaultCursor('default');
                noText.setScale(1.0);
                this.readyCheck?.changeTint(-1);
            });

        noText.setDropShadow(1, 1, devConfig.negativeColor, 1);
        const yesText = this.add.bitmapText(0, 0, 'pixelFont', ' Yes ', 64).setOrigin(0.5, 0.5).setInteractive()
            .on('pointerup', () => {
                this.readyCheck?.setVisible(false);
                this.startGame();
            })
            .on('pointerover', () => {
                this.tweens.killTweensOf([noText, yesText]);
                this.input.setDefaultCursor('pointer');
                yesText.setScale(1.0); 
                yesNoTween = this.tweens.add({
                    targets: yesText,
                    ease: 'power2.inOut',
                    duration: 200,
                    scaleX: { start: 1.0, to: 1.2 }, 
                    scaleY: { start: 1.0, to: 1.2 },
                    yoyo: true,
                    repeat: -1
                });
                this.readyCheck?.changeTint(devConfig.positiveColor);})
            .on('pointerout', () => {
                if (yesNoTween && yesNoTween.isPlaying()) {
                    yesNoTween.stop();
                }
                this.input.setDefaultCursor('default');
                yesText.setScale(1.0);
                this.readyCheck?.changeTint(-1);
            });
        yesText.setDropShadow(1, 1, devConfig.positiveColor, 1);
        this.readyCheck.insertElement(readyText);
        this.readyCheck.insertElement([ noText, yesText ]);
        this.readyCheck.positionElements(['center', 'center'], 0, 32);
        this.add.existing(this.readyCheck);
        this.readyCheck.setVisible(false).setDepth(1001).setInteractive();
    }
    startGame() {
        if(this.unitsToTake.length < 3 || this.unitsToTake.length > 3){
            console.error("Invalid number of units to take");
            return;
        }
        if(this.selectedLevel < 1){
            console.error("No level selected");
            return;
        }
        this.registry.set('playerUnits', this.unitsToTake);
        this.registry.set('stage', this.selectedLevel);
        this.registry.get('gamesPlayed') ? this.registry.set('gamesPlayed', this.registry.get('gamesPlayed') + 1) : this.registry.set('gamesPlayed', 1);
        SaveManager.saveGame(this);
        this.scene.start('Game');
    }

    /* Handles this.sawmill sprite and construction upgrades */
    showConstructionMenu(){
        const menuTopLeftPadding = 160;
        this.constructionMenu = new UIComponent(this, (menuTopLeftPadding+72+this.largeWindowSize.w/2), (menuTopLeftPadding+this.largeWindowSize.h/2), this.largeWindowSize.w, this.largeWindowSize.h, 0, true).setDepth(1001);
        this.add.existing(this.constructionMenu);
        this.constructionMenu.setInteractive();

        const wallCons : ConstructionUpgrade[] = this.upgradeManager.getAllConstructionUpgrades('walls');
        const towerCons : ConstructionUpgrade[] = this.upgradeManager.getAllConstructionUpgrades('watchtower');
        const fireCons : ConstructionUpgrade[] = this.upgradeManager.getAllConstructionUpgrades('campfire');

        // Upgrade info
        //let conID : string | undefined;
        //let preConID : string | undefined;
        let selectedCon : ConstructionUpgrade | undefined;
        let lastClicked : FramedImage | undefined;
        const padding = 32;
        const title = this.add.bitmapText(0, 0, 'pixelFont', 'WORKSHOP', 64).setMaxWidth(this.constructionMenu.width-padding*2);
        const conName = this.add.bitmapText(0, 0, 'pixelFont', '', 48).setMaxWidth(this.constructionMenu.width-padding*2);
        const conText = this.add.bitmapText(0, 0, 'pixelFont', '', 32).setMaxWidth(this.constructionMenu.width-padding*2);
        //const conCostText = this.add.bitmapText(0, 0, 'pixelFont', `Cost:`, 48).setOrigin(0,0.5).setVisible(false);
        const conCost = this.add.bitmapText(0, 0, 'pixelFont', ``, 48).setOrigin(0,0.5);
        const coinImage = this.add.image(0, 0, 'coin_gold').setOrigin(0,0.5).setVisible(false);
        const divider = this.add.line(0, 0, 0, 0, this.constructionMenu.width-padding*2, 0, 0x000000).setLineWidth(8);
        if(!this.conBuyButton){
            this.conBuyButton = new FramedImage(this, menuTopLeftPadding, this.constructionMenu.y+this.constructionMenu.height/2-64, 128, 128, 'square').setInteractive();
        }
        else this.conBuyButton.setVisible(true);
        this.conBuyButton.changeBorder(4, 0x333333);
        this.conBuyButton.changeBackground(0xCCCCCC, 0.5);
        this.conBuyButton.setDepth(1002);
        this.add.existing(this.conBuyButton);
        this.conBuyButton.putInside(this.add.bitmapText(0, 0, 'pixelFont', 'Build', 48));
        this.conBuyButton.on('pointerup', () => {
            if(selectedCon){ // If a construction is selected
                if(this.builtConstructions.includes(selectedCon.id)) return; // Skip if the construction is already built
                if(selectedCon.prerequisites.length > 0 && !this.builtConstructions.includes(selectedCon.prerequisites[0])) return; // Skip if a prerequisite is not built
                if(this.registry.get('coins') < selectedCon.cost) return; // Skip if not enough coins
                this.registry.set('coins', this.registry.get('coins') - selectedCon.cost);
                this.updateMoney();
                this.builtConstructions.push(selectedCon.id);
                this.registry.set('builtConstructions', this.builtConstructions);
                this.constructionMenu?.destroy();
                this.redoPregameConstruction();
                this.showConstructionMenu();
            }
        })
            .on('pointerover', () => {
                this.input.setDefaultCursor('pointer');
                this.conBuyButton.changeBackground(undefined, 1);
            })
            .on('pointerout', () => {
                this.input.setDefaultCursor('default');
                this.conBuyButton.changeBackground(undefined, 0.5);
            });
        this.constructionMenu.insertElement(title, true);
        this.constructionMenu.insertElement([conName, coinImage, conCost], true);
        this.constructionMenu.insertElement(conText, true);
        //this.constructionMenu.insertElement([conCostText, conCost, coinImage, empty, this.conBuyButton], true);
        this.constructionMenu.insertElement(divider, true);

        // Loop through construction upgrade types
        for(let i = 0; i < 3; i++){
            let constructions : ConstructionUpgrade[] = [];
            let tempArray : any[] = [];
            let firstNotBuilt : boolean = true;
            switch(i){
                case 0:
                    constructions = wallCons;
                    break;
                case 1:
                    constructions = towerCons;
                    break;
                case 2:
                    constructions = fireCons;
                    break;
            }
            
            constructions.forEach((con : ConstructionUpgrade) => {
                let conSlot : FramedImage;
                const line : Phaser.GameObjects.Line = this.add.line(0, 0, 0, 0, 64, 0, devConfig.negativeColor).setLineWidth(8);
                if(con.tier === 'major'){
                    conSlot = new FramedImage(this, 0, 0, 72, 72, 'squircle').setInteractive();
                }
                else{
                    conSlot = new FramedImage(this, 0, 0, 48, 48, 'square').setInteractive();
                }
                conSlot.putInside(this.add.image(0, 0, 'icons', ICON_FRAMES[con.iconFrameKey]));
                conSlot.changeBorder(4, devConfig.negativeColor); // Set all upgrades to not possible color
                conSlot.changeBackground(devConfig.negativeColorLight, 0.5);
                conSlot.setData('canBuild', false);
                if(this.builtConstructions.includes(con.id)){ // Change those already built to neutral color
                    conSlot.changeBorder(4, 0x000000);
                    conSlot.changeBackground(0xCCCCCC, 0.5);
                    conSlot.setData('built', true);
                    line.strokeColor = 0x000000;
                }
                else if(firstNotBuilt){ // On finding first upgrade not built, give it special color
                    firstNotBuilt = false;
                    conSlot.changeBorder(4, devConfig.positiveColor);
                    conSlot.changeBackground(devConfig.positiveColorLight, 0.5);
                    line.strokeColor = devConfig.positiveColor;
                    conSlot.setData('built', false);
                    if(this.playerMoney >= con.cost){
                        conSlot.setData('canBuild', true);
                    }
                }
                conSlot.on('pointerup', () => {
                    if (this.constructionMenu?.getWasDragged()) {
                        return;
                    }
                    coinImage.setVisible(true);
                    if(lastClicked && lastClicked !== conSlot){
                        lastClicked.changeBorder(4);
                    }
                    if(conSlot.getData('built')){
                        this.conBuyButton.changeBorder(4, 0x333333);
                        this.conBuyButton.changeBackground(0xCCCCCC, 0.5);
                    }
                    else if(!conSlot.getData('canBuild')){
                        this.conBuyButton.changeBorder(4, devConfig.negativeColor);
                        this.conBuyButton.changeBackground(devConfig.negativeColorLight, 0.5);
                    }
                    else{
                        this.conBuyButton.changeBorder(4, devConfig.positiveColor);
                        this.conBuyButton.changeBackground(devConfig.positiveColorLight, 0.5);
                    }
                    selectedCon = con; 
                    lastClicked = conSlot;
                    conName.setText(`${con.name} (`);
                    conText.setText(`${con.description}`);
                    conCost.setText(` ${con.cost})`);
                    conSlot.changeBorder(8);
                    this.constructionMenu!.positionElements(['left', 'top'], 0, 8, padding);
                })
                    .on('pointerover', () => {
                        this.input.setDefaultCursor('pointer');
                        conSlot.changeBackground(undefined, 1);
                    })
                    .on('pointerout', () => {
                        this.input.setDefaultCursor('default');
                        conSlot.changeBackground(undefined, 0.5);
                    });
                tempArray.push(line, conSlot);
            });
            tempArray.splice(0,1);
            this.constructionMenu.insertElement(tempArray);
        }
        
        if(this.constructionMenu.getContentLength() <= 0) return;
        this.constructionMenu.positionElements(['left', 'top'], 0, 8, padding);


    }

    /* Handles this.alchemist sprite and potion selection */
    alchemistLogic(){
        this.potionsMenu = new UIComponent(this, (this.gameWidth-this.largeWindowSize.w/2-64), this.gameHeight/2, this.largeWindowSize.w, this.largeWindowSize.h/2, 0).setDepth(1001).setVisible(false);
        this.add.existing(this.potionsMenu);
        this.potionsMenu.setInteractive();
        const title = this.add.bitmapText(0, 0, 'pixelFont', 'The Alchemist', 64);
        const text = this.add.bitmapText(0, 0, 'pixelFont', 'Enhance units with random potion for next game?', 32).setMaxWidth(this.potionsMenu!.width-64);
        const costText = this.add.bitmapText(0, 0, 'pixelFont', 'Costs 10', 32).setMaxWidth(this.potionsMenu!.width-64);
        const coinImage = this.add.image(0, 0, 'coin_gold').setDisplaySize(32, 32).setOrigin(0,0.5);
        const empty = this.add.rectangle(0, 0, 16, 16, 0x000000).setVisible(false);
        const potionBuy = new FramedImage(this, 0, 0, 64, 40, 'square').setInteractive();
        if(this.registry.get('coins') < 10){
            potionBuy.changeBorder(4, devConfig.negativeColor);
            potionBuy.changeBackground(devConfig.negativeColorLight, 0.5);
        }
        potionBuy.putInside(this.add.bitmapText(0, 0, 'pixelFont', 'BUY', 32));
        potionBuy.changeBorder(4, devConfig.positiveColor);
        potionBuy.changeBackground(devConfig.positiveColorLight, 0.5);
        this.potionsMenu.insertElement(title, true);
        this.potionsMenu.insertElement(text);
        this.potionsMenu.insertElement([costText, coinImage, empty, potionBuy]);
        this.potionsMenu.positionElements(['left', 'top'], 0, 8);

        potionBuy.on('pointerup', () => {
            if(this.registry.get('coins') < 10) return; // Skip if not enough coins
            this.registry.set('coins', this.registry.get('coins') - 10);
            this.updateMoney();
            const potions : Potion[] = this.upgradeManager.getAllPotions();
            const randomPotionIndex = Math.floor(Math.random() * potions.length);
            const randomPotion : Potion = potions[randomPotionIndex];
            this.registry.set('playerPotion', randomPotion.id);
            this.potionSelected = true;
            this.alchemist?.playAfterRepeat('alchemist_idleToDialog');
            this.potionsMenu?.destroyContent(false);
            const potionName = this.add.bitmapText(0, 0, 'pixelFont', randomPotion.name, 48).setMaxWidth(this.potionsMenu!.width-64);
            const potionText = this.add.bitmapText(0, 0, 'pixelFont', randomPotion.description, 32).setMaxWidth(this.potionsMenu!.width-64);
            this.potionsMenu?.insertElement(potionName);
            this.potionsMenu?.insertElement(potionText);
            this.potionsMenu?.positionElements(['left', 'top'], 0, 8);
        })
        .on('pointerover', () => {
            this.input.setDefaultCursor('pointer');
            potionBuy.changeBackground(devConfig.positiveColorLight, 1);
        })
        .on('pointerout', () => {
            this.input.setDefaultCursor('default');
            potionBuy.changeBackground(devConfig.positiveColorLight, 0.5);
        });

        this.alchemist = this.add.sprite(100, this.botY, 'alchemist').play('alchemist_idle').setScale(2).setOrigin(0.5, 1);
        this.alchemist.postFX.addGlow(0x000000, 2, 0, false, 1, 2);
        this.alchemist.setInteractive({ pixelPerfect: true }).on('pointerup', () => {
            this.alchemist?.playAfterRepeat('alchemist_idleToDialog');
            this.potionsMenu?.setVisible(true);
            this.overlay?.setVisible(true);
        });

        this.alchemist.on('pointerover', () => {
            this.alchemist?.postFX.clear();
            this.input.setDefaultCursor('pointer');
            this.alchemist?.postFX.addGlow(0x00FFFF, 10, 0, false, 1, 1);
        }).on('pointerout', () => {
            this.alchemist?.postFX.clear();
            this.input.setDefaultCursor('default');
            this.alchemist?.postFX.addGlow(0x000000, 2, 0, false, 1, 2);
        });

        this.alchemist.on('animationcomplete', (anim : Phaser.Animations.Animation, frame : Phaser.Animations.AnimationFrame) => {
            switch (anim.key) {
                case 'alchemist_idle':
                    if (Math.random() <= 0.1) {
                        this.alchemist?.play('alchemist_idle2');
                    }
                    else{
                        this.alchemist?.play('alchemist_idle');
                    }
                    break;
                case 'alchemist_idle2':
                    this.alchemist?.play('alchemist_idle');
                    break;
                case 'alchemist_idleToDialog':
                    this.alchemist?.play('alchemist_dialog');
                    break;
                case 'alchemist_dialog':
                    this.alchemist?.play('alchemist_dialogToIdle');
                    break;
                case 'alchemist_dialogToIdle':
                    if(this.potionSelected) {
                        this.alchemist?.play('alchemist_idleToWork');
                    }
                    else{
                        this.alchemist?.play('alchemist_idle');
                    }
                    break;
                case 'alchemist_idleToWork':
                    this.alchemist?.play('alchemist_work');
                    break;
                case 'alchemist_work':
                    if (Math.random() < 0.5) {
                        this.alchemist?.play('alchemist_work2');
                    }
                    else{
                        this.alchemist?.play('alchemist_work');
                    }
                    break;
                case 'alchemist_work2':
                    if (Math.random() < 0.5) {
                        this.alchemist?.play('alchemist_work2');
                    }
                    else{
                        this.alchemist?.play('alchemist_work');
                    }
                    break;
            }
        });

    }

    update(){
        if(this.selectedLevel > 0){
            this.tweens.killTweensOf(this.levelButton!);
        }
        if (this.unitsToTake.length === 3 && this.selectedLevel > 0) {
            this.readyButton?.setText(`READY?`);
            if(this.readyButtonTween && this.readyButtonTween.isPlaying()) return;
            this.readyButtonTween = this.tweens.add({
                targets: this.readyButton,
                ease: 'power2.inOut',
                duration: 200,
                scaleX: { start: 1.0, to: 1.2 }, 
                scaleY: { start: 1.0, to: 1.2 },
                yoyo: true,
                repeat: -1
            });
        }
        else{
            this.readyButton?.setText(`Units selected (${this.unitsToTake.length}/3)`);
            this.tweens.killTweensOf(this.readyButton!);
        }
    }
}
