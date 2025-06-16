// src/Eviction.js

class Node {
    constructor(key, value) {
        this.key = key;
        this.value = value;
        this.prev = null;
        this.next = null;
    }
}

class DoublyLinkedList {
    constructor() {
        this.head = new Node(null, null); // dummy head
        this.tail = new Node(null, null); // dummy tail
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    // Add to front (most recently used)
    addToFront(node) {
        node.next = this.head.next;
        node.prev = this.head;
        this.head.next.prev = node;
        this.head.next = node;
    }

    // Remove any node
    removeNode(node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    // Move node to front
    moveToFront(node) {
        this.removeNode(node);
        this.addToFront(node);
    }

    // Remove last (least recently used)
    removeTail() {
        const node = this.tail.prev;
        if (node === this.head) return null;
        this.removeNode(node);
        return node;
    }
}

module.exports = { Node, DoublyLinkedList };
