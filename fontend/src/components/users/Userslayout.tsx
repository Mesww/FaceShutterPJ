import React from 'react';
import { Outlet } from 'react-router-dom';

const Userslayout: React.FC = () => {
  return (
      <div>
        <Outlet/>
      </div>
  );
};

export default Userslayout;