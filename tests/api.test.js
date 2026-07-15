require('dotenv').config();
const axios = require('axios');
const Ajv = require('ajv');
const getUserSchema = require('../schemas/getUser.schema.json');
const createUserSchema = require('../schemas/createUser.schema.json');
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
const validateGetResource = ajv.compile(getResourceSchema);
const validateGetResourceList = ajv.compile(getResourceListSchema);
const validateRegister = ajv.compile(registerSchema);
const validateLogin = ajv.compile(loginSchema);


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

  test('GET /unknown returns 200 and a list of resources', async () => {
    const response = await client.get('/unknown');

    expect(response.status).toBe(200);

    const isValid = validateGetResourceList(response.data);
    expect(isValid).toBe(true);
    expect(validateGetResourceList.errors).toBeNull();
  });

  test('GET /unknown/23 returns 404 for a missing resource', async () => {
    await expect(client.get('/unknown/23')).rejects.toMatchObject({
      response: {
        status: 404,
      },
    });
  });

  test('GET /products returns 200 and a list of resources', async () => {
    const response = await client.get('/products');

    expect(response.status).toBe(200);

    const isValid = validateGetResourceList(response.data);
    expect(isValid).toBe(true);
    expect(validateGetResourceList.errors).toBeNull();
  });

  test('GET /products/1 returns 200 and correct data structure', async () => {
    const response = await client.get('/products/1');

    expect(response.status).toBe(200);

    const isValid = validateGetResource(response.data);
    expect(isValid).toBe(true);
    expect(validateGetResource.errors).toBeNull();
  });

  test('POST /register with valid credentials returns 200 and a token', async () => {
    const response = await client.post('/register', {
      email: 'eve.holt@reqres.in',
      password: 'pistol',
    });

    expect(response.status).toBe(200);

    const isValid = validateRegister(response.data);
    expect(isValid).toBe(true);
    expect(validateRegister.errors).toBeNull();
  });

  test('POST /register without a password returns 400', async () => {
    await expect(
      client.post('/register', { email: 'sydney@fife' })
    ).rejects.toMatchObject({
      response: {
        status: 400,
        data: { error: 'Missing password' },
      },
    });
  });

  test('POST /login with valid credentials returns 200 and a token', async () => {
    const response = await client.post('/login', {
      email: 'eve.holt@reqres.in',
      password: 'cityslicka',
    });

    expect(response.status).toBe(200);

    const isValid = validateLogin(response.data);
    expect(isValid).toBe(true);
    expect(validateLogin.errors).toBeNull();
  });

  test('POST /login without a password returns 400', async () => {
    await expect(
      client.post('/login', { email: 'sydney@fife' })
    ).rejects.toMatchObject({
      response: {
        status: 400,
        data: { error: 'Missing password' },
      },
    });
  });
});
