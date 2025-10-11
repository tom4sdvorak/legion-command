export interface Effect {
    stat: string; // The stat to modify
    type: string; // Either flat, percent, or special string for any special upgrade
    value: number; // By how much to modify (+1 equals 1, +1% equals 0.01, etc)
}

export interface ConstructionUpgrade {
    id: string; // Unique ID
    name: string; // Displayed name
    description: string; // Displayed description
    type: 'watchtower' | 'walls' | 'campfire'; // The type of construction
    target: 'unit' | 'player';
    cost: number; // Cost to purchase
    effects: Effect[]; // Array of stat changes applied by this upgrade
    prerequisites: string[]; // Array of IDs that must be purchased first
    level: number; // The sequential level within the construction's progression
}

export interface UnitUpgrade {
    id: string; // Unique ID
    name: string; // Displayed name
    description: string; // Displayed description
    rarity: string; // String for now, later any defined rarity
    tags: string[]; // Array of tags defining this upgrade (and what units it works on for example)
    effects: Effect[]; // Array of stat changes applied by this upgrade
}

export interface Potion {
    id: string; // Unique ID
    name: string; // Displayed name
    description: string; // Displayed description
    cost: number; // Cost to purchase
    effects: Effect[]; // Array of stat changes applied by this potion
}

export interface TotalEffect {
    flat: number;
    percent: number;
    specialValue?: string;
}

export class UpgradeManager {
    private static instance: UpgradeManager;
    private unitUpgrades: Map<string, UnitUpgrade>;
    private constructionUpgrades: Map<string, ConstructionUpgrade>;
    private potions: Map<string, Potion>;

    constructor() {
        this.unitUpgrades = new Map<string, UnitUpgrade>();
        this.constructionUpgrades = new Map<string, ConstructionUpgrade>();
        this.potions = new Map<string, Potion>();
    }

    public static getInstance(): UpgradeManager {
        if (!UpgradeManager.instance) {
            UpgradeManager.instance = new UpgradeManager();
        }
        return UpgradeManager.instance;
    }

    /**
     * Load upgrades from supplied arrays (with json data)
     * @param unitUpgradesJson Json of unit upgrades
     * @param constructionJson 
     * @param potionJson 
     */
    public init(unitUpgradesJson: UnitUpgrade[], constructionJson: ConstructionUpgrade[], potionJson: Potion[]): void {
        this.loadUpgradesFromJson(unitUpgradesJson, constructionJson, potionJson);
    }

    private loadUpgradesFromJson(unitUpgrades: UnitUpgrade[], constructions: ConstructionUpgrade[], potions: Potion[]): void {
        if(!unitUpgrades || !constructions || !potions){
            throw new Error('Could not load upgrades from JSON');
        }

        unitUpgrades.forEach(upgrade => this.unitUpgrades.set(upgrade.id, upgrade));
        constructions.forEach(upgrade => this.constructionUpgrades.set(upgrade.id, upgrade));
        potions.forEach(potion => this.potions.set(potion.id, potion));
    }

