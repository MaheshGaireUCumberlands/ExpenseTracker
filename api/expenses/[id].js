// api/expenses/[id].js - Handle individual expense operations
import { readFileSync, writeFileSync, existsSync } from 'fs';

const DATA_FILE = '/tmp/expenses.json';

const readExpenses = () => {
  if (!existsSync(DATA_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeExpenses = (expenses) => {
  try {
    writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2));
    return true;
  } catch (error) {
    return false;
  }
};

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;
  const expenseId = parseInt(id);

  if (isNaN(expenseId)) {
    res.status(400).json({ error: 'Invalid expense ID' });
    return;
  }

  const expenses = readExpenses();

  switch (req.method) {
    case 'GET':
      const expense = expenses.find(e => e.id === expenseId);
      if (expense) {
        res.status(200).json(expense);
      } else {
        res.status(404).json({ error: 'Expense not found' });
      }
      break;

    case 'PUT':
      const expenseIndex = expenses.findIndex(e => e.id === expenseId);
      if (expenseIndex === -1) {
        res.status(404).json({ error: 'Expense not found' });
        return;
      }

      try {
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
      const deleteIndex = expenses.findIndex(e => e.id === expenseId);
      if (deleteIndex === -1) {
        res.status(404).json({ error: 'Expense not found' });
        return;
      }

      expenses.splice(deleteIndex, 1);
      if (writeExpenses(expenses)) {
        res.status(204).end();
      } else {
        res.status(500).json({ error: 'Failed to delete expense' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE', 'OPTIONS']);
      res.status(405).json({ error: 'Method not allowed' });
  }
}