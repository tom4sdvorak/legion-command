import { Scene } from 'phaser';
import { Player } from '../Player';
import { UIComponent } from '../components/UIComponent';

export class Pause extends Scene {
    player: Player;
    situation: string;
    overlay: Phaser.GameObjects.Rectangle;
    levelPopUp: UIComponent;
    menu: UIComponent;
    constructor() {
        super('Pause');
    }

    init(data: { player: Player, situation: string }) {
        this.player = data.player;
        this.situation = data.situation;
    }

    public showLevelUp() : void {
        // Create level up UI
        this.levelPopUp = new UIComponent(this, this.cameras.main.width/2, this.cameras.main.height/2, this.cameras.main.width/2, this.cameras.main.height/2, 1);
        const levelUpButton = this.add.bitmapText(0, 0, 'pixelFont', 'Level Up', 48).setOrigin(0.5, 0.5).setTintFill(0xffd700).setInteractive();
        levelUpButton.on('pointerup', () => this.levelUp());
        this.levelPopUp.setDepth(1001);
        this.levelPopUp.add(levelUpButton);
        this.add.existing(this.levelPopUp);
    }

    public levelUp() {
        console.log("Level up");
        this.scene.resume('Game');
        this.scene.resume('UI');
        this.player.levelUp();
        this.scene.stop('Pause');
    }

    public resume(){
        this.scene.resume('Game');
        this.scene.resume('UI');
        this.scene.stop('Pause');
    }

    public showMenu() {
        this.menu = new UIComponent(this, this.cameras.main.width/2, this.cameras.main.height/2, this.cameras.main.width/2, this.cameras.main.height/2, 1);
        const resumeButton = this.add.bitmapText(0, 0, 'pixelFont', 'Resume', 48).setOrigin(0.5, 0).setInteractive().on('pointerup', () => this.resume());
        this.menu.add(resumeButton);
        this.menu.setDepth(1001);
        this.add.existing(this.menu);
    }

    create() {
        this.scene.pause('Game');
        this.scene.pause('UI');
        this.overlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000).setOrigin(0, 0).setAlpha(0.5).setInteractive().setDepth(1000);
        if (this.situation === 'LevelUp') {
            this.showLevelUp();
        }
        else if (this.situation === 'pause') {
            this.showMenu();
        }
        else{
            this.resume();
        }
    }
    

}
