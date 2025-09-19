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
export const searchStudent = (query) =>
  axiosWrapper.get(`/api/auth/members/user?search=${query}`);
export const adminFetchAllStudentsDuties = () =>
  axiosWrapper.get(`/api/admin/duty/fetchAllDuties`);
export const adminFetchAllGroups = () =>
  axiosWrapper.get(`api/admin/group/fetchAllgroups`);
export const searchGroup = (query) =>
  axiosWrapper.get(`api/admin/group/?search=${query}`);
export const createGroup = (data) =>
  axiosWrapper.put(`api/admin/group/create`, data);
export const updateGroupName = (id, data) =>
  axiosWrapper.put(`api/admin/group/update/${id}`, data);
export const addMembersToGroup = (id, data) =>
  axiosWrapper.post(`api/admin/group/addMembers/${id}`, data);
export const removeMemberToGroup = (groupId, userId) =>
  axiosWrapper.delete(`api/admin/group/${groupId}/members/${userId}`);
export const deleteGroup = (id) =>
  axiosWrapper.delete(`api/admin/group/delete/${id}`);
export const adminfetchAllStudents = () =>
  axiosWrapper.get(`api/admin/students/fetchAllStudents`);
export const updateStudentInformation = (id, data) =>
  axiosWrapper.put(`api/admin/students/update/${id}`, data);
export const deleteStudent = (id) =>
  axiosWrapper.delete(`api/admin/students/delete/${id}`);
export const markAttendance = (id) =>
  axiosWrapper.get(`api/admin/attendance/mark/${id}`);
export const passwordReset = (id) =>
  axiosWrapper.put(`api/auth/update/${id}/resetpassword`);
export const fetchStudent = (id) =>
  axiosWrapper.get(`api/admin/students/fetchStudent/${id}`);

/** ADMIN/USER ENDPOINTS **/
export const changePassword = (data, id) =>
  axiosWrapper.put(`/api/auth/update/${id}/password`, data);
export const updateProfileImage = (id, data) =>
  axiosWrapper.put(`/api/auth/update/${id}/profile-image`, data);

/** DUTY ENDPOIONTS **/
export const createDuty = (dutyPayload) =>
  axiosWrapper.post(`api/admin/duty/create`, dutyPayload);
export const updateDuty = (id, dutyPayload) =>
  axiosWrapper.put(`api/admin/duty/update/${id}`, dutyPayload);
export const deleteDuty = (id) =>
  axiosWrapper.delete(`api/admin/duty/delete/${id}`);

/** STUDENT ENDPOINTS **/
export const fetchUserDuties = (id) =>
  axiosWrapper.get(`/api/student/duties/fetchDuties/${id}`);
export const fetchUserAttendance = (schoolId) =>
  axiosWrapper.get(`/api/student/attendance/fetchAttendance/${schoolId}`);
export const updateUserInformation = (id, data) =>
  axiosWrapper.put(`/api/student/update/${id}/information`, data);
