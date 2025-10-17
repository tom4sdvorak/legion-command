import { Scene, GameObjects } from 'phaser';
import { UIComponent } from '../components/UIComponent';
import SaveManager from '../helpers/SaveManager';
import { devConfig } from '../helpers/DevConfig';
import { ConstructionUpgrade, Potion, UpgradeManager } from '../helpers/UpgradeManager';
import { FramedImage } from '../components/FramedImage';
import { ICON_FRAMES } from '../helpers/IconKeys';

export class PreGame extends Scene
{
    unitsToTake : string[] = [];
    readyCheck: UIComponent | undefined;
    gameWidth : number;
    gameHeight : number;
    readyButton: Phaser.GameObjects.BitmapText| undefined;
    overlay: GameObjects.Rectangle| undefined;
    potionsMenu: UIComponent| undefined;
    constructionMenu: UIComponent| undefined;
    potionSelected: boolean = false;
    largeWindowSize: {w: number, h: number} = {w: 0, h: 0};
    upgradeManager: UpgradeManager;
    builtConstructions: string[] = [];
    campfire: Phaser.GameObjects.Sprite| undefined;
    alchemist: Phaser.GameObjects.Sprite| undefined;
    sawmill: Phaser.GameObjects.Sprite| undefined;

    constructor ()
    {
        super('PreGame');
    }

