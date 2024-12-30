const axios = require('axios');

const fetchAndAggregateData = async () => {
  try {
    const [postsResponse, usersResponse] = await Promise.all([
      axios.get('https://jsonplaceholder.typicode.com/posts'),
      axios.get('https://jsonplaceholder.typicode.com/users'),
    ]);

    const posts = postsResponse.data;
    const users = usersResponse.data;

    const result = users.map(user => {
      const userPosts = posts.filter(post => post.userId === user.id);
      return { ...user, posts: userPosts };
    });

    return result;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw new Error('Failed to fetch and aggregate data');
  }
};

module.exports = fetchAndAggregateData;
