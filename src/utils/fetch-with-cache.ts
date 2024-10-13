const ttl = 24 * 60 * 60 * 1000; // 1 day in milliseconds
const cacheKeyPrefix = 'fetch-with-cache:';

export const fetchWithCache = async (url: string, opts: { force: boolean }) => {
  const { force = false } = opts;
  const cacheKey = `${cacheKeyPrefix}${url}`;
  const cachedResponse = getCacheItem(cacheKey);

  if (!force && cachedResponse) {
    const currentTime = new Date().getTime();
    if (currentTime - cachedResponse.timestamp < ttl) {
      return new Response(JSON.stringify(cachedResponse.data));
    }
    removeCacheItem(cacheKey);
  }

  const response = await fetch(url);
  const clonedResponse = await response.clone().json();

  setCacheItem(cacheKey, {
    data: {
      name: clonedResponse.name,
      description: clonedResponse.description
    },
    timestamp: new Date().getTime()
  });

  return response;
};

const getCacheItem = (key: string) => {
  const cachedItem = localStorage.getItem(key);
  if (cachedItem) {
    return JSON.parse(cachedItem);
  }
  return null;
};

const setCacheItem = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const removeCacheItem = (key: string) => {
  localStorage.removeItem(key);
};
