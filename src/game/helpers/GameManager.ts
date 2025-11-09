export interface GameLevel {
    level: number;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    units: string[];
}

export class GameManager {
    private static instance: GameManager;
    private gameLevels: Map<number, GameLevel>;

    constructor() {
        this.gameLevels = new Map<number, GameLevel>();
    }

    public static getInstance(): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

    public init(levels: GameLevel[]): void {
        this.loadUpgradesFromJson(levels);
    }

    private loadUpgradesFromJson(levels: GameLevel[]): void {
        if(!levels){
            throw new Error('Could not load upgrades from JSON');
        }

        levels.forEach(level => this.gameLevels.set(level.level, level));
    }

    public getInfoForLevel(level: number): GameLevel | undefined {
        return this.gameLevels.get(level);
    }

    public getAllLevels(): GameLevel[] {
        return Array.from(this.gameLevels.values());
    }
}