import { useState } from 'react';
import Fuse from 'fuse.js';
import { Search, Loader2 } from 'lucide-react';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

type Dependency = {
  name: string;
  description: string;
  type: 'dependency' | 'devDependency';
};

function DependencyScannerComponent() {
  const [packageJson, setPackageJson] = useState('');
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const parseDependencies = async (json: string) => {
    setIsLoading(true);
    try {
      const parsed = JSON.parse(json);
      const deps: Dependency[] = [];

      const processDeps = async (obj: Record<string, string>, type: 'dependency' | 'devDependency') => {
        for (const [name, version] of Object.entries(obj)) {
          // Simulate API call to fetch dependency description
          await new Promise((resolve) => setTimeout(resolve, 100));
          deps.push({
            name,
            description: `Description for ${name} (version ${version})`, // In a real app, fetch this from an API
            type
          });
        }
      };

      if (parsed.dependencies) {
        await processDeps(parsed.dependencies, 'dependency');
      }
      if (parsed.devDependencies) {
        await processDeps(parsed.devDependencies, 'devDependency');
      }

      setDependencies(deps);
    } catch (error) {
      console.error('Failed to parse package.json:', error);
      alert('Failed to parse package.json. Please check the format and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fuse = new Fuse(dependencies, {
    keys: ['name', 'description'],
    threshold: 0.4
  });

  const filteredDependencies = searchTerm ? fuse.search(searchTerm).map((result) => result.item) : dependencies;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Dependency Scanner</h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Scan Your package.json</CardTitle>
          <CardDescription>
            Paste your package.json content below and click 'Scan Dependencies' to analyze.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Paste your package.json here"
            value={packageJson}
            onChange={(e) => setPackageJson(e.target.value)}
            className="h-48 mb-4"
          />
          <Button onClick={() => parseDependencies(packageJson)} className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning Dependencies...
              </>
            ) : (
              'Scan Dependencies'
            )}
          </Button>
        </CardContent>
      </Card>
      {dependencies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scan Results</CardTitle>
            <CardDescription>Found {dependencies.length} dependencies in total.</CardDescription>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search dependencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
                <TabsTrigger value="devDependencies">Dev Dependencies</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <DependencyList dependencies={filteredDependencies} />
              </TabsContent>
              <TabsContent value="dependencies">
                <DependencyList dependencies={filteredDependencies.filter((dep) => dep.type === 'dependency')} />
              </TabsContent>
              <TabsContent value="devDependencies">
                <DependencyList dependencies={filteredDependencies.filter((dep) => dep.type === 'devDependency')} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DependencyList({ dependencies }: { dependencies: Dependency[] }) {
  return (
    <div className="grid gap-4">
      {dependencies.map((dep) => (
        <Card key={dep.name} className="overflow-hidden">
          <CardHeader className="bg-muted">
            <CardTitle className="text-lg">{dep.name}</CardTitle>
            <CardDescription>{dep.type}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <p>{dep.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default DependencyScannerComponent;
