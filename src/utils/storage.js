const STORAGE_KEYS = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  user: 'user',
};

export const setUserData = (data) => {
  if (!data || typeof data !== 'object') return false;
  if (!data.accessToken || !data.refreshToken) return false;

  try {
    localStorage.setItem(STORAGE_KEYS.accessToken, data.accessToken);
    localStorage.setItem(STORAGE_KEYS.refreshToken, data.refreshToken);

    const user = {
      id: data.id,
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      roles: data.roles ?? [],
      currentRoleId: data.currentRoleId ?? null,
      currentRoleName: data.currentRoleName ?? null,
      markazId: data.markazId ?? null,
      menus: data.menus ?? [],
      permissions: data.permissions ?? [],
      noeHamkari: data.noeHamkari ?? 0,
      expiresIn: data.expiresIn ?? null,
    };

    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    return true;
  } catch (error) {
    console.error('setUserData error:', error);
    return false;
  }
};
/*export const setUserData = (data) => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  try {
    localStorage.setItem(
      STORAGE_KEYS.accessToken,
      data.accessToken ?? ''
    );

    localStorage.setItem(
      STORAGE_KEYS.refreshToken,
      data.refreshToken ?? ''
    );

    const user = {
      id: data.id,
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      roles: data.roles,
      currentRoleId: data.currentRoleId,
      currentRoleName: data.currentRoleName,
      markazId: data.markazId,
      menus: data.menus,
      permissions: data.permissions,
      noeHamkari: data.noeHamkari ?? 0,
      expiresIn: data.expiresIn,
    };

    localStorage.setItem(
      STORAGE_KEYS.user,
      JSON.stringify(user)
    );

    return true;
  } catch (error) {
    console.error('setUserData error:', error);
    return false;
  }
};*/

export const getAccessToken = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.accessToken);
  } catch (error) {
    console.error('getAccessToken error:', error);
    return null;
  }
};

export const getRefreshToken = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.refreshToken);
  } catch (error) {
    console.error('getRefreshToken error:', error);
    return null;
  }
};

export const getUserData = () => {
  try {
    const user = localStorage.getItem(STORAGE_KEYS.user);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('getUserData error:', error);
    return null;
  }
};

export const clearUserData = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.user);

    return true;
  } catch (error) {
    console.error('clearUserData error:', error);
    return false;
  }
};
export const isAuthenticated = () => {
  const token = getAccessToken();
  return Boolean(token && token.length > 20); // جلوگیری از رشته خالی/خراب
};
/*export const isAuthenticated = () => {
  return Boolean(getAccessToken());
};*/

/*
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
        noeHamkari:data.noeHamkari ?? 0,
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
*/