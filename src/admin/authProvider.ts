export const authProvider = {
  login: ({ password }: { password: string }) => {
    if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', '1')
      return Promise.resolve()
    }
    return Promise.reject(new Error('Wrong password'))
  },
  logout: () => {
    sessionStorage.removeItem('admin_auth')
    return Promise.resolve()
  },
  checkAuth: () =>
    sessionStorage.getItem('admin_auth') ? Promise.resolve() : Promise.reject(),
  checkError: () => Promise.resolve(),
  getPermissions: () => Promise.resolve(),
}
