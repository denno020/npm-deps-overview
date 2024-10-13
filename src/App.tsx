import type { PropsWithChildren } from 'react';
import { Search, Loader2 } from 'lucide-react';

import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import LoadingDescription from './components/LoadingDescription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { useDependencyLookup } from './hooks/useDependencyLookup';
import type { Dependency } from './hooks/useDependencyLookup';

const Alert = ({ children }: PropsWithChildren) => (
  <div className="p-4 text-red-700 bg-red-100 border border-red-200 rounded mt-4">{children}</div>
);

const DependencyScannerComponent = () => {
  const {
    isLoading,
    input,
    setInput,
    searchTerm,
    setSearchTerm,
    dependencies,
    filteredDependencies,
    handleSubmit,
    error
  } = useDependencyLookup();

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">NPM Dependency Overview</h1>
      <div className="mb-6">
        <p className="w-full mb-6 text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-400">
          Use this tool to scan your package.json for dependencies (regular and dev), and list a description of each
        </p>
        <p>
          I built this tool to make it easier to onboard into a new project, and quickly get an overview of the
          dependencies available in those projects
        </p>
      </div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Scan Your package.json</CardTitle>
          <CardDescription>
            Paste your package.json content below and click 'Scan Dependencies' to analyze.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Textarea
              placeholder="Paste your package.json here"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-48 mb-4"
            />
            <Button className="w-full" disabled={isLoading} type="submit">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning Dependencies...
                </>
              ) : (
                'Scan Dependencies'
              )}
            </Button>
          </form>
          {error && <Alert>{error}</Alert>}
        </CardContent>
      </Card>
      {dependencies.length > 0 && (
        <Card className="dependency-results">
          <CardHeader>
            <CardTitle>Scan Results</CardTitle>
            <CardDescription>Found {filteredDependencies.length} dependencies in total.</CardDescription>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Fuzzy search dependencies..."
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
                <TabsTrigger value="dependencies">
                  Dependencies ({filteredDependencies.filter((dep) => dep.type === 'dependency').length})
                </TabsTrigger>
                <TabsTrigger value="devDependencies">
                  Dev Dependencies({filteredDependencies.filter((dep) => dep.type === 'devDependency').length})
                </TabsTrigger>
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
};

function DependencyList({ dependencies }: { dependencies: Dependency[] }) {
  return (
    <div className="grid gap-4">
      {dependencies.map((dep) => (
        <Card key={dep.name} className="overflow-hidden">
          <CardHeader className="bg-muted flex-row">
            <CardTitle className="text-lg">{dep.name}</CardTitle>
            <CardDescription>{dep.type}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {dep.isLoading ? <LoadingDescription /> : <p>{dep.description}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default DependencyScannerComponent;
