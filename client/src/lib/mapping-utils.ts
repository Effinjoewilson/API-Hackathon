export interface FieldMapping {
  source_path: string;
  target_column: string;
  transformations: string[];
  default_value: any;
  skip_if_null: boolean;
}

export function extractFieldPaths(data: any, prefix: string = ''): Array<{path: string, type: string, value: any}> {
  const paths: Array<{path: string, type: string, value: any}> = [];
  
  if (data === null || data === undefined) {
    return paths;
  }
  
  if (typeof data === 'object' && !Array.isArray(data)) {
    Object.entries(data).forEach(([key, value]) => {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
          paths.push({ path: currentPath, type: 'array', value: value });
          paths.push(...extractFieldPaths(value[0], `${currentPath}[0]`));
        } else if (!Array.isArray(value)) {
          paths.push({ path: currentPath, type: 'object', value: value });
          paths.push(...extractFieldPaths(value, currentPath));
        } else {
          paths.push({ path: currentPath, type: Array.isArray(value) ? 'array' : typeof value, value: value });
        }
      } else {
        paths.push({ path: currentPath, type: typeof value, value: value });
      }
    });
  } else if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
    paths.push(...extractFieldPaths(data[0], `${prefix}[0]`));
  }
  
  return paths;
}

export function getValueByPath(obj: any, path: string): any {
  const parts = path.replace(/
$$
(\d+)
$$/g, '.$1').split('.');
  let value = obj;
  
  for (const part of parts) {
    if (value === null || value === undefined) return null;
    
    if (part.match(/^\d+$/)) {
      value = value[parseInt(part)];
    } else {
      value = value[part];
    }
  }
  
  return value;
}

export function validateMapping(mapping: FieldMapping, sourceType: string, targetType: string): {
  valid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  let valid = true;
  
  // Type compatibility checks
  const typeCompatibility = checkTypeCompatibility(sourceType, targetType);
  if (!typeCompatibility.compatible) {
    errors.push(typeCompatibility.error || 'Type mismatch');
    valid = false;
  } else if (typeCompatibility.warning) {
    warnings.push(typeCompatibility.warning);
  }
  
  // Transformation validation
  mapping.transformations.forEach(transform => {
    const transformValidation = validateTransform(transform, sourceType);
    if (!transformValidation.valid) {
      errors.push(transformValidation.error || `Invalid transform: ${transform}`);
      valid = false;
    }
  });
  
  return { valid, warnings, errors };
}

function checkTypeCompatibility(sourceType: string, targetType: string): {
  compatible: boolean;
  warning?: string;
  error?: string;
} {
  const source = sourceType.toLowerCase();
  const target = targetType.toLowerCase();
  
  // Direct match
  if (source === target) {
    return { compatible: true };
  }
  
  // Compatible conversions
  const compatibilityMatrix: {[key: string]: string[]} = {
    'string': ['text', 'varchar', 'char'],
    'number': ['int', 'integer', 'bigint', 'float', 'double', 'decimal', 'numeric'],
    'boolean': ['bool', 'boolean', 'bit'],
    'object': ['json', 'jsonb'],
  };
  
  for (const [sType, tTypes] of Object.entries(compatibilityMatrix)) {
    if (source.includes(sType)) {
      for (const tType of tTypes) {
        if (target.includes(tType)) {
          return { compatible: true };
        }
      }
    }
  }
  
  // Special cases with warnings
  if (source === 'number' && target.includes('int')) {
    return { compatible: true, warning: 'Decimal places will be truncated' };
  }
  
  if (source === 'string' && target.includes('date')) {
    return { compatible: true, warning: 'Ensure string format matches expected date format' };
  }
  
  return { 
    compatible: false, 
    error: `Cannot convert ${sourceType} to ${targetType}` 
  };
}

function validateTransform(transform: string, sourceType: string): {
  valid: boolean;
  error?: string;
} {
  const stringTransforms = ['lowercase', 'uppercase', 'trim', 'capitalize', 'title_case'];
  const numberTransforms = ['parse_int', 'parse_float', 'multiply', 'divide', 'add', 'subtract'];
  const universalTransforms = ['to_string', 'default_if_empty'];
  
  if (universalTransforms.includes(transform)) {
    return { valid: true };
  }
  
  if (stringTransforms.includes(transform) && sourceType !== 'string') {
    return { valid: false, error: `${transform} can only be applied to string values` };
  }
  
  if (numberTransforms.includes(transform) && !['number', 'string'].includes(sourceType)) {
    return { valid: false, error: `${transform} requires numeric or string input` };
  }
  
  return { valid: true };
}