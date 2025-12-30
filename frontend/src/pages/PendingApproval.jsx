import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Home, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PendingApproval = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
                    <CheckCircle className="h-10 w-10 text-yellow-600" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Application Pending
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Your restaurant account has been created successfully and is currently pending admin approval.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="rounded-md bg-blue-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3 flex-1 md:flex md:justify-between">
                                <p className="text-sm text-blue-700">
                                    An administrator will review your details soon. Once approved, you will serve to customers.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                            <Home className="w-4 h-4 mr-2" />
                            Return to Home
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PendingApproval;
