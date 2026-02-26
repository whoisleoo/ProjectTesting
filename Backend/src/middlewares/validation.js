export const validarEmail = function (email){
    const regex = /^[^\s]+@[^\s]+\.[^\s]+$/;
    return regex.test(email);
}   