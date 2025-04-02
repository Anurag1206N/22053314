import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemText } from '@mui/material';
import axios from 'axios';

const TrendingPosts = () => {
  const [trendingPosts, setTrendingPosts] = useState([]);

  useEffect(() => {
    const fetchTrendingPosts = async () => {
      try {
        const response = await axios.get('http://localhost:3000/posts?type=popular');
        setTrendingPosts(response.data);
      } catch (error) {
        console.error('Error fetching trending posts:', error);
      }
    };

    fetchTrendingPosts();
  }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>Trending Posts</Typography>
        <List>
          {trendingPosts.map((post) => (
            <ListItem key={post.id}>
              <ListItemText primary={post.title} secondary={`Comments: ${post.commentCount}`} />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default TrendingPosts;
