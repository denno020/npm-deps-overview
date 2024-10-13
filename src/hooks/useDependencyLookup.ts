import { useState } from 'react';
import Fuse from 'fuse.js';
import { parsePackageJson } from '../utils/parse-package-json';

export type Dependency = {
  name: string;
  description: string;
  type: 'dependency' | 'devDependency';
};

export const useDependencyLookup = () => {
  const [input, setInput] = useState('');
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState('');

  const fetchPackageInfo = async (packageInfo: Dependency) => {
    try {
      const response = await fetch(`https://registry.npmjs.org/${packageInfo.name}`);

      if (!response.ok) throw new Error(`Package "${packageInfo.name}" not found`);

      const data = await response.json();

      return {
        ...packageInfo,

        description: data.description || 'No description available',

        version: data['dist-tags']?.latest || 'Version unknown'
      };
    } catch (err) {
      let message = '';
      if (err instanceof Error) message = err.message;
      else message = String(error);
      throw {
        ...packageInfo,
        description: `Error: ${message}`,
        error: true
      };
    }
  };

  const processResults = (results: PromiseSettledResult<Dependency>[]) => {
    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }

      // If the promise was rejected, return the error object
      return result.reason;
    });
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

      const depsResults = await Promise.allSettled(dependencies.map(fetchPackageInfo));

      setDependencies(processResults(depsResults));
    } catch (err) {
      let message = '';
      if (err instanceof Error) message = err.message;
      else message = String(error);
      setError(`Error processing input: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

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
    setSearchTerm
  };
};
