// tests/Cache.test.js

const Cache = require('../src/cache');

describe('In-Memory Cache', () => {
    let cache;

    beforeEach(() => {
        cache = new Cache(2, 1); // maxSize=2, TTL=1s
    });
    afterEach(()=>{
        cache.close();

    });


    test('should store and retrieve value', async () => {
        await cache.put("foo", "bar");
        const value = await cache.get("foo");
        expect(value).toBe("bar");
    });

    test('should expire value after TTL', async () => {
        await cache.put("temp", "123", 1);
        await new Promise(r => setTimeout(r, 1100));
        const value = await cache.get("temp");
        expect(value).toBeNull();
    });

    test('should evict LRU', async () => {
        await cache.put("a", 1);
        await cache.put("b", 3);
        await cache.get("a"); // makes "b" least recently used
        await cache.put("c", 3); // evicts "b"
        expect(await cache.get("b")).toBeNull();
        expect(await cache.get("a")).toBe(1);
        expect(await cache.get("c")).toBe(3);
    });
});