    /**
     * Calculates total flat/percent (or special cases) of all stats upgraded by the given upgrades
     * @param ownedUpgrades Array of upgrade IDs
     * @param target Who to calculate for ('unit' or 'player')
     * @param activePotionID ID of active potion (if any)
     * @returns Returns list of stat upgrades such as maxHealth : {flat: 10, percent: 0}
     */
    public calculateEffects(ownedUpgrades: string[], target: 'unit' | 'player', activePotionID?: string) : Record<string, TotalEffect> {
        const TotalStats: Record<string, TotalEffect> = {};
        let relevantUnitUpgrades : UnitUpgrade[] = [];
        let relevantConstructionUpgrades : ConstructionUpgrade[] = [];

        if(target === 'unit'){
            relevantUnitUpgrades = ownedUpgrades.map(id => this.unitUpgrades.get(id)).filter(upgrade => upgrade !== undefined);
            relevantConstructionUpgrades = ownedUpgrades
                .map(id => this.constructionUpgrades.get(id))
                .filter((upgrade): upgrade is ConstructionUpgrade => upgrade !== undefined && upgrade.target === 'unit');
        }
        else if(target === 'player'){
            relevantConstructionUpgrades = ownedUpgrades
                .map(id => this.constructionUpgrades.get(id))
                .filter((upgrade): upgrade is ConstructionUpgrade => upgrade !== undefined && upgrade.target === 'player');
            relevantConstructionUpgrades.sort((a, b) => a.level - b.level);
        }
        else{
            throw new Error('Invalid target for upgrade calculation');
        }

        for (const upgrade of relevantConstructionUpgrades) {
            for (const effect of upgrade.effects) {
                // Initialize the stat if it doesn't exist
                if (!TotalStats[effect.stat]) {
                    TotalStats[effect.stat] = { flat: 0, percent: 0 };
                }
                if (effect.type === 'flat') {
                    TotalStats[effect.stat].flat += effect.value;
                } else if (effect.type === 'percent') {
                    TotalStats[effect.stat].percent += effect.value;
                } else {
                    TotalStats[effect.stat].specialValue = effect.type; 
                }
            }
        }

        if(target === 'unit'){
            for (const upgrade of relevantUnitUpgrades) {
                for (const effect of upgrade.effects) {
                    // Initialize the stat if it doesn't exist
                    if (!TotalStats[effect.stat]) {
                        TotalStats[effect.stat] = { flat: 0, percent: 0 };
                    }
                    if (effect.type === 'flat') {
                        TotalStats[effect.stat].flat += effect.value;
                    } else if (effect.type === 'percent') {
                        TotalStats[effect.stat].percent += effect.value;
                    } else {
                        TotalStats[effect.stat].specialValue = effect.type; 
                    }
                }
            }
        }

        if (activePotionID) {
            const potion = this.potions.get(activePotionID);
            if (potion) {
                for (const effect of potion.effects) {
                    // Initialize the stat if it doesn't exist 
                    if (!TotalStats[effect.stat]) {
                        TotalStats[effect.stat] = { flat: 0, percent: 0 };
                    }
                    if (effect.type === 'flat') {
                        TotalStats[effect.stat].flat += effect.value;
                    } else if (effect.type === 'percent') {
                        TotalStats[effect.stat].percent += effect.value;
                    } else {
                        // Potion state provides the FINAL override.
                        TotalStats[effect.stat].specialValue = effect.type; 
                    }
                }
            
            }
        }
        return TotalStats;   
    }

    public getConstructionUpgradesByType(type: 'watchtower' | 'walls' | 'campfire'): ConstructionUpgrade[] {
        return Array.from(this.constructionUpgrades.values()).filter(upgrade => upgrade.type === type);
    }

    public getUnitUpgradesByTags(tags: string[]): UnitUpgrade[] {
        if (tags.length === 0) {
            return [];
        }
        return Array.from(this.unitUpgrades.values()).filter(upgrade => {
            return tags.some(inputTag => upgrade.tags.includes(inputTag));
        });
    }

    public getUnitUpgradeByID(id: string): UnitUpgrade | undefined {
        return this.unitUpgrades.get(id);
    }

    public getConstructionUpgradeByID(id: string): ConstructionUpgrade | undefined {
        return this.constructionUpgrades.get(id);
    }

    public getPotionByID(id: string): Potion | undefined {
        return this.potions.get(id);
    }

    public getAllUnitUpgrades(): UnitUpgrade[] {
        return Array.from(this.unitUpgrades.values());
    }

    public getAllConstructionUpgrades(): ConstructionUpgrade[] {
        return Array.from(this.constructionUpgrades.values());
    }

    public getAllPotions(): Potion[] {
        return Array.from(this.potions.values());
    }

}
