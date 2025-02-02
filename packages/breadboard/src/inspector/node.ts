/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  InputValues,
  NodeConfiguration,
  NodeDescriberResult,
  NodeDescriptor,
  NodeIdentifier,
  NodeTypeIdentifier,
} from "../types.js";
import { collectPorts } from "./ports.js";
import { EdgeType } from "./schemas.js";
import {
  InspectableEdge,
  InspectableGraph,
  InspectableNode,
  InspectableNodePorts,
  InspectablePortList,
  NodeTypeDescriberOptions,
} from "./types.js";

class Node implements InspectableNode {
  descriptor: NodeDescriptor;
  #graph: InspectableGraph;

  constructor(descriptor: NodeDescriptor, graph: InspectableGraph) {
    this.descriptor = descriptor;
    this.#graph = graph;
  }

  title(): string {
    return this.descriptor.metadata?.title || this.descriptor.id;
  }

  incoming(): InspectableEdge[] {
    return this.#graph.incomingForNode(this.descriptor.id);
  }

  outgoing(): InspectableEdge[] {
    return this.#graph.outgoingForNode(this.descriptor.id);
  }

  isEntry(): boolean {
    return this.incoming().length === 0;
  }

  isExit(): boolean {
    return this.outgoing().length === 0;
  }

  configuration(): NodeConfiguration {
    return this.descriptor.configuration || {};
  }

  async #describeInternal(
    options: NodeTypeDescriberOptions
  ): Promise<NodeDescriberResult> {
    return this.#graph.describeType(this.descriptor.type, {
      inputs: { ...options.inputs, ...this.configuration() },
      incoming: options.incoming,
      outgoing: options.outgoing,
    });
  }

  async describe(inputs?: InputValues): Promise<NodeDescriberResult> {
    return this.#describeInternal({
      inputs,
      incoming: this.incoming(),
      outgoing: this.outgoing(),
    });
  }

  async ports(inputValues?: InputValues): Promise<InspectableNodePorts> {
    const incoming = this.incoming();
    const outgoing = this.outgoing();
    const described = await this.#describeInternal({
      inputs: inputValues,
      incoming,
      outgoing,
    });
    const inputs: InspectablePortList = {
      fixed: described.inputSchema.additionalProperties === false,
      ports: collectPorts(
        EdgeType.In,
        incoming,
        described.inputSchema,
        this.configuration()
      ),
    };
    const outputs: InspectablePortList = {
      fixed: described.outputSchema.additionalProperties === false,
      ports: collectPorts(EdgeType.Out, outgoing, described.outputSchema),
    };
    return { inputs, outputs };
  }
}

export class InspectableNodeCache {
  #graph: InspectableGraph;
  #map?: Map<NodeIdentifier, InspectableNode>;
  #typeMap?: Map<NodeTypeIdentifier, InspectableNode[]>;

  constructor(graph: InspectableGraph) {
    this.#graph = graph;
  }

  #addNodeInternal(node: NodeDescriptor) {
    this.#typeMap ??= new Map();
    this.#map ??= new Map();
    const inspectableNode = new Node(node, this.#graph);
    const type = node.type;
    let list = this.#typeMap.get(type);
    if (!list) {
      list = [];
      this.#typeMap.set(type, list);
    }
    list.push(inspectableNode);
    this.#map.set(node.id, inspectableNode);
    return inspectableNode;
  }

  #ensureNodeMap() {
    if (this.#map) return this.#map;
    this.#graph.raw().nodes.forEach((node) => this.#addNodeInternal(node));
    this.#map ??= new Map();
    return this.#map!;
  }

  byType(type: NodeTypeIdentifier): InspectableNode[] {
    this.#ensureNodeMap();
    return this.#typeMap?.get(type) || [];
  }

  get(id: string): InspectableNode | undefined {
    return this.#ensureNodeMap().get(id);
  }

  add(node: NodeDescriptor) {
    if (!this.#map) {
      return;
    }
    console.assert(!this.#map.has(node.id), "Node already exists in cache.");
    this.#addNodeInternal(node);
  }

  remove(id: NodeIdentifier) {
    if (!this.#map) {
      return;
    }
    const node = this.#map.get(id);
    console.assert(node, "Node does not exist in cache.");
    const type = node!.descriptor.type;
    const list = this.#typeMap?.get(type);
    if (list) {
      const index = list.indexOf(node!);
      list.splice(index, 1);
    }
    this.#map.delete(id);
  }

  nodes(): InspectableNode[] {
    return Array.from(this.#ensureNodeMap().values());
  }
}
