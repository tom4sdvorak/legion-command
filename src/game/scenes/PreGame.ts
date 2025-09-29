import { Scene, GameObjects } from 'phaser';
import { UIComponent } from '../components/UIComponent';
import SaveManager from '../helpers/SaveManager';

export class PreGame extends Scene
{
    unitsToTake : string[] = [];
    readyCheck: UIComponent;
    gameWidth : number;
    gameHeight : number;
    readyButton: Phaser.GameObjects.BitmapText;
    overlay: GameObjects.Rectangle;
    potionsMenu: UIComponent;
    constructionMenu: UIComponent;
    potionSelected: boolean = false;
    largeWindowSize: {w: number, h: number} = {w: 0, h: 0};

    constructor ()
    {
        super('PreGame');
    }

    preload(){
        this.gameWidth = this.game.config.width as number;
        this.gameHeight = this.game.config.height as number;
        this.largeWindowSize.w = (this.gameWidth/4*3);
        this.largeWindowSize.h = this.gameHeight-128;
    }

    create ()
    {     
        
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
                this.readyButton.postFX?.addGlow(0xFFFF00, 1, 0, false);
            })
            .on('pointerout', () => {
                if(this.unitsToTake.length < 3) return;
                this.readyButton.postFX?.clear();
            })
            .on('pointerup', () => {
                if(this.unitsToTake.length < 3) return;
                this.overlay.setVisible(true);
                this.readyCheck.setVisible(true);
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
            let glow = mySprite.postFX?.addGlow(0x000000, 1, 0, false);
            mySprite.on('pointerover', () => {
                mySprite.postFX.remove(glow);
                glow = mySprite.postFX.addGlow(0xffff00, 10, 0, false, 1, 1);
            }).on('pointerout', () => {
                mySprite.postFX.remove(glow);
                glow = mySprite.postFX?.addGlow(0x000000, 1, 0, false);
            });

            mySprite.play(`${unit}_idle`);
            mySprite.setDepth(mySprite.y);
            
        });
        this.alchemistLogic();
        const sawmill = this.add.sprite(300, 300, 'sawmill').play('sawmill_work').setDisplaySize(96, 96);
        sawmill.setInteractive({ pixelPerfect: true }).on('pointerup', () => {
            this.showConstructionMenu();
            this.overlay.setVisible(true);
        });
        this.add.sprite(this.gameWidth/2, this.gameHeight/2, 'campfire').play('campfire_burning').setDisplaySize(64,64);

        this.overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000).setOrigin(0, 0).setAlpha(0.5).setInteractive().setDepth(1000).setVisible(false);
        this.overlay.on('pointerup', () => {
            this.overlay.setVisible(false);
            this.readyCheck.setVisible(false);
            this.potionsMenu.setVisible(false);
            this.constructionMenu?.destroy();
            console.log("Overlay clicked");
        });
    }

    /* Handles ready check window */
    readyCheckLogic(){
        this.readyCheck = new UIComponent(this, this.gameWidth/2, this.gameHeight/2, this.gameWidth/2, this.gameHeight/2, 1);
        const readyText = this.add.bitmapText(0, 0, 'pixelFont', 'Ready?', 64).setOrigin(0.5, 0.5);
        const noText = this.add.bitmapText(0, 0, 'pixelFont', 'No', 64).setOrigin(0.5, 0.5).setInteractive().on('pointerup', () => {
            this.overlay.setVisible(false);
            this.readyCheck.setVisible(false);
        });
        const yesText = this.add.bitmapText(0, 0, 'pixelFont', 'Yes', 64).setOrigin(0.5, 0.5).setInteractive().on('pointerup', () => {
            this.readyCheck.setVisible(false);
            this.startGame();
        });
        this.readyCheck.insertElement(readyText);
        this.readyCheck.insertElement([ noText, yesText ]);
        this.readyCheck.positionElements(['center', 'center'], 16, 16);
        this.add.existing(this.readyCheck);
        this.readyCheck.setVisible(false).setDepth(1001).setInteractive();
    }
    startGame() {
        this.registry.set('playerUnits', this.unitsToTake);
        this.registry.get('gamesPlayed') ? this.registry.set('gamesPlayed', this.registry.get('gamesPlayed') + 1) : this.registry.set('gamesPlayed', 1);
        SaveManager.saveGame(this);
        this.scene.start('Game');
    }

    /* Handles sawmill sprite and construction upgrades */
    showConstructionMenu(){

        this.constructionMenu = new UIComponent(this, (this.gameWidth-this.largeWindowSize.w/2-64), this.gameHeight/2, this.largeWindowSize.w, this.largeWindowSize.h, 0).setDepth(1001);
        this.add.existing(this.constructionMenu);
        this.constructionMenu.setInteractive();

        const constructionJson = this.cache.json.get('constructionData');
        let builtConstructions : string[] = this.registry.get('builtConstructions') ?? [];
        constructionJson.forEach((con : any) => {
            if(!builtConstructions.includes(con.id)){
                if(con.prerequisites.some((prereq : string) => !builtConstructions.includes(prereq))){
                    return;
                }                
                // Upgrade info
                const conName = this.add.bitmapText(0, 0, 'pixelFont', con.name, 64).setMaxWidth(this.constructionMenu.width-64);
                const conText = this.add.bitmapText(0, 0, 'pixelFont', con.description, 32).setMaxWidth(this.constructionMenu.width-64);
                const conCostText = this.add.bitmapText(0, 0, 'pixelFont', `Cost: ${con.cost}`, 32).setOrigin(0,0.5);
                const coinImage = this.add.image(0, 0, 'coin').setDisplaySize(32, 32).setOrigin(0,0.5);

                // Buying button
                const conButtonBorder = this.add.rectangle(0, 0, 96, 34, 0xffffff, 0).setStrokeStyle(1, 0x000000);
                const conBuyText = this.add.bitmapText(0, 0, 'pixelFont', `BUILD`, 32);
                const conButton = this.add.container(0, 0, [conButtonBorder, conBuyText]);
                conButton.setSize(96, 34);
                conButton.setInteractive().on('pointerup', () => {
                    this.constructionMenu.destroy();
                    this.overlay.setVisible(false);
                    builtConstructions.push(con.id);
                    this.registry.set('builtConstructions', builtConstructions);
                });

                this.constructionMenu.insertElement(conName);
                this.constructionMenu.insertElement(conText);
                this.constructionMenu.insertElement([conCostText, coinImage, conButton]);

            }
        });
        if(this.constructionMenu.getContentLength() <= 0) return;
        this.constructionMenu.positionElements(['left', 'top'], 8, 16);


    }

    /* Handles alchemist sprite and potion selection */
    alchemistLogic(){
        this.potionsMenu = new UIComponent(this, (this.gameWidth-this.largeWindowSize.w/2-64), this.gameHeight/2, this.largeWindowSize.w, this.largeWindowSize.h, 0).setDepth(1001).setVisible(false);
        this.add.existing(this.potionsMenu);
        /*this.potionsMenu.on('uicomponent-visibility-changed', (visible : boolean) => {
            if(!visible) alchemist.playAfterRepeat('alchemist_dialogToIdle');
        });*/
        this.potionsMenu.setInteractive();
        
        // Load and show potions
        const potionJson = this.cache.json.get('potionData');
        potionJson.forEach((potion : any) => {

            // Potion info
            const potionName = this.add.bitmapText(0, 0, 'pixelFont', potion.name, 64).setMaxWidth(this.potionsMenu.width-64);
            const potionText = this.add.bitmapText(0, 0, 'pixelFont', potion.description, 32).setMaxWidth(this.potionsMenu.width-64);
            const potionCostText = this.add.bitmapText(0, 0, 'pixelFont', `Cost: ${potion.cost}`, 32).setOrigin(0,0.5);
            const coinImage = this.add.image(0, 0, 'coin').setDisplaySize(32, 32).setOrigin(0,0.5);
            
            // Buying button
            const potionButtonBorder = this.add.rectangle(0, 0, 64, 34, 0xffffff, 0).setStrokeStyle(1, 0x000000);
            const potionBuyText = this.add.bitmapText(0, 0, 'pixelFont', `BUY`, 32).setOrigin(0.5,0.5);
            const potionButton = this.add.container(0, 0, [potionButtonBorder, potionBuyText]);
            potionButton.setSize(32, 34);
            potionButton.setInteractive().on('pointerup', () => {
                this.potionsMenu.setVisible(false);
                this.overlay.setVisible(false);
                this.registry.set('playerPotion', potion);
                this.potionSelected = true;
                alchemist.playAfterRepeat('alchemist_idleToDialog');
            });

            this.potionsMenu.insertElement(potionName);
            this.potionsMenu.insertElement(potionText);
            this.potionsMenu.insertElement([potionCostText, coinImage, potionButton]);
        });
        this.potionsMenu.positionElements(['left', 'top'], 8, 16);

        const alchemist = this.add.sprite(100, 300, 'alchemist').play('alchemist_idle').setScale(2);
        alchemist.setInteractive({ pixelPerfect: true }).on('pointerup', () => {
            if(this.potionSelected) return;
            alchemist.playAfterRepeat('alchemist_idleToDialog');
            this.potionsMenu.setVisible(true);
            this.overlay.setVisible(true);
        });

        alchemist.on('animationcomplete', (anim : Phaser.Animations.Animation, frame : Phaser.Animations.AnimationFrame) => {
            switch (anim.key) {
                case 'alchemist_idle':
                    if (Math.random() <= 0.1) {
                        alchemist.play('alchemist_idle2');
                    }
                    else{
                        alchemist.play('alchemist_idle');
                    }
                    break;
                case 'alchemist_idle2':
                    alchemist.play('alchemist_idle');
                    break;
                case 'alchemist_idleToDialog':
                    alchemist.play('alchemist_dialog');
                    break;
                case 'alchemist_dialog':
                    alchemist.play('alchemist_dialogToIdle');
                    break;
                case 'alchemist_dialogToIdle':
                    if(this.potionSelected) {
                        alchemist.play('alchemist_idleToWork');
                    }
                    else{
                        alchemist.play('alchemist_idle');
                    }
                    break;
                case 'alchemist_idleToWork':
                    alchemist.play('alchemist_work');
                    break;
                case 'alchemist_work':
                    if (Math.random() < 0.5) {
                        alchemist.play('alchemist_work2');
                    }
                    else{
                        alchemist.play('alchemist_work');
                    }
                    break;
                case 'alchemist_work2':
                    if (Math.random() < 0.5) {
                        alchemist.play('alchemist_work2');
                    }
                    else{
                        alchemist.play('alchemist_work');
                    }
                    break;
            }
        });

    }
    showPotions() {
        throw new Error('Method not implemented.');
    }

    update(){
        
        if (this.unitsToTake.length === 3) {
            this.readyButton.setText(`READY`);
        }
        else{
            this.readyButton.setText(`Selected ${this.unitsToTake.length}/3`);
        }
    }
}
