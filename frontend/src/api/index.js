/*
 * Licensed Software
 * For authorized client use only.
 * Unauthorized modification or redistribution is prohibited.
 * Full license terms available in LICENSE.md
 */

import axios from "axios";
import { axiosWrapper } from "./axiosWrapper";

/** AUTH ENDPOINTS **/
export const loginUser = (data) => axiosWrapper.post("/api/auth/login", data);
export const registerUser = (data) =>
  axiosWrapper.post("/api/auth/register", data);

/** ADMIN ENDPOINTS **/
export const adminFetchAllStudentsDuties = () =>
  axiosWrapper.get(`/api/duties`);
export const adminFetchAllGroups = () => axiosWrapper.get(`api/group`);
export const adminfetchAllStudents = () =>
  axios.get(`api/admin/fetchAllStudents`);

/** ADMIN/USER ENDPOINTS **/
export const changePassword = (data, id) =>
  axiosWrapper.put(`/api/auth/update/${id}/password`, data);

/** STUDENT ENDPOINTS **/
export const fetchUserDuties = (id) =>
  axiosWrapper.get(`/api/duties/user/${user._id}`);
export const fetchUserAttendance = (schoolId) =>
  axiosWrapper.get(`/api/attendance/${schoolId}`);
