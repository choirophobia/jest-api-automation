require('dotenv').config();
const axios = require('axios');
const Ajv = require('ajv');
const getUserSchema = require('../schemas/getUser.schema.json');
const createUserSchema = require('../schemas/createUser.schema.json');
const updateUserSchema = require('../schemas/updateUser.schema.json');
const userListSchema = require('../schemas/userList.schema.json');
const getResourceSchema = require('../schemas/getResource.schema.json');
const getResourceListSchema = require('../schemas/getResourceList.schema.json');
const registerSchema = require('../schemas/register.schema.json');
const loginSchema = require('../schemas/login.schema.json');

const BASE_URL = 'https://reqres.in/api';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'x-api-key': process.env.REQRES_API_KEY,
  },
});

const ajv = new Ajv();
const validateGetUser = ajv.compile(getUserSchema);
const validateCreateUser = ajv.compile(createUserSchema);
const validateUpdateUser = ajv.compile(updateUserSchema);
const validateUserList = ajv.compile(userListSchema);
const validateGetResource = ajv.compile(getResourceSchema);
const validateGetResourceList = ajv.compile(getResourceListSchema);
const validateRegister = ajv.compile(registerSchema);
const validateLogin = ajv.compile(loginSchema);

describe('ReqRes API', () => {
  describe('GET /users/:id', () => {
    test('returns 200 and correct data structure for an existing user', async () => {
      const response = await client.get('/users/2');

      expect(response.status).toBe(200);

      const isValid = validateGetUser(response.data);
      expect(isValid).toBe(true);
      expect(validateGetUser.errors).toBeNull();
      expect(response.data.data.id).toBe(2);
    });

    test('returns 404 for a missing resource', async () => {
      await expect(client.get('/users/9999')).rejects.toMatchObject({
        response: {
          status: 404,
          data: {},
        },
      });
    });

    test('returns 404 for a non-numeric id', async () => {
      await expect(client.get('/users/abc')).rejects.toMatchObject({
        response: {
          status: 404,
          data: {},
        },
      });
    });

    test('returns 404 for id 0', async () => {
      await expect(client.get('/users/0')).rejects.toMatchObject({
        response: {
          status: 404,
          data: {},
        },
      });
    });

    test('returns 404 for a negative id', async () => {
      await expect(client.get('/users/-1')).rejects.toMatchObject({
        response: {
          status: 404,
          data: {},
        },
      });
    });
  });

  describe('GET /users (list & pagination)', () => {
    test('returns 200 with a valid paginated list', async () => {
      const response = await client.get('/users', { params: { page: 2 } });

      expect(response.status).toBe(200);

      const isValid = validateUserList(response.data);
      expect(isValid).toBe(true);
      expect(validateUserList.errors).toBeNull();
      expect(response.data.page).toBe(2);
      expect(response.data.data.length).toBeGreaterThan(0);
      expect(response.data.total_pages).toBe(
        Math.ceil(response.data.total / response.data.per_page)
      );
    });

    test('page=0 falls back to page 1 instead of erroring', async () => {
      const response = await client.get('/users', { params: { page: 0 } });

      expect(response.status).toBe(200);
      expect(response.data.page).toBe(1);
      expect(response.data.data.length).toBeGreaterThan(0);
      expect(response.data.data.length).toBeLessThanOrEqual(response.data.per_page);
    });

    test('a page far beyond total_pages returns 200 with an empty data array', async () => {
      const response = await client.get('/users', { params: { page: 9999 } });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data).toHaveLength(0);
      expect(response.data.page).toBe(9999);
    });
  });

  describe('POST /users (create)', () => {
    test('creates a new resource and returns 201', async () => {
      const newUser = {
        name: 'morpheus',
        job: 'leader',
      };

      const response = await client.post('/users', newUser);

      expect(response.status).toBe(201);

      const isValid = validateCreateUser(response.data);
      expect(isValid).toBe(true);
      expect(validateCreateUser.errors).toBeNull();
      expect(response.data.name).toBe(newUser.name);
      expect(response.data.job).toBe(newUser.job);
      expect(new Date(response.data.createdAt).toString()).not.toBe('Invalid Date');
    });

    test('still returns 201 for an empty body, without fabricating name/job', async () => {
      const response = await client.post('/users', {});

      expect(response.status).toBe(201);
      expect(response.data.id).toBeDefined();
      expect(response.data.createdAt).toBeDefined();
      expect(response.data.name).toBeUndefined();
      expect(response.data.job).toBeUndefined();
      expect(new Date(response.data.createdAt).toString()).not.toBe('Invalid Date');
    });
  });

  describe('PUT /users/:id (update)', () => {
    test('updates an existing resource and returns 200', async () => {
      const updatedUser = {
        name: 'morpheus',
        job: 'zion resident',
      };

      const response = await client.put('/users/2', updatedUser);

      expect(response.status).toBe(200);

      const isValid = validateUpdateUser(response.data);
      expect(isValid).toBe(true);
      expect(validateUpdateUser.errors).toBeNull();
      expect(response.data.name).toBe(updatedUser.name);
      expect(response.data.job).toBe(updatedUser.job);
      expect(new Date(response.data.updatedAt).toString()).not.toBe('Invalid Date');
    });
  });

  describe('DELETE /users/:id', () => {
    test('deletes a resource and returns 204 with no content', async () => {
      const response = await client.delete('/users/2');

      expect(response.status).toBe(204);
      expect(response.data).toEqual('');
      expect(response.headers['content-type']).toBeUndefined();
    });
  });

  describe('GET /unknown', () => {
    test('returns 200 and a list of resources', async () => {
      const response = await client.get('/unknown');

      expect(response.status).toBe(200);

      const isValid = validateGetResourceList(response.data);
      expect(isValid).toBe(true);
      expect(validateGetResourceList.errors).toBeNull();
      expect(response.data.total_pages).toBe(
        Math.ceil(response.data.total / response.data.per_page)
      );
    });

    test('returns 404 for a missing resource', async () => {
      await expect(client.get('/unknown/23')).rejects.toMatchObject({
        response: {
          status: 404,
          data: {},
        },
      });
    });
  });

  describe('GET /products', () => {
    test('returns 200 and a list of resources', async () => {
      const response = await client.get('/products');

      expect(response.status).toBe(200);

      const isValid = validateGetResourceList(response.data);
      expect(isValid).toBe(true);
      expect(validateGetResourceList.errors).toBeNull();
      expect(response.data.total_pages).toBe(
        Math.ceil(response.data.total / response.data.per_page)
      );
    });

    test('GET /products/1 returns 200 and correct data structure', async () => {
      const response = await client.get('/products/1');

      expect(response.status).toBe(200);

      const isValid = validateGetResource(response.data);
      expect(isValid).toBe(true);
      expect(validateGetResource.errors).toBeNull();
      expect(response.data.data.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe('POST /register', () => {
    test('succeeds and returns an id and token for a valid, registered email', async () => {
      const response = await client.post('/register', {
        email: 'eve.holt@reqres.in',
        password: 'pistol',
      });

      expect(response.status).toBe(200);

      const isValid = validateRegister(response.data);
      expect(isValid).toBe(true);
      expect(validateRegister.errors).toBeNull();
      expect(response.data.token).toBe('QpwL5tke4Pnpja7X4');
    });

    test('fails with 400 and an error message when password is missing', async () => {
      const error = await client
        .post('/register', { email: 'sydney@fife' })
        .catch((err) => err);

      expect(error.response.status).toBe(400);
      expect(error.response.data).toEqual({ error: 'Missing password' });
    });
  });

  describe('POST /login', () => {
    test('succeeds and returns a token for valid credentials', async () => {
      const response = await client.post('/login', {
        email: 'eve.holt@reqres.in',
        password: 'cityslicka',
      });

      expect(response.status).toBe(200);

      const isValid = validateLogin(response.data);
      expect(isValid).toBe(true);
      expect(validateLogin.errors).toBeNull();
      expect(response.data.token).toBe('QpwL5tke4Pnpja7X4');
    });

    test('fails with 400 and an error message when password is missing', async () => {
      const error = await client
        .post('/login', { email: 'sydney@fife' })
        .catch((err) => err);

      expect(error.response.status).toBe(400);
      expect(error.response.data).toEqual({ error: 'Missing password' });
    });
  });
});
