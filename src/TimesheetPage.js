import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const TimesheetPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [team, setTeam] = useState(location.state?.team || sessionStorage.getItem('team') || '');
    const [entries, setEntries] = useState([]);
    const [activityTypes, setActivityTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [users, setUsers] = useState([]);
    const [showUserManagement, setShowUserManagement] = useState(false);
    const [newUser , setNewUser ] = useState({
        username: '',
        password: '',
        team: '',
        role: ''
    });
    const [passwordChange, setPasswordChange] = useState({
        userId: '',
        newPassword: ''
    });

    const username = location.state?.username || sessionStorage.getItem('username');
    const role = location.state?.role || sessionStorage.getItem('role') || '';
    const isAdmin = role === 'Admin'; // Check if the user is an admin

    useEffect(() => {
        if (!username) {
            navigate('/login');  // If username missing -> Force login
        }
    }, [username, navigate]);

    const fetchTeamAndActivityTypes = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            let teamData = team;

            if (!teamData) {
                const teamResponse = await axios.get(`http://192.168.4.22:5000/api/getUser Details?username=${encodeURIComponent(username)}`);
                
                if (!teamResponse.data.success) throw new Error(teamResponse.data.message || 'Failed to fetch team');
                
                teamData = teamResponse.data.user.team;
                
                setTeam(teamData);
                sessionStorage.setItem('team', teamData);  // Store team in session for next visit
            }

            const activitiesResponse = await axios.get(`http://192.168.4.22:5000/api/activityTypes?team=${encodeURIComponent(teamData)}`);
            
            if (!activitiesResponse.data.success) throw new Error(activitiesResponse.data.message || 'Failed to fetch activity types');
            
            setActivityTypes(activitiesResponse.data.activityTypes || []);
            
            // If admin, fetch all users
            if (isAdmin) {
                const usersResponse = await axios.get('http://192.168.4.22:5000/api/users');
                if (usersResponse.data.success) {
                    setUsers(usersResponse.data.users || []);
                } else {
                    console.error('Failed to fetch users:', usersResponse.data.message);
                }
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err.message || 'Network or server error');
            setActivityTypes([]);
        } finally {
            setIsLoading(false);
        }
    }, [username, team, isAdmin]);

    useEffect(() => {
        if (username) {
            fetchTeamAndActivityTypes();
        }
    }, [fetchTeamAndActivityTypes, username]);

    // Admin User Management Functions
    const handleCreateUser  = async () => {
        try {
            const response = await axios.post('http://192.168.4.22:5000/api/users', newUser );
            if (response.data.success) {
                alert('User  created successfully!');
                setNewUser ({ username: '', password: '', team: '', role: '' });
                fetchTeamAndActivityTypes(); // Refresh user list
            }
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Error creating user: ' + (error.response?.data?.message || 'Unknown error'));
        }
    };

    const handleDeleteUser  = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                const response = await axios.delete(`http://192.168.4.22:5000/api/users/${userId}`);
                if (response.data.success) {
                    alert('User  deleted successfully!');
                    fetchTeamAndActivityTypes(); // Refresh user list
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Error deleting user: ' + (error.response?.data?.message || 'Unknown error'));
            }
        }
    };

    const handleChangePassword = async () => {
        try {
            const response = await axios.put(
                `http://192.168.4.22:5000/api/users/${passwordChange.userId}/password`,
                { newPassword: passwordChange.newPassword }
            );
            if (response.data.success) {
                alert('Password changed successfully!');
                setPasswordChange({ userId: '', newPassword: '' });
            }
        } catch (error) {
            console.error('Error changing password:', error);
            alert('Error changing password: ' + (error.response?.data?.message || 'Unknown error'));
        }
    };

    const addNewEntry = () => {
        setEntries([...entries, {
            team: team,
            date: '',
            projectName: '',
            activityType: '',
            activityPerformed: '',
            jobType: '',
            hoursSpent: '',
            isEditing: true
        }]);
    };

    const handleLogout = () => {
        navigate('/');
    };

    const handleInputChange = (index, e) => {
        const { name, value } = e.target;
        const newEntries = [...entries];
        newEntries[index][name] = value;
        setEntries(newEntries);
    };

    const handleSave = (index) => {
        const newEntries = [...entries];
        newEntries[index].isEditing = false;
        setEntries(newEntries);
    };

    const handleEdit = (index) => {
        const newEntries = [...entries];
        newEntries[index].isEditing = true;
        setEntries(newEntries);
    };

    const handleClear = (index) => {
        const newEntries = [...entries];
        newEntries[index] = {
            team: team,
            date: '',
            projectName: '',
            activityType: '',
            activityPerformed: '',
            jobType: '',
            hoursSpent: '',
            isEditing: true
        };
        setEntries(newEntries);
    };

    const handleDelete = (index) => {
        const newEntries = [...entries];
        newEntries.splice(index, 1);
        setEntries(newEntries);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                username,
                team,
                entries: entries.map(entry => ({
                    ...entry,
                    date: new Date(entry.date).toISOString().split('T')[0],
                    hoursSpent: parseFloat(entry.hoursSpent) || 0
                }))
            };

            const response = await axios.post('http://192.168.4.22:5000/api/timesheets', payload);
            if (response.data.success) {
                alert('Timesheet saved successfully!');
                setEntries([{ 
                    team, 
                    date: '', 
                    projectName: '', 
                    activityType: '', 
                    activityPerformed: '', 
                    jobType: '', 
                    hoursSpent: '', 
                    isEditing: true 
                }]);
            }
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to submit timesheet');
            console.error('Submission error:', error);
        }
    };

    const handleCancel = () => {
        setEntries([{
            team: team,
            date: '',
            projectName: '',
            activityType: '',
            activityPerformed: '',
            jobType: '',
            hoursSpent: '',
            isEditing: true
        }]);
    };

    const handleDownloadReport = async () => {
        try {
            const response = await axios.get(`http://192.168.4.22:5000/api/timesheet/report?startDate=${startDate}&endDate=${endDate}`, {
                responseType: 'blob' // Important for downloading files
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'timesheet_report.xlsx'); // Specify the file name
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading report:', error);
            alert('Failed to download report.');
        }
    };

    const pageStyles = {
        backgroundImage: 'url(/assets/Login/blue.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        padding: '20px'
    };

    const containerStyles = {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '1400px',
        margin: '0 auto',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    };

    const headerStyles = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '1px solid #eee'
    };

    const userInfoStyles = {
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
    };

    const usernameStyles = {
        fontWeight: 'bold',
        fontSize: '16px',
        color: '#333'
    };

    const teamBadgeStyles = {
        backgroundColor: '#e1f5fe',
        color: '#0288d1',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500'
    };

    const logoutButtonStyles = {
        padding: '8px 16px',
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'background-color 0.3s',
        ':hover': {
            backgroundColor: '#d32f2f'
        }
    };

    const tableStyles = {
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '20px',
        fontSize: '14px'
    };

    const thStyles = {
        padding: '12px',
        textAlign: 'left',
        border: '1px solid #ddd',
        backgroundColor: '#f5f5f5',
        fontWeight: '600',
        color: '#333'
    };

    const tdStyles = {
        padding: '10px',
        border: '1px solid #e0e0e0',
        verticalAlign: 'middle'
    };

    const inputStyles = {
        width: '90%',
        padding: '8px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px'
    };

    const readOnlyInputStyles = {
        ...inputStyles,
        backgroundColor: '#fafafa',
        border: '1px solid #e0e0e0',
        fontWeight: '500',
        color: '#333'
    };

    const selectStyles = {
        width: '100%',
        padding: '8px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: 'white',
        fontSize: '14px'
    };

    const buttonStyles = {
        padding: '6px 10px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        margin: '2px',
        minWidth: '60px',
        transition: 'all 0.2s'
    };

    const actionButtonStyles = {
        padding: '10px 15px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'all 0.2s'
    };

    const adminSectionStyles = {
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        border: '1px solid #ddd'
    };

    const adminButtonStyles = {
        padding: '8px 16px',
        backgroundColor: '#673ab7',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        marginBottom: '20px'
    };

    const adminInputStyles = {
        padding: '8px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        margin: '5px',
        width: '200px'
    };

    const userTableStyles = {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '20px'
    };

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div style={pageStyles}>
            <div style={containerStyles}>
                <div style={headerStyles}>
                    <h2 style={{ margin: 0, color: '#333' }}>IT Timesheet Management</h2>
                    <div style={userInfoStyles}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={usernameStyles}>{username}</span>
                            {team && <span style={teamBadgeStyles}>{team}</span>}
                            {isAdmin && <span style={{ ...teamBadgeStyles, backgroundColor: '#e8f5e9', color: '#2e7d32' }}>Admin</span>}
                        </div>
                        <button onClick={handleLogout} style={logoutButtonStyles}>
                            Log Out
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={tableStyles}>
                            <thead>
                                <tr>
                                    <th style={thStyles}>Team*</th>
                                    <th style={thStyles}>Date*</th>
                                    <th style={thStyles}>Project Name*</th>
                                    <th style={thStyles}>Activity Type*</th>
                                    <th style={thStyles}>Activity Performed*</th>
                                    <th style={thStyles}>Job Type*</th>
                                    <th style={thStyles}>Hours Spent*</th>
                                    <th style={{ ...thStyles, textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((entry, index) => (
                                    <tr key={index} style={{ backgroundColor: entry.isEditing ? '#fff' : '#f9f9f9' }}>
                                        <td style={tdStyles}>
                                            <input
                                                type="text"
                                                value={entry.team}
                                                readOnly
                                                style={readOnlyInputStyles}
                                            />
                                        </td>
                                        <td style={tdStyles}>
                                            <input
                                                type="date"
                                                name="date"
                                                value={entry.date}
                                                onChange={(e) => handleInputChange(index, e)}
                                                style={inputStyles}
                                                required
                                                disabled={!entry.isEditing}
                                            />
                                        </td>
                                        <td style={tdStyles}>
                                            <input
                                                type="text"
                                                name="projectName"
                                                value={entry.projectName}
                                                onChange={(e) => handleInputChange(index, e)}
                                                style={inputStyles}
                                                required
                                                disabled={!entry.isEditing}
                                            />
                                        </td>
                                        <td style={tdStyles}>
                                            <select
                                                name="activityType"
                                                value={entry.activityType}
                                                onChange={(e) => handleInputChange(index, e)}
                                                style={selectStyles}
                                                required
                                                disabled={!entry.isEditing}
                                            >
                                                <option value="">Select---</option>
                                                {activityTypes.map((type) => (
                                                    <option key={type.Id} value={type.ActivityName}>
                                                        {type.ActivityName}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td style={tdStyles}>
                                            <input
                                                type="text"
                                                name="activityPerformed"
                                                value={entry.activityPerformed}
                                                onChange={(e) => handleInputChange(index, e)}
                                                style={inputStyles}
                                                required
                                                disabled={!entry.isEditing}
                                            />
                                        </td>
                                        <td style={tdStyles}>
                                            <select
                                                name="jobType"
                                                value={entry.jobType}
                                                onChange={(e) => handleInputChange(index, e)}
                                                style={selectStyles}
                                                required
                                                disabled={!entry.isEditing}
                                            >
                                                <option value="">Select---</option>
                                                <option value="Planned">Planned</option>
                                                <option value="Unplanned">Unplanned</option>
                                            </select>
                                        </td>
                                        <td style={tdStyles}>
                                            <input
                                                type="number"
                                                name="hoursSpent"
                                                value={entry.hoursSpent}
                                                onChange={(e) => handleInputChange(index, e)}
                                                style={{ ...inputStyles, width: '80%' }}
                                                min="0"
                                                max="24"
                                                step="0.5"
                                                required
                                                disabled={!entry.isEditing}
                                            />
                                        </td>
                                        <td style={{ ...tdStyles, textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleEdit(index)}
                                                    style={{ ...buttonStyles, backgroundColor: '#2196f3', color: 'white' }}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleSave(index)}
                                                    style={{ ...buttonStyles, backgroundColor: '#4caf50', color: 'white' }}
                                                >
                                                    Save
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleClear(index)}
                                                    style={{ ...buttonStyles, backgroundColor: '#ff9800', color: 'white' }}
                                                >
                                                    Clear
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleDelete(index)}
                                                    style={{ ...buttonStyles, backgroundColor: '#f44336', color: 'white' }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                type="button"
                                onClick={addNewEntry}
                                style={{ ...actionButtonStyles, backgroundColor: '#2196f3', color: 'white' }}
                            >
                                Add New Entry
                            </button>
                            <button 
                                type="button"
                                onClick={handleCancel}
                                style={{ ...actionButtonStyles, backgroundColor: '#9e9e9e', color: 'white' }}
                            >
                                Cancel
                            </button>
                        </div>
                        <button 
                            type="submit"
                            style={{ ...actionButtonStyles, backgroundColor: '#4caf50', color: 'white' }}
                        >
                            Submit Timesheet
                        </button>
                    </div>
                </form>

                {/* Date Range for Report Generation */}
                <div style={{ marginTop: '300px' }}>
                    <h3>Generate Timesheet Report</h3>
                    <div style={{ display: 'flex', gap: '400px', alignItems: 'center' }}>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={inputStyles}
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={inputStyles}
                        />
                        <button 
                            onClick={handleDownloadReport}
                            style={{ ...actionButtonStyles, backgroundColor: '#2196f3', color: 'white' }}
                        >
                            Download Report
                        </button>
                    </div>
                </div>

                {/* Admin User Management Section */}
                {isAdmin && (
                    <div style={adminSectionStyles}>
                        <h3>User Management</h3>
                        <button
                            onClick={() => setShowUserManagement(!showUserManagement)}
                            style={adminButtonStyles}
                        >
                            {showUserManagement ? 'Hide User Management' : 'Show User Management'}
                        </button>
                        {showUserManagement && (
                            <>
                                {/* Create New User */}
                                <div style={{ margin: '20px 0' }}>
                                    <h4>Create New User</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <input
                                            type="text"
                                            placeholder="Username"
                                            value={newUser .username}
                                            onChange={(e) => setNewUser ({ ...newUser , username: e.target.value })}
                                            style={adminInputStyles}
                                        />
                                        <input
                                            type="password"
                                            placeholder="Password"
                                            value={newUser .password}
                                            onChange={(e) => setNewUser ({ ...newUser , password: e.target.value })}
                                            style={adminInputStyles}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Team"
                                            value={newUser .team}
                                            onChange={(e) => setNewUser ({ ...newUser , team: e.target.value })}
                                            style={adminInputStyles}
                                        />
                                        <select
                                            value={newUser .role}
                                            onChange={(e) => setNewUser ({ ...newUser , role: e.target.value })}
                                            style={adminInputStyles}
                                        >
                                            <option value="">Select Role</option>
                                            <option value="Admin">Admin</option>
                                            <option value="User ">User </option>
                                        </select>
                                        <button
                                            onClick={handleCreateUser }
                                            style={{ ...adminButtonStyles, backgroundColor: '#4caf50' }}
                                            disabled={!newUser .username || !newUser .password || !newUser .team || !newUser .role}
                                        >
                                            Create User
                                        </button>
                                    </div>
                                </div>
                                {/* Change Password */}
                                <div style={{ margin: '20px 0' }}>
                                    <h4>Change User Password</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <select
                                            value={passwordChange.userId}
                                            onChange={(e) => setPasswordChange({ ...passwordChange, userId: e.target.value })}
                                            style={adminInputStyles}
                                        >
                                            <option value="">Select User</option>
                                            {users.map(user => (
                                                <option key={user.UserID} value={user.UserID}>{user.Username}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="password"
                                            placeholder="New Password"
                                            value={passwordChange.newPassword}
                                            onChange={(e) => setPasswordChange({ ...passwordChange, newPassword: e.target.value })}
                                            style={adminInputStyles}
                                        />
                                        <button
                                            onClick={handleChangePassword}
                                            style={{ ...adminButtonStyles, backgroundColor: '#ff9800' }}
                                            disabled={!passwordChange.userId || !passwordChange.newPassword}
                                        >
                                            Change Password
                                        </button>
                                    </div>
                                </div>
                                {/* Users List */}
                                <div style={{ margin: '20px 0' }}>
                                    <h4>User List</h4>
                                    <table style={userTableStyles}>
                                        <thead>
                                            <tr>
                                                <th style={thStyles}>ID</th>
                                                <th style={thStyles}>Username</th>
                                                <th style={thStyles}>Team</th>
                                                <th style={thStyles}>Role</th>
                                                <th style={thStyles}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(user => (
                                                <tr key={user.UserID}>
                                                    <td style={tdStyles}>{user.UserID}</td>
                                                    <td style={tdStyles}>{user.Username}</td>
                                                    <td style={tdStyles}>{user.Team}</td>
                                                    <td style={tdStyles}>{user.Role || 'User '}</td>
                                                    <td style={tdStyles}>
                                                        <button
                                                            onClick={() => handleDeleteUser (user.UserID)}
                                                            style={{ ...buttonStyles, backgroundColor: '#f44336', color: 'white' }}
                                                            disabled={user.Username === username} // Don't allow self-deletion
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimesheetPage;
