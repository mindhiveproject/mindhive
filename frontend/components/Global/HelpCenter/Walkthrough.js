import React from 'react';

export default function Walkthrough({ onStart, tour }) {
  const handleStart = () => {
    if (onStart) onStart();
    setTimeout(() => {
      tour.start();
    }, 500);
  };

  return (
    <div>
      <p>Explore Walkthroughs soon! 🧗🏼‍♂️</p>
      {/* <button onClick={handleStart}>Start</button> */}
    </div>
  );
} 