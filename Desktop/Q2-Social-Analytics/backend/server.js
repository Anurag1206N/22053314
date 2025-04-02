const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());

const TEST_SERVER_BASE_URL = process.env.TEST_SERVER_BASE_URL || 'http://20.244.56.144/evaluation-service';
let authToken = null;

let userPostCounts = new Map();
let userPostsMap = new Map();
let postsWithCommentCounts = new Map();
let allPosts = [];
let usersData = {};

const authenticate = async () => {
  try {
    const authResponse = await axios.post(`${TEST_SERVER_BASE_URL}/auth`, {
      email: process.env.EMAIL,
      name: process.env.NAME,
      rollNo: process.env.ROLL_NO,
      accessCode: process.env.ACCESS_CODE,
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET
    });
    
    authToken = authResponse.data.access_token;
    return authToken;
  } catch (error) {
    throw new Error('Authentication failed');
  }
};

const makeAuthenticatedRequest = async (url) => {
  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      await authenticate();
      const retryResponse = await axios.get(url, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      return retryResponse.data;
    }
    throw error;
  }
};

const fetchUsers = async () => {
  try {
    const response = await makeAuthenticatedRequest(`${TEST_SERVER_BASE_URL}/users`);
    usersData = response.users || {};
    return usersData;
  } catch (error) {
    return {};
  }
};

const fetchPostsForUser = async (userId) => {
  try {
    const response = await makeAuthenticatedRequest(`${TEST_SERVER_BASE_URL}/users/${userId}/posts`);
    const posts = response.posts || [];
    
    userPostCounts.set(userId, posts.length);
    userPostsMap.set(userId, posts);
    
    posts.forEach(post => {
      post.timestamp = post.timestamp || Date.now();
      allPosts.push(post);
      fetchCommentsForPost(post.id);
    });
    
    return posts;
  } catch (error) {
    return [];
  }
};

const fetchCommentsForPost = async (postId) => {
  try {
    const response = await makeAuthenticatedRequest(`${TEST_SERVER_BASE_URL}/posts/${postId}/comments`);
    const comments = response.comments || [];
    
    postsWithCommentCounts.set(postId, comments.length);
    
    return comments;
  } catch (error) {
    return [];
  }
};

const initializeData = async () => {
  try {
    userPostCounts.clear();
    userPostsMap.clear();
    postsWithCommentCounts.clear();
    allPosts = [];
    
    const users = await fetchUsers();
    
    for (const userId in users) {
      await fetchPostsForUser(userId);
    }
  } catch (error) {}
};

const scheduleDataRefresh = () => {
  setInterval(async () => {
    await initializeData();
  }, 5 * 60 * 1000);
  
  setInterval(async () => {
    const users = usersData;
    const userIds = Object.keys(users);
    const sampleSize = Math.min(5, userIds.length);
    
    for (let i = 0; i < sampleSize; i++) {
      const randomIndex = Math.floor(Math.random() * userIds.length);
      const userId = userIds[randomIndex];
      await fetchPostsForUser(userId);
    }
  }, 60 * 1000);
};

app.get('/users', async (req, res) => {
  try {
    if (Object.keys(usersData).length === 0) {
      await initializeData();
    }
    
    const userPostCountArray = Array.from(userPostCounts.entries());
    userPostCountArray.sort((a, b) => b[1] - a[1]);
    
    const topUsers = userPostCountArray.slice(0, 5).map(([userId, postCount]) => {
      return {
        userId,
        userName: usersData[userId],
        postCount
      };
    });
    
    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch top users' });
  }
});

app.get('/posts', async (req, res) => {
  try {
    const type = req.query.type || 'popular';
    
    if (type !== 'popular' && type !== 'latest') {
      return res.status(400).json({ error: 'Invalid type parameter. Use "popular" or "latest".' });
    }
    
    if (allPosts.length === 0) {
      await initializeData();
    }
    
    let resultPosts;
    
    if (type === 'popular') {
      if (postsWithCommentCounts.size === 0) {
        return res.status(503).json({ error: 'Comments data not available yet' });
      }
      
      let maxCommentCount = 0;
      for (const count of postsWithCommentCounts.values()) {
        if (count > maxCommentCount) {
          maxCommentCount = count;
        }
      }
      
      const popularPostIds = [];
      for (const [postId, count] of postsWithCommentCounts.entries()) {
        if (count === maxCommentCount) {
          popularPostIds.push(postId);
        }
      }
      
      resultPosts = allPosts.filter(post => popularPostIds.includes(post.id));
      resultPosts.forEach(post => {
        post.commentCount = postsWithCommentCounts.get(post.id) || 0;
      });
    } else {
      const sortedPosts = [...allPosts].sort((a, b) => b.timestamp - a.timestamp);
      resultPosts = sortedPosts.slice(0, 5);
    }
    
    res.json(resultPosts);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch ${req.query.type || 'posts'}` });
  }
});

app.get('/', (req, res) => {
  res.send('Social Media Analytics Microservice is running');
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  authenticate()
    .then(() => {
      initializeData();
      scheduleDataRefresh();
    })
    .catch(err => {});
});
