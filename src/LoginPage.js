import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError('Please enter both username and password');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('http://192.168.4.22:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.success) {
                // Store username, team, and role in sessionStorage
                sessionStorage.setItem('username', data.username);
                sessionStorage.setItem('team', data.team);
                sessionStorage.setItem('role', data.role); // Store role in sessionStorage

                navigate('/timesheet', { state: { username: data.username, team: data.team, role: data.role } }); // Pass role in state
            } else {
                setError(data.message || 'Invalid username or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Failed to connect to server. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const pageStyles = {
        backgroundImage: 'url(/assets/Login/devops.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    };

    const formStyles = {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '300px'
    };

    return (
        <div style={pageStyles}>
            <div style={formStyles}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Login Page</h2>

                {error && (
                    <div style={{
                        color: '#dc3545',
                        backgroundColor: '#f8d7da',
                        padding: '0.5rem',
                        marginBottom: '1rem',
                        borderRadius: '4px'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem' }}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem' }}
                    />

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            backgroundColor: '#007bff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
