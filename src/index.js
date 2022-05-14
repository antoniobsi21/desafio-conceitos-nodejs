const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find((user) => user.username === username);

  if(!user) {
    return response.status(404).json({ error: 'Invalid username.' });
  }

  request.user = user;

  next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  if(!name || !username) {
    return response.status(400).json({ error: 'Please provide a valid \'name\' and \'username\'.'});
  }

  const usernameAlreadyExists = users.some((user) => user.username === username);

  if(usernameAlreadyExists) {
    return response.status(400).json({ error: 'Username already exists.'});
  }
  const user = {
    id: uuidv4(),
    created_at: new Date(),
    name,
    username,
    todos: [],
  }

  users.push(user);

  return response.status(201).json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const user = request.user;

  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;

  if(!title) {
    return response.status(400).json({ error: 'Please provide a valid \'title\'.'});
  }

  const deadlineDate = new Date(deadline)

  if(!deadlineDate instanceof Date || isNaN(deadlineDate)) {
    return response.status(400).json({ error: 'Please provide a valid \'deadline\'.'});
  }

  const todo = {
    id: uuidv4(),
    created_at: new Date(),
    title,
    deadline: deadlineDate,
    done: false,
  };

  request.user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { id } = request.params;

  if(!title) {
    return response.status(400).json({ error: 'Please provide a valid \'title\'.'});
  }

  const deadlineDate = new Date(deadline)

  if(!deadlineDate instanceof Date || isNaN(deadlineDate)) {
    return response.status(400).json({ error: 'Please provide a valid \'deadline\'.'});
  }

  const todo = request.user.todos.find((todo) => todo.id === id);

  if(!todo) {
    return response.status(404).json({ error: 'Not found.' });
  }

  todo.title = title;
  todo.deadline = deadline;

  return response.status(201).json(todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const todo = request.user.todos.find((todo) => todo.id === id);

  if(!todo) {
    return response.status(404).json({ error: 'Not found.' });
  }

  todo.done = true;

  return response.status(200).json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const todoIndex = request.user.todos.findIndex((todo) => todo.id === id);

  if(todoIndex === -1) {
    return response.status(404).json({ error: 'Not found.' });
  }

  request.user.todos.splice(todoIndex, 1);

  return response.status(204).send();
});

module.exports = app;