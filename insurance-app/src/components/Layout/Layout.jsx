import { Outlet } from 'react-router-dom';
import Header from './Header';
import './Layout.css';

const Layout = () => {
    return (
        <div className="layout-container">
            <Header />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
