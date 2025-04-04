import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TimesheetPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { username } = location.state || { username: 'User' };
    
    const [entries, setEntries] = useState([{
        date: '',
        projectName: '',
        activityType: '',
        activityPerformed: '',
        jobType: '',
        hoursSpent: '',
        isEditing: true // New entries should be editable by default
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
        // Here you would typically save to backend
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
        console.log('Timesheet submitted:', entries);
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

    const pageStyles = {
        backgroundImage: 'url(/assets/Login/blue.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        padding: '20px'
    };

    // Button styles
    const buttonStyle = {
        padding: '6px 10px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        margin: '2px',
        minWidth: '60px'
    };

    return (
        <div style={pageStyles}>
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                padding: '20px',
                borderRadius: '8px',
                maxWidth: '1400px',
                margin: '0 auto'
            }}>
                {/* Header section remains the same */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                }}>
                    <h2>IT Timesheet Management Page</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ marginBottom: '5px', fontWeight: 'bold' }}>{username}</span>
                        <button 
                            onClick={handleLogout} 
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Log Out
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f2f2f2' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Date*</th>
                                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Project Name*</th>
                                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Activity Type*</th>
                                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Activity Performed*</th>
                                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Job Type*</th>
                                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Hours Spent*</th>
                                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>Action</th>
                                
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((entry, index) => (
                                    <tr key={index}>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            <input
                                                type="date"
                                                name="date"
                                                value={entry.date}
                                                onChange={(e) => handleInputChange(index, e)}
                                                style={{ width: '90%', padding: '8px' }}
                                                required
                                                disabled={!entry.isEditing}
                                            />
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            <input
                                                type="text"
                                                name="projectName"
                                                value={entry.projectName}
                                                onChange={(e) => handleInputChange(index, e)}
                                                style={{ width: '90%', padding: '8px' }}
                                                required
                                                disabled={!entry.isEditing}
                                            />
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            <select
                                                name="activityType"
                                                value={entry.activityType}
                                                onChange={(e) => handleInputChange(index, e)}
                                                style={{ width: '100%', padding: '8px' }}
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
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            <input
                                                type="text"
                                                name="activityPerformed"
                                                value={entry.activityPerformed}
                                                onChange={(e) => handleInputChange(index, e)}
                                                style={{ width: '90%', padding: '8px' }}
                                                required
                                                disabled={!entry.isEditing}
                                            />
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            <select
                                                name="jobType"
                                                value={entry.jobType}
                                                onChange={(e) => handleInputChange(index, e)}
                                                style={{ width: '100%', padding: '8px' }}
                                                required
                                                disabled={!entry.isEditing}
                                            >
                                                <option value="">Select---</option>
                                                <option value="Planned">Planned</option>
                                                <option value="Unplanned">Unplanned</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                            <input
                                                type="number"
                                                name="hoursSpent"
                                                value={entry.hoursSpent}
                                                onChange={(e) => handleInputChange(index, e)}
                                                style={{ width: '80%', padding: '8px' }}
                                                min="0"
                                                max="24"
                                                step="0.5"
                                                required
                                                disabled={!entry.isEditing}
                                            />
                                        </td>

                                        <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                {entry.isEditing ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSave(index)}
                                                            style={{
                                                                ...buttonStyle,
                                                                backgroundColor: '#28a745',
                                                                color: 'white'
                                                            }}
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleClear(index)}
                                                            style={{
                                                                ...buttonStyle,
                                                                backgroundColor: '#ffc107',
                                                                color: '#212529'
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
                                                            ...buttonStyle,
                                                            backgroundColor: '#17a2b8',
                                                            color: 'white'
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(index)}
                                                    style={{
                                                        ...buttonStyle,
                                                        backgroundColor: '#dc3545',
                                                        color: 'white'
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
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '10px 15px',
                                    cursor: 'pointer',
                                    marginRight: '10px'
                                }}
                            >
                                + New
                            </button>
                        </div>
                        <div>
                            <button
                                type="button"
                                onClick={handleCancel}
                                style={{
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '10px 15px',
                                    cursor: 'pointer',
                                    marginRight: '10px'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                style={{
                                    backgroundColor: '#2196F3',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '10px 15px',
                                    cursor: 'pointer'
                                }}
                            >
                                Save All
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TimesheetPage;