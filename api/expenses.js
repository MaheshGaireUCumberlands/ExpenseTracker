// api/expenses.js - Vercel serverless function for expenses API
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Simple file-based storage for demo purposes
// In production, you'd use a proper database
const DATA_FILE = '/tmp/expenses.json';

// Initialize with sample data if file doesn't exist
const initializeData = () => {
  if (!existsSync(DATA_FILE)) {
    const sampleData = [
      {
        id: 1,
        title: 'Groceries',
        amount: 85.50,
        category: 'Food',
        date: '2025-09-30',
        notes: 'Weekly shopping'
      },
      {
        id: 2,
        title: 'Gas',
        amount: 45.00,
        category: 'Transportation',
        date: '2025-09-29',
        notes: 'Fill up tank'
      },
      {
        id: 3,
        title: 'Coffee',
        amount: 12.50,
        category: 'Food',
        date: '2025-09-28',
        notes: 'Morning coffee'
      }
    ];
    writeFileSync(DATA_FILE, JSON.stringify(sampleData, null, 2));
  }
};

const readExpenses = () => {
  initializeData();
  try {
    const data = readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading expenses:', error);
    return [];
  }
};

const writeExpenses = (expenses) => {
  try {
    writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing expenses:', error);
    return false;
  }
};

const getNextId = (expenses) => {
  return expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1;
};

export default function handler(req, res) {
  // Enable CORS for frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const expenses = readExpenses();

  switch (req.method) {
    case 'GET':
      // Get all expenses or single expense by ID
      const { id } = req.query;
      if (id) {
        const expense = expenses.find(e => e.id === parseInt(id));
        if (expense) {
          res.status(200).json(expense);
        } else {
          res.status(404).json({ error: 'Expense not found' });
        }
      } else {
        res.status(200).json(expenses);
      }
      break;

    case 'POST':
      // Create new expense
      try {
        const newExpense = {
          id: getNextId(expenses),
          ...req.body,
          amount: parseFloat(req.body.amount)
        };
        expenses.push(newExpense);
        if (writeExpenses(expenses)) {
          res.status(201).json(newExpense);
        } else {
          res.status(500).json({ error: 'Failed to save expense' });
        }
      } catch (error) {
        res.status(400).json({ error: 'Invalid expense data' });
      }
      break;

    case 'PUT':
      // Update existing expense
      try {
        const { id } = req.query;
        const expenseId = parseInt(id);
        const expenseIndex = expenses.findIndex(e => e.id === expenseId);
        
        if (expenseIndex === -1) {
          res.status(404).json({ error: 'Expense not found' });
          return;
        }

        expenses[expenseIndex] = {
          ...expenses[expenseIndex],
          ...req.body,
          id: expenseId,
          amount: parseFloat(req.body.amount)
        };

        if (writeExpenses(expenses)) {
          res.status(200).json(expenses[expenseIndex]);
        } else {
          res.status(500).json({ error: 'Failed to update expense' });
        }
      } catch (error) {
        res.status(400).json({ error: 'Invalid expense data' });
      }
      break;

    case 'DELETE':
      // Delete expense
      try {
        const { id } = req.query;
        const expenseId = parseInt(id);
        const expenseIndex = expenses.findIndex(e => e.id === expenseId);
        
        if (expenseIndex === -1) {
          res.status(404).json({ error: 'Expense not found' });
          return;
        }

        expenses.splice(expenseIndex, 1);
        if (writeExpenses(expenses)) {
          res.status(204).end();
        } else {
          res.status(500).json({ error: 'Failed to delete expense' });
        }
      } catch (error) {
        res.status(400).json({ error: 'Invalid request' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
      res.status(405).json({ error: 'Method not allowed' });
  }
}