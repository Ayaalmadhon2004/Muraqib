// src/core/env-options.ts

export interface MuraqibOptionInfo {
  configName: string; 
  type: 'string' | 'number' | 'boolean';
  isSensitive: boolean; 
}

const muraqibOptions = [
  { name: 'dbUrl', type: 'string', isSensitive: true },
  { name: 'allowEmpty', type: 'boolean', isSensitive: false },
  { name: 'serverPort', type: 'number', isSensitive: false },
];

export function getMuraqibEnvMap(): Record<string, MuraqibOptionInfo> {
  const map: Record<string, MuraqibOptionInfo> = {};

  for (const option of muraqibOptions) {
    const envKey = `MURAQIB_${option.name.replace(/([A-Z])/g, '_$1').toUpperCase()}`;

    map[envKey] = {
      configName: option.name,
      type: option.type as any,
      isSensitive: option.isSensitive
    };
  }

  return map; 
}