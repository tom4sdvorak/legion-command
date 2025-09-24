import { Scene, GameObjects } from 'phaser';
import { UIComponent } from '../components/UIComponent';

export class PreGame extends Scene
{
    unitsToTake : string[] = [];
    readyCheck: UIComponent;
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

        this.readyCheckLogic();

        this.readyButton = this.add.text(this.gameWidth-100, this.gameHeight-100, 'Selected 0/3', {color: '#000', fontSize: '48px', fontFamily: 'Arial Black'}).setOrigin(1, 1).setInteractive()
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
        this.add.sprite(this.gameWidth/2, this.gameHeight/2, 'campfire').play('campfire_burning').setDisplaySize(64,64);
    }

    readyCheckLogic(){
        this.readyCheck = new UIComponent(this, this.gameWidth/2, this.gameHeight/2, this.gameWidth/2, this.gameHeight/2, 1);
        const readyText = this.add.bitmapText(0, 0, 'pixelFont', 'Ready?', 64).setOrigin(0.5, 0.5);
        const noText = this.add.bitmapText(0, 0, 'pixelFont', 'No', 64).setOrigin(0.5, 0.5).setInteractive().on('pointerup', () => {
            this.readyCheck.setVisible(false);
        });
        const yesText = this.add.bitmapText(0, 0, 'pixelFont', 'Yes', 64).setOrigin(0.5, 0.5).setInteractive().on('pointerup', () => {
            this.readyCheck.setVisible(false);
            this.registry.set('playerUnits', this.unitsToTake);
            this.scene.start('Game');
        });
        this.readyCheck.insertElement(readyText);
        this.readyCheck.insertElement([ noText, yesText ]);
        this.readyCheck.positionElements(['center', 'center'], 16, 16);
        this.add.existing(this.readyCheck);
        this.readyCheck.setVisible(false).setDepth(999);
    }

    alchemistLogic(){
        const alchemist = this.add.sprite(100, 300, 'alchemist').play('alchemist_idle').setScale(2);
        alchemist.setInteractive({ pixelPerfect: true }).on('pointerup', () => {
            alchemist.playAfterRepeat('alchemist_idleToDialog').playAfterRepeat('alchemist_dialog');
            this.showPotions();
        });

        alchemist.on('animationcomplete', (anim : Phaser.Animations.Animation, frame : Phaser.Animations.AnimationFrame) => {
            switch (anim.key) {
                case 'alchemist_idle':
                    alchemist.play('alchemist_idle2');
                    break;
                case 'alchemist_idle2':
                    alchemist.play('alchemist_idle');
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
