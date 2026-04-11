import { Admin, Resource } from 'react-admin'
import postgrestDataProvider from 'ra-data-postgrest'
import { RoomList } from './RoomList'
import { RoomEdit } from './RoomEdit'
import { RoomCreate } from './RoomCreate'
import { authProvider } from './authProvider'
import { darkTheme, lightTheme } from './theme'

if (!import.meta.env.VITE_ADMIN_PASSWORD) {
  console.warn('[admin] VITE_ADMIN_PASSWORD not set — anyone can log in')
}

const _apiUrl = new URL(import.meta.env.VITE_API_URL || 'http://localhost:3000')
const dataProvider = postgrestDataProvider({
  host: `${_apiUrl.protocol}//${_apiUrl.hostname}`,
  port: parseInt(_apiUrl.port) || 80,
})

export default function AdminApp() {
  return (
    <Admin dataProvider={dataProvider} authProvider={authProvider} basename="/admin" theme={lightTheme} darkTheme={darkTheme}>
      <Resource name="rooms" list={RoomList} edit={RoomEdit} create={RoomCreate} />
    </Admin>
  )
}
