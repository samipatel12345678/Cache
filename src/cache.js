// src/cache.js

const { Mutex } = require("async-mutex");
const { Node, DoublyLinkedList } = require("./Eviction");

class Cache {
    constructor(maxSize = 1000, defaultTTL = 300) {
        this.maxSize = maxSize;
        this.defaultTTL = defaultTTL * 1000; // in ms
        this.map = new Map(); // key -> node
        this.lru = new DoublyLinkedList();
        this.mutex = new Mutex();

        // Stats
        this.stats = {
            hits: 0,
            misses: 0,
            total_requests: 0,
            evictions: 0,
            expired_removals: 0
        };

        // Start background TTL cleanup
        this.startCleanup();
    }

    startCleanup() {
    this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            for (const [key, node] of this.map.entries()) {
                if (node.expiry && node.expiry < now) {
                    this.lru.removeNode(node);
                    this.map.delete(key);
                    this.stats.expired_removals++;
                }
            }
        }, 5000); // every 5 sec
    }

  close(){
    if(this.cleanupInterval){
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;

    }
  }
  
    async put(key, value, ttl = null) {
        return this.mutex.runExclusive(() => {
            const expiry = ttl ? Date.now() + ttl * 1000 : Date.now() + this.defaultTTL;

            if (this.map.has(key)) {
                // Update value and move to front
                const node = this.map.get(key);
                node.value = value;
                node.expiry = expiry;
                this.lru.moveToFront(node);
            } else {
                const node = new Node(key, value);
                node.expiry = expiry;
                this.lru.addToFront(node);
                this.map.set(key, node);

                if (this.map.size > this.maxSize) {
                    const lruNode = this.lru.removeTail();
                    if (lruNode) {
                        this.map.delete(lruNode.key);
                        this.stats.evictions++;
                    }
                }
            }
        });
    }

    async get(key) {
        return this.mutex.runExclusive(() => {
            this.stats.total_requests++;

            if (!this.map.has(key)) {
                this.stats.misses++;
                return null;
            }

            const node = this.map.get(key);

            if (node.expiry && node.expiry < Date.now()) {
                this.map.delete(key);
                this.lru.removeNode(node);
                this.stats.expired_removals++;
                this.stats.misses++;
                return null;
            }

            this.lru.moveToFront(node);
            this.stats.hits++;
            return node.value;
        });
    }

    async delete(key) {
        return this.mutex.runExclusive(() => {
            if (this.map.has(key)) {
                const node = this.map.get(key);
                this.lru.removeNode(node);
                this.map.delete(key);
            }
        });
    }

    async clear() {
        return this.mutex.runExclusive(() => {
            this.map.clear();
            this.lru = new DoublyLinkedList();
        });
    }

    get_stats() {
        return {
            ...this.stats,
            hit_rate: this.stats.total_requests === 0
                ? 0
                : (this.stats.hits / this.stats.total_requests).toFixed(3),
            current_size: this.map.size
        };
    }
}



module.exports = Cache;
