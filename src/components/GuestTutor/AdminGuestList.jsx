import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const AdminGuestList = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingRequests();
    }, []);

    const fetchPendingRequests = async () => {
        try {
            const response = await fetch('/api/guest/pending', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                setRequests(data);
            } else {
                toast.error(data.error || 'Failed to fetch requests');
            }
        } catch (error) {
            toast.error('Failed to fetch requests');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId) => {
        try {
            const response = await fetch(`/api/guest/approve/${requestId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Request approved successfully');
                // Remove the approved request from the list
                setRequests(requests.filter(req => req._id !== requestId));
            } else {
                toast.error(data.error || 'Failed to approve request');
            }
        } catch (error) {
            toast.error('Failed to approve request');
            console.error('Error:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Pending Guest Tutor Requests</h2>
            
            {requests.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No pending requests found</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {requests.map((request) => (
                        <div key={request._id} className="bg-white p-6 rounded-lg shadow-md">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        {request.guest.name}
                                    </h3>
                                    <p className="text-gray-600">{request.guest.phone}</p>
                                </div>
                                <button
                                    onClick={() => handleApprove(request._id)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                >
                                    Approve
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-sm text-gray-500">Requested By</p>
                                    <p className="text-gray-800">{request.tutor.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Request Date</p>
                                    <p className="text-gray-800">
                                        {new Date(request.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-sm text-gray-500">Qualification</p>
                                    <p className="text-gray-800">{request.guest.qualification}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Department</p>
                                    <p className="text-gray-800">{request.tutor.department}</p>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <p className="text-sm text-gray-500 mb-2">Date Range</p>
                                <div className="flex gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">From</p>
                                        <p className="text-gray-800">
                                            {new Date(request.dateRange.startDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">To</p>
                                        <p className="text-gray-800">
                                            {new Date(request.dateRange.endDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminGuestList;
