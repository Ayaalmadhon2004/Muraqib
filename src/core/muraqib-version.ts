import is from '@sindresorhus/is';
import semver from 'semver';
 
export type VersionUpdateStrategy = 'replace' | 'keep-both';

export interface MuraqibVersionConfig {
  currentVersion: string;         
  newVersion: string;             
  updateStrategy: VersionUpdateStrategy;
  packageName?: string;     
}

export function getMuraqibNewVersionValue({
  currentVersion,
  newVersion,
  updateStrategy,
  packageName: _packageName,
}: MuraqibVersionConfig): string | null {
  
  if (!is.string(currentVersion) || !is.string(newVersion)) { 
    return currentVersion; 
  }

  const cleanCurrent = currentVersion.trim();
  const cleanNew = newVersion.trim();
  const parsedNew = semver.parse(cleanNew); 

  if (parsedNew && parsedNew.prerelease.length > 0) {
    return cleanCurrent; 
  }

  const prefixMatch = cleanCurrent.match(/^([\^~=x*<>]+)/);
  const prefix = prefixMatch ? prefixMatch[0] : '';
  const coercedCurrent = semver.coerce(cleanCurrent);
  const coercedNew = semver.coerce(cleanNew);

  if (coercedCurrent && coercedNew) {
    if (semver.gte(coercedCurrent, coercedNew)) {
      return cleanCurrent;
    }
  }

  const pureNewVersion = semver.clean(cleanNew) || coercedNew?.version || cleanNew;
  const formattedNewVersion = `${prefix}${pureNewVersion}`;

  switch (updateStrategy) {
    
    case 'replace':
      return formattedNewVersion;

    case 'keep-both':
      return `${cleanCurrent} || ${formattedNewVersion}`;

    default:
      return formattedNewVersion;
  }
}
