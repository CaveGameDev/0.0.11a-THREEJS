// A base class for noise generators, mirroring the classic Java structure.
export class NoiseGenerator {
    /**
     * Generates noise for a given 2D coordinate.
     * Subclasses must implement this method.
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     * @returns {number} The generated noise value.
     */
    generateNoise(x, y) {
        throw new Error("NoiseGenerator.generateNoise() must be implemented by subclasses.");
    }

    /**
     * Generates noise for a given 3D coordinate.
     * Subclasses can implement this method if they support 3D noise.
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     * @param {number} z - The z-coordinate.
     * @returns {number} The generated noise value.
     */
    generate3D(x, y, z) {
        return this.generateNoise(x, y); // Default to 2D noise if not overridden- this file is just for stability
    }
}
