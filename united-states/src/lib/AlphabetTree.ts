import { writeFile, readFile } from 'fs/promises';


const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

/**
 * Returns the next letter in the alphabet, or null if there is no next letter
 * @param letter 
 * @returns 
 */
function getNextLetter(letter: string): string | null {
    const index = ALPHABET.indexOf(letter);
    return index < ALPHABET.length - 1 ? ALPHABET[index + 1] : null;
}

export class AlphabetNode {
    query: string;
    children: { [key: string]: AlphabetNode };
    numResults: number | "tooMany" | null;
    parent: AlphabetNode | null;

    constructor(query: string, parent: AlphabetNode | null = null) {
        this.query = query;
        this.children = {};
        this.numResults = null;
        this.parent = parent;
    }

    private get lastLetter(): string | null {
        if (this.query === '') {
            return null;
        }

        return this.query[this.query.length - 1];
    }

    /**
     * Returns the next sibling node (a -> b, b -> c, aa -> ab), or null if there is no next sibling
     * @returns 
     */
    public createSibling(): AlphabetNode | null {
        // if query is empty, return null
        const lastLetter = this.lastLetter;
        if (!lastLetter) {
            return null;
        }

        // if query is not empty, return sibling node 
        const nextLetter = getNextLetter(lastLetter);
        if (!nextLetter) {
            return null;
        }

        const newQuery = this.query.slice(0, -1) + nextLetter;
        const sibling = new AlphabetNode(newQuery, this.parent);
        this.parent!.children[nextLetter] = sibling;
        return sibling;
    }

    public createFirstChild(): AlphabetNode {
        const newQuery = this.query + ALPHABET[0];
        const child = new AlphabetNode(newQuery, this);
        this.children[ALPHABET[0]] = child;
        return child;
    }


    public serialize(): string {
        const children = Object.keys(this.children).map(key => {
            return {
                [key]: this.children[key]!.serialize()
            }
        });

        return JSON.stringify({
            query: this.query,
            children: children,
            numResults: this.numResults
        });
    }

    public static deserialize(data: string, parent: AlphabetNode | null = null): AlphabetNode {
        const parsed = JSON.parse(data);
        const node = new AlphabetNode(parsed.query, parent);
        node.numResults = parsed.numResults;
        
        Object.keys(parsed.children).forEach((key) => {
            node.children[key] = AlphabetNode.deserialize(parsed.children[key], node);
        });

        return node;
    }
}


export class AlphabetTree {
    private root: AlphabetNode;
    private currentNode: AlphabetNode | null = null;

    constructor() {
        this.root = new AlphabetNode('');
    }

    public static async readCache(path: string): Promise<AlphabetTree> {
        console.warn("iterating over tree from cache file is not supported yet");
        const text = await readFile(path, 'utf8');
        const root = AlphabetNode.deserialize(text);
        const tree = new AlphabetTree();
        tree.root = root;
        return tree;
    }

    public async writeCache(path: string): Promise<void> {
        const text = this.root.serialize();
        await writeFile(path, text);
    }

    /**
     * Returns the next node in the index, or null if there is no next node
     * @returns 
     */
    public next(): AlphabetNode | null {
        // if no current node, return root
        if (!this.currentNode) {
            this.currentNode = this.root;
            return this.currentNode;
        }

        // if current node has too many results, create first child node
        if (this.currentNode.numResults === "tooMany") {
            const child = this.currentNode.createFirstChild();
            this.currentNode = child;
            return this.currentNode;
        }
         
        // else, try to create sibling node at current level or traverse up the tree
        let parent = this.currentNode.parent;
        while (parent) {
            const sibling = this.currentNode.createSibling();
            if (sibling) {
                this.currentNode = sibling;
                return this.currentNode;
            }
            parent = parent.parent;
        }

        // if we've exhausted all possibilities, we're done
        return null;
    }
}