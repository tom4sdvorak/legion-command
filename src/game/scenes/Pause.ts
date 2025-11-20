import { Scene } from 'phaser';
import { Player } from '../Player';
import { UIComponent } from '../components/UIComponent';
import eventsCenter from '../EventsCenter';
import { UnitUpgrade, UpgradeManager } from '../helpers/UpgradeManager';
import { devConfig } from '../helpers/DevConfig';
import { FramedImage } from '../components/FramedImage';

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

    private determineRarity(){
        const playerLevel = this.player.getLevel();
        // Return common if player level is 1-5
        if(playerLevel <= 5) return 'common';
        // Return common 90% of the time and rare 10% of the time if player level is 6-10
        else if(playerLevel < 10) return Math.random() < 0.9 ? 'common' : 'rare';
        // If player is exactly level 10, return legendary
        else if(playerLevel === 10) return 'legendary';
        // Return common 75% of the time, rare 15% of the time and epic 10% of the time if player level is 11-15
        else if(playerLevel <= 15)return Math.random() < 0.75 ? 'common' : Math.random() < 0.9 ? 'rare' : 'epic';
        // Return common 60% of the time, rare 30% of the time and epic 10% of the time if player level is 15-20
        else if(playerLevel < 20)return Math.random() < 0.6 ? 'common' : Math.random() < 0.3 ? 'rare' : 'epic';
        // If player is exactly level 20, return legendary
        else if(playerLevel === 20) return 'legendary';
        // Above level 20, return common 55% of the time, rare 30% of the time, epic 10% of the time and legendary 5% of the time
        else return Math.random() < 0.55 ? 'common' : Math.random() < 0.3 ? 'rare' : Math.random() < 0.1 ? 'epic' : 'legendary';
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
            const rarity = this.determineRarity();
            const upgrade : UnitUpgrade = this.getRandomUpgrade(selectedUnit.unitConfig.tags, rarity);
            if(upgrade === undefined) return;
            const upgradeUIElement = new UIComponent(this, currentPosX+UIElementWidth/2, 0, UIElementWidth, UIElementHeight, 1);
            upgradeUIElement.setSize(UIElementWidth, UIElementHeight);
            const upgradeName = this.add.bitmapText(0, (32-UIElementHeight/2), 'pixelFont', upgrade.name, 32).setOrigin(0.5, 0).setMaxWidth(UIElementWidth-32);
            const upgradeDescription = this.add.bitmapText(0, (-UIElementHeight/4), 'pixelFont', upgrade.description, 16).setOrigin(0.5, 0).setMaxWidth(UIElementWidth-32);
            const tempArray : FramedImage[] = [];
            const unit = new FramedImage(this, 0, 0, 48, 48, `square`);
            unit.putInside(this.add.image(0, 0, `${unitType}_static`));
            tempArray.push(unit);
            upgrade.iconFrameKey.forEach((frameKey, index) => {
                const upgradeIcon = new FramedImage(this, 0, 0, 48, 48, "square");
                upgradeIcon.putInside(this.add.image(0, 0, frameKey));
                tempArray.push(upgradeIcon);
            });

            /*const unitSprite = this.add.sprite(0, UIElementHeight/2, `${unitType}_static`).setOrigin(0, 1);
            const scaleY = 48 / unitSprite.height;
            unitSprite.setScale(scaleY, scaleY);*/

            upgradeUIElement.insertElement(upgradeName);
            upgradeUIElement.insertElement(upgradeDescription);
            upgradeUIElement.insertElement(tempArray);
            upgradeUIElement.positionElements(['center', 'top'], 8, 32, 16);

            container.add(upgradeUIElement);
            currentPosX += UIElementWidth + gap;
            let currentGlow : any;
            upgradeUIElement.setInteractive()
                .on('pointerover', () => {
                    let buttonBorder : Phaser.GameObjects.NineSlice = upgradeUIElement.list[2] as Phaser.GameObjects.NineSlice;
                    if(currentGlow) buttonBorder.postFX.remove(currentGlow);
                    currentGlow = buttonBorder.postFX.addGlow(0xffffff, 4, 0, false, 1, 5);
                    this.input.setDefaultCursor('pointer');
                })
                .on('pointerout', () => {
                    let buttonBorder : Phaser.GameObjects.NineSlice = upgradeUIElement.list[2] as Phaser.GameObjects.NineSlice;
                    if(currentGlow) buttonBorder.postFX.remove(currentGlow);
                    this.input.setDefaultCursor('default');
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
        this.menu.positionElements(['center', 'center'], 16, 32, 32);

        // Group them all as clickable elements and give them on hover glow
        const interactableGroup = this.add.group();
        interactableGroup.add(resumeButton);
        interactableGroup.add(slowDownButton);
        interactableGroup.add(speedUpButton);
        interactableGroup.add(giveUpButton);
        this.menu.setDepth(1001);
        this.add.existing(this.menu);

        resumeButton.setDropShadow(2, 2, devConfig.positiveColor, 1);
        giveUpButton.setDropShadow(2, 2, devConfig.negativeColor, 1);


        interactableGroup.getChildren().forEach(child => {
            child.on('pointerover', () => {
                this.input.setDefaultCursor('pointer');
                this.tweens.killTweensOf(interactableGroup.getChildren());
                (child as Phaser.GameObjects.BitmapText).setScale(1.0);
                this.tweens.add({
                    targets: child,
                    ease: 'power2.inOut',
                    duration: 200,
                    scaleX: { start: 1.0, to: 1.2 }, 
                    scaleY: { start: 1.0, to: 1.2 },
                    yoyo: true,
                    repeat: -1
                });
            }, this);
            child.on('pointerout', ()=>{
                this.input.setDefaultCursor('default');
                this.tweens.killTweensOf(interactableGroup.getChildren());
                (child as Phaser.GameObjects.BitmapText).setScale(1.0);
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

    private getRandomUpgrade(tags: string[], filterByRarity?: 'common' | 'rare' | 'epic' | 'legendary') : UnitUpgrade {
        const upgradesByTags = this.upgradeManager.getUnitUpgradesByTags(tags);
        let arrayToCheck : UnitUpgrade[] = upgradesByTags;
        if (filterByRarity) {
            let rarityFilteredUpgrades : UnitUpgrade[] = [];
            while (rarityFilteredUpgrades.length === 0) {
                rarityFilteredUpgrades = upgradesByTags.filter(upgrade => upgrade.rarity === filterByRarity);
                // downgrade rarity
                switch (filterByRarity) {
                    case 'legendary':
                        filterByRarity = 'epic';
                        break;
                    case 'epic':
                        filterByRarity = 'rare';
                        break;
                    case 'rare':
                        filterByRarity = 'common';
                        break;
                    default:
                        if(rarityFilteredUpgrades.length === 0) throw new Error('No upgrades with rarity ' + filterByRarity);
                        break;
                }
            }
            arrayToCheck = rarityFilteredUpgrades;
        }
        const randomUpgradeIndex = Math.floor(Math.random() * arrayToCheck.length);
        const randomUpgrade = arrayToCheck[randomUpgradeIndex];
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
