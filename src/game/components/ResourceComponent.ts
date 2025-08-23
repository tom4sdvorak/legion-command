import { Player } from "../Player";

export class ResourceComponent {
    private money: number = 0;
    private parent: Player;
    private moneyPerSecond: number = 0;

    constructor(parent: Player) {
        this.parent = parent;
    }

    public getMoney(): number {
        return this.money;
    }

    public setMoney(amount: number): void {
        this.money = amount;
    }

    public addMoney(amount: number): void {
        this.money += amount;
    }

    public removeMoney(amount: number): void {
        this.money -= amount;
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

    public update(time: any, delta: number): void {
        this.addMoney(this.moneyPerSecond * delta / 1000);
    }
}
