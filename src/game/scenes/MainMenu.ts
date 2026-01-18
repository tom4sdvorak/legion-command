import { Scene, GameObjects } from 'phaser';
import { UIComponent } from '../components/UIComponent';
import SaveManager, { SaveData } from '../helpers/SaveManager';
import { OverlayComponent } from '../components/OverlayComponent';
import { devConfig } from '../helpers/DevConfig';
import { FramedImage } from '../components/FramedImage';

export class MainMenu extends Scene
{
    mainMenu: UIComponent;
    creditsUI: UIComponent | undefined;
    overlay: OverlayComponent;
    saveSlotsContainer: GameObjects.Container;

    constructor ()
    {
        super('MainMenu');
    }

    
    create ()
    {
        this.events.once('shutdown', () => this.shutdown());
        // x, y, width, height, background (0: lighter, 1: darker)
        this.mainMenu = new UIComponent(this, (this.game.config.width as number)/2, (this.game.config.height as number)/2, (this.game.config.width as number)*0.6, (this.game.config.height as number)*0.9, 1, true); 
        const interactableGroup = this.add.group();
        this.overlay = new OverlayComponent(this, 0x000000, 0.3);
        this.overlay.on('overlay-clicked', () => this.hideSaveSlots());
        
        // Menu buttons
        const buttonSize = 64;
        let menuTween : Phaser.Tweens.Tween | undefined;
        //const playButton = this.add.bitmapText(0, 0, 'pixelFont', 'Play', buttonSize).setOrigin(0.5, 0.5).setInteractive().on('pointerup', () => this.showSaveSlots());
        const playButton = this.add.bitmapText(0, 0, 'pixelFont', 'Play', buttonSize).setOrigin(0.5, 0.5).setInteractive()
            .on('pointerup', () => {
                this.showSaveSlots();
                this.tweens.killTweensOf(interactableGroup.getChildren());
            });
        //cancelText.setDropShadow(2, 2, devConfig.positiveColor, 1);
        interactableGroup.add(playButton);
        //const creditsButton = this.add.bitmapText(0, 0, 'pixelFont', 'Credits', buttonSize).setOrigin(0.5, 0.5).setInteractive().on('pointerup', () => this.showCredits());
        const creditsButton = this.add.bitmapText(0, 0, 'pixelFont', 'Credits', buttonSize).setOrigin(0.5, 0.5).setInteractive()
            .on('pointerup', () => {
                this.showCredits();
                this.tweens.killTweensOf(interactableGroup.getChildren());
            });
        interactableGroup.add(creditsButton);

        //this.mainMenu.add([continueButton, newGameButton, creditsButton]);
        this.mainMenu.insertElement(playButton);
        this.mainMenu.insertElement(creditsButton);
        this.mainMenu.positionElements(['center', 'center']);
        this.add.existing(this.mainMenu);

        interactableGroup.getChildren().forEach(child => {
            child.on('pointerover', () => {
                this.input.setDefaultCursor('pointer');
                this.tweens.killTweensOf(interactableGroup.getChildren());
                (child as Phaser.GameObjects.BitmapText).setScale(1.0); 
                menuTween = this.tweens.add({
                    targets: child,
                    ease: 'power2.inOut',
                    duration: 200,
                    scaleX: { start: 1.0, to: 1.1 }, 
                    scaleY: { start: 1.0, to: 1.1 },
                    yoyo: true,
                    repeat: -1
                });
            }, this);
            child.on('pointerout', ()=>{
                this.input.setDefaultCursor('default');
                if (menuTween && menuTween.isPlaying()) {
                    menuTween.stop();
                }
                (child as Phaser.GameObjects.BitmapText).setScale(1.0);
            }, this);
        });
    }
    shutdown() {
        this.tweens.killAll();
        this.hideSaveSlots();
        this.overlay.destroy();
        this.mainMenu.destroy();
        this.creditsUI?.destroy();
    }

