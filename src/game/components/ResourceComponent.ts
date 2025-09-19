import eventsCenter from "../EventsCenter";
import { Player } from "../Player";
import { PlayerController } from "./PlayerController";

export class ResourceComponent {
    private money: number = 0;
    private xp: number = 0;
    private maxXP: number = 100;
    private parent: PlayerController;
    private moneyPerSecond: number = 0;

    constructor(parent: PlayerController) {
        this.parent = parent;

        this.parent.scene.time.addEvent({
            delay: 1000,
            callback: () => this.addMoney(this.moneyPerSecond),
            callbackScope: this,
            loop: true
        });

    }

    public getMoney(): number {
        return this.money;
    }

    public getXP(): number {
        return this.xp;
    }

    public setMoney(amount: number): void {
        this.money = amount;
        eventsCenter.emit('money-changed', this.parent.faction, this.money);
    }

    public addMoney(amount: number): void {
        this.money += amount;
        eventsCenter.emit('money-changed', this.parent.faction, this.money);
    }

    public addXP(amount: number): void {
        this.xp += amount;
        eventsCenter.emit('xp-changed', this.parent.faction, this.xp);
        // On overflow, signal level up and reset to 0, preserving the overflow amount
        if (this.xp >= this.maxXP) {
            eventsCenter.emit('level-up', this.parent.faction);
            this.xp = this.xp - this.maxXP;
        }
    }

    public setMaxXP(amount: number) {
        this.maxXP = amount;
    }

    public getMaxXP(): number {
        return this.maxXP;
    }

    public removeMoney(amount: number): void {
        this.money -= amount;
        eventsCenter.emit('money-changed', this.parent.faction, this.money);
    }

    public hasEnoughMoney(amount: number): boolean {
        return this.money >= amount;
    }

    public getPassiveIncome(): number {
        return this.moneyPerSecond;
    }

    public setPassiveIncome(amount: number): void {
        this.moneyPerSecond = amount;
        if (this.moneyPerSecond < 0) this.moneyPerSecond = 0;
    }
}
