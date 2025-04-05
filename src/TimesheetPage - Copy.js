import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TimesheetPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { username, team } = location.state || { username: 'User', team: 'IT-Internal' };
    
    const [entries, setEntries] = useState([{
        date: '',
        projectName: '',
        activityType: '',
        activityPerformed: '',
        jobType: '',
        hoursSpent: '',
        isEditing: true
    }]);

    const handleLogout = () => {
        navigate('/');
    };

    const handleInputChange = (index, e) => {
        const { name, value } = e.target;
        const newEntries = [...entries];
        newEntries[index][name] = value;
        setEntries(newEntries);
    };

    const addNewEntry = () => {
        setEntries([...entries, {
            date: '',
            projectName: '',
            activityType: '',
            activityPerformed: '',
            jobType: '',
            hoursSpent: '',
            isEditing: true
        }]);
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

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            username,
            team,
            entries: entries.map(entry => ({
                ...entry,
                date: new Date(entry.date).toISOString().split('T')[0] // Format date
            }))
        };
        console.log('Timesheet submitted:', payload);
        alert('Timesheet saved successfully!');
    };

    const handleCancel = () => {
        setEntries([{
            date: '',
            projectName: '',
            activityType: '',
            activityPerformed: '',
            jobType: '',
            hoursSpent: '',
            isEditing: true
        }]);
    };

    // Styles
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

    return (
        <div style={pageStyles}>
            <div style={containerStyles}>
                <div style={headerStyles}>
                    <h2 style={{ margin: 0, color: '#333' }}>IT Timesheet Management</h2>
                    <div style={userInfoStyles}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={usernameStyles}>{username}</span>
                            {team && <span style={teamBadgeStyles}>{team}</span>}
                        </div>
                        <button 
                            onClick={handleLogout} 
                            style={logoutButtonStyles}
                        >
                            Log Out
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={tableStyles}>
                            <thead>
                                <tr>
                                    <th style={thStyles}>Team</th>
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
                                                value={team || 'Not assigned'}
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
                                                <option value="BRNET">BRNET</option>
                                                <option value="GLOW">GLOW</option>
                                                <option value="TruCell">TruCell</option>
                                                <option value="TracOD">TracOD</option>
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
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                {entry.isEditing ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSave(index)}
                                                            style={{
                                                                ...buttonStyles,
                                                                backgroundColor: '#4caf50',
                                                                color: 'white',
                                                                ':hover': {
                                                                    backgroundColor: '#388e3c'
                                                                }
                                                            }}
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleClear(index)}
                                                            style={{
                                                                ...buttonStyles,
                                                                backgroundColor: '#ff9800',
                                                                color: '#fff',
                                                                ':hover': {
                                                                    backgroundColor: '#f57c00'
                                                                }
                                                            }}
                                                        >
                                                            Clear
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEdit(index)}
                                                        style={{
                                                            ...buttonStyles,
                                                            backgroundColor: '#2196f3',
                                                            color: 'white',
                                                            ':hover': {
                                                                backgroundColor: '#1976d2'
                                                            }
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(index)}
                                                    style={{
                                                        ...buttonStyles,
                                                        backgroundColor: '#f44336',
                                                        color: 'white',
                                                        ':hover': {
                                                            backgroundColor: '#d32f2f'
                                                        }
                                                    }}
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
                        <div>
                            <button
                                type="button"
                                onClick={addNewEntry}
                                style={{
                                    ...actionButtonStyles,
                                    backgroundColor: '#4caf50',
                                    color: 'white',
                                    marginRight: '10px',
                                    ':hover': {
                                        backgroundColor: '#388e3c'
                                    }
                                }}
                            >
                                + New Entry
                            </button>
                        </div>
                        <div>
                            <button
                                type="button"
                                onClick={handleCancel}
                                style={{
                                    ...actionButtonStyles,
                                    backgroundColor: '#9e9e9e',
                                    color: 'white',
                                    marginRight: '10px',
                                    ':hover': {
                                        backgroundColor: '#757575'
                                    }
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                style={{
                                    ...actionButtonStyles,
                                    backgroundColor: '#2196f3',
                                    color: 'white',
                                    ':hover': {
                                        backgroundColor: '#1976d2'
                                    }
                                }}
                            >
                                Submit All
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TimesheetPage;