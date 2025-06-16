// index.js

const cache = require('./src/cache');
const cache = new cache(3, 5); // maxSize: 3, defaultTTL: 5s

(async () => {
    await cache.put("a", 1);
    await cache.put("b", 2);
    await cache.put("c", 3);

    console.log(await cache.get("a")); // 1
    await cache.put("d", 4);           // should evict "b"

    console.log(await cache.get("b")); // null (evicted)
    console.log(await cache.get_stats());
})();
