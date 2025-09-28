import { Scene, GameObjects } from 'phaser';
import { UIComponent } from '../components/UIComponent';
import SaveManager from '../helpers/SaveManager';
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
        const continueButton = this.add.bitmapText(0, 0, 'pixelFont', 'Continue', buttonSize).setOrigin(0.5, 0.5).setInteractive().on('pointerup', () => this.continue());
        interactableGroup.add(continueButton);
        const newGameButton = this.add.bitmapText(0, 0, 'pixelFont', 'New Game', buttonSize).setOrigin(0.5, 0.5).setInteractive().on('pointerup', () => this.newGame());
        interactableGroup.add(newGameButton);
        const creditsButton = this.add.bitmapText(0, 0, 'pixelFont', 'Credits', buttonSize).setOrigin(0.5, 0.5).setInteractive().on('pointerup', () => this.showCredits());
        interactableGroup.add(creditsButton);

        //this.mainMenu.add([continueButton, newGameButton, creditsButton]);
        this.mainMenu.insertElement(continueButton);
        this.mainMenu.insertElement(newGameButton);
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
            const saveSlotName = this.add.bitmapText(0, (32-UIElementHeight/2), 'pixelFont', saveData.saveName, 32).setOrigin(0.5, 0).setMaxWidth(UIElementWidth-32).setDepth(9999);
            saveSlotUIElement.insertElement(saveSlotName);
            // Dont show date for empty save slot
            if(saveData.saveName !== 'NewGame'){
                const date = new Date(saveData.timestamp);
                const options: Intl.DateTimeFormatOptions = {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit', 
                    hour: '2-digit',
                    minute: '2-digit',
                };
                const dateParsed = date.toLocaleString(undefined, options);
                const saveSlotText = this.add.bitmapText(0, (-UIElementHeight/4), 'pixelFont', dateParsed, 16).setOrigin(0.5, 0).setMaxWidth(UIElementWidth-32);
                saveSlotUIElement.insertElement(saveSlotText);
            }
            saveSlotUIElement.positionElements(['center', 'top'], 32, 16);
            container.add(saveSlotUIElement);
            currentPosX += UIElementWidth + gap;
            let currentGlow : any;
            saveSlotUIElement.setInteractive()
                .on('pointerover', () => {
                    let buttonBorder : Phaser.GameObjects.NineSlice = saveSlotUIElement.list[2] as Phaser.GameObjects.NineSlice;
                    if(currentGlow) buttonBorder.postFX.remove(currentGlow);
                    currentGlow = buttonBorder.postFX.addGlow(0xffffff, 4, 0, false, 1, 5);
                })
                .on('pointerout', () => {
                    let buttonBorder : Phaser.GameObjects.NineSlice = saveSlotUIElement.list[2] as Phaser.GameObjects.NineSlice;
                    if(currentGlow) buttonBorder.postFX.remove(currentGlow);
                })
                .on('pointerup', () => {
                    this.chooseSaveSlot(saveSlot);
                });
        });
        container.x = (this.game.config.width as number) / 2 - (currentPosX - gap) / 2;
        this.add.existing(container);
        container.setDepth(1001);
        this.overlay.show(container);
    }

    chooseSaveSlot(saveSlot: string) {
        throw new Error('Method not implemented.');
    }
        
    newGame() {
    
        this.showSaveSlots();
        this.scene.start('PreGame');
    }

    showCredits() {
        throw new Error('Method not implemented.');
    }
    
    continue() {
        throw new Error('Method not implemented.');
    }
}
