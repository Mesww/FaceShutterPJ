import { User } from "@/interfaces/users_facescan.interface";
import { useState } from "react";

const RegisModal: React.FC<{ employeeId: string, setIsRegister: React.Dispatch<React.SetStateAction<boolean>>, isRegister: boolean,setUserDetails: React.Dispatch<React.SetStateAction<User>>,userDetails: User,setIsScanning: React.Dispatch<React.SetStateAction<boolean>> }> = ({ employeeId, setIsRegister, isRegister,setUserDetails,userDetails,setIsScanning }) => {
   
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validateInput = (field: keyof User, value: string) => {
        if (value.trim() === '') {
            setErrors(prev => ({
                ...prev,
                [field]: `${field} is required`
            }));
        }else if(field === 'email' && !/\S+@\S+\.\S+/.test(value)){
            setErrors(prev => ({
                ...prev,
                [field]: 'Email is invalid'
            }));
        }else if(field ==='name' && value.length < 3){
            setErrors(prev => ({
                ...prev,
                [field]: 'Name is too short'
            }));
        }else if(field === 'tel' && !/^\d{10}$/.test(value)){
            setErrors(prev => ({
                ...prev,
                [field]: 'Phone number is invalid'
            }));
        }
        else{
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

        // Submit the form
        console.log('Submitting form:', userDetails);
        setIsRegister(false);
        setIsScanning(true);
    }
    const handleModalCancel = () => {
        setErrors({});
        setUserDetails({ employee_id: "", name: "", email: "", password: "",tel: "" });
        setIsRegister(false);

    }
    return (
        <div
            className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-700 ${isRegister ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
        >
            <div
                className={`bg-white w-80 p-6 rounded-lg shadow-md transform transition-transform duration-700 ${isRegister ? "scale-100" : "scale-95"
                    }`}
            >
                <h2 className="text-lg font-semibold mb-4">Modal Form</h2>
                <form onSubmit={handleModalFormSubmit}>
                    <div className="mb-4">
                        <label className="block mb-1">Employee ID:</label>
                        <input
                            type="text"
                            value={employeeId}
                            disabled
                            className="w-full p-2 border rounded border-gray-300"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-1">Name:</label>
                        <input
                            type="text"
                            value={userDetails.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="w-full p-2 border rounded border-gray-300"
                        />
                    </div>
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                    <div className="mb-4">
                        <label className="block mb-1">Email:</label>
                        <input
                            type="email"
                            value={userDetails.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="w-full p-2 border rounded border-gray-300"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block mb-1">Tel:</label>
                        <input
                            type="tel"
                            value={userDetails.tel}
                            onChange={(e) => handleInputChange('tel', e.target.value)}
                            className="w-full p-2 border rounded border-gray-300"
                        />
                    </div>
                    {errors.tel && <p className="text-red-500 text-sm mt-1">{errors.tel}</p>}
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleModalCancel}
                            className="mr-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default RegisModal;