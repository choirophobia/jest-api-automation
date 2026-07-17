require('dotenv').config();
const axios = require('axios');
const Ajv = require('ajv');
const getUserSchema = require('../schemas/getUser.schema.json');
const createUserSchema = require('../schemas/createUser.schema.json');
const updateUserSchema = require('../schemas/updateUser.schema.json');
const registerSuccessSchema = require('../schemas/registerSuccess.schema.json');
const userListSchema = require('../schemas/userList.schema.json');

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
const validateRegisterSuccess = ajv.compile(registerSuccessSchema);
const validateUserList = ajv.compile(userListSchema);

describe('ReqRes API', () => {
  describe('GET /users/:id', () => {
    test('returns 200 and correct data structure for an existing user', async () => {
      const response = await client.get('/users/2');

      expect(response.status).toBe(200);

      const isValid = validateGetUser(response.data);
      expect(isValid).toBe(true);
      expect(validateGetUser.errors).toBeNull();
    });

    test('returns 404 for a missing resource', async () => {
      await expect(client.get('/users/9999')).rejects.toMatchObject({
        response: {
          status: 404,
        },
      });
    });

    test('returns 404 for a non-numeric id', async () => {
      await expect(client.get('/users/abc')).rejects.toMatchObject({
        response: {
          status: 404,
        },
      });
    });

    test('returns 404 for id 0', async () => {
      await expect(client.get('/users/0')).rejects.toMatchObject({
        response: {
          status: 404,
        },
      });
    });

    test('returns 404 for a negative id', async () => {
      await expect(client.get('/users/-1')).rejects.toMatchObject({
        response: {
          status: 404,
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
    });

    test('page=0 falls back to page 1 instead of erroring', async () => {
      const response = await client.get('/users', { params: { page: 0 } });

      expect(response.status).toBe(200);
      expect(response.data.page).toBe(1);
      expect(response.data.data.length).toBeGreaterThan(0);
    });

    test('a page far beyond total_pages returns 200 with an empty data array', async () => {
      const response = await client.get('/users', { params: { page: 9999 } });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data).toHaveLength(0);
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
    });

    test('still returns 201 for an empty body, without fabricating name/job', async () => {
      const response = await client.post('/users', {});

      expect(response.status).toBe(201);
      expect(response.data.id).toBeDefined();
      expect(response.data.createdAt).toBeDefined();
      expect(response.data.name).toBeUndefined();
      expect(response.data.job).toBeUndefined();
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
    });
  });

  describe('DELETE /users/:id', () => {
    test('deletes a resource and returns 204 with no content', async () => {
      const response = await client.delete('/users/2');

      expect(response.status).toBe(204);
      expect(response.data).toEqual('');
    });
  });

  describe('POST /register', () => {
    test('succeeds and returns an id and token for a valid, registered email', async () => {
      const response = await client.post('/register', {
        email: 'eve.holt@reqres.in',
        password: 'pistol',
      });

      expect(response.status).toBe(200);

      const isValid = validateRegisterSuccess(response.data);
      expect(isValid).toBe(true);
      expect(validateRegisterSuccess.errors).toBeNull();
    });

    test('fails with 400 and an error message when password is missing', async () => {
      await expect(
        client.post('/register', { email: 'sydney@fife' })
      ).rejects.toMatchObject({
        response: {
          status: 400,
          data: {
            error: 'Missing password',
          },
        },
      });
    });
  });
});
