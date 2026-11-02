import crypto from 'crypto';
import { ModuleCache } from '../../models/ModuleCache';
import { ModuleSummary } from '../ai/types';

/**
 * Computes a SHA-256 hash for a set of file contents to detect changes
 */
export function computeFilesHash(files: string[], sourceFiles: Record<string, string>): string {
  const hash = crypto.createHash('sha256');
  const sortedFiles = [...files].sort();

  for (const f of sortedFiles) {
    hash.update(f);
    hash.update(sourceFiles[f] || '');
  }

  return hash.digest('hex');
}

/**
 * Retrieves valid cached module summaries for unchanged modules
 */
export async function getCachedModules(
  repoFullName: string,
  sourceFiles: Record<string, string>
): Promise<Map<string, ModuleSummary>> {
  const cachedMap = new Map<string, ModuleSummary>();

  try {
    const entries = await ModuleCache.find({ repoFullName });

    for (const entry of entries) {
      // Verify content hash matches current files
      const currentHash = computeFilesHash(entry.files, sourceFiles);
      if (currentHash === entry.contentHash) {
        cachedMap.set(entry.moduleName, {
          moduleName: entry.moduleName,
          files: entry.files,
          purpose: entry.summary,
          keyComponents: entry.keyComponents,
          apisExposed: entry.apisExposed,
          databaseInteractions: entry.databaseInteractions,
          dependencies: [],
          evidenceClaims: entry.evidenceClaims,
          status: entry.status,
        });
      }
    }
  } catch (err) {
    console.warn('[ModuleCache] Error retrieving cached modules:', err);
  }

  return cachedMap;
}

/**
 * Saves module analysis results to cache
 */
export async function persistModuleSummaries(
  repoFullName: string,
  commitSha: string,
  modules: ModuleSummary[],
  sourceFiles: Record<string, string>
): Promise<void> {
  try {
    for (const mod of modules) {
      const contentHash = computeFilesHash(mod.files, sourceFiles);

      await ModuleCache.findOneAndUpdate(
        { repoFullName, moduleName: mod.moduleName },
        {
          repoFullName,
          moduleName: mod.moduleName,
          files: mod.files,
          contentHash,
          summary: mod.purpose,
          keyComponents: mod.keyComponents,
          apisExposed: mod.apisExposed,
          databaseInteractions: mod.databaseInteractions,
          evidenceClaims: mod.evidenceClaims,
          status: mod.status,
          commitSha,
        },
        { upsert: true, new: true }
      );
    }
  } catch (err) {
    console.warn('[ModuleCache] Error saving module cache:', err);
  }
}

