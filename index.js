const express = require('express');
const app = express();
app.use(require('morgan')('dev'));
const PORT = process.env.PORT || 8080;
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/acme_hr_directory')

app.use(express.json());

// get all employees

app.get('/employees', async (req, res, next) => {
  try {
    const SQL = `
    SELECT * FROM employees;
    `
    const databaseResponse = await client.query(SQL);
    res.send(databaseResponse.rows)
  } catch (error) {
    next(error);
  }
});

// get all departments

app.get('/departments', async (req, res, next) => {
  try {
    const SQL = `
    SELECT * FROM departments;
    `
    const databaseResponse = await client.query(SQL);
    res.send(databaseResponse.rows)
  } catch (error) {
    next(error);
  }
});

// post an employee

app.post('/employees', async (req, res, next) => {
  try {
    const SQL = `
    INSERT INTO employees (name, department_id)
    VALUES ($1, $2)
    RETURNING *;
    `
    const response = await client.query(SQL, [req.body.name, req.body.department_id]);
    res.send(response.rows)
  } catch (error) {
    next(error);
  }
});

// remove an employee

app.delete('/employees/:id', async (req, res, next) => {
  try {
    const SQL = `
    DELETE FROM employees
    WHERE id = $1;
    `
    await client.query(SQL, [req.params.id]);
    res.send('Your employee was removed!')
  } catch (error) {
    next(error);
  }
});

// update an employee

app.put('/employees/:id', async (req, res, next) => {
  try {
    const SQL = `
    UPDATE employees
    SET name = $2,
    department_id = $3,
    updated_at = now()
    WHERE id = $1
    RETURNING *;
    `
    const response = await client.query(SQL, [req.params.id, req.body.name, req.body.department_id]);
    res.send(response.rows[0])
  } catch (error) {
    next(error);
  }
});

const init = async() => {
  client.connect();
  const SQL = `
    DROP TABLE IF EXISTS employees CASCADE;
    DROP TABLE IF EXISTS departments CASCADE;

    CREATE TABLE departments(
      id SERIAL PRIMARY KEY,
      name VARCHAR (255) NOT NULL
    );

    CREATE TABLE employees(
      id SERIAL PRIMARY KEY,
      name VARCHAR (255) NOT NULL,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      department_id INTEGER REFERENCES departments(id) NOT NULL
    );
    INSERT INTO departments (name)
    VALUES ('Management');
    INSERT INTO departments (name)
    VALUES ('Administration');
    INSERT INTO departments (name)
    VALUES ('Payroll');
    INSERT INTO departments (name)
    VALUES ('Recruitment');


    INSERT INTO employees (name, department_id)
    VALUES ('Alexandria', (SELECT id FROM departments WHERE name = 'Recruitment'));

    INSERT INTO employees (name, department_id)
    VALUES ('Bernie', (SELECT id FROM departments WHERE name = 'Management'));

    INSERT INTO employees (name, department_id)
    VALUES ('Ilhan', (SELECT id FROM departments WHERE name = 'Administration'));

    INSERT INTO employees (name, department_id)
    VALUES ('Cori', (SELECT id FROM departments WHERE name = 'Payroll'));
  `
  await client.query(SQL);
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
}

init();