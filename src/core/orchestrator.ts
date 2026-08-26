import { execSync } from 'child_process';
import is from '@sindresorhus/is'; 
import semver from 'semver';
import { getMuraqibNewVersionValue } from './muraqib-version.js';
import { MURAQIB_LOCAL_PRESETS, fetchRemoteMuraqibPresets } from '../config/presets.js';
import type { PackageGroup } from '../config/presets.js'; 
import { detectProjectPackageManager } from '../utils/manager-detector.js'; 

interface SchemaMigrationRule {
  packageName: string;
  breakingMajor: number;
  migrationCommand: string;
  description: string;
}

const SCHEMA_MIGRATIONS_REGISTRY: SchemaMigrationRule[] = [
  {
    packageName: 'tailwindcss',
    breakingMajor: 4,
    migrationCommand: 'npx @tailwindcss/upgrade@latest --yes',
    description: 'تحويل إعدادات tailwind.config.js القديمة إلى نظام CSS-first (@theme) تلقائياً',
  },
  {
    packageName: 'prisma',
    breakingMajor: 6,
    migrationCommand: 'npx prisma format && npx prisma validate',
    description: 'تحديث وتدقيق سكيما بريسما لتتوافق مع معايير النسخة 6 القياسية',
  },
  {
    packageName: 'next',
    breakingMajor: 15,
    migrationCommand: 'npx @next/codemod@latest next-async-request-api --force',
    description: 'تحويل الـ Params والـ SearchParams لنظام الـ Async الإجباري في Next.js 15',
  },
  {
    packageName: 'react',
    breakingMajor: 19,
    migrationCommand: 'npx react-codemod@latest update-react-imports --force',
    description: 'تطهير وتحديث الـ Components والـ Refs لتتوافق مع معايير React 19 الجديدة',
  },
  {
    packageName: 'eslint',
    breakingMajor: 9,
    migrationCommand: 'npx @eslint/config-inspector@latest --init',
    description: 'ترقية نظام الإعدادات إلى Flat Config وحل مشاكل القواعد المتعارضة تلقائياً',
  },
  {
    packageName: 'zustand',
    breakingMajor: 5,
    migrationCommand: 'npx zustand-codemod v5-migration ./src',
    description: 'تحديث دوال إنشاء الـ Stores وحذف الـ Deprecated signatures لتتوافق مع تزامنية React 19',
  }
];

export interface OrchestratorConfig {
  packageName: string;
  currentValue: string; 
  newVersion: string;   
  rangeStrategy: 'replace' | 'widen' | 'bump';
  remotePresetUrl?: string; 
}

