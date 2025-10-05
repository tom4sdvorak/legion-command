/**
 * @file UnitConfigLoader.ts
 * @description This file provides a utility class for loading and parsing unit configuration from a JSON object.
 * The parser handles the hierarchical inheritance model defined in the JSON, merging properties from base units,
 * unit classes, and specific unit types.
 */

// Import the UnitProps interface from its dedicated file.
import { UnitProps } from './UnitProps';

// Define an interface for the raw unit data from the JSON, which includes the 'extends' property.
interface RawUnitConfig extends UnitProps {
    extends?: string;
}

interface UnitData {
    [key: string]: RawUnitConfig;
}

// Represents the full structure of the JSON configuration file.
interface UnitConfig {
    baseUnit: UnitProps;
    unitClasses: UnitData;
    unitTypes: UnitData;
}

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

        // Start the recursive merge process.
        const mergedRawProps = this.recursiveMerge(unitData, 'unitTypes');

        // Clean up the final object and ensure all required UnitProps fields exist.
        delete (mergedRawProps as any).extends;

        return mergedRawProps as UnitProps;
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
        
        // At this point, mergedProps.tags contains the fully resolved tags 
        // from the entire inheritance chain up to (and including) the resolved parent,
        // OR the tags from the 'childConfig' if they were explicitly defined 
        // and overwrote the parent's (due to the shallow merge). 
        
        // To fix this, we need to take the parent's *resolved* tags and add the child's *explicit* tags.
        
        // Get the tags that came from the resolved parent (or base unit)
        const parentTags = (parentConfig ? (this.recursiveMerge(parentConfig, 'unitClasses')).tags : this.config.baseUnit.tags) || [];
        
        // Get the tags explicitly defined on the current child
        const childExplicitTags = childConfig.tags || [];

        // Combine them all and de-duplicate
        const combinedTags = [...parentTags, ...childExplicitTags];
        
        // Use a Set to ensure unique tags
        mergedProps.tags = [...new Set(combinedTags)];

        return mergedProps;
    }
}