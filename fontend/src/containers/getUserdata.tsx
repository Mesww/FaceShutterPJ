import { BACKEND_URL } from "@/configs/backend";
import { Responsedata } from "@/interfaces/users_facescan.interface";
import { getLogined } from "./userLogin";

export const getuserdata = async (token: string) => {

    try {
        const response = await fetch(`${BACKEND_URL}/api/users/get_user_by_employee_id`, {
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
        const datas = await response.json(); 
        return  datas.data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        // console.error('Error:', error);
        // alert(error instanceof Error ? error.message : 'Registration failed');
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        // console.error('Error:', error);
        // alert(error instanceof Error ? error.message : 'Registration failed');
    }
}

export const getcheckinorouttime = async (): Promise<Responsedata | undefined> => {
    try {
        const currentTime = new Date();
        const hours = currentTime.getHours().toString().padStart(2, '0');
        const minutes = currentTime.getMinutes().toString().padStart(2, '0');
        const seconds = currentTime.getSeconds().toString().padStart(2, '0');
        const time = `${hours}:${minutes}:${seconds}`;
        const response = await fetch(`${BACKEND_URL}/api/checkinout/is_checkinorout_time_valid/${time}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Checkin or out time failed');
        }
        const data:Responsedata = await response.json();
        return  data;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        // console.error('Error:', error);
        // alert(error instanceof Error ? error.message : 'Checkin or out time failed');
    }
}

export const getisCheckin = async (token: string,checkinorout:string) => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/checkinout/${checkinorout === 'checkin' ? 'is_already_checked_in_today':'is_already_checked_out_today'}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Checkin failed');
        }
        return  await response.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        // console.error('Error:', error);
        // alert(error instanceof Error ? error.message : 'Checkin failed');
    }       
}

export const getisWIFI = async (employee_id: string) => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/snmp/findId/${employee_id}`, {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        // console.error('Error:', error);
        // alert(error instanceof Error ? error.message : 'Registration failed');
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

export const edituserdata = async (employee_id: string, name: string, email: string, phone: string, imageData:File | null, role:string) => {
    try {
        // console.log(employee_id, name, email, phone);
        const formData = new FormData();
        formData.append('employee_id', employee_id);
        formData.append('name', name);
        formData.append('email', email);
        formData.append('tel', phone);
        // console.log(formData.get('employee_id'));
        if (imageData) {
            // console.log('imageData:', imageData);
            formData.append('image', imageData);
        }
        const token = getLogined();
        if (!token) {
            throw new Error('No token found');
        }
        // console.log(role);

        const body = {
            'employee_id': employee_id ?? null,
            'name': name ?? null,
            'email': email ?? null,
            'tel': phone ?? null,
            'roles': role ?? null,
        }
        const response = await fetch(`${BACKEND_URL}/api/users/update_user`, {
        method: 'PUT',
        body: JSON.stringify(body),
        headers:{
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Registration failed');
        }
        return await response.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        // console.error('Error:', error);
        // alert(error instanceof Error ? error.message : 'Registration failed');
    }
}