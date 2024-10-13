import { useState } from 'react';
import Fuse from 'fuse.js';
import { parsePackageJson } from '../utils/parse-package-json';
import { fetchWithCache } from '../utils/fetch-with-cache';

export type Dependency = {
  name: string;
  description: string;
  type: 'dependency' | 'devDependency';
  isLoading: boolean;
  isError: boolean;
};

export const useDependencyLookup = () => {
  const [input, setInput] = useState('');
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUsingCache, setIsUsingCache] = useState(true);

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState('');

  const fetchPackageInfo = async (packageInfo: Dependency) => {
    try {
      const response = await fetchWithCache(`https://registry.npmjs.org/${packageInfo.name}`, { force: !isUsingCache });

      if (!response.ok) throw new Error(`Package "${packageInfo.name}" not found`);

      const data = await response.json();

      setDependencies((prevDeps) =>
        prevDeps.map((dep) =>
          dep.name === packageInfo.name
            ? {
                ...dep,
                description: data.description || 'No description available',
                version: data['dist-tags']?.latest || 'Version unknown',
                isLoading: false,
                isError: false
              }
            : dep
        )
      );

      return {
        ...packageInfo,
        description: data.description || 'No description available',
        version: data['dist-tags']?.latest || 'Version unknown'
      };
    } catch (err) {
      let message = '';
      if (err instanceof Error) message = err.message;
      else message = String(error);

      setDependencies((prevDeps) =>
        prevDeps.map((dep) =>
          dep.name === packageInfo.name
            ? {
                ...dep,
                description: `Error: ${message}`,
                isLoading: false,
                isError: true
              }
            : dep
        )
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError('');

    if (!input.trim()) {
      setError('Please enter package names or paste a package.json file');

      return;
    }

    setIsLoading(true);

    try {
      setDependencies([]);
      const dependencies = parsePackageJson(input);

      if (dependencies.length === 0) {
        setError('No dependencies found in input');
        setIsLoading(false);
        return;
      }

      setDependencies(
        dependencies.map((dep) => ({
          ...dep,
          description: 'Loading...',
          isError: false,
          isLoading: true
        }))
      );

      await Promise.all(dependencies.map(fetchPackageInfo));
    } catch (err) {
      let message = '';
      if (err instanceof Error) message = err.message;
      else message = String(error);
      setError(`Error processing input: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCacheCheckboxToggle = () => setIsUsingCache((prev) => !prev);

  const fuse = new Fuse(dependencies, {
    keys: ['name', 'description'],
    threshold: 0.4
  });

  const filteredDependencies = searchTerm ? fuse.search(searchTerm).map((result) => result.item) : dependencies;

  return {
    handleSubmit,
    input,
    setInput,
    isLoading,
    error,
    dependencies,
    filteredDependencies,
    searchTerm,
    setSearchTerm,
    isUsingCache,
    handleCacheCheckboxToggle
  };
};
