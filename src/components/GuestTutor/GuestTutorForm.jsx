import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FiUser, FiPhone, FiAward, FiCalendar, FiSend, FiLoader, FiUserPlus } from 'react-icons/fi';
import { motion } from 'framer-motion';

const GuestTutorForm = () => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm();
    const [dateRange, setDateRange] = useState([null, null]);
    const [loading, setLoading] = useState(false);
    const [startDate, endDate] = dateRange;

    const onSubmit = async (data) => {
        setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-medium p-8"
        >
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                    <FiUserPlus size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Request a Substitute</h2>
                <p className="text-gray-500 mt-1">Fill out the form to request a guest tutor for your absence.</p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <FiUser className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            id="name"
                            {...register('name', { required: 'Full name is required' })}
                            className="block w-full rounded-lg border-gray-300 pl-10 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="e.g., John Doe"
                        />
                    </div>
                    {errors.name && <span className="text-red-600 text-xs mt-1">{errors.name.message}</span>}
                </div>

                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <FiPhone className="text-gray-400" />
                        </div>
                        <input
                            type="tel"
                            id="phone"
                            {...register('phone', { 
                                required: 'Phone number is required',
                                pattern: { value: /^\d{10}$/, message: 'Enter a valid 10-digit phone number' }
                            })}
                            className="block w-full rounded-lg border-gray-300 pl-10 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="e.g., 9876543210"
                        />
                    </div>
                    {errors.phone && <span className="text-red-600 text-xs mt-1">{errors.phone.message}</span>}
                </div>

                <div>
                    <label htmlFor="qualification" className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <FiAward className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            id="qualification"
                            {...register('qualification', { required: 'Qualification is required' })}
                            className="block w-full rounded-lg border-gray-300 pl-10 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="e.g., B.Sc. in Physics"
                        />
                    </div>
                    {errors.qualification && <span className="text-red-600 text-xs mt-1">{errors.qualification.message}</span>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Absence Duration</label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <FiCalendar className="text-gray-400" />
                        </div>
                        <DatePicker
                            selectsRange={true}
                            startDate={startDate}
                            endDate={endDate}
                            onChange={(update) => setDateRange(update)}
                            isClearable={true}
                            placeholderText="Select start and end date"
                            className="block w-full rounded-lg border-gray-300 pl-10 py-2.5 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            wrapperClassName="w-full"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={!startDate || !endDate || loading}
                    className="w-full flex justify-center items-center gap-2 bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <FiLoader className="animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <FiSend />
                            Submit Request
                        </>
                    )}
                </button>
            </form>
        </motion.div>
    );
};

export default GuestTutorForm;
