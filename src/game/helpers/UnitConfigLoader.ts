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

    /**
     * Initializes the loader with the raw JSON configuration.
     * @param rawConfig The raw JSON object parsed from the configuration file.
     */
    constructor(rawConfig: any) {
        this.config = rawConfig as UnitConfig;
    }

    /**
     * Retrieves the fully merged properties for a specific unit type.
     * This method correctly handles the inheritance chain from base unit to specific unit type
     * and correctly merges array properties like 'tags'.
     * @param unitType The string identifier for the unit (e.g., "warrior", "archer").
     * @returns The fully merged UnitProps object.
     */
    public getUnitProps(unitType: string): UnitProps {
        const unit: RawUnitConfig = this.config.unitTypes[unitType];

        if (!unit) {
            console.error(`Error: Unit type '${unitType}' not found in configuration.`);
            return {} as UnitProps;
        }

        const parentClass: RawUnitConfig = this.config.unitClasses[unit.extends!];

        // Step 1: Perform the shallow merge for all properties.
        // This will correctly override numbers, strings, etc., but will overwrite arrays.
        let finalProps: UnitProps = {
            ...this.config.baseUnit,
            ...(parentClass || {}),
            ...unit,
        };

        // Step 2: Manually merge the 'tags' array to combine them instead of overwriting.
        const baseTags = this.config.baseUnit.tags || [];
        const classTags = parentClass?.tags || [];
        const unitTags = unit.tags || [];

        // Combine all tags and use a Set to automatically handle duplicates.
        const combinedTags = [...new Set([...baseTags, ...classTags, ...unitTags])];
        
        // Assign the correctly merged array to the final properties.
        finalProps.tags = combinedTags;

        // Step 3: Clean up the final object by removing the `extends` property.
        delete (finalProps as any).extends;

        return finalProps;
    }
}