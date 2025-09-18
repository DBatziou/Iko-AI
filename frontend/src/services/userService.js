import axios from "axios";

//handling login
async function loginApi(username, password) {
    axios.defaults.withCredentials = true;

    let userPassBase64 = btoa(`${username}:${password}`);//encrypted username:password
    console.log(`Base64: ${userPassBase64}`);


    const res = await axios.get(`http://localhost:8080/login`, {

        headers: { 'Authorization': `Basic ${userPassBase64}` },
        withCredentials: true
    });//handling the get request for the sign in


    return res.data.token;
}

//handling sing up
async function signupApi(username, password, name, email, role) {
    axios.defaults.withCredentials = true;

    let userPassBase64 = btoa(`${username}:${password}`);//encrypted username:password
    console.log(`Base64: ${userPassBase64}`);


    const res = await axios.post(
        `http://localhost:8080/users`, // <-- change endpoint
        {
            username,
            password,
            name,
            email,
            role
        },
        { withCredentials: true } // send credentials/cookies
    );

    // If backend sends a token right away, return it
    if (res.data.token) {
        return res.data.token;
    } else {
        return res.data; // maybe it just says "user created" or similar
    }
}



function jwtPayload(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
}

export default {
    loginApi,
    signupApi,
    jwtPayload
}