import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemText } from '@mui/material';
import axios from 'axios';

const LatestPosts = () => {
  const [latestPosts, setLatestPosts] = useState([]);

  useEffect(() => {
    const fetchLatestPosts = async () => {
      try {
        const response = await axios.get('http://localhost:3000/posts?type=latest');
        setLatestPosts(response.data);
      } catch (error) {
        console.error('Error fetching latest posts:', error);
      }
    };

    fetchLatestPosts();
  }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>Latest Posts</Typography>
        <List>
          {latestPosts.map((post) => (
            <ListItem key={post.id}>
              <ListItemText 
                primary={post.title} 
                secondary={new Date(post.timestamp).toLocaleString()} 
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default LatestPosts;
