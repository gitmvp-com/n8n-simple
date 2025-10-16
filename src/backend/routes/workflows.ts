import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  insertWorkflow,
  getWorkflow,
  getAllWorkflows,
  updateWorkflow,
  deleteWorkflow,
  getExecutions,
} from '../models/database';

export const workflowRoutes = Router();

// List all workflows
workflowRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const workflows = await getAllWorkflows();
    res.json(workflows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create workflow
workflowRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, nodes = [], connections = [] } = req.body;
    const id = uuidv4();

    await insertWorkflow(id, { name, description, nodes, connections });
    const workflow = await getWorkflow(id);

    res.status(201).json(workflow);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get workflow
workflowRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const workflow = await getWorkflow(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update workflow
workflowRoutes.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, nodes, connections } = req.body;
    await updateWorkflow(req.params.id, { name, description, nodes, connections });
    const workflow = await getWorkflow(req.params.id);
    res.json(workflow);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete workflow
workflowRoutes.delete('/:id', async (req: Request, res: Response) => {
  try {
    await deleteWorkflow(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get executions for workflow
workflowRoutes.get('/:id/executions', async (req: Request, res: Response) => {
  try {
    const executions = await getExecutions(req.params.id);
    res.json(executions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
