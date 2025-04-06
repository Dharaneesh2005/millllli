import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Redirect to the actual application
    window.location.href = '/index.html';
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column'
    }}>
      <h1>Millikit E-Commerce</h1>
      <p>Loading the application...</p>
    </div>
  );
}