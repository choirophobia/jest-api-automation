require('dotenv').config();
const axios = require('axios');
const Ajv = require('ajv');
const getUserSchema = require('../schemas/getUser.schema.json');
const createUserSchema = require('../schemas/createUser.schema.json');

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

describe('ReqRes API', () => {
  test('GET /users/2 returns 200 and correct data structure', async () => {
    const response = await client.get('/users/2');

    expect(response.status).toBe(200);

    const isValid = validateGetUser(response.data);
    expect(isValid).toBe(true);
    expect(validateGetUser.errors).toBeNull();
  });

  test('POST /users creates a new resource and returns 201', async () => {
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

  test('GET /users/9999 returns 404 for a missing resource', async () => {
    await expect(client.get('/users/9999')).rejects.toMatchObject({
      response: {
        status: 404,
      },
    });
  });
});
