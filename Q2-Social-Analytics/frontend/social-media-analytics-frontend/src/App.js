import React from 'react';
import { Container, Grid } from '@mui/material';
import Header from './components/Header';
import TopUsers from './components/TopUsers';
import TrendingPosts from './components/TrendingPosts';
import LatestPosts from './components/LatestPosts';

function App() {
  return (
    <div className="App">
      <Header />
      <Container maxWidth="lg" style={{ marginTop: '2rem' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TopUsers />
          </Grid>
          <Grid item xs={12} md={4}>
            <TrendingPosts />
          </Grid>
          <Grid item xs={12} md={4}>
            <LatestPosts />
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}

export default App;
