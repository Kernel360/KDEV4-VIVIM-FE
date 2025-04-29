// export const API_BASE_URL = 'https://dev.vivim.co.kr/api';
export const API_BASE_URL = 'https://localhost/api';
 
export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/auth/login`,
  
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

  PROJECTS_SEARCH: `${API_BASE_URL}/projects/search`,

  RESET_PASSWORD: `${API_BASE_URL}/users/resetpassword`,
  AUDIT_LOGS: `${API_BASE_URL}/auditLog`,
  AUDIT_LOGS_SEARCH: `${API_BASE_URL}/auditLog/search`,
  AUTH_LOGOUT: `${API_BASE_URL}/auth/logout`,

  APPROVAL: {
    LIST: (progressId) => `${API_BASE_URL}/progress/${progressId}/approval`,
    DETAIL: (id) => `${API_BASE_URL}/approval/${id}`,
    CREATE: (progressId) => `${API_BASE_URL}/progress/${progressId}/approval`,
    MODIFY: (id) => `${API_BASE_URL}/approval/${id}`,
    DELETE: (id) => `${API_BASE_URL}/approval/${id}`,
    APPROVERS: (proposalId) => `${API_BASE_URL}/approval/${proposalId}/approvers`,
    CREATE_APPROVER: (proposalId) => `${API_BASE_URL}/approval/${proposalId}/approvers`,
    MODIFY_APPROVERS: (proposalId) => `${API_BASE_URL}/approval/${proposalId}/approvers`,
    UPDATE_APPROVERS: (proposalId) => `${API_BASE_URL}/approval/${proposalId}/approvers`,
    DELETE_APPROVERS: (proposalId) => `${API_BASE_URL}/approval/${proposalId}/approvers`,
    DECISIONS: (id) => `${API_BASE_URL}/approval/${id}/decisions`,
    CREATE_DECISION: (proposalId) => `${API_BASE_URL}/approval/${proposalId}/decisions`,
    MODIFY_DECISION: (proposalId, decisionId) => `${API_BASE_URL}/approval/${proposalId}/decisions/${decisionId}`,
    DELETE_DECISION: (proposalId, decisionId) => `${API_BASE_URL}/approval/${proposalId}/decisions/${decisionId}`,
    RESEND: (approvalId) => `${API_BASE_URL}/approval/${approvalId}/resend`,
    SEND: (approvalId) => `${API_BASE_URL}/approval/${approvalId}/send`,
    STATUS_SUMMARY: (proposalId) => `${API_BASE_URL}/approval/${proposalId}/status`,
    RECENT: `${API_BASE_URL}/proposals/recent`,
  },
  DECISION: {
    CREATE_WITH_APPROVER: (approverId) => `${API_BASE_URL}/approver/${approverId}/decision`,
    MODIFY: (decisionId) => `${API_BASE_URL}/decision/${decisionId}`,
    DELETE: (decisionId) => `${API_BASE_URL}/decision/${decisionId}`,
    DETAIL: (approvalId) => `${API_BASE_URL}/approval/${approvalId}/approver/decision`,
    LIST: (approvalId) => `${API_BASE_URL}/approval/${approvalId}/decision`,
    ALL: () => `${API_BASE_URL}/approval/approver/decision`,
    SEND: (decisionId) => `${API_BASE_URL}/decision/${decisionId}/send`
  },
};