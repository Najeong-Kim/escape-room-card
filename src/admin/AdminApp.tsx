import { Admin, Resource } from 'react-admin'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import StorefrontIcon from '@mui/icons-material/Storefront'
import { createSupabaseDataProvider } from './supabaseDataProvider'
import { RoomList } from './RoomList'
import { RoomEdit } from './RoomEdit'
import { RoomCreate } from './RoomCreate'
import { CafeList } from './CafeList'
import { CafeApprovalList } from './CafeApprovalList'
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
      <Resource name="rooms" options={{ label: '방 목록' }} icon={MeetingRoomIcon} list={RoomList} edit={RoomEdit} create={RoomCreate} />
      <Resource name="cafes" options={{ label: '매장 목록' }} icon={StorefrontIcon} list={CafeList} />
      <Resource name="cafe-approvals" options={{ label: '매장 검수' }} icon={HomeWorkIcon} list={CafeApprovalList} />
      <Resource name="theme-approvals" options={{ label: '테마 검수' }} icon={AssignmentTurnedInIcon} list={ThemeApprovalList} />
    </Admin>
  )
}
