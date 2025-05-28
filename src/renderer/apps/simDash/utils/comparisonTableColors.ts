// ---------- Color coding configuration ----------

const COLOR_MAX_VALUES = {
  coverPercent: 0.25,    // 25% change reaches max intensity
  usaFair: 80,           // change of 80 reaches max intensity
  overPercent: 0.25,     // 25% change reaches max intensity
  scorePercent: 0.25,    // 25% change reaches max intensity
  percent: 0.25          // 25% change reaches max intensity
};

// ---------- Helper functions ----------

/**
 * Calculate color intensity using sqrt scale with single maxValue
 * @param value - The numeric value
 * @param maxValue - The value at which intensity reaches maximum (1.0)
 * @returns Intensity between 0 and 1
 */
export function calculateIntensity(value: number, maxValue: number): number {
  const absValue = Math.abs(value);
  if (absValue === 0) return 0;
  
  return Math.min(Math.sqrt(absValue / maxValue), 1);
}

/**
 * Generate background color based on value and maxValue
 * @param value - The numeric value (positive = green, negative = red)
 * @param maxValue - The value at which intensity reaches maximum
 * @returns CSS color string
 */
export function generateBackgroundColor(value: number, maxValue: number): string {
  const intensity = calculateIntensity(value, maxValue);
  if (intensity === 0) return 'transparent';
  
  // Alpha ranges from 0.1 to 0.5 based on intensity
  const alpha = 0.1 + (intensity * 0.4);
  
  if (value > 0) {
    return `rgba(46, 125, 50, ${alpha})`; // Material green-700
  } else {
    return `rgba(211, 47, 47, ${alpha})`; // Material red-700
  }
}

/**
 * Create color coding rules for a specific field in comparison tables
 * @param data - Array of comparison data
 * @param fieldName - Name of the field to create rules for
 * @param maxValue - The value at which intensity reaches maximum
 * @param matchKeys - Array of key names used to match rows (e.g., ['team', 'period', 'line'])
 * @returns Array of display rules
 */
export function createComparisonColorRules<T extends Record<string, any>>(
  data: T[], 
  fieldName: keyof T, 
  maxValue: number,
  matchKeys: (keyof T)[]
) {
  const rules: any[] = [];
  
  // Add rule for maximum intensity (values >= maxValue)
  rules.push({
    condition: (row: any) => {
      const originalValue = data.find(d => 
        matchKeys.every(key => d[key] === row[key])
      )?.[fieldName];
      
      if (typeof originalValue !== 'number') return false;
      
      const intensity = calculateIntensity(originalValue, maxValue);
      return originalValue > 0 && intensity >= 1.0;
    },
    style: { 
      backgroundColor: `rgba(46, 125, 50, 0.5)`, // Maximum green intensity
      padding: '4px 8px',
      borderRadius: '4px'
    },
    type: 'cell' as const
  });
  
  rules.push({
    condition: (row: any) => {
      const originalValue = data.find(d => 
        matchKeys.every(key => d[key] === row[key])
      )?.[fieldName];
      
      if (typeof originalValue !== 'number') return false;
      
      const intensity = calculateIntensity(originalValue, maxValue);
      return originalValue < 0 && intensity >= 1.0;
    },
    style: { 
      backgroundColor: `rgba(211, 47, 47, 0.5)`, // Maximum red intensity
      padding: '4px 8px',
      borderRadius: '4px'
    },
    type: 'cell' as const
  });
  
  // Create 20 intensity levels for smooth color gradation (0.05 to 0.95)
  for (let i = 1; i <= 19; i++) {
    const intensityThreshold = i * 0.05; // 0.05 to 0.95 in steps of 0.05
    const alpha = 0.1 + (intensityThreshold * 0.4); // Alpha based on this threshold level
    
    // Positive values (green)
    rules.push({
      condition: (row: any) => {
        const originalValue = data.find(d => 
          matchKeys.every(key => d[key] === row[key])
        )?.[fieldName];
        
        if (typeof originalValue !== 'number') return false;
        
        const intensity = calculateIntensity(originalValue, maxValue);
        return originalValue > 0 && 
               intensity >= (intensityThreshold - 0.05) && 
               intensity < intensityThreshold;
      },
      style: { 
        backgroundColor: `rgba(46, 125, 50, ${alpha})`, // Green with calculated alpha
        padding: '4px 8px',
        borderRadius: '4px'
      },
      type: 'cell' as const
    });
    
    // Negative values (red)
    rules.push({
      condition: (row: any) => {
        const originalValue = data.find(d => 
          matchKeys.every(key => d[key] === row[key])
        )?.[fieldName];
        
        if (typeof originalValue !== 'number') return false;
        
        const intensity = calculateIntensity(originalValue, maxValue);
        return originalValue < 0 && 
               intensity >= (intensityThreshold - 0.05) && 
               intensity < intensityThreshold;
      },
      style: { 
        backgroundColor: `rgba(211, 47, 47, ${alpha})`, // Red with calculated alpha
        padding: '4px 8px',
        borderRadius: '4px'
      },
      type: 'cell' as const
    });
  }
  
  return rules;
}

// Export the color max values for easy access
export { COLOR_MAX_VALUES }; 