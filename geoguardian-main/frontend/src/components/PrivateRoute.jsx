import React from 'react';

const PrivateRoute = ({ children }) => {
  // Pass-through since auth logic is relaxed for now
  return <>{children}</>;
};

export default PrivateRoute;
