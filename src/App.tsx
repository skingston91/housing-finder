import { Route, Routes } from 'react-router-dom';

import { AreaSearchPage } from '@/pages/AreaSearchPage';

export const App = () => (
  <Routes>
    <Route path="/" element={<AreaSearchPage />} />
  </Routes>
);
