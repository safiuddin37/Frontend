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
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Guest Tutor Name
                    </label>
                    <input
                        type="text"
                        {...register("name", { 
                            required: "Name is required",
                            minLength: {
                                value: 2,
                                message: "Name must be at least 2 characters"
                            }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                    </label>
                    <input
                        type="tel"
                        {...register("phone", {
                            required: "Phone number is required",
                            pattern: {
                                value: /^[0-9]{10}$/,
                                message: "Please enter a valid 10-digit phone number"
                            }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Qualification
                    </label>
                    <input
                        type="text"
                        {...register("qualification", {
                            required: "Qualification is required"
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.qualification && (
                        <p className="mt-1 text-sm text-red-600">{errors.qualification.message}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date Range
                    </label>
                    <DatePicker
                        selectsRange={true}
                        startDate={startDate}
                        endDate={endDate}
                        onChange={(update) => setDateRange(update)}
                        minDate={new Date()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholderText="Select date range"
                    />
                    {(!startDate || !endDate) && (
                        <p className="mt-1 text-sm text-red-600">Date range is required</p>
                    )}
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
