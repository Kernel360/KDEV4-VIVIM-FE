// export const API_BASE_URL = 'https://localhost/api';
export const API_BASE_URL = 'https://dev.vivim.co.kr/api';
 
export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/auth/login`,
  USER_INFO: `${API_BASE_URL}/auth/user`,

  // Users
  USERS: `${API_BASE_URL}/users`,
  USER_DETAIL: (id) => `${API_BASE_URL}/users/${id}`,
  USER_PASSWORD_MODIFY: (userId, password) => `${API_BASE_URL}/users/modifypassword/${userId}?password=${password}`,
  USERS_SEARCH: `${API_BASE_URL}/users/search`,

  // Companies
  COMPANIES: `${API_BASE_URL}/companies`,
  COMPANY_DETAIL: (id) => `${API_BASE_URL}/companies/${id}`,
  COMPANY_EMPLOYEES: (companyId) => `${API_BASE_URL}/companies/${companyId}/employees`,
  COMPANIES_SEARCH: `${API_BASE_URL}/companies/search`,

  // Projects
  PROJECTS: `${API_BASE_URL}/projects`,
  PROJECT_DETAIL: (id) => `${API_BASE_URL}/projects/${id}`,
  ADMIN_PROJECTS: `${API_BASE_URL}/projects/all`,
  USER_PROJECTS: (userId) => `${API_BASE_URL}/projects?userId=${userId}`,
  PROJECT_POSTS: (projectId) => `${API_BASE_URL}/projects/${projectId}/posts`,
  PROJECT_POST_LINK: (projectId, postId) => `${API_BASE_URL}/projects/${projectId}/posts/${postId}/link`,
  PROJECT_POST_FILE: (projectId, postId) => `${API_BASE_URL}/projects/${projectId}/posts/${postId}/file/stream`,
  PROJECT_PROGRESS_POSITION: (projectId, progressId) => `${API_BASE_URL}/projects/${projectId}/progress/${progressId}/positioning`,
  PROJECTS_SEARCH: `${API_BASE_URL}/projects/search`,

  RESET_PASSWORD: `${API_BASE_URL}/users/resetpassword`,
  AUDIT_LOGS: `${API_BASE_URL}/auditLog`,
  AUDIT_LOGS_SEARCH: `${API_BASE_URL}/auditLog/search`,
  AUTH_LOGOUT: `${API_BASE_URL}/auth/logout`,

  APPROVAL: {
    LIST: (progressId) => `${API_BASE_URL}/progress/${progressId}/approval`,
    RECENT: `${API_BASE_URL}/proposals/recent`,
    DETAIL: (approvalId) => `${API_BASE_URL}/approval/${approvalId}`,
    CREATE: (progressId) => `${API_BASE_URL}/approval/${progressId}`,
    MODIFY: (approvalId) => `${API_BASE_URL}/approval/${approvalId}`,
    DELETE: (approvalId) => `${API_BASE_URL}/approval/${approvalId}`,
    SEND: (approvalId) => `${API_BASE_URL}/approval/${approvalId}/send`,
    APPROVERS: (approvalId) => `${API_BASE_URL}/approval/${approvalId}/approvers`,
    CREATE_APPROVER: (approvalId) => `${API_BASE_URL}/approval/${approvalId}/approvers`,
    FILES: (approvalId) => `${API_BASE_URL}/approval/${approvalId}/files`,
    FILE_PRESIGNED: (approvalId) => `${API_BASE_URL}/approval/${approvalId}/files/presigned`,
    FILE_UPLOAD: (approvalId) => `${API_BASE_URL}/approval/${approvalId}/files/upload`,
    FILE_DOWNLOAD: (fileId) => `${API_BASE_URL}/files/${fileId}/download`,
    LINKS: (approvalId) => `${API_BASE_URL}/approval/${approvalId}/link`,
    GET_LINKS: (approvalId) => `${API_BASE_URL}/approval/${approvalId}/link`,
    STATUS_SUMMARY: (approvalId) => `${API_BASE_URL}/approval/${approvalId}/status/summary`,
  },
  DECISION: {
    CREATE: (approvalId) => `${API_BASE_URL}/approver/${approvalId}/decision`,
    CREATE_WITH_APPROVER: (approverId) => `${API_BASE_URL}/approver/${approverId}/decision`,
    MODIFY: (decisionId) => `${API_BASE_URL}/decision/${decisionId}`,
    DELETE: (decisionId) => `${API_BASE_URL}/decision/${decisionId}`,
    DETAIL: (approvalId) => `${API_BASE_URL}/approval/${approvalId}/approver/decision`,
    LIST: (approvalId) => `${API_BASE_URL}/approval/${approvalId}/decision`,
    ALL: () => `${API_BASE_URL}/approval/approver/decision`,
    SEND: (decisionId) => `${API_BASE_URL}/decision/${decisionId}/send`,
    FILE_PRESIGNED: (decisionId) => `${API_BASE_URL}/decisions/${decisionId}/file/presigned`,
    FILES: (decisionId) => `${API_BASE_URL}/decisions/${decisionId}/files`,
    FILE_DOWNLOAD: (fileId) => `${API_BASE_URL}/files/${fileId}/download`,
    GET_LINKS: (decisionId) => `${API_BASE_URL}/decisions/${decisionId}/links`,
    LINKS: (decisionId) => `${API_BASE_URL}/decisions/${decisionId}/links`,
    DELETE_LINK: (linkId) => `${API_BASE_URL}/links/${linkId}`
  },
  PROJECT_COMPANIES: (projectId) => `${API_BASE_URL}/projects/${projectId}/companies`,

  // Admin Inquiry
  ADMIN_INQUIRY_LIST: `${API_BASE_URL}/admininquiry`,
  USER_INQUIRY_LIST: `${API_BASE_URL}/user/admininquiry`,
  ADMIN_INQUIRY_DETAIL: (id) => `${API_BASE_URL}/admininquiry/${id}`,
  ADMIN_INQUIRY_EDIT: (id) => `${API_BASE_URL}/admininquiry/${id}`,
  ADMIN_INQUIRY_CREATE: `${API_BASE_URL}/admininquiry`,

  NOTIFICATIONS: {
    LIST: `${API_BASE_URL}/notifications`,
    SUBSCRIBE: `${API_BASE_URL}/notifications/subscribe`,
    READ: `${API_BASE_URL}/notifications/read`,
  },

  // Posts
  POST: {
    LIST: (projectId) => `${API_BASE_URL}/projects/${projectId}/posts`,
    RECENT: `${API_BASE_URL}/posts/admin/recent`,
    DETAIL: (id) => `${API_BASE_URL}/posts/${id}`,
    CREATE: `${API_BASE_URL}/posts`,
    MODIFY: (id) => `${API_BASE_URL}/posts/${id}`,
    DELETE: (id) => `${API_BASE_URL}/posts/${id}`,
  },
};