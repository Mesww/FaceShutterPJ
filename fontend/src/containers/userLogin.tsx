import Cookie from 'js-cookie';
export const checkisLogined:boolean = (()=> {
    const token = Cookie.get('token');
    if (token !== undefined) {
        console.log(token);
        return true;
    }
    return false;
})();


export const setLogined = (token:string) => {
    Cookie.set('token', token);
    return true;
}