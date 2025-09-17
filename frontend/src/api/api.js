/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://192.168.1.6:3000/api",
// });

// // Automatically attach token if available
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token"); // or sessionStorage

//     console.log(token);

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// export default api;

import { axiosWrapper } from "./axiosWrapper";

// Function to set or remove the authorization token
export const setAuthToken = (token) => {
  if (token) {
    // Apply the token to the Authorization header
    axiosWrapper.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    // Delete the authorization header if no token is provided
    delete axiosWrapper.defaults.headers.common["Authorization"];
  }
};