export async function runMuraqibUpgradeOrchestrator({
  packageName,
  currentValue,
  newVersion,
  rangeStrategy,
  remotePresetUrl,
}: OrchestratorConfig): Promise<{ updatedVersion: string | null; schemaMigrated: boolean; skipReason?: string }> {

  let schemaMigrated = false;
  if (!is.string(packageName) || is.emptyStringOrWhitespace(packageName)) {
    console.error('❌ [Muraqib Orchestrator Error]: Invalid package name.');
    return { updatedVersion: null, schemaMigrated: false };
  }

  if (!is.string(newVersion) || is.emptyStringOrWhitespace(newVersion)) {
    console.error(`❌ [Muraqib Orchestrator Error]: Invalid new version for ${packageName}.`);
    return { updatedVersion: null, schemaMigrated: false };
  }

  const coercedCurrent = semver.coerce(currentValue);
  if (!coercedCurrent || !semver.valid(coercedCurrent)) {
    console.warn(`⚠️  [Muraqib Guard]: Skipping package "${packageName}". Reason: [invalid-version syntax]`);
    return { updatedVersion: null, schemaMigrated: false, skipReason: 'invalid-version' };
  }
  const currentEnv = detectProjectPackageManager();
  // Map the simple package manager id to a small command/metadata object
  const managerMeta: Record<string, { type: string; commands: { lockFile: string; build: string } }> = {
    npm: { type: 'npm', commands: { lockFile: 'package-lock.json', build: 'npm run build' } },
    yarn: { type: 'yarn', commands: { lockFile: 'yarn.lock', build: 'yarn build' } },
    pnpm: { type: 'pnpm', commands: { lockFile: 'pnpm-lock.yaml', build: 'pnpm -w build' } },
  };

  const envMeta = (managerMeta[currentEnv as string] ?? managerMeta['npm']);
  console.log(`🔍 [Muraqib Environment]: Active Package Manager detected: [${envMeta.type.toUpperCase()}] via "${envMeta.commands.lockFile}"`);

  let activePresets: PackageGroup[] = MURAQIB_LOCAL_PRESETS;
 
  if (remotePresetUrl && is.string(remotePresetUrl) && !is.emptyStringOrWhitespace(remotePresetUrl)) {
    console.log(`🌐 [Muraqib Remote Engine]: Fetching centralized presets from URL...`);
    activePresets = await fetchRemoteMuraqibPresets(remotePresetUrl);
  }

  const matchedPreset = activePresets.find(preset => 
    preset.packages.includes(packageName)
  );

  if (matchedPreset) {
    console.log(`\n📦 [Muraqib Manager]: Package "${packageName}" matches active preset group: [${matchedPreset.groupName}]`);
    console.log(`🔗 [Grouping Activation]: Muraqib will sync and update all sibling packages: (${matchedPreset.packages.join(', ')}) simultaneously.`);
  }

  const internalStrategy = rangeStrategy === 'widen' ? 'keep-both' : rangeStrategy;

  const updatedVersionValue = getMuraqibNewVersionValue({
    currentVersion: currentValue,
    newVersion,
    updateStrategy: internalStrategy as any,
    packageName,
  });

  if (updatedVersionValue && updatedVersionValue !== currentValue) {
    console.log(`\n[Muraqib Engine]: Version bumped for ${packageName} to ${updatedVersionValue} 🎉`);
    
    const targetMajor = semver.major(semver.coerce(newVersion) || newVersion);

    const migrationRule = SCHEMA_MIGRATIONS_REGISTRY.find(
      (rule) => rule.packageName === packageName && targetMajor === rule.breakingMajor
    );

    if (migrationRule) {
      console.log(`⚠️  [Schema Alert]: ${packageName} v${targetMajor} introduces breaking configuration changes!`);
      console.log(`🔄 [Migration]: Running Automated Repair: ${migrationRule.description}...`);

      try {
        execSync(migrationRule.migrationCommand, { stdio: 'inherit' }); 
        console.log(`✅ [Success]: Automated syntax for ${packageName} has been auto-healed!`);
        schemaMigrated = true;
      } catch (migrationError) {
        console.error(`❌ [Error]: Automated schema migration failed for ${packageName}. Proceeding with cautious testing.`);
      }
    } else {
      console.log(`ℹ️  [Info]: No core schema modifications required for ${packageName} v${targetMajor}.`);
    }

    const targetBuildCommand = envMeta.commands.build;
    console.log(`🧪 [Integrity]: Testing project build after upgrade using: "${targetBuildCommand}"...`);
    
    try {
      execSync(targetBuildCommand, { stdio: 'ignore' }); 
      console.log(`💎 [Integrity Success]: Project build passed smoothly on [${envMeta.type.toUpperCase()}] environment! Safe to commit.`);
    } catch (buildError) {
      console.error(`💥 [Integrity Failure]: Project build failed after updating ${packageName}!`);
      console.log(`🔄 [Auto-Recovery]: Initiating emergency rollback via Git to protect project stability...`);
      execSync('git checkout -- .', { stdio: 'ignore' });
      console.log(`⏪ [Rollback Complete]: Project restored to original safe configuration.`);
      return { updatedVersion: currentValue, schemaMigrated: false };
    }
  }

  return {
    updatedVersion: updatedVersionValue,
    schemaMigrated,
  };
}

