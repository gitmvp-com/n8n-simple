import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'app.db');
const db = new sqlite3.Database(dbPath);

export async function initializeDatabase() {
  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      // Workflows table
      db.run(`
        CREATE TABLE IF NOT EXISTS workflows (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          nodes TEXT NOT NULL,
          connections TEXT NOT NULL,
          active BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Executions table
      db.run(`
        CREATE TABLE IF NOT EXISTS executions (
          id TEXT PRIMARY KEY,
          workflow_id TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          input_data TEXT,
          output_data TEXT,
          error TEXT,
          started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          completed_at DATETIME,
          FOREIGN KEY(workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

export async function insertWorkflow(id: string, data: any) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO workflows (id, name, description, nodes, connections) VALUES (?, ?, ?, ?, ?)`,
      [id, data.name, data.description, JSON.stringify(data.nodes), JSON.stringify(data.connections)],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

export async function getWorkflow(id: string) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM workflows WHERE id = ?`,
      [id],
      (err, row: any) => {
        if (err) reject(err);
        else {
          if (row) {
            row.nodes = JSON.parse(row.nodes);
            row.connections = JSON.parse(row.connections);
          }
          resolve(row);
        }
      }
    );
  });
}

export async function getAllWorkflows() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM workflows ORDER BY created_at DESC`,
      (err, rows: any[]) => {
        if (err) reject(err);
        else {
          const workflows = rows.map(row => ({
            ...row,
            nodes: JSON.parse(row.nodes),
            connections: JSON.parse(row.connections),
          }));
          resolve(workflows);
        }
      }
    );
  });
}

export async function updateWorkflow(id: string, data: any) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE workflows SET name = ?, description = ?, nodes = ?, connections = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [data.name, data.description, JSON.stringify(data.nodes), JSON.stringify(data.connections), id],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
}

export async function deleteWorkflow(id: string) {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM workflows WHERE id = ?`,
      [id],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
}

export async function insertExecution(id: string, workflowId: string, inputData: any) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO executions (id, workflow_id, input_data, status) VALUES (?, ?, ?, 'running')`,
      [id, workflowId, JSON.stringify(inputData)],
      function(err) {
        if (err) reject(err);
        else resolve(id);
      }
    );
  });
}

export async function updateExecution(id: string, updates: any) {
  return new Promise((resolve, reject) => {
    const { status, outputData, error } = updates;
    db.run(
      `UPDATE executions SET status = ?, output_data = ?, error = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, JSON.stringify(outputData), error, id],
      function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
}

export async function getExecution(id: string) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM executions WHERE id = ?`,
      [id],
      (err, row: any) => {
        if (err) reject(err);
        else {
          if (row) {
            if (row.input_data) row.input_data = JSON.parse(row.input_data);
            if (row.output_data) row.output_data = JSON.parse(row.output_data);
          }
          resolve(row);
        }
      }
    );
  });
}

export async function getExecutions(workflowId: string) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM executions WHERE workflow_id = ? ORDER BY started_at DESC LIMIT 50`,
      [workflowId],
      (err, rows: any[]) => {
        if (err) reject(err);
        else {
          const executions = rows.map(row => ({
            ...row,
            input_data: row.input_data ? JSON.parse(row.input_data) : null,
            output_data: row.output_data ? JSON.parse(row.output_data) : null,
          }));
          resolve(executions);
        }
      }
    );
  });
}

export { db };
