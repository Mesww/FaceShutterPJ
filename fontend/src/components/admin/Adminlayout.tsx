import React from 'react';
import { Outlet } from 'react-router-dom';

const Adminlayout: React.FC = () => {
  return (
      <div>
        <Outlet/>
      </div>
  );
};

export default Adminlayout;