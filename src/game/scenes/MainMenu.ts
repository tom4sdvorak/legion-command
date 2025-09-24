import { Scene, GameObjects } from 'phaser';
import { UIComponent } from '../components/UIComponent';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    logo: GameObjects.Text;
    title: GameObjects.Text;
    mainMenu: UIComponent

    constructor ()
    {
        super('MainMenu');
    }

    
    create ()
    {

        // x, y, width, height, background (0: lighter, 1: darker)
        this.mainMenu = new UIComponent(this, (this.game.config.width as number)/2, (this.game.config.height as number)/2, (this.game.config.width as number)*0.6, (this.game.config.height as number)*0.9, 0); 
        const interactableGroup = this.add.group();
        
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

    newGame() {
        this.scene.start('PreGame');
    }

    showCredits() {
        throw new Error('Method not implemented.');
    }
    
    continue() {
        throw new Error('Method not implemented.');
    }
}
