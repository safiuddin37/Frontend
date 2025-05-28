import React from 'react';
import GuestTutorForm from '../components/GuestTutor/GuestTutorForm';
import GuestTutorList from '../components/GuestTutor/GuestTutorList';

const GuestTutorPage = () => {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <GuestTutorForm />
                </div>
                <div>
                    <GuestTutorList />
                </div>
            </div>
        </div>
    );
};

export default GuestTutorPage;
