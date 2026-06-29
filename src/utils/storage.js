// ============================================================
// ذخیره اطلاعات کاربر در localStorage
// ============================================================
export const setUserData = (data) => {
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('user', JSON.stringify({
    username: data.username,
    email: data.email,
    roles: data.roles,
    currentRoleId: data.currentRoleId,
    currentRoleName: data.currentRoleName,
    menus: data.menus,
    expiresIn: data.expiresIn
  }));
};

// ============================================================
// دریافت AccessToken
// ============================================================
export const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

// ============================================================
// دریافت RefreshToken
// ============================================================
export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

// ============================================================
// دریافت اطلاعات کاربر
// ============================================================
export const getUserData = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// ============================================================
// حذف اطلاعات کاربر (خروج)
// ============================================================
export const clearUserData = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

// ============================================================
// بررسی اینکه آیا کاربر لاگین کرده است
// ============================================================
export const isAuthenticated = () => {
  return !!getAccessToken();
};