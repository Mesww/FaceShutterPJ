export interface FaceScanPageProps {
    modelPath?: string;
 
  }

export interface User{
  employee_id: string;
  name: string;
  email: string;
  password: string;
  tel: string;
}
 
export interface Responsedata{
  status: number;
  message: string;
  data:object|boolean|string|null;
}