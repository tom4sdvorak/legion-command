import { devConfig } from '../helpers/devConfig';
import { Unit } from '../units/Unit';

export class HealthComponent {
    private parent: Unit
    private health: number;
    private maxHealth: number;
    private healthBar: Phaser.GameObjects.Rectangle | null;
    private barWidth: number;
    private barHeight: number;
    private yOffset: number;

    constructor(parent: Unit, width: number, height: number, yOffset: number, maxHealth: number) {
        this.health = maxHealth;
        this.maxHealth = maxHealth;
        this.barWidth = width;
        this.barHeight = height;
        this.yOffset = yOffset;
        this.parent = parent;
        this.healthBar = null;
        this.createHealthBar();
    }

    update() : void {
        if (!this.parent.active) {
            return;
        }
        // Update Health Bar
        if (this.healthBar) {
            this.healthBar.x = this.parent.x;
            this.healthBar.y = this.parent.y + this.yOffset;
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
            this.healthBar.y = this.parent.y + this.yOffset;
        }
        else{
            this.createHealthBar();
        }
        this.update();
    }

    deactivate() : void {
        this.healthBar?.setVisible(false);
    }

    createHealthBar() {
        this.healthBar = this.parent.scene.add.rectangle(this.parent.x, this.parent.y+this.yOffset, this.barWidth, this.barHeight, 0x00ff00).setDepth(1).setAlpha(0.5);
    }
    takeDamage(damage: number): void {
        this.health -= damage;
        if(devConfig.consoleLog) console.log(`${this.parent.constructor.name} took ${damage} damage, remaining health is ${this.health}`);
        if(this.health <= 0){
            this.health = 0;
            this.parent.emit("death", this.parent);
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
