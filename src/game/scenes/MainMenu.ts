import { Scene, GameObjects } from 'phaser';
import { UIComponent } from '../components/UIComponent';
import SaveManager, { SaveData } from '../helpers/SaveManager';
import { OverlayComponent } from '../components/OverlayComponent';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    logo: GameObjects.Text;
    title: GameObjects.Text;
    mainMenu: UIComponent;
    overlay: OverlayComponent;

    constructor ()
    {
        super('MainMenu');
    }

    
    create ()
    {

        // x, y, width, height, background (0: lighter, 1: darker)
        this.mainMenu = new UIComponent(this, (this.game.config.width as number)/2, (this.game.config.height as number)/2, (this.game.config.width as number)*0.6, (this.game.config.height as number)*0.9, 1); 
        const interactableGroup = this.add.group();
        this.overlay = new OverlayComponent(this);
        this.overlay.on('overlay-clicked', () => this.overlay.hide());
        
        // Menu buttons
        const buttonSize = 48;
        const playButton = this.add.bitmapText(0, 0, 'pixelFont', 'Play', buttonSize).setOrigin(0.5, 0.5).setInteractive().on('pointerup', () => this.showSaveSlots());
        interactableGroup.add(playButton);
        const creditsButton = this.add.bitmapText(0, 0, 'pixelFont', 'Credits', buttonSize).setOrigin(0.5, 0.5).setInteractive().on('pointerup', () => this.showCredits());
        interactableGroup.add(creditsButton);

        //this.mainMenu.add([continueButton, newGameButton, creditsButton]);
        this.mainMenu.insertElement(playButton);
        this.mainMenu.insertElement(creditsButton);
        this.mainMenu.positionElements(['center', 'center'], 16, 16);
        this.add.existing(this.mainMenu);

        interactableGroup.getChildren().forEach(child => {
            child.setInteractive();
            child.on('pointerover', () => {
                (child as any).postFX.addGlow(0xFFFF00, 1, 0, false);
            }, this);
            child.on('pointerout', ()=>{
                (child as any).postFX.clear();
            }, this);
        });
    }

    public showSaveSlots() : void {        
        // Create UI to show 3 save slots
        const container = this.add.container((this.game.config.width as number)/2, (this.game.config.height as number)/2);
        container.setDepth(9999);
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
                    .on('pointerup', () => SaveManager.deleteSave(saveSlot))
                    .on('pointerout', () => {
                        if (saveSlotDeleteButtonTween && saveSlotDeleteButtonTween.isPlaying()) {
                            saveSlotDeleteButtonTween.stop();
                        }
                        saveSlotDeleteButton.setScale(1.0);
                        saveSlotUIElement.changeTint(-1, -1);
                    })
                    .on('pointerover', () => {
                        this.tweens.killTweensOf(saveSlotDeleteButton);
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
                        saveSlotUIElement.changeTint(0xbd2222, 0xDE9191);
                    });
                saveSlotDeleteButton.setDropShadow(2, 2, 0xbd2222, 1);
                saveSlotUIElement.insertElement(saveSlotDeleteButton);
            }
            saveSlotUIElement.positionElements(['center', 'center'], 64, 16);
            container.add(saveSlotUIElement);
            currentPosX += UIElementWidth + gap;
            saveSlotUIElement.setInteractive()
                .on('pointerover', () => {
                    saveSlotUIElement.changeTint(0x39FF14, 0xB3FFB3);
                })
                .on('pointerout', () => {
                    saveSlotUIElement.changeTint(-1, -1);
                })
                .on('pointerup', () => {
                    this.chooseSaveSlot(saveSlot,isNew);
                });
        });
        container.x = (this.game.config.width as number) / 2 - (currentPosX - gap) / 2;
        this.add.existing(container);
        container.setDepth(1001);
        this.overlay.show(true,container);
    }

    chooseSaveSlot(saveSlot: string, isNew: boolean) {
        let loaded = false;
        // If new game, create new save and load its default values
        if(isNew){
            let saved = SaveManager.createAndSaveGame(saveSlot);
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
        throw new Error('Method not implemented.');
    }

}
