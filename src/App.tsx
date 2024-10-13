import { useState } from 'react';

import { Search, Loader2 } from 'lucide-react';

const Alert = ({ children }) => (
  <div className="p-4 text-red-700 bg-red-100 border border-red-200 rounded">{children}</div>
);

const DependencyGroup = ({ title, packages }) => {
  if (!packages || packages.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold mt-6 mb-3">{title}</h2>

      {packages.map((pkg, index) => (
        <div
          key={index}
          className={`p-4 rounded border ${pkg.error ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{pkg.name}</h3>

              {!pkg.error && <div className="text-sm text-gray-500">v{pkg.version}</div>}
            </div>

            {pkg.specifiedVersion && <div className="text-sm text-gray-500">Specified: {pkg.specifiedVersion}</div>}
          </div>

          <p className="mt-1">{pkg.description}</p>
        </div>
      ))}
    </div>
  );
};

export default function NPMPackageLookup() {
  const [input, setInput] = useState('');

  const [regularDeps, setRegularDeps] = useState([]);

  const [devDeps, setDevDeps] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const parsePackageJson = (input) => {
    try {
      const parsed = JSON.parse(input);

      const deps = parsed.dependencies || {};

      const devDeps = parsed.devDependencies || {};

      return {
        dependencies: Object.entries(deps).map(([name, version]) => ({
          name,

          specifiedVersion: version
        })),

        devDependencies: Object.entries(devDeps).map(([name, version]) => ({
          name,

          specifiedVersion: version
        }))
      };
    } catch (e) {
      const packageNames = input

        .split(/[\s,]+/)

        .map((pkg) => pkg.trim())

        .filter((pkg) => pkg);

      return {
        dependencies: packageNames.map((name) => ({ name })),

        devDependencies: []
      };
    }
  };

  const fetchPackageInfo = async (packageInfo) => {
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
      throw {
        ...packageInfo,

        description: `Error: ${err.message}`,

        error: true
      };
    }
  };

  const processResults = (results) => {
    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // If the promise was rejected, return the error object

        return result.reason;
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    if (!input.trim()) {
      setError('Please enter package names or paste a package.json file');

      return;
    }

    setLoading(true);

    try {
      const { dependencies, devDependencies } = parsePackageJson(input);

      if (dependencies.length === 0 && devDependencies.length === 0) {
        setError('No dependencies found in input');

        setLoading(false);

        return;
      }

      const [depsResults, devDepsResults] = await Promise.all([
        Promise.allSettled(dependencies.map(fetchPackageInfo)),

        Promise.allSettled(devDependencies.map(fetchPackageInfo))
      ]);

      setRegularDeps(processResults(depsResults));

      setDevDeps(processResults(devDepsResults));
    } catch (err) {
      setError('Error processing input: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">NPM Package Description Lookup</h1>

      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your package.json content or enter package names (separated by spaces, commas, or newlines)"
          className="w-full p-2 border rounded min-h-[100px] font-mono text-sm"
        />

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
          Look up packages
        </button>
      </form>

      {error && <Alert>{error}</Alert>}

      <DependencyGroup title="Dependencies" packages={regularDeps} />

      <DependencyGroup title="Dev Dependencies" packages={devDeps} />
    </div>
  );
}
