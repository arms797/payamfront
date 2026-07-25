// ============================================================
// ذخیره اطلاعات کاربر در localStorage
// ============================================================
export const setUserData = (data) => {
    /*console.log('💾 setUserData called with:', {
        accessToken: data.accessToken?.substring(0, 30) + '...',
        refreshToken: data.refreshToken?.substring(0, 30) + '...',
        username: data.username
    });*/
    
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify({
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        roles: data.roles,
        currentRoleId: data.currentRoleId,
        currentRoleName: data.currentRoleName,
        menus: data.menus,
        permissions: data.permissions,
        expiresIn: data.expiresIn
    }));
    
    // ============================================================
    // 🔥 دیباگ: بررسی اینکه آیا ذخیره شده است
    // ============================================================
    //console.log('✅ localStorage accessToken after set:', localStorage.getItem('accessToken')?.substring(0, 30) + '...');
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