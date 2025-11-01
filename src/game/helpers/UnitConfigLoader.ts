/**
 * @file UnitConfigLoader.ts
 * @description This file provides a utility class for loading and parsing unit configuration from a JSON object.
 * The parser handles the hierarchical inheritance model defined in the JSON, merging properties from base units,
 * unit classes, and specific unit types.
 */

// Import the UnitProps interface from its dedicated file.
import { UnitProps } from './UnitProps';

type MultiplierValue = string | number;

// Define an interface for the raw unit data from the JSON, which includes the 'extends' property.
interface RawUnitConfig {
    health?: MultiplierValue;
    damage?: MultiplierValue;
    walkSpeed?: MultiplierValue;
    attackSpeed?: MultiplierValue;
    cost?: MultiplierValue;
    spawnTime?: MultiplierValue;
    tags?: string[];
    extends?: string;
    // Add other properties from UnitProps as needed
    [key: string]: any; 
}

interface UnitData {
    [key: string]: RawUnitConfig;
}

// Represents the full structure of the JSON configuration file.
interface UnitConfig {
    baseUnit: RawUnitConfig;
    unitClasses: UnitData;
    unitTypes: UnitData;
}

// Regex to identify multiplier strings like "2x" or "0.5x"
const MULTIPLIER_REGEX = /^(\d+(\.\d+)?)x$/;

/**
 * A utility class to load and process unit configurations.
 * This class is now exported and does not contain example usage, as it should be instantiated
 * in a separate part of the application, like a Phaser Scene.
 */
export class UnitConfigLoader {
    private config: UnitConfig;

    constructor(rawConfig: any) {
        this.config = rawConfig as UnitConfig;
    }

    /**
     * Public entry point to retrieve the fully merged properties for a specific unit type.
     * @param unitType The string identifier for the unit (e.g., "warrior", "archer").
     * @returns The fully merged UnitProps object.
     */
    public getUnitProps(unitType: string): UnitProps {
        const unitData = this.config.unitTypes[unitType];

        if (!unitData) {
            console.error(`Error: Unit type '${unitType}' not found.`);
            return {} as UnitProps;
        }

        // 1. Recursive Merge (results in strings like "2x")
        const mergedRawProps = this.recursiveMerge(unitData, 'unitTypes');
        
        // 2. Numerical Calculation (resolves strings like "2x" to numbers)
        const finalProps = this.calculateNumericalValues(mergedRawProps);

        // 3. Clean up the final object and return the fully calculated result.
        delete (finalProps as any).extends;

        // BUG FIX: Returning the calculated 'finalProps' instead of the raw 'mergedRawProps'.
        return finalProps as UnitProps;
    }

    private calculateNumericalValues(rawProps: RawUnitConfig): UnitProps {
        const calculatedProps: any = { ...rawProps };

        // Define which properties need multiplier calculation
        const propertiesToCalculate: (keyof RawUnitConfig)[] = [
            'cost', 
            'damage', 
            'speed', 
            'maxHealth', 
            'actionSpeed', 
            'spawnTime',
            'attackRange'
            // Add other numeric properties here
        ];

        for (const prop of propertiesToCalculate) {
            const value = rawProps[prop];

            if (typeof value === 'string') {
                const match = value.match(MULTIPLIER_REGEX);
                if (match) {
                    const multiplier = parseFloat(match[1]);
                    
                    // To correctly calculate the final number, we need a baseline from baseUnit.
                    const baseValue = this.config.baseUnit[prop];
                    if (typeof baseValue !== 'number') {
                        // Handle cases where base value is missing, not a number, or incorrectly set.
                        console.error(`Error: Base value for property '${prop}' in baseUnit must be a literal number.`);
                         calculatedProps[prop] = 0; // Default to error case
                    } else {
                        calculatedProps[prop] = multiplier * (baseValue as number);
                    }
                } else {
                    // It's a non-multiplier string (e.g., a theme string); keep it as is.
                    calculatedProps[prop] = value;
                }
            } else {
                // It's already a number, or another type; keep it as is.
                calculatedProps[prop] = value;
            }
        }

        return calculatedProps as UnitProps;
    }

    /**
     * Recursively walks the inheritance chain, merging properties from parent to child.
     * @param childConfig The config object of the current level (e.g., "wizard").
     * @param containerKey The key of the container where the child resides ('unitTypes' or 'unitClasses').
     * @returns The merged RawUnitConfig object.
     */
    private recursiveMerge(childConfig: RawUnitConfig, containerKey: 'unitTypes' | 'unitClasses'): RawUnitConfig {
        const parentKey = childConfig.extends;
        let mergedProps: RawUnitConfig = { ...childConfig };
        let parentConfig: RawUnitConfig | null = null;
        
        // --- 1. Identify Parent Config ---
        if (parentKey === 'baseUnit') {
            parentConfig = this.config.baseUnit as RawUnitConfig;
        } else if (parentKey) {
            if (this.config.unitClasses[parentKey]) {
                parentConfig = this.config.unitClasses[parentKey];
            } else if (this.config.unitTypes[parentKey] && containerKey === 'unitTypes') {
                 parentConfig = this.config.unitTypes[parentKey]; 
            }
        }
        
        // --- 2. Recursive Merge for Shallow Properties ---
        if (!parentKey || !parentConfig) {
            // Base Case: Merge with the actual baseUnit structure
            mergedProps = { ...this.config.baseUnit, ...mergedProps };
        } else {
            // Get the fully resolved parent properties recursively
            const resolvedParent = this.recursiveMerge(parentConfig, 'unitClasses');

            // Shallow merge: Child properties overwrite parent properties
            mergedProps = { ...resolvedParent, ...mergedProps };
        }
        
        // --- 3. CORRECT ARRAY MERGE FOR TAGS ---
        
        const resolvedParentTags = (parentKey && parentConfig) ? this.recursiveMerge(parentConfig, 'unitClasses').tags : this.config.baseUnit.tags;
        const parentTags = resolvedParentTags || [];
        const childExplicitTags = childConfig.tags || [];

        // Combine them all and de-duplicate
        const combinedTags = [...parentTags, ...childExplicitTags];
        mergedProps.tags = [...new Set(combinedTags)];

        return mergedProps;
    }
}