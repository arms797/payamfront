// ============================================================
// ذخیره اطلاعات کاربر در localStorage
// ============================================================
export const setUserData = (data) => {
  try{    
            //console.log('🔍 setUserData data:', data);  // ← این رو اضافه کن


    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify({
        id:data.id,
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        roles: data.roles,
        currentRoleId: data.currentRoleId,
        currentRoleName: data.currentRoleName,
        markazId: data.markazId,  // ← اضافه کن
        menus: data.menus,
        permissions: data.permissions,
        expiresIn: data.expiresIn
    }));
  } catch (error) {
        console.error('❌ setUserData error:', error);
  }
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