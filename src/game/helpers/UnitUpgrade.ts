export interface UnitUpgrade {
    id: string;
    name: string;
    description: string;
    rarity: string;
    tags: string[];
    effects: { stat: string; type: string; value: number }[];
}