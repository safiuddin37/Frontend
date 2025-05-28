import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const GuestTutorList = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const response = await fetch('/api/guest/my-requests', {
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

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'approved':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
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
            <h2 className="text-2xl font-bold mb-6 text-gray-800">My Guest Tutor Requests</h2>
            
            {requests.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No guest tutor requests found</p>
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
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(request.status)}`}>
                                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-sm text-gray-500">Qualification</p>
                                    <p className="text-gray-800">{request.guest.qualification}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Request Date</p>
                                    <p className="text-gray-800">
                                        {new Date(request.createdAt).toLocaleDateString()}
                                    </p>
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

                            {request.status === 'approved' && request.pins && (
                                <div className="mt-4 border-t pt-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">PIN Details</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        {request.pins.map((pin, index) => (
                                            <div key={index} className="bg-gray-50 p-2 rounded">
                                                <p className="text-xs text-gray-500">
                                                    {new Date(pin.date).toLocaleDateString()}
                                                </p>
                                                <p className="text-lg font-mono font-bold text-blue-600">
                                                    {pin.pin}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GuestTutorList;
