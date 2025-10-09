import { Scene } from 'phaser';
import eventsCenter from '../EventsCenter';
import SaveManager from '../helpers/SaveManager';
import { UI } from './UI';
import { UIComponent } from '../components/UIComponent';
import { devConfig } from '../helpers/DevConfig';

export class GameOver extends Scene
{
    gameOverUI: UIComponent;
    postGameData: { winner: boolean, playTime: number, level: number, money: number, unitsKilled: number, unitsSpawned: number };

    constructor ()
    {
        super('GameOver');
    }

    init(data: { winner: boolean, playTime: number, level: number, money: number, unitsKilled: number, unitsSpawned: number }){
        this.postGameData = data;
    }

    create ()
    {
        // Save game
        SaveManager.saveGame(this);

        // Clean up all listeners we were using in previous scenes
        eventsCenter.removeAllListeners();

        this.gameOverUI = new UIComponent(this, (this.game.config.width as number)/2, (this.game.config.height as number)/2, (this.game.config.width as number)*0.6, (this.game.config.height as number)*0.9, 1); 
        let victoryString = '';
        let color = 0x000000;
        if(this.postGameData.winner){
            victoryString = 'Victory';
            color = devConfig.positiveColor;
        }
        else{
            victoryString = 'Defeat';
            color = devConfig.negativeColor;
        }
        const victoryText = this.add.bitmapText(0, 0, 'pixelFont', victoryString, 96).setOrigin(0.5, 0.5).setTintFill(color).setDropShadow(2, 2, 0x000000, 1);
        const formatedTime = [Math.floor(this.postGameData.playTime / 60), ((this.postGameData.playTime % 60).toFixed(0)).padStart(2, '0')].join(':');
        const playTimeText = this.add.bitmapText(0, 0, 'pixelFont', `Play Time: ${formatedTime}`, 48).setOrigin(0.5, 0.5);
        const levelText = this.add.bitmapText(0, 0, 'pixelFont', `Level: ${this.postGameData.level}`, 48).setOrigin(0.5, 0.5);
        const moneyText = this.add.bitmapText(0, 0, 'pixelFont', `Money: ${this.postGameData.money}`, 48).setOrigin(0.5, 0.5);
        const unitsKilledText = this.add.bitmapText(0, 0, 'pixelFont', `Units Killed: ${this.postGameData.unitsKilled}`, 48).setOrigin(0.5, 0.5);
        const unitsSpawnedText = this.add.bitmapText(0, 0, 'pixelFont', `Units Spawned: ${this.postGameData.unitsSpawned}`, 48).setOrigin(0.5, 0.5);
        let continueTween: Phaser.Tweens.Tween;
        const continueText = this.add.bitmapText(0, 0, 'pixelFont', 'Continue', 64).setOrigin(0.5, 0.5).setInteractive()
            .on('pointerup', () => {
                this.scene.start('PreGame');
            })
            .on('pointerover', () => {
                this.tweens.killTweensOf(continueText);
                continueText.setScale(1.0);
                continueTween = this.tweens.add({
                    targets: continueText,
                    ease: 'power2.inOut',
                    duration: 200,
                    scaleX: { start: 1.0, to: 1.2 }, 
                    scaleY: { start: 1.0, to: 1.2 },
                    yoyo: true,
                    repeat: -1
                });})
            .on('pointerout', () => {
                if (continueTween && continueTween.isPlaying()) {
                    continueTween.stop();
                }
                continueText.setScale(1.0);
            });
        continueText.setDropShadow(2, 2, devConfig.positiveColor, 1);
        this.gameOverUI.insertElement(victoryText);
        this.gameOverUI.insertElement(playTimeText);
        this.gameOverUI.insertElement(levelText);
        this.gameOverUI.insertElement(moneyText);
        this.gameOverUI.insertElement(unitsKilledText);
        this.gameOverUI.insertElement(unitsSpawnedText);
        this.gameOverUI.insertElement(continueText);
        this.gameOverUI.positionElements(['center', 'center'], 16, 32);
        this.add.existing(this.gameOverUI);


        // Clean up temporary data
        this.registry.set('playerUnits', []);
        this.registry.remove('playerPotion');
        console.log(this.registry.get('playerUnits'));        
    }
}
