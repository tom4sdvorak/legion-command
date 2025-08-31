import { Scene, GameObjects } from 'phaser';
import { UIComponent } from '../components/UIComponent';

export class PreGame extends Scene
{
    unitList = ['warrior', 'archer', 'healer', 'fireWorm'];
    unitsToTake : string[] = [];
    readyCheck: Phaser.GameObjects.Container;
    gameWidth : number;
    gameHeight : number;
    readyButton: Phaser.GameObjects.Text;

    constructor ()
    {
        super('PreGame');
    }

    preload(){
        this.gameWidth = this.game.config.width as number;
        this.gameHeight = this.game.config.height as number;
    }

    create ()
    {     

        this.add.image(0, 0, 'pregamelayer3').setDisplaySize(this.gameWidth, this.gameHeight).setOrigin(0, 0);
        this.add.image(0, 0, 'pregamelayer1').setDisplaySize(this.gameWidth, this.gameHeight).setOrigin(0, 0);
        this.add.image(0, 0, 'pregamelayer2').setDisplaySize(this.gameWidth, this.gameHeight).setOrigin(0, 0);
        this.add.image(0, 0, 'pregamelayer4').setDisplaySize(this.gameWidth, this.gameHeight).setOrigin(0, 0);
        this.add.image(0, 0, 'pregamelayer5').setDisplaySize(this.gameWidth, this.gameHeight).setOrigin(0, 0);

        this.readyButton = this.add.text(this.gameWidth-100, this.gameHeight-100, 'Selected 0/3', {color: '#000', fontSize: '48px', fontFamily: 'Arial Black'}).setOrigin(1, 1).setInteractive()
            .on('pointerover', () => {
                if(this.unitsToTake.length < 3) return;
                this.readyButton.preFX?.addGlow(0xFFFF00, 1, 0, false);
            })
            .on('pointerout', () => {
                if(this.unitsToTake.length < 3) return;
                this.readyButton.preFX?.clear();
            })
            .on('pointerup', () => {
                if(this.unitsToTake.length < 3) return;
                this.readyCheck.setVisible(true);
            });
    

        const UI = new UIComponent(this, 0, 0, this.gameWidth/2, this.gameHeight/2, 1, undefined);
        this.readyCheck = this.add.container(this.gameWidth/2, this.gameHeight/2);
        this.readyCheck.add(UI).setVisible(false).setDepth(999);
        const readyText = this.add.text(0, -this.gameHeight/6, 'Ready?', {color: '#000', fontSize: '64px', fontFamily: 'Arial Black'}).setOrigin(0.5, 0);
        this.readyCheck.add(readyText);
        const noText = this.add.text(50, 0, 'No', {color: '#000', fontSize: '64px', fontFamily: 'Arial Black'}).setOrigin(0, 0.5).setInteractive().on('pointerup', () => {
            this.readyCheck.setVisible(false);
        });
        this.readyCheck.add(noText);
        const yesText = this.add.text(-50, 0, 'Yes', {color: '#000', fontSize: '64px', fontFamily: 'Arial Black'}).setOrigin(1, 0.5).setInteractive().on('pointerup', () => {
            this.readyCheck.setVisible(false);
            this.scene.start('Game', {units: this.unitsToTake});
        });
        this.readyCheck.add(yesText);

        this.unitList.forEach(unit => {
            const mySprite = this.add.sprite(200, 400, unit, 0).setScale(1.3).setRandomPosition(100, this.gameHeight/3, this.gameWidth*0.6, this.gameHeight/3).setOrigin(0.5).setInteractive().on('pointerup', () => {
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
            }).play(`${unit}_idle`);
            mySprite.preFX?.addGlow(0x000000, 1, 0, false);
            mySprite.setDepth(mySprite.y);
        });

        /*this.input.once('pointerup', () => {

            this.scene.start('Game');

        });*/
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
