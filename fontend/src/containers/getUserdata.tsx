import { BACKEND_URL } from "@/configs/backend";

export const getuserdata = async (token: string) => {

    try {
        const response = await fetch(`${BACKEND_URL}/api/users/get_user_by_employee_id/${employee_id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Registration failed');
        }
        return  await response.json();
    } catch (error) {
        console.error('Error:', error);
        alert(error instanceof Error ? error.message : 'Registration failed');
    }
}

export const getisuserdata = async (employee_id: string) => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/get_is_user_by_employee_id/${employee_id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Registration failed');
        }
        return  await response.json();
    } catch (error) {
        console.error('Error:', error);
        alert(error instanceof Error ? error.message : 'Registration failed');
    }
}

/**
 * Edits user data.
 * 
 * @param employee_id - The ID of the employee.
 * @param name - The name of the user.
 * @param email - The email of the user.
 * @param phone - The phone number of the user.
 * @returns A Promise that resolves to the edited user data.
 * @throws An error if the request fails or if the registration fails.
 */

export const edituserdata = async (employee_id: string, name: string, email: string, phone: string, imageData:File | null) => {
    try {
        // console.log(employee_id, name, email, phone);
        const formData = new FormData();
        formData.append('employee_id', employee_id);
        formData.append('name', name);
        formData.append('email', email);
        formData.append('tel', phone);
        // console.log(formData.get('employee_id'));
        if (imageData) {
            console.log('imageData:', imageData);
            formData.append('image', imageData);
        }
        const response = await fetch(`${BACKEND_URL}/api/users/update`, {
        method: 'PUT',
        body: formData,
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Registration failed');
        }
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        alert(error instanceof Error ? error.message : 'Registration failed');
    }
}