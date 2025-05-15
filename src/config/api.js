// export const API_BASE_URL = 'https://localhost/api';
export const API_BASE_URL = 'https://dev.vivim.co.kr/api';
 
export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/auth/login`,
  USER_INFO: `${API_BASE_URL}/auth/user`,
  
  //File,Link
  POST_FILE_UPLOAD: (Id) =>`${API_BASE_URL}/posts/${Id}/file/multipart`,
  APPROVAL_FILE_UPLOAD: (Id) =>`${API_BASE_URL}/approvals/${Id}/file/multipart`,
  DECISION_FILE_UPLOAD: (Id) =>`${API_BASE_URL}/decisions/${Id}/file/multipart`,
  FILE_COMPLETE: () => `${API_BASE_URL}/upload/complete`,
  POST_FILE_UPLOAD: (Id) =>`${API_BASE_URL}/posts/${Id}/file/multipart`,
  FILE_DELETE: (fileId) => `${API_BASE_URL}/files/${fileId}`,
  LINK_DELETE: (linkId) => `${API_BASE_URL}/links/${linkId}`,
 
  // Users
  USERS: `${API_BASE_URL}/users`,
  USER_DETAIL: (id) => `${API_BASE_URL}/users/${id}`,
  USER_PASSWORD_MODIFY: (userId, password) => `${API_BASE_URL}/users/modifypassword/${userId}?password=${password}`,
  USERS_SEARCH: `${API_BASE_URL}/users/search`,
  USER_SOFT_DELETE: (id) => `${API_BASE_URL}/users/soft/${id}`,

  // Companies
  COMPANIES: `${API_BASE_URL}/companies`,
  COMPANY_DETAIL: (id) => `${API_BASE_URL}/companies/${id}`,
  COMPANY_SOFT_DELETE: (id) => `${API_BASE_URL}/companies/soft/${id}`,
  COMPANY_EMPLOYEES: (companyId) => `${API_BASE_URL}/companies/${companyId}/employees`,
  COMPANIES_SEARCH: `${API_BASE_URL}/companies/search`,

  // Projects
  PROJECTS: `${API_BASE_URL}/projects`,
  PROJECT_DETAIL: (id) => `${API_BASE_URL}/projects/${id}`,
  ADMIN_PROJECTS: `${API_BASE_URL}/projects/all`,
  USER_PROJECTS: (userId) => `${API_BASE_URL}/projects?userId=${userId}`,
  PROJECT_POSTS: (projectId) => `${API_BASE_URL}/projects/${projectId}/posts`,
  PROJECT_POST_LINK: (projectId, postId) => `${API_BASE_URL}/posts/${postId}/link`,
  PROJECT_POST_FILE_MULTIPART: (postId) => `${API_BASE_URL}/posts/${postId}/file/multipart`,
  PROJECT_PROGRESS_POSITION: (projectId, progressId) => `${API_BASE_URL}/projects/${projectId}/progress/${progressId}/positioning`,
  PROJECT_PROGRESS_INCREASE: (projectId) => `${API_BASE_URL}/projects/${projectId}/progress/increase_current_progress`,
  PROJECTS_SEARCH: `${API_BASE_URL}/projects/search`,

  RESET_PASSWORD: `${API_BASE_URL}/users/resetpassword`,
  AUDIT_LOGS: `${API_BASE_URL}/auditLog`,
  AUDIT_LOGS_SEARCH: `${API_BASE_URL}/auditLog/search`,
  AUTH_LOGOUT: `${API_BASE_URL}/auth/logout`,

  APPROVAL: {
    LIST: (progressId) => `${API_BASE_URL}/progress/${progressId}/approval`,
    RECENT: `${API_BASE_URL}/approval/recent`,
    DETAIL: (approvalId) => `${API_BASE_URL}/approval/${approvalId}`,
    CREATE: (progressId) => `${API_BASE_URL}/progress/${progressId}/approval`,
    MODIFY: (approvalId) => `${API_BASE_URL}/approval/${approvalId}`,
    DELETE: (approvalId) => `${API_BASE_URL}/approval/${approvalId}`,
    SEND: (approvalId) => `${API_BASE_URL}/approval/${approvalId}/send`,
    APPROVERS: (proposalId) => `${API_BASE_URL}/approval/${proposalId}/approvers`,
    CREATE_APPROVER: (proposalId) => `${API_BASE_URL}/approval/${proposalId}/approvers`,
    UPDATE_APPROVERS: (proposalId) => `${API_BASE_URL}/approval/${proposalId}/approvers`,
    FILES: (approvalId) => `${API_BASE_URL}/approvals/${approvalId}/files`,
    FILE_DOWNLOAD: (fileId) => `${API_BASE_URL}/files/${fileId}/download`,
    LINKS: (approvalId) => `${API_BASE_URL}/approvals/${approvalId}/links`,
    DELETE_LINK: (linkId) => `${API_BASE_URL}/links/${linkId}`,
    GET_LINKS: (approvalId) => `${API_BASE_URL}/approvals/${approvalId}/links`,
    STATUS_SUMMARY: (approvalId) => `${API_BASE_URL}/approvals/${approvalId}/status/summary`,
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
    FILES: (decisionId) => `${API_BASE_URL}/decisions/${decisionId}/files`,
    FILE_DOWNLOAD: (fileId) => `${API_BASE_URL}/files/${fileId}/download`,
    GET_LINKS: (decisionId) => `${API_BASE_URL}/decisions/${decisionId}/links`,
    LINKS: (decisionId) => `${API_BASE_URL}/decisions/${decisionId}/links`,
    DELETE_LINK: (linkId) => `${API_BASE_URL}/links/${linkId}`,
  },
  PROJECT_COMPANIES: (projectId) => `${API_BASE_URL}/projects/${projectId}/companies`,

  // Admin Inquiry
  ADMIN_INQUIRY_LIST: `${API_BASE_URL}/admininquiry`,
  ADMIN_INQUIRY_SEARCH: `${API_BASE_URL}/admininquiry/search`,
  USER_INQUIRY_LIST: `${API_BASE_URL}/user/admininquiry`,
  ADMIN_INQUIRY_DETAIL: (id) => `${API_BASE_URL}/admininquiry/${id}`,
  ADMIN_INQUIRY_EDIT: (id) => `${API_BASE_URL}/admininquiry/${id}`,
  ADMIN_INQUIRY_CREATE: `${API_BASE_URL}/admininquiry`,
  ADMIN_INQUIRY_DELETE: (id) => `${API_BASE_URL}/admininquiry/${id}/delete`,
  ADMIN_INQUIRY_COMMENT_DELETE: (inquiryId, commentId) => `${API_BASE_URL}/admininquiry/${inquiryId}/comment/${commentId}/delete`,

  // Posts
  POST: {
    LIST: (projectId) => `${API_BASE_URL}/projects/${projectId}/posts`,
    RECENT: `${API_BASE_URL}/posts/user/recent`,
    ADMIN_RECENT: `${API_BASE_URL}/posts/admin/recent`,
    DETAIL: (id) => `${API_BASE_URL}/posts/${id}`,
    CREATE: `${API_BASE_URL}/posts`,
    MODIFY: (id) => `${API_BASE_URL}/posts/${id}`,
    DELETE: (id) => `${API_BASE_URL}/posts/${id}`,
  },

  NOTIFICATIONS: {
    LIST: `${API_BASE_URL}/notifications`,
    SUBSCRIBE: `${API_BASE_URL}/notifications/subscribe`,
    READ: (id) => `${API_BASE_URL}/notifications/${id}/read`,
    READ_ALL: `${API_BASE_URL}/notifications/read-all`,
    UNREAD_COUNT: `${API_BASE_URL}/notifications/unread/count`
  },

  REQUEST_RESET: `${API_BASE_URL}/users/request-reset`,
  CONFIRM_RESET: `${API_BASE_URL}/users/confirm-reset`,
};