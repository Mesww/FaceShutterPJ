import Cookie from 'js-cookie';
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