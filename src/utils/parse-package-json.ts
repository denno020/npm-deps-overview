import type { PackageJson } from 'types-package-json';
import type { Dependency } from '../hooks/useDependencyLookup';

export const parsePackageJson = (json: string) => {
  const parsed: PackageJson = JSON.parse(json);
  const deps: Dependency[] = [];

  const processDeps = async (obj: Record<string, string>, type: 'dependency' | 'devDependency') => {
    for (const [name, version] of Object.entries(obj)) {
      deps.push({
        name,
        description: `Description for ${name} (version ${version})`, // In a real app, fetch this from an API
        type
      });
    }
  };

  if (parsed.dependencies) {
    processDeps(parsed.dependencies, 'dependency');
  }
  if (parsed.devDependencies) {
    processDeps(parsed.devDependencies, 'devDependency');
  }

  return deps;
};
