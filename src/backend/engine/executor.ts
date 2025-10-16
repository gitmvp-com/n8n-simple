import axios from 'axios';
import { updateExecution } from '../models/database';

interface Node {
  id: string;
  type: string;
  label: string;
  data: any;
  position: { x: number; y: number };
}

interface Connection {
  source: string;
  target: string;
}

interface Workflow {
  id: string;
  name: string;
  nodes: Node[];
  connections: Connection[];
}

interface ExecutionContext {
  [nodeId: string]: any;
}

export async function executeWorkflow(
  executionId: string,
  workflow: Workflow,
  inputData: any
): Promise<void> {
  const context: ExecutionContext = { input: inputData };
  const executedNodes = new Set<string>();

  try {
    // Find start node
    const startNode = workflow.nodes.find((n) => n.type === 'start');
    if (!startNode) {
      throw new Error('No start node found in workflow');
    }

    // Execute nodes in order
    let currentNode: Node | undefined = startNode;
    const visited = new Set<string>();

    while (currentNode && !visited.has(currentNode.id)) {
      visited.add(currentNode.id);
      await executeNode(currentNode, context, workflow);
      executedNodes.add(currentNode.id);

      // Find next connected node
      const connection = workflow.connections.find((c) => c.source === currentNode!.id);
      if (connection) {
        currentNode = workflow.nodes.find((n) => n.id === connection.target);
      } else {
        currentNode = undefined;
      }
    }

    // Update execution with results
    const outputNode = workflow.nodes.find((n) => n.type === 'output');
    const finalOutput = outputNode ? context[outputNode.id] : context;

    await updateExecution(executionId, {
      status: 'success',
      outputData: finalOutput,
      error: null,
    });
  } catch (error: any) {
    await updateExecution(executionId, {
      status: 'error',
      outputData: null,
      error: error.message,
    });
  }
}

async function executeNode(
  node: Node,
  context: ExecutionContext,
  workflow: Workflow
): Promise<void> {
  const { type, data, id } = node;

  try {
    switch (type) {
      case 'start':
        context[id] = context.input;
        break;

      case 'code':
        context[id] = await executeCodeNode(data, context);
        break;

      case 'http':
        context[id] = await executeHttpNode(data, context);
        break;

      case 'output':
        context[id] = data.mapping ? mapData(context.input, data.mapping) : context.input;
        break;

      default:
        throw new Error(`Unknown node type: ${type}`);
    }
  } catch (error: any) {
    throw new Error(`Error in node '${node.label}': ${error.message}`);
  }
}

async function executeCodeNode(data: any, context: ExecutionContext): Promise<any> {
  try {
    // Create a safe function from the code
    const func = new Function('input', 'context', `return (async () => { ${data.code} })()`);
    const result = await func(context.input, context);
    return result;
  } catch (error: any) {
    throw new Error(`Code execution error: ${error.message}`);
  }
}

async function executeHttpNode(data: any, context: ExecutionContext): Promise<any> {
  try {
    const { method = 'GET', url, headers = {}, body } = data;

    const config = {
      method: method.toUpperCase(),
      url,
      headers,
      ...(body && { data: body }),
      timeout: 30000,
    };

    const response = await axios(config);
    return response.data;
  } catch (error: any) {
    throw new Error(`HTTP request failed: ${error.message}`);
  }
}

function mapData(data: any, mapping: Record<string, string>): any {
  const result: any = {};
  for (const [key, path] of Object.entries(mapping)) {
    result[key] = getValueByPath(data, path as string);
  }
  return result;
}

function getValueByPath(obj: any, path: string): any {
  return path.split('.').reduce((current, part) => current?.[part], obj);
}
