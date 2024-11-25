import Cookie from 'js-cookie';
export const isLogined:boolean = (()=> {
    const token = Cookie.get('token');
    if (token) {
        return true;
    }
    return false;
})();


export const setLogined = (token:string) => {
    Cookie.set('token', token);
    return true;
}