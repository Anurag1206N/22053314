import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemText } from '@mui/material';
import axios from 'axios';

const TopUsers = () => {
  const [topUsers, setTopUsers] = useState([]);

  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        const response = await axios.get('http://localhost:3000/users');
        setTopUsers(response.data);
      } catch (error) {
        console.error('Error fetching top users:', error);
      }
    };

    fetchTopUsers();
  }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>Top Users</Typography>
        <List>
          {topUsers.map((user) => (
            <ListItem key={user.userId}>
              <ListItemText primary={user.userName} secondary={`Posts: ${user.postCount}`} />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default TopUsers;
