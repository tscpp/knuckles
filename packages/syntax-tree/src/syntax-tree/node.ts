import { type Position, Range, type RawRange } from "@knuckles/location";

export interface NodeInit {
  range: Range;
}

export interface RawNode extends RawRange {}

export abstract class Node extends Range {
  constructor(init: NodeInit) {
    super(init.range);
  }

  visit<T extends Node = Node>(
    callback: (node: T) => void,
    options?: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filter?: new (..._: any) => T;
    },
  ): void {
    if (!options?.filter || this instanceof options.filter) {
      callback(this as unknown as T);
    }

    if (this instanceof ParentNode) {
      for (const child of this.children) {
        child.visit(callback, options);
      }
    }
  }

  override toJSON(): RawNode {
    return super.toJSON();
  }
}

export interface ParentNodeInit extends NodeInit {
  children: Iterable<Node>;
}

export interface RawParentNode extends RawRange {
  children: RawNode[];
}

export abstract class ParentNode extends Node {
  children: Node[];

  constructor(init: ParentNodeInit) {
    super(init);
    this.children = Array.from(init.children);
  }

  getNodeAt(position: Position): Node | null {
    const ascendants: Node[] = [];

    this.visit((node) => {
      if (node.contains(position)) {
        ascendants.push(node);
      }
    });

    if (ascendants.length === 0) {
      return null;
    }

    return ascendants.reduce((a, b) => (a.size < b.size ? a : b));
  }

  override toJSON(): RawParentNode {
    return {
      ...super.toJSON(),
      children: this.children.map((child) => child.toJSON()),
    };
  }
}
