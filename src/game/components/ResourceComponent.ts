import eventsCenter from "../EventsCenter";
import { Player } from "../Player";

export class ResourceComponent {
    private money: number = 9;
    private parent: Player;
    private moneyPerSecond: number = 0;

    constructor(parent: Player) {
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

    public setMoney(amount: number): void {
        this.money = amount;
        eventsCenter.emit('money-changed', this.parent.faction, this.money);
    }

    public addMoney(amount: number): void {
        this.money += amount;
        eventsCenter.emit('money-changed', this.parent.faction, this.money);
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