    public showSaveSlots() : void {
        if (this.saveSlotsContainer) {
            this.hideSaveSlots(); 
        }
        // Create UI to show 3 save slots
        this.saveSlotsContainer = this.add.container((this.game.config.width as number)/2, (this.game.config.height as number)/2);
        this.saveSlotsContainer.setDepth(9999);
        const gap = 16;
        let currentPosX = 0;
        const UIElementWidth = (this.game.config.width as number)/4;
        const UIElementHeight = (this.game.config.height as number)/2;
        const saves : Map<string, {saveName: string, timestamp: string}> = SaveManager.getSaves();
        saves.forEach((saveData, saveSlot) => {
            const saveSlotUIElement = new UIComponent(this, currentPosX+UIElementWidth/2, 0, UIElementWidth, UIElementHeight, 0).setDepth(9999);
            saveSlotUIElement.setSize(UIElementWidth, UIElementHeight);
            const saveSlotName = this.add.bitmapText(0, (32-UIElementHeight/2), 'pixelFont', saveData.saveName, 64).setOrigin(0.5, 0).setMaxWidth(UIElementWidth-32).setDepth(9999);
            saveSlotUIElement.insertElement(saveSlotName);
            let isNew = true;
            // Dont show date for empty save slot
            if(saveData.saveName !== 'New Game'){
                isNew = false;
                const date = new Date(saveData.timestamp);
                const options: Intl.DateTimeFormatOptions = {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit', 
                    hour: '2-digit',
                    minute: '2-digit',
                };
                const dateParsed = date.toLocaleString(undefined, options);
                const saveSlotText = this.add.bitmapText(0, (-UIElementHeight/4), 'pixelFont', dateParsed, 32).setOrigin(0.5, 0).setMaxWidth(UIElementWidth-32);
                saveSlotUIElement.insertElement(saveSlotText);
                let saveSlotDeleteButtonTween : Phaser.Tweens.Tween | undefined;
                const saveSlotDeleteButton = this.add.bitmapText(0, 200, 'pixelFont', 'X', 64).setOrigin(0.5, 0).setInteractive()
                    .on('pointerup', () => {
                        if (saveSlotDeleteButtonTween && saveSlotDeleteButtonTween.isPlaying()) {
                            saveSlotDeleteButtonTween.stop();
                        }
                        saveSlotDeleteButton.setScale(1.0);
                        saveSlotUIElement.changeTint(-1, -1);
                        this.deleteSave(saveSlot, saveData.saveName);             
                    })
                    .on('pointerout', () => {
                        if (saveSlotDeleteButtonTween && saveSlotDeleteButtonTween.isPlaying()) {
                            saveSlotDeleteButtonTween.stop();
                        }
                        this.input.setDefaultCursor('default');
                        saveSlotDeleteButton.setScale(1.0);
                        saveSlotUIElement.changeTint(-1, -1);
                    })
                    .on('pointerover', () => {
                        this.tweens.killTweensOf(saveSlotDeleteButton);
                        this.input.setDefaultCursor('pointer');
                        saveSlotDeleteButton.setScale(1.0); 
                        saveSlotDeleteButtonTween = this.tweens.add({
                            targets: saveSlotDeleteButton,
                            ease: 'power2.inOut',
                            duration: 200,
                            scaleX: { start: 1.0, to: 1.5 }, 
                            scaleY: { start: 1.0, to: 1.5 },
                            yoyo: true,
                            repeat: -1
                        });
                        saveSlotUIElement.changeTint(devConfig.negativeColor, devConfig.negativeColorLight);
                    });
                saveSlotDeleteButton.setDropShadow(2, 2, devConfig.negativeColor, 1);
                saveSlotUIElement.insertElement(saveSlotDeleteButton);
            }
            saveSlotUIElement.positionElements(['center', 'center'], 0, 64);
            this.saveSlotsContainer.add(saveSlotUIElement);
            currentPosX += UIElementWidth + gap;
            saveSlotUIElement.setInteractive()
                .on('pointerover', () => {
                    saveSlotUIElement.changeTint(devConfig.positiveColor, devConfig.positiveColorLight);
                    this.input.setDefaultCursor('pointer');
                })
                .on('pointerout', () => {
                    saveSlotUIElement.changeTint(-1, -1);
                    this.input.setDefaultCursor('default');
                })
                .on('pointerup', () => {
                    this.chooseSaveSlot(saveSlot,isNew);
                });
        });
        this.saveSlotsContainer.x = (this.game.config.width as number) / 2 - (currentPosX - gap) / 2;
        this.add.existing(this.saveSlotsContainer);
        this.saveSlotsContainer.setDepth(1001);
        this.overlay.show(true,this.saveSlotsContainer);
    }

