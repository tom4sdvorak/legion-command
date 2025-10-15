import { Scene } from 'phaser';
import { Player } from '../Player';
import { UIComponent } from '../components/UIComponent';
import eventsCenter from '../EventsCenter';
import { UnitUpgrade } from '../helpers/UnitUpgrade';
import { UpgradeManager } from '../helpers/UpgradeManager';

export class Pause extends Scene {
    player: Player;
    situation: string;
    overlay: Phaser.GameObjects.Rectangle;
    levelPopUp: UIComponent;
    menu: UIComponent;
    gameSpeed: number = 1;
    upgradeManager: UpgradeManager;
    constructor() {
        super('Pause');

    }

    init(data: { player: Player, situation: string }) {
        this.player = data.player;
        this.situation = data.situation;
        this.upgradeManager = UpgradeManager.getInstance();
    }

    public showLevelUp() : void {
        // Create level up UI
        const container = this.add.container(this.cameras.main.width/2, this.cameras.main.height/2);
        const gap = 16;
        let currentPosX = 0;
        const UIElementWidth = this.cameras.main.width/4;
        const UIElementHeight = this.cameras.main.height/2;

        /* Will run for each selected unit (1-3) to display random upgrade for it */
        this.player.selectedUnits.forEach((selectedUnit, unitType) => {
            const upgrade : UnitUpgrade = this.getRandomUpgrade(selectedUnit.unitConfig.tags);
            if(upgrade === undefined) return;
            const upgradeUIElement = new UIComponent(this, currentPosX+UIElementWidth/2, 0, UIElementWidth, UIElementHeight, 1);
            upgradeUIElement.setSize(UIElementWidth, UIElementHeight);
            const upgradeName = this.add.bitmapText(0, (32-UIElementHeight/2), 'pixelFont', upgrade.name, 32).setOrigin(0.5, 0).setMaxWidth(UIElementWidth-32);
            const upgradeDescription = this.add.bitmapText(0, (-UIElementHeight/4), 'pixelFont', upgrade.description, 16).setOrigin(0.5, 0).setMaxWidth(UIElementWidth-32);
            const unitSprite = this.add.sprite(0, UIElementHeight/2, `${unitType}_static`).setOrigin(0, 1);
            upgradeUIElement.insertElement(unitSprite);
            upgradeUIElement.insertElement(upgradeName);
            upgradeUIElement.insertElement(upgradeDescription);
            upgradeUIElement.positionElements(['center', 'top'], 0, 32);

            container.add(upgradeUIElement);
            currentPosX += UIElementWidth + gap;
            let currentGlow : any;
            upgradeUIElement.setInteractive()
                .on('pointerover', () => {
                    let buttonBorder : Phaser.GameObjects.NineSlice = upgradeUIElement.list[2] as Phaser.GameObjects.NineSlice;
                    if(currentGlow) buttonBorder.postFX.remove(currentGlow);
                    currentGlow = buttonBorder.postFX.addGlow(0xffffff, 4, 0, false, 1, 5);
                })
                .on('pointerout', () => {
                    let buttonBorder : Phaser.GameObjects.NineSlice = upgradeUIElement.list[2] as Phaser.GameObjects.NineSlice;
                    if(currentGlow) buttonBorder.postFX.remove(currentGlow);
                })
                .on('pointerup', () => {
                    this.levelUp(unitType, upgrade.id);
                });
        });

        container.x = this.cameras.main.width / 2 - (currentPosX - gap) / 2;
        this.add.existing(container);
        container.setDepth(1001);
    }

    public levelUp(unit: string, upgrade: string) {
        this.scene.resume('Game');
        this.scene.resume('UI');
        this.player.levelUp(unit, upgrade);
        this.scene.stop('Pause');
    }

    public resume(){
        this.scene.resume('Game');
        this.scene.resume('UI');
        eventsCenter.emit('resume', this.gameSpeed);
        this.scene.stop('Pause');
    }

    public showMenu() {
        this.menu = new UIComponent(this, this.cameras.main.width/2, this.cameras.main.height/2, this.cameras.main.width/2, this.cameras.main.height/2, 1);
        

        // Create items for menu
        const resumeButton = this.add.bitmapText(0, 0, 'pixelFont', 'Resume', 48).setOrigin(0.5, 0.5).setInteractive().on('pointerup', () => this.resume());
        const slowDownButton = this.add.bitmapText(0, 0, 'pixelFont', '<', 64).setOrigin(0.5, 0.5).setInteractive().on('pointerup', () => {
            if(this.gameSpeed > 1){
                this.gameSpeed--;
                gameSpeedText.setText(`Speed: ${this.gameSpeed}`);
            } 
        });
        const gameSpeedText = this.add.bitmapText(0, 0, 'pixelFont', `Speed: ${this.gameSpeed}`, 48).setOrigin(0.5, 0.5);
        const speedUpButton = this.add.bitmapText(0, 0, 'pixelFont', '>', 64).setOrigin(0.5, 0.5).setInteractive().on('pointerup', () => {
            if(this.gameSpeed < 3){
                this.gameSpeed++;
                gameSpeedText.setText(`Speed: ${this.gameSpeed}`);
            } 
        });
        const giveUpButton = this.add.bitmapText(0, 0, 'pixelFont', 'Give Up', 48).setOrigin(0.5, 0.5).setInteractive().on('pointerup', () => this.giveUp());

        // Insert them in order of appearance in menu
        this.menu.insertElement(resumeButton);
        this.menu.insertElement([slowDownButton, gameSpeedText, speedUpButton]);
        this.menu.insertElement(giveUpButton);
        this.menu.positionElements(['center', 'center'], 0, 32, 32);

        // Group them all as clickable elements and give them on hover glow
        const interactableGroup = this.add.group();
        interactableGroup.add(resumeButton);
        interactableGroup.add(slowDownButton);
        interactableGroup.add(speedUpButton);
        interactableGroup.add(giveUpButton);
        this.menu.setDepth(1001);
        this.add.existing(this.menu);

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
    giveUp() {
        this.scene.resume('Game');
        this.scene.resume('UI');
        // Mimic event of player's base destruction
        eventsCenter.emit('base-destroyed', this.player.faction);
        this.scene.stop('Pause');
    }

    private getRandomUpgrade(tags: string[]) : UnitUpgrade {
        const upgradesByTags = this.upgradeManager.getUnitUpgradesByTags(tags);
        const randomUpgradeIndex = Math.floor(Math.random() * upgradesByTags.length);
        const randomUpgrade = upgradesByTags[randomUpgradeIndex];
        return randomUpgrade;
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
