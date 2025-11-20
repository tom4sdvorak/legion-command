import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { UI } from './scenes/UI';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { PreGame } from './scenes/PreGame';
import { Pause } from './scenes/Pause';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1200,
    height: 800,
    parent: 'game-container',
    pixelArt: true,
    autoRound: true,
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.HEIGHT_CONTROLS_WIDTH,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [
        Boot,
        Preloader,
        MainMenu,
        PreGame,
        MainGame,
        GameOver,
        UI,
        Pause
    ]
};

const StartGame = (parent: string) => {
    
    return new Game({ ...config, parent });

}

export default StartGame;
