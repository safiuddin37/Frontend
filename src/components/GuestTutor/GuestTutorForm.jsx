import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const GuestTutorForm = () => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm();
    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;

    const onSubmit = async (data) => {
        try {
            const requestData = {
                ...data,
                dateRange: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                }
            };

            const response = await fetch('/api/guest/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();

            if (response.ok) {
                toast.success('Guest tutor request submitted successfully');
                reset();
                setDateRange([null, null]);
            } else {
                toast.error(result.error || 'Failed to submit request');
            }
        } catch (error) {
            toast.error('Failed to submit request');
            console.error('Error:', error);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Request Guest Tutor</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                            type="text"
                            id="name"
                            {...register('name', { required: true })}
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                        {errors.name && <span className="text-red-600">Name is required</span>}
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                        <input
                            type="text"
                            id="phone"
                            {...register('phone', { required: true })}
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                        {errors.phone && <span className="text-red-600">Phone number is required</span>}
                    </div>
                    <div>
                        <label htmlFor="qualification" className="block text-sm font-medium text-gray-700">Qualification</label>
                        <input
                            type="text"
                            id="qualification"
                            {...register('qualification', { required: true })}
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                        {errors.qualification && <span className="text-red-600">Qualification is required</span>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Absence Duration</label>
                        <DatePicker
                            selectsRange={true}
                            startDate={startDate}
                            endDate={endDate}
                            onChange={(update) => setDateRange(update)}
                            isClearable={true}
                            className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={!startDate || !endDate}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Submit Request
                </button>
            </form>
        </div>
    );
};

export default GuestTutorForm;
