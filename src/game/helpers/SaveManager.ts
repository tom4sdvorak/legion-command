
export interface SaveData {
    metadata: {
        version: number;
        saveSlot: string;
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
        lastStageWon: number;
    }
};

export default class SaveManager {
    private static defaultSave : SaveData = {
        metadata: {
            version: 0.1,
            saveSlot: "",
            saveName: "New Game",
            timestamp: new Date().toISOString(),
            playTimeSeconds: 0
        },
        playerData: {
            builtUpgrades: [],
            unlockedUnits: [],
            coins: 100,
            gamesPlayed: 0,
            gamesWon: 0,
            lastStageWon: 0
        }
    };

    /**
     * 
     * @returns A new SaveData object
     */
    private static getNewSave(): SaveData {
        return JSON.parse(JSON.stringify(this.defaultSave)); 
    }

    /**
     * 
     * @param scene Any scene that will have access to global registry
     * @returns SaveData object with the data from the registry
     */
    private static createSaveFromData(scene: Phaser.Scene): SaveData {
        let newSave = this.getNewSave();
        newSave.metadata.saveName = scene.registry.get('saveName');
        newSave.metadata.saveSlot = scene.registry.get('saveSlot');
        newSave.metadata.timestamp = new Date().toISOString();
        newSave.metadata.playTimeSeconds = scene.registry.get('playTime');
        newSave.playerData.builtUpgrades = scene.registry.get('builtConstructions');
        newSave.playerData.unlockedUnits = scene.registry.get('unlockedUnits');
        newSave.playerData.coins = scene.registry.get('coins');
        newSave.playerData.gamesPlayed = scene.registry.get('gamesPlayed');
        newSave.playerData.gamesWon = scene.registry.get('gamesWon');
        newSave.playerData.lastStageWon = scene.registry.get('lastStageWon');
        return newSave;
    }

    /**
     * 
     * @param scene Any scene that will have access to global registry
     * @returns True if successful
     */
    public static async saveGame(scene: Phaser.Scene) : Promise<boolean> {
        const save = this.createSaveFromData(scene);
        try {
            await this.save(save, save.metadata.saveSlot);
            return true;
        }
        catch(e) {
            console.error("Local storage issue: " + e);
            return false;
        }
    }


    /**
     * 
     * @param save SaveData object to save to localStorage
     * @param saveSlot string name of slot to save to
     * @returns true if successful
     */
    private static async save(save: SaveData, saveSlot: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                localStorage.setItem(saveSlot, JSON.stringify(save));
                console.log("Saved game to " + saveSlot);
                console.log(save);
                resolve();            
            }
            catch(e) {
                console.error("Local storage issue: " + e);
                reject(e);
            }
        });
    }

    /**
     * 
     * @param saveSlot string name of slot to save to
     * @returns true if successful
     */
    static async createAndSaveGame(saveSlot: string): Promise<boolean> {
        let newSave = this.getNewSave();
        newSave.metadata.saveName = `Save ${saveSlot.split('_')[1]}`;
        newSave.metadata.saveSlot = saveSlot;
        newSave.metadata.timestamp = new Date().toISOString();
        try {
            await this.save(newSave, saveSlot);
            return true;
        }
        catch(e) {
            console.error("Local storage issue: " + e);
            return false;
        }
    }

    /**
     * 
     * @param scene Any scene that will have access to global registry
     * @param saveSlot string name of slot to save to
     * @returns true if successful
     */
    static loadGame(scene: Phaser.Scene, saveSlot: string): boolean {
        const save = localStorage.getItem(saveSlot);
        if (save) {
            const saveData : SaveData = JSON.parse(save);
            // Save to phaser registry all loaded data
            scene.registry.set('saveName', saveData.metadata.saveName);
            scene.registry.set('saveSlot', saveData.metadata.saveSlot);
            scene.registry.set('playTime', saveData.metadata.playTimeSeconds);
            scene.registry.set('builtConstructions', saveData.playerData.builtUpgrades);
            scene.registry.set('unlockedUnits', saveData.playerData.unlockedUnits);
            scene.registry.set('coins', saveData.playerData.coins);
            scene.registry.set('gamesPlayed', saveData.playerData.gamesPlayed);
            scene.registry.set('gamesWon', saveData.playerData.gamesWon);
            scene.registry.set('lastStageWon', saveData.playerData.lastStageWon);
            console.log("Loaded game from " + saveSlot);
            return true;
        }
        return false;
    }


    /**
     * 
     * @returns Map of three saves under keys (save_1, save_2, save_3) that hold saveName and timestamp of last save
     */
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

    /**
     * 
     * @param saveSlot string name of slot to delete
     */
    static deleteSave(saveSlot: string) {
        localStorage.removeItem(saveSlot);
    }
}