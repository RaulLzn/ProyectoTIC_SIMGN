import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import Production from './pages/Production';
import Demanda from './pages/Demanda';
import Regalias from './pages/Regalias';
import GeographicAnalysis from './pages/GeographicAnalysis';
import DescargaInforme from './pages/DescargaInforme';
import Estadisticas from './pages/Estadisticas';

const App: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="produccion" element={<Production />} />
                    <Route path="demanda" element={<Demanda />} />
                    <Route path="regalias" element={<Regalias />} />
                    <Route path="geografia" element={<GeographicAnalysis />} />
                    <Route path="estadisticas" element={<Estadisticas />} />
                    <Route path="descarga-informe" element={<DescargaInforme />} />
                </Route>
            </Routes>
        </Router>
    );
};

export default App;