const axios = require('axios');
const sinon = require('sinon');
const { expect } = require('chai');
const fetchAndAggregateData = require('./fetchAndAggregateData');

// Mock axios
describe('fetchAndAggregateData', () => {

  let axiosGetStub;

  beforeEach(() => {
    axiosGetStub = sinon.stub(axios, 'get');
  });

  afterEach(() => {
    axiosGetStub.restore();
  });

  it('should return aggregated data when both API calls are successful', async () => {
    axiosGetStub.onCall(0).resolves({
      data: [
        { id: 1, userId: 1, title: 'Post 1', body: 'Content of post 1' },
        { id: 2, userId: 1, title: 'Post 2', body: 'Content of post 2' },
      ],
    });
    axiosGetStub.onCall(1).resolves({
      data: [
        { id: 1, name: 'User 1', username: 'user1' },
        { id: 2, name: 'User 2', username: 'user2' },
      ],
    });

    const result = await fetchAndAggregateData();

    expect(result).to.deep.equal([
      {
        id: 1,
        name: 'User 1',
        username: 'user1',
        posts: [
          { id: 1, userId: 1, title: 'Post 1', body: 'Content of post 1' },
          { id: 2, userId: 1, title: 'Post 2', body: 'Content of post 2' },
        ],
      },
      {
        id: 2,
        name: 'User 2',
        username: 'user2',
        posts: [],
      },
    ]);
  });

  it('should throw an error if any of the API calls fail', async () => {
    axiosGetStub.onCall(0).resolves({
      data: [
        { id: 1, userId: 1, title: 'Post 1', body: 'Content of post 1' },
      ],
    });
    axiosGetStub.onCall(1).rejects(new Error('Network error'));

    try {
      await fetchAndAggregateData();
     
      throw new Error('Expected function to throw error');
    } catch (error) {
      expect(error.message).to.equal('Failed to fetch and aggregate data');
    }
  });

  it('should handle 500 server error gracefully', async () => {
    axiosGetStub.onCall(0).resolves({
      data: [
        { id: 1, userId: 1, title: 'Post 1', body: 'Content of post 1' },
      ],
    });
    axiosGetStub.onCall(1).rejects({
      response: { status: 500, data: 'Internal Server Error' },
    });

    try {
      await fetchAndAggregateData();
      throw new Error('Expected function to throw error');
    } catch (error) {
      expect(error.message).to.equal('Failed to fetch and aggregate data');
    }
  });

  it('should handle invalid data structure gracefully', async () => {
    axiosGetStub.onCall(0).resolves({
      data: [
        { id: 1, userId: 1, title: 'Post 1' },
      ],
    });
    axiosGetStub.onCall(1).resolves({
      data: [
        { id: 1, name: 'User 1' }, 
      ],
    });

    const result = await fetchAndAggregateData();

    expect(result).to.deep.equal([
      {
        id: 1,
        name: 'User 1',
        posts: [
          { id: 1, userId: 1, title: 'Post 1', body: undefined }, 
        ],
      },
    ]);
  });
});
