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
        //this.add.image((this.game.config.width as number)/2, (this.game.config.height as number)/2, 'UI_bg_lighter').setDisplaySize(this.game.config.width as number, this.game.config.height as number);
        //this.add.nineslice((this.game.config.width as number)/2, (this.game.config.height as number)/2, 'UI_border', undefined, (this.game.config.width as number), this.game.config.height as number, 8, 8, 6, 6);
        //test.setTint(0xffb3b3);

        // x, y, width, height, background (0: lighter, 1: darker), tint
        this.mainMenu = new UIComponent(this, (this.game.config.width as number)/2, (this.game.config.height as number)/2, (this.game.config.width as number)*0.9, (this.game.config.height as number)*0.9, 0);
        this.add.existing(this.mainMenu);


        this.logo = this.add.text(200, 200, 'Game', {
            fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        this.title = this.add.text(300, 300, 'Start', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerup', () => {

            this.scene.start('PreGame');

        });
    }
}
