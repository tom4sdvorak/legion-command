
export interface SaveData {
    metadata: {
        version: number;
        saveName: string;
        timestamp: string;
        playTimeSeconds: number;
    },
    playerData: {
        builtUpgrades: string[];
        unlockedUnits: string[];
        coins: number;
        gamesPlayed: number;
        gamesWon: number;
    }
};

export default class SaveManager {
    private static defaultSave : SaveData = {
        metadata: {
            version: 0.1,
            saveName: "NewGame",
            timestamp: new Date().toISOString(),
            playTimeSeconds: 0
        },
        playerData: {
            builtUpgrades: [],
            unlockedUnits: [],
            coins: 0,
            gamesPlayed: 0,
            gamesWon: 0
        }
    };

    static getNewSave(): SaveData {
        return JSON.parse(JSON.stringify(this.defaultSave)); 
    }


    
    static saveGame(scene: Phaser.Scene): void {
        const newSave = {
            playerName: 'Player 1',
            builtUpgrades: scene.registry.get('builtConstructions'),
        };
        localStorage.setItem('gameSave', JSON.stringify(newSave));
    }

    static loadGame(): void {
        const save = localStorage.getItem('gameSave');
        if (save) {
            const saveData = JSON.parse(save);
            // Load the game state from the save data
            // ...
        }
    }

    static getSaves(): Map<string, {saveName: string, timestamp: string}> {
        let saves : Map<string, {saveName: string, timestamp: string}> = new Map<string, {saveName: string, timestamp: string}>();
        const unparsedSaves : (string | null)[] = [localStorage.getItem('save_1'), localStorage.getItem('save_2'), localStorage.getItem('save_3')];
        for (let index = 0; index < 3; index++) {
            const unparsedSave = unparsedSaves[index];
            if (typeof unparsedSave === 'string') {
                const saveParsed : SaveData = JSON.parse(unparsedSave);
                saves.set(`save_${index + 1}`, {saveName: saveParsed.metadata.saveName, timestamp: saveParsed.metadata.timestamp});
            }
            else{
                const saveParsed = this.getNewSave();
                saves.set(`save_${index + 1}`, {saveName: saveParsed.metadata.saveName, timestamp: saveParsed.metadata.timestamp});
            }  
        }
        return saves;
    }
}