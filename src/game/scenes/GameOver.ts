import { Scene } from 'phaser';
import eventsCenter from '../EventsCenter';
import SaveManager from '../helpers/SaveManager';
import { UIComponent } from '../components/UIComponent';
import { devConfig } from '../helpers/DevConfig';

export class GameOver extends Scene
{
    gameOverUI: UIComponent | undefined;
    postGameData: { winner: boolean, playTime: number, level: number, money: number, reward : number, unitsKilled: number, unitsSpawned: number } | undefined;

    constructor ()
    {
        super('GameOver');
    }

    init(data: { winner: boolean, playTime: number, level: number, money: number, reward: number, unitsKilled: number, unitsSpawned: number }){
        this.postGameData = data;
    }

    create ()
    {
        // Save game
        SaveManager.saveGame(this);

        // Clean up all listeners we were using before
        eventsCenter.removeAllListeners();

        this.events.once('shutdown', () => this.shutdown());

        this.gameOverUI = new UIComponent(this, (this.game.config.width as number)/2, (this.game.config.height as number)/2, (this.game.config.width as number)*0.6, (this.game.config.height as number)*0.9, 1); 
        let victoryString = '';
        let color = 0x000000;
        if(this.postGameData!.winner){
            victoryString = 'Victory';
            color = devConfig.positiveColor;
        }
        else{
            victoryString = 'Defeat';
            color = devConfig.negativeColor;
        }
        const victoryText = this.add.bitmapText(0, 0, 'pixelFont', victoryString, 96).setOrigin(0.5, 0.5).setTintFill(color).setDropShadow(3, 3, 0x000000, 1);
        const formatedTime = [Math.floor(this.postGameData!.playTime / 60), ((this.postGameData!.playTime % 60).toFixed(0)).padStart(2, '0')].join(':');
        const playTimeText = this.add.bitmapText(0, 0, 'pixelFont', `Play Time: ${formatedTime}`, 48).setOrigin(0.5, 0.5);

        /* Animated texts */
        const levelText = this.add.bitmapText(0, 0, 'pixelFont', `Level: `, 48).setOrigin(0.5, 0.5);
        const levelNumber = this.add.bitmapText(0, 0, 'pixelFont', `   0`, 48).setOrigin(0.5, 0.5);
        this.visualCountingUp(levelNumber, 0, this.postGameData!.level, 5000);
        const moneyText = this.add.bitmapText(0, 0, 'pixelFont', `Coins Accumulated: `, 48).setOrigin(0.5, 0.5);
        const moneyNumber = this.add.bitmapText(0, 0, 'pixelFont', `   0`, 48).setOrigin(0.5, 0.5);
        this.visualCountingUp(moneyNumber, 0, this.postGameData!.money, 5000);
        const coinRewardText = this.add.bitmapText(0, 0, 'pixelFont', `Reward: `, 48).setOrigin(0.5, 0.5);
        const coinRewardNumber = this.add.bitmapText(0, 0, 'pixelFont', `   0`, 48).setOrigin(0.5, 0.5);
        this.visualCountingUp(coinRewardNumber, 0, this.postGameData!.reward, 5000);
        const unitsKilledText = this.add.bitmapText(0, 0, 'pixelFont', `Units Killed: `, 48).setOrigin(0.5, 0.5);
        const unitsKilledNumber = this.add.bitmapText(0, 0, 'pixelFont', `   0`, 48).setOrigin(0.5, 0.5);
        this.visualCountingUp(unitsKilledNumber, 0, this.postGameData!.unitsKilled, 5000);
        const unitsSpawnedText = this.add.bitmapText(0, 0, 'pixelFont', `Units Spawned: `, 48).setOrigin(0.5, 0.5);
        const unitsSpawnedNumber = this.add.bitmapText(0, 0, 'pixelFont', `   0`, 48).setOrigin(0.5, 0.5);
        this.visualCountingUp(unitsSpawnedNumber, 0, this.postGameData!.unitsSpawned, 5000);
        /* End of animated texts */

        const continueText = this.add.bitmapText(0, 0, 'pixelFont', 'Continue', 64).setOrigin(0.5, 0.5).setInteractive()
            .on('pointerup', () => {
                this.scene.start('PreGame');
            })
            .on('pointerover', () => {
                this.tweens.killTweensOf(continueText);
                continueText.setScale(1.0);
                this.tweens.add({
                    targets: continueText,
                    ease: 'power2.inOut',
                    duration: 200,
                    scaleX: { start: 1.0, to: 1.2 }, 
                    scaleY: { start: 1.0, to: 1.2 },
                    yoyo: true,
                    repeat: -1
                });})
            .on('pointerout', () => {
                this.tweens.killTweensOf(continueText);
                continueText.setScale(1.0);
            });
        continueText.setDropShadow(2, 2, devConfig.positiveColor, 1);
        this.gameOverUI.insertElement(victoryText);
        this.gameOverUI.insertElement(playTimeText);
        this.gameOverUI.insertElement([levelText, levelNumber]);
        this.gameOverUI.insertElement([moneyText, moneyNumber]);
        this.gameOverUI.insertElement([coinRewardText, coinRewardNumber]);
        this.gameOverUI.insertElement([unitsKilledText, unitsKilledNumber]);
        this.gameOverUI.insertElement([unitsSpawnedText, unitsSpawnedNumber]);
        this.gameOverUI.insertElement(continueText);
        this.gameOverUI.positionElements(['center', 'center']);
        this.add.existing(this.gameOverUI);


        // Clean up temporary data
        this.registry.set('playerUnits', []);
        this.registry.remove('playerPotion');      
    }
    shutdown() {
        this.tweens.killAll();
        this.gameOverUI?.destroy();
        this.gameOverUI = undefined;
        this.postGameData = undefined;
    }

    visualCountingUp(bitmapTextObject: Phaser.GameObjects.BitmapText, startValue: number, endValue: number, duration: number){
        bitmapTextObject.setText(`${startValue}`);
        const counter = {
            value: startValue
        };
        this.tweens.add({
            targets: counter,
            value: endValue,
            duration: duration,
            ease: 'Cubic.easeOut',
            onUpdate: (tween) => {
                const currentValue = counter.value;
                bitmapTextObject.setText(Math.floor(currentValue).toLocaleString());
            },
            onComplete: () => {
                bitmapTextObject.setText(endValue.toLocaleString());
            }
        });
    }
}
