import Cookie from 'js-cookie';
import forge from "node-forge";
import axios from "axios";
import { BACKEND_URL } from '@/configs/backend';

export const checkisLogined:boolean = (()=> {
    const token = Cookie.get('token');
    if (token !== undefined) {
        console.log(token);
        return true;
    }
    return false;
})();

export const getLogined = () => {
    const token = Cookie.get('token');
    if (token === undefined) {
        removeLogined();
        return undefined;
    }
    return token;
}

export const setLogined = (token:string) => {
  
    Cookie.set('token', token);
    return true;
}

export const removeLogined = () => {
    Cookie.remove('token');
    return false;
}


export const adminLogin = async (employeeId:string, password:string) =>  {
    try {
        
        // Fetch public key from the backend
        const { data: { public_key } } = await axios.get(BACKEND_URL+"/get_public_key");
        const publicKey = forge.pki.publicKeyFromPem(public_key);

        // Encrypt employeeId and password
        const encryptedEmployeeId = publicKey.encrypt(employeeId, "RSA-OAEP", {
            md: forge.md.sha256.create(),
        });
        const encryptedPassword = publicKey.encrypt(password, "RSA-OAEP", {
            md: forge.md.sha256.create(),
        });

        // Convert to hex for transmission
        const encryptedData = {
            employeeid: forge.util.bytesToHex(encryptedEmployeeId),
            password: forge.util.bytesToHex(encryptedPassword),
        };

        // Send encrypted data to backend
        const response = await axios.post(BACKEND_URL+"/api/auth/login", encryptedData);

        alert(response.data.message);
        if (response.data.token) {
            setLogined(response.data.token);
            return true;
        }
        return false;
    } catch (error) {
        console.error(error);
        alert("Login failed!");
    }
}