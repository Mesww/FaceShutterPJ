export interface FaceScanPageProps {
    modelPath?: string;
 
  }

  export interface UserData {
    user: {
      employee_id: string;
      name: string;
      email: string;
      tel: string;
    };
    image: {
      filename: string;
      data: string;
    };
  }