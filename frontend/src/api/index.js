/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

import { axiosWrapper } from "./axiosWrapper";

// API Endpoints

// Auth Endpoints
export const loginUser = (data) => axiosWrapper.post("/api/auth/login", data);
export const register = (data) => axiosWrapper.post("/api/auth/register", data);
