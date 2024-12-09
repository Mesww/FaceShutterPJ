import { User } from "@/interfaces/users_facescan.interface";
import { useState, useEffect } from "react";

const RegisModal: React.FC<{ 
    employeeId: string, 
    setIsRegister: React.Dispatch<React.SetStateAction<boolean>>, 
    isRegister: boolean,
    setUserDetails: React.Dispatch<React.SetStateAction<User>>,
    userDetails: User,
    setIsScanning: React.Dispatch<React.SetStateAction<boolean>> 
}> = ({ 
    employeeId, 
    setIsRegister, 
    isRegister,
    setUserDetails,
    userDetails,
    setIsScanning 
}) => {
   
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [countdown, setCountdown] = useState<number | null>(null);

    const validateInput = (field: keyof User, value: string) => {
        if (value.trim() === '') {
            setErrors(prev => ({
                ...prev,
                [field]: `${field} is required`
            }));
        } else if(field === 'email' && !/\S+@\S+\.\S+/.test(value)) {
            setErrors(prev => ({
                ...prev,
                [field]: 'Email is invalid'
            }));
        } else if(field ==='name' && value.length < 3) {
            setErrors(prev => ({
                ...prev,
                [field]: 'Name is too short'
            }));
        } else if(field === 'tel' && !/^\d{10}$/.test(value)) {
            setErrors(prev => ({
                ...prev,
                [field]: 'Phone number is invalid'
            }));
        } else {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    }

    const handleInputChange = (field: keyof User, value: string) => {
        validateInput(field, value);
        setUserDetails(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleModalFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: { [key: string]: string } = {};
        userDetails.employee_id = employeeId;
        
        if (userDetails.name.trim() === '') {
            newErrors.name = 'Name is required';
        }
        if (userDetails.email.trim() === '') {
            newErrors.email = 'Email is required';
        }
        if (userDetails.tel.trim() === '') {
            newErrors.tel = 'Tel is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        // Start countdown before scanning
        setCountdown(3);
    }

    const handleModalCancel = () => {
        setErrors({});
        setUserDetails({ employee_id: "", name: "", email: "", password: "", tel: "" });
        setIsRegister(false);
    }

    // Countdown effect
    useEffect(() => {
        let timer: NodeJS.Timeout;
        
        if (countdown !== null && countdown > 0) {
            timer = setTimeout(() => {
                setCountdown(prev => prev !== null ? prev - 1 : null);
            }, 1000);
        } else if (countdown === 0) {
            // When countdown reaches 0, start scanning
            setIsRegister(false);
            setIsScanning(true);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [countdown, setIsRegister, setIsScanning]);

    return (
        <div
            className={`fixed inset-0 flex items-center justify-center z-50 transition-all duration-500 px-4 ${
                isRegister 
                    ? "opacity-100 pointer-events-auto backdrop-blur-sm bg-black/30" 
                    : "opacity-0 pointer-events-none"
            }`}
        >
            {/* Show countdown overlay if countdown is active */}
            {countdown !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
                    <div className="text-white text-9xl font-bold animate-pulse">
                        {countdown}
                    </div>
                </div>
            )}

            <div
                className={`bg-gradient-to-br from-white to-gray-50 w-full max-w-md mx-auto p-4 sm:p-6 md:p-8 rounded-2xl shadow-xl transform transition-all duration-500 ${
                    isRegister 
                        ? "scale-100 translate-y-0" 
                        : "scale-95 translate-y-4"
                }`}
            >
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    Registration Form
                </h2>
                
                <form onSubmit={handleModalFormSubmit} className="space-y-4 sm:space-y-5">
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Employee ID:</label>
                        <input
                            type="text"
                            value={employeeId}
                            disabled
                            className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-base sm:text-lg"
                        />
                    </div>

                    {/* Rest of the form remains the same as in the original code */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Name:</label>
                        <input
                            type="text"
                            value={userDetails.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300 text-base sm:text-lg"
                            placeholder="Enter your name"
                        />
                        {errors.name && (
                            <p className="text-red-500 text-sm mt-1 animate-fade-in">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Other input fields remain the same */}
                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Email:</label>
                        <input
                            type="email"
                            value={userDetails.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300 text-base sm:text-lg"
                            placeholder="Enter your email"
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-1 animate-fade-in">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">Tel:</label>
                        <input
                            type="tel"
                            value={userDetails.tel}
                            onChange={(e) => handleInputChange('tel', e.target.value)}
                            className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300 text-base sm:text-lg"
                            placeholder="Enter your phone number"
                            inputMode="numeric"
                        />
                        {errors.tel && (
                            <p className="text-red-500 text-sm mt-1 animate-fade-in">
                                {errors.tel}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={handleModalCancel}
                            className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-300 transition-all duration-300 text-base sm:text-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 focus:ring-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105 text-base sm:text-lg"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RegisModal;