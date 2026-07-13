const axios = require('axios');

const BASE_URL = 'https://jsonplaceholder.typicode.com';

describe('JSONPlaceholder API', () => {
  test('GET /posts/1 returns 200 and correct data structure', async () => {
    const response = await axios.get(`${BASE_URL}/posts/1`);

    expect(response.status).toBe(200);
    expect(response.data).toEqual(
      expect.objectContaining({
        userId: expect.any(Number),
        id: 1,
        title: expect.any(String),
        body: expect.any(String),
      })
    );
  });

  test('POST /posts creates a new resource and returns 201', async () => {
    const newPost = {
      title: 'foo',
      body: 'bar',
      userId: 1,
    };

    const response = await axios.post(`${BASE_URL}/posts`, newPost);

    expect(response.status).toBe(201);
    expect(response.data).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        title: newPost.title,
        body: newPost.body,
        userId: newPost.userId,
      })
    );
  });

  test('GET /posts/9999 returns 404 for a missing resource', async () => {
    await expect(axios.get(`${BASE_URL}/posts/9999`)).rejects.toMatchObject({
      response: {
        status: 404,
      },
    });
  });
});