    hideSaveSlots() {
        if (this.saveSlotsContainer) {
            this.saveSlotsContainer.list.forEach(child => {
                if (child.destroy) {
                    child.destroy();
                }
            });
            this.saveSlotsContainer.destroy();
        }
        if(this.overlay) this.overlay.hide();
    }
    deleteSave(saveSlot: string, saveName: string) {
        const overlay = new OverlayComponent(this, 0x000000, 0.9);
        overlay.show(false);
        overlay.changeDepth(9000);
        overlay.on('overlay-clicked', () => {
            this.tweens.killTweensOf([deleteText, cancelText]);
            overlay.destroy();
            deleteCheck.destroy();
        });
        const deleteCheck = new UIComponent(this, (this.game.config.width as number)/2, (this.game.config.height as number)/2, (this.game.config.width as number)/2, (this.game.config.height as number)/2, 1);
        const readyText = this.add.bitmapText(0, 0, 'pixelFont', `Delete ${saveName}?`, 64).setOrigin(0.5, 0.5);
        let yesNoTween : Phaser.Tweens.Tween | undefined;
        const deleteText = this.add.bitmapText(0, 0, 'pixelFont', ' Delete ', 48).setOrigin(0.5, 0.5).setInteractive()
            .on('pointerup', () => {
                SaveManager.deleteSave(saveSlot);
                this.tweens.killTweensOf([deleteText, cancelText]);
                overlay.destroy();
                deleteCheck.destroy();
                this.showSaveSlots();
            })
            .on('pointerover', () => {
                this.tweens.killTweensOf([deleteText, cancelText]);
                this.input.setDefaultCursor('pointer');
                deleteText.setScale(1.0); 
                yesNoTween = this.tweens.add({
                    targets: deleteText,
                    ease: 'power2.inOut',
                    duration: 200,
                    scaleX: { start: 1.0, to: 1.05 }, 
                    scaleY: { start: 1.0, to: 1.05 },
                    yoyo: true,
                    repeat: -1
                });
                deleteCheck.changeTint(devConfig.negativeColor);
            })
            .on('pointerout', () => {
                if (yesNoTween && yesNoTween.isPlaying()) {
                    yesNoTween.stop();
                }
                this.input.setDefaultCursor('default');
                deleteText.setScale(1.0);
                deleteCheck.changeTint(-1);
            });

        deleteText.setDropShadow(2, 2, devConfig.negativeColor, 1);
        const cancelText = this.add.bitmapText(0, 0, 'pixelFont', ' Cancel ', 48).setOrigin(0.5, 0.5).setInteractive()
            .on('pointerup', () => {
                this.tweens.killTweensOf([deleteText, cancelText]);
                overlay.destroy();
                deleteCheck.destroy();
            })
            .on('pointerover', () => {
                this.tweens.killTweensOf([deleteText, cancelText]);
                this.input.setDefaultCursor('pointer');
                cancelText.setScale(1.0); 
                yesNoTween = this.tweens.add({
                    targets: cancelText,
                    ease: 'power2.inOut',
                    duration: 200,
                    scaleX: { start: 1.0, to: 1.1 }, 
                    scaleY: { start: 1.0, to: 1.1 },
                    yoyo: true,
                    repeat: -1
                });
                deleteCheck.changeTint(devConfig.positiveColor);})
            .on('pointerout', () => {
                if (yesNoTween && yesNoTween.isPlaying()) {
                    yesNoTween.stop();
                }
                this.input.setDefaultCursor('default');
                cancelText.setScale(1.0);
                deleteCheck.changeTint(-1);
            });
        cancelText.setDropShadow(2, 2, devConfig.positiveColor, 1);
        deleteCheck.insertElement(readyText);
        deleteCheck.insertElement([ deleteText, cancelText ]);
        deleteCheck.positionElements(['center', 'center']);
        this.add.existing(deleteCheck);
        deleteCheck.setDepth(9001).setInteractive();
        overlay.show(true);
    }

    async chooseSaveSlot(saveSlot: string, isNew: boolean) {
        let loaded = false;
        // If new game, create new save and load its default values
        if(isNew){
            let saved = await SaveManager.createAndSaveGame(saveSlot);
            if(saved) loaded = SaveManager.loadGame(this, saveSlot);
        }
        else{
            loaded = SaveManager.loadGame(this, saveSlot);
        }
        
        if(loaded) {
            this.scene.start('PreGame');
        }
        else{
            throw new Error('Could not load save');
        }
    }

    showCredits() {
        // Create credits menu if its not already existing
        const overlay = new OverlayComponent(this, 0x000000, 0.5);
        overlay.show(false);
        overlay.changeDepth(900);
        overlay.on('overlay-clicked', () => {
            overlay.destroy();
            this.creditsUI?.setVisible(false);
        });
        if(!this.creditsUI){
            this.creditsUI = new UIComponent(this, (this.game.config.width as number)/2, (this.game.config.height as number)/2, (this.game.config.width as number)*0.6, (this.game.config.height as number)*0.9, 0, true).setDepth(1000);
            this.add.existing(this.creditsUI);
            const developText = this.add.bitmapText(0, 0, 'pixelFont', 'DEVELOPED BY', 48);
            const developer = this.add.bitmapText(0, 0, 'pixelFont', 'Tomas Dvorak', 32);
            const artText = this.add.bitmapText(0, 0, 'pixelFont', 'ART BY:', 48);
            this.creditsUI!.insertElement(developText);
            this.creditsUI!.insertElement(developer);
            this.creditsUI!.insertElement(artText);
            const credits : {creator: string, link: string}[] = this.cache.json.get('credits');
            credits.forEach(credit => {
                const creditText = this.add.bitmapText(0, 0, 'pixelFont', credit.creator, 32);
                const creditLink = this.add.bitmapText(0, 0, 'pixelFont', credit.link, 16).setInteractive()
                    .on('pointerup', () => window.open(credit.link, '_blank'))
                    .on('pointerover', () => {
                        this.input.setDefaultCursor('pointer');
                    })
                    .on('pointerout', () => {
                        this.input.setDefaultCursor('default');
                    });
                this.creditsUI!.insertElement(creditText);
                this.creditsUI!.insertElement(creditLink); 
            });
            this.creditsUI!.positionElements(['left', 'top'], 8, 0, 16);

        }
        else{
            this.creditsUI.setVisible(true);
        }

    }

}
