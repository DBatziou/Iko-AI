import axios from "axios";
async function loginApi(username, password) {
    axios.defaults.withCredentials = true; // ✅ Important




        let userPassBase64 = btoa(`${username}:${password}`);
        console.log(`Base64: ${userPassBase64}`);


        const res = await axios.get(`http://localhost:8080/login`, {

            headers: { 'Authorization': `Basic ${userPassBase64}` },
            withCredentials: true
});


        return res.data.token;
    }



    function jwtPayload(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    }

    export default {
        loginApi,
        jwtPayload
    }
