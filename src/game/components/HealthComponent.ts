
import { devConfig } from '../helpers/DevConfig';
import { PlayerBase } from '../PlayerBase';
import { Unit } from '../units/Unit';

    /**
     * HealthComponent is a class that manages the health of an unit or base and can display a health bar
     * @param parent The object that owns this health component.
     * @param maxHealth The maximum health of it
     * @param hpBar A boolean indicating whether to display the health bar or not.
     * @param {number} [width=30] The width of the health bar.
     * @param {number} [height=5] The height of the health bar.
     * @param {number} [yOffset=-20] The vertical offset of the health bar relative to the unit's position.
     */

export class HealthComponent {
    private parent: Unit | PlayerBase
    private health: number;
    private maxHealth: number;
    private healthBar: Phaser.GameObjects.Rectangle | null;
    private barWidth: number;
    private barHeight: number;
    private posY: number;
    private hpBarVisible: boolean = true;

    constructor(parent: any, maxHealth: number, hpBar: boolean = true, width: number = 30, height: number = 5, posY: number = -20, ) {
        this.health = maxHealth;
        this.maxHealth = maxHealth;
        this.barWidth = width;
        this.barHeight = height;
        this.posY = posY;
        this.parent = parent;
        this.healthBar = null;
        this.hpBarVisible = hpBar;
        this.createHealthBar();
    }

    update() : void {
        if (!this.parent.active) {
            return;
        }
        // Update Health Bar
        if (this.healthBar) {
            this.healthBar.x = this.parent.x;
            //this.healthBar.y = this.parent.y + this.yOffset;
            this.healthBar.width = this.barWidth * (this.health / this.maxHealth);
            if (this.healthBar.width > (this.barWidth * 0.66)) {
                this.healthBar.setFillStyle(0x00ff00);
            }
            else if (this.healthBar.width > (this.barWidth * 0.33)) {
                this.healthBar.setFillStyle(0xffa500);
            }
            else {
                this.healthBar.setFillStyle(0xff0000);
            }
        }
    }

    spawn(health: number) : void {
        this.maxHealth = health;
        this.health = health;
        if (this.healthBar) {
            this.healthBar.setVisible(true);
            //this.healthBar.y = this.parent.y + this.yOffset;
        }
        else{
            this.createHealthBar();
        }
        this.update();
    }

    deactivate() : void {
        this.healthBar?.setVisible(false);
        this.hpBarVisible = false;
    }

    createHealthBar() :void {
        this.healthBar = this.parent.scene.add.rectangle(-500, this.posY, this.barWidth, this.barHeight, 0x00ff00).setDepth(100).setAlpha(0.5);
        this.healthBar.setVisible(this.hpBarVisible);
    }

    toggleVisibility():void{
        this.hpBarVisible = !this.hpBarVisible;
        this.healthBar?.setVisible(this.hpBarVisible);
    }

    takeDamage(damage: number): void {
        this.health -= damage;
        if(devConfig.consoleLog) console.log(`${this.parent.constructor.name} took ${damage} damage, remaining health is ${this.health}`);
        if(this.health <= 0){
            this.health = 0;
            this.parent.emit("death", this.parent);
        }
    }

    heal(amount: number): void {
        this.health += amount;
        if(devConfig.consoleLog) console.log(`${this.parent.constructor.name} was healed by ${amount} hp, remaining health is ${this.health}`);
        if (this.health > this.maxHealth) {
            this.health = this.maxHealth;
        }
    }

    isAlive(): boolean {
        return this.health > 0;
    }

    getHealth(): number {
        return this.health;
    }

    getMaxHealth(): number {
        return this.maxHealth;
    }
}