    init(){
        this.unitsToTake = [];
        this.potionSelected = false;
        this.gameWidth = this.game.config.width as number;
        this.gameHeight = this.game.config.height as number;
        this.largeWindowSize.w = (this.gameWidth/4*3);
        this.largeWindowSize.h = this.gameHeight-128;
        this.upgradeManager = UpgradeManager.getInstance();
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
        this.readyCheckLogic();

        this.readyButton = this.add.bitmapText(this.gameWidth-100, this.gameHeight-100, 'pixelFont', 'Selected 0/3', 64).setOrigin(1, 1).setInteractive()
            .on('pointerover', () => {
                if(this.unitsToTake.length < 3) return;
                this.readyButton?.postFX?.addGlow(0xFFFF00, 1, 0, false);
            })
            .on('pointerout', () => {
                if(this.unitsToTake.length < 3) return;
                this.readyButton?.postFX?.clear();
            })
            .on('pointerup', () => {
                if(this.unitsToTake.length < 3) return;
                this.overlay?.setVisible(true);
                this.readyCheck?.setVisible(true);
            });

        const unitList : string[] = this.registry.get('allUnits');
        unitList.forEach(unit => {
            const mySprite = this.add.sprite(200, 400, unit, 0).setScale(1).setRandomPosition(100, this.gameHeight/3, this.gameWidth*0.6, this.gameHeight/3).setOrigin(0.5).setInteractive({ pixelPerfect: true });
            mySprite.on('pointerup', () => {
                let destX, destY, direction;
                if(mySprite.x < (this.gameWidth*0.7)){
                    if(this.unitsToTake.length >= 3) return;
                    destX = Phaser.Math.Between(this.gameWidth*0.8, this.gameWidth*0.9);
                    destY = Phaser.Math.Between(this.gameHeight/3, this.gameHeight*0.7);
                    direction = 1;
                    Phaser.Utils.Array.Add(this.unitsToTake, unit, 3);
                }
                else{
                    destX = Phaser.Math.Between(this.gameWidth*0.1, this.gameWidth/2);
                    destY = Phaser.Math.Between(this.gameHeight/3, this.gameHeight*0.7);
                    direction = -1;
                    Phaser.Utils.Array.Remove(this.unitsToTake, unit);
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
                        mySprite.play(`${mySprite.texture.key}_idle`);
                    }
                });
            });
            mySprite.on('pointerover', () => {
                mySprite.postFX.addGlow(0xffff00, 10, 0, false, 1, 1);
            }).on('pointerout', () => {
                mySprite.postFX.clear();
            });

            mySprite.play(`${unit}_idle`);
            mySprite.setDepth(mySprite.y);
            
        });
        this.builtConstructions = this.registry.get('builtConstructions') ?? [];
        this.alchemistLogic();
        this.redoPregameConstruction();
        this.sawmill = this.add.sprite(300, 300, 'sawmill').play('sawmill_work').setDisplaySize(96, 96);
        this.sawmill.setInteractive({ pixelPerfect: true }).on('pointerup', () => {
            this.showConstructionMenu();
            this.overlay?.setVisible(true);
        });
        this.sawmill.on('pointerover', () => {
            this.sawmill?.postFX.addGlow(0x00FFFF, 10, 0, false, 1, 1);
        }).on('pointerout', () => {
            this.sawmill?.postFX.clear();
        });
        
        

        this.overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000).setOrigin(0, 0).setAlpha(0.5).setInteractive().setDepth(1000).setVisible(false);
        this.overlay.on('pointerup', () => {
            this.overlay?.setVisible(false);
            this.readyCheck?.setVisible(false);
            this.potionsMenu?.setVisible(false);
            this.constructionMenu?.destroy();
        });
    }

    shutdown() {
        this.readyCheck?.destroy();
        this.readyCheck = undefined;
        this.readyButton?.destroy();
        this.readyButton = undefined;
        this.overlay?.destroy();
        this.overlay = undefined;
        this.potionsMenu?.destroy();
        this.potionsMenu = undefined;
        this.constructionMenu?.destroy();
        this.constructionMenu = undefined;
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
            console.log("Found pot")
            if(this.campfire) this.campfire.setTexture('campfire_pot');
            else this.campfire = this.add.sprite(this.gameWidth/2, this.gameHeight/2, 'campfire_pot').setDisplaySize(64,64);
            this.campfire.play('campfire_pot_burning');
        }
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
        this.registry.set('playerUnits', this.unitsToTake);
        this.registry.get('gamesPlayed') ? this.registry.set('gamesPlayed', this.registry.get('gamesPlayed') + 1) : this.registry.set('gamesPlayed', 1);
        SaveManager.saveGame(this);
        this.scene.start('Game');
    }

    /* Handles this.sawmill sprite and construction upgrades */
    showConstructionMenu(){

        this.constructionMenu = new UIComponent(this, (this.gameWidth-this.largeWindowSize.w/2-64), this.gameHeight/2, this.largeWindowSize.w, this.largeWindowSize.h, 0, true).setDepth(1001);
        this.add.existing(this.constructionMenu);
        this.constructionMenu.setInteractive();

        const wallCons : ConstructionUpgrade[] = this.upgradeManager.getAllConstructionUpgrades('walls');
        const towerCons : ConstructionUpgrade[] = this.upgradeManager.getAllConstructionUpgrades('watchtower');
        const fireCons : ConstructionUpgrade[] = this.upgradeManager.getAllConstructionUpgrades('campfire');

        // Upgrade info
        let conID : string | undefined;
        let preConID : string | undefined;
        let lastClicked : FramedImage | undefined;
        const padding = 32;
        const conName = this.add.bitmapText(0, 0, 'pixelFont', ' ', 64).setMaxWidth(this.constructionMenu.width-padding*2);
        const conText = this.add.bitmapText(0, 0, 'pixelFont', ' ', 32).setMaxWidth(this.constructionMenu.width-padding*2);
        const conCostText = this.add.bitmapText(0, 0, 'pixelFont', `Cost:`, 48).setOrigin(0,0.5).setVisible(false);
        const conCost = this.add.bitmapText(0, 0, 'pixelFont', `   `, 48).setOrigin(0,0.5);
        const coinImage = this.add.image(0, 0, 'coin').setDisplaySize(32, 32).setOrigin(0,0.5).setVisible(false);
        const divider = this.add.line(0, 0, 0, 0, this.constructionMenu.width-padding*2, 0, 0x000000).setLineWidth(8);
        const empty = this.add.zone(0,0,128,32);
        const conBuyText = new FramedImage(this, 0, 0, 128, 48, 'square').setInteractive().setVisible(false);
        conBuyText.putInside(this.add.bitmapText(0, 0, 'pixelFont', 'Build', 48));
        conBuyText.on('pointerup', () => {
            if(conID && preConID){
                if(this.builtConstructions.includes(conID)) return;
                if(preConID !== 'none' && !this.builtConstructions.includes(preConID)) return;
                this.builtConstructions.push(conID);
                this.registry.set('builtConstructions', this.builtConstructions);
                this.constructionMenu?.destroy();
                this.redoPregameConstruction();
                this.showConstructionMenu();
            }
        });
        this.constructionMenu.insertElement(conName, true);
        this.constructionMenu.insertElement(conText, true);
        this.constructionMenu.insertElement([conCostText, conCost, coinImage, empty, conBuyText], true);
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
                if(this.builtConstructions.includes(con.id)){ // Change those already built to neutral color
                    conSlot.changeBorder(4, 0x000000);
                    conSlot.setData('built', true);
                    conSlot.setData('canBuild', false);
                    line.strokeColor = 0x000000;
                }
                else if(firstNotBuilt){ // On finding first upgrade not built, give it special color
                    firstNotBuilt = false;
                    conSlot.changeBorder(4, devConfig.positiveColor);
                    line.strokeColor = devConfig.positiveColor;
                    conSlot.setData('built', false);
                    conSlot.setData('canBuild', true);
                }
                else{
                    conSlot.setData('built', false);
                    conSlot.setData('canBuild', false);
                }
                conSlot.on('pointerup', () => {
                    if (this.constructionMenu?.getWasDragged()) {
                        console.log("Click stopped because Was Dragged");
                        return;
                    }
                    conCostText.setVisible(true);
                    coinImage.setVisible(true);
                    if(lastClicked && lastClicked !== conSlot){
                        lastClicked.changeBorder(4);
                    }
                    if(conSlot.getData('built')){
                        conBuyText.setVisible(false);
                    }
                    else if(!conSlot.getData('canBuild')){
                        conBuyText.setVisible(true);
                        conBuyText.changeBorder(4, devConfig.negativeColor);
                        conBuyText.changeBackground(devConfig.negativeColorLight, 0.5);
                    }
                    else{
                        conBuyText.setVisible(true);
                        conBuyText.changeBorder(4, devConfig.positiveColor);
                        conBuyText.changeBackground(devConfig.positiveColorLight, 0.5);
                    } 
                    conID = con.id;
                    if(con.prerequisites.length > 0){
                        preConID = con.prerequisites[0];
                    }
                    else{
                        preConID = 'none';
                    }
                    lastClicked = conSlot;
                    conName.setText(`${con.name}`);
                    conText.setText(`${con.description}`);
                    conCost.setText(`${con.cost}`);
                    conSlot.changeBorder(8);
                });
                tempArray.push(line, conSlot);
            });
            tempArray.splice(0,1);
            this.constructionMenu.insertElement(tempArray);
        }
        
        if(this.constructionMenu.getContentLength() <= 0) return;
        this.constructionMenu.positionElements(['left', 'top'], 0, 16, padding);


    }

    /* Handles this.alchemist sprite and potion selection */
    alchemistLogic(){
        this.potionsMenu = new UIComponent(this, (this.gameWidth-this.largeWindowSize.w/2-64), this.gameHeight/2, this.largeWindowSize.w, this.largeWindowSize.h, 0).setDepth(1001).setVisible(false);
        this.add.existing(this.potionsMenu);
        /*this.potionsMenu.on('uicomponent-visibility-changed', (visible : boolean) => {
            if(!visible) this.alchemist.playAfterRepeat('alchemist_dialogToIdle');
        });*/
        this.potionsMenu.setInteractive();
        
        // Load and show potions
        const potions : Potion[] = this.upgradeManager.getAllPotions();
        potions.forEach((potion : Potion) => {

            // Potion info
            const potionName = this.add.bitmapText(0, 0, 'pixelFont', potion.name, 64).setMaxWidth(this.potionsMenu!.width-64);
            const potionText = this.add.bitmapText(0, 0, 'pixelFont', potion.description, 32).setMaxWidth(this.potionsMenu!.width-64);
            const potionCostText = this.add.bitmapText(0, 0, 'pixelFont', `Cost: ${potion.cost}`, 32).setOrigin(0,0.5);
            const coinImage = this.add.image(0, 0, 'coin').setDisplaySize(32, 32).setOrigin(0,0.5);
            
            // Buying button
            const potionButtonBorder = this.add.rectangle(0, 0, 64, 34, 0xffffff, 0).setStrokeStyle(1, 0x000000);
            const potionBuyText = this.add.bitmapText(0, 0, 'pixelFont', `BUY`, 32).setOrigin(0.5,0.5);
            const potionButton = this.add.container(0, 0, [potionButtonBorder, potionBuyText]);
            potionButton.setSize(32, 34);
            potionButton.setInteractive().on('pointerup', () => {
                this.potionsMenu?.setVisible(false);
                this.overlay?.setVisible(false);
                this.registry.set('playerPotion', potion.id);
                this.potionSelected = true;
                this.alchemist?.playAfterRepeat('alchemist_idleToDialog');
            });

            this.potionsMenu?.insertElement(potionName);
            this.potionsMenu?.insertElement(potionText);
            this.potionsMenu?.insertElement([potionCostText, coinImage, potionButton]);
        });
        this.potionsMenu.positionElements(['left', 'top'], 0, 8);

        this.alchemist = this.add.sprite(100, 300, 'alchemist').play('alchemist_idle').setScale(2);
        this.alchemist.setInteractive({ pixelPerfect: true }).on('pointerup', () => {
            if(this.potionSelected) return;
            this.alchemist?.playAfterRepeat('alchemist_idleToDialog');
            this.potionsMenu?.setVisible(true);
            this.overlay?.setVisible(true);
        });

        this.alchemist.on('pointerover', () => {
            this.alchemist?.postFX.addGlow(0x00FFFF, 10, 0, false, 1, 1);
        }).on('pointerout', () => {
            this.alchemist?.postFX.clear();
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
        
        if (this.unitsToTake.length === 3) {
            this.readyButton?.setText(`READY`);
        }
        else{
            this.readyButton?.setText(`Selected ${this.unitsToTake.length}/3`);
        }
    }
}
