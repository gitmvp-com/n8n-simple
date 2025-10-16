import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { insertExecution, getExecution, getWorkflow } from '../models/database';
import { executeWorkflow } from '../engine/executor';

export const executionRoutes = Router();

// Execute workflow
executionRoutes.post('/:workflowId', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const { inputData = {} } = req.body;

    const workflow = await getWorkflow(workflowId);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const executionId = uuidv4();
    await insertExecution(executionId, workflowId, inputData);

    // Execute asynchronously
    executeWorkflow(executionId, workflow, inputData).catch((error) => {
      console.error('Workflow execution error:', error);
    });

    res.status(202).json({
      id: executionId,
      workflowId,
      status: 'running',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get execution status
executionRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const execution = await getExecution(req.params.id);
    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }
    res.json(execution);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
