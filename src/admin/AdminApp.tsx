import { Admin, Resource } from 'react-admin'
import { createSupabaseDataProvider } from './supabaseDataProvider'
import { RoomList } from './RoomList'
import { RoomEdit } from './RoomEdit'
import { RoomCreate } from './RoomCreate'
import { ThemeApprovalList } from './ThemeApprovalList'
import { authProvider } from './authProvider'
import { darkTheme, lightTheme } from './theme'

if (!import.meta.env.VITE_ADMIN_PASSWORD) {
  console.warn('[admin] VITE_ADMIN_PASSWORD not set — anyone can log in')
}

const dataProvider = createSupabaseDataProvider()

export default function AdminApp() {
  return (
    <Admin dataProvider={dataProvider} authProvider={authProvider} basename="/admin" theme={lightTheme} darkTheme={darkTheme}>
      <Resource name="rooms" list={RoomList} edit={RoomEdit} create={RoomCreate} />
      <Resource name="theme-approvals" options={{ label: '등록 승인' }} list={ThemeApprovalList} />
    </Admin>
  )
}
