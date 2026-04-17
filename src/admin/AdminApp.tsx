import { Admin, Resource } from 'react-admin'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import RateReviewIcon from '@mui/icons-material/RateReview'
import ReportProblemIcon from '@mui/icons-material/ReportProblem'
import StorefrontIcon from '@mui/icons-material/Storefront'
import UpdateIcon from '@mui/icons-material/Update'
import { createSupabaseDataProvider } from './supabaseDataProvider'
import { RoomList } from './RoomList'
import { RoomEdit } from './RoomEdit'
import { RoomCreate } from './RoomCreate'
import { CafeList } from './CafeList'
import { CafeEdit } from './CafeEdit'
import { CafeApprovalList } from './CafeApprovalList'
import { ThemeApprovalList } from './ThemeApprovalList'
import { ThemeUpdateSuggestionList } from './ThemeUpdateSuggestionList'
import { ReportEdit, ReportList } from './ReportList'
import { ReviewLinkCreate, ReviewLinkEdit, ReviewLinkList } from './ReviewLinkList'
import { ThemeTagCreate, ThemeTagEdit, ThemeTagList } from './ThemeTagList'
import { ThemeTaggingCreate, ThemeTaggingEdit, ThemeTaggingList } from './ThemeTaggingList'
import { authProvider } from './authProvider'
import { darkTheme, lightTheme } from './theme'
import './admin.css'


const dataProvider = createSupabaseDataProvider()

export default function AdminApp() {
  return (
    <Admin dataProvider={dataProvider} authProvider={authProvider} basename="/admin" theme={lightTheme} darkTheme={darkTheme}>
      <Resource name="themes" options={{ label: '방 목록' }} icon={MeetingRoomIcon} list={RoomList} edit={RoomEdit} create={RoomCreate} />
      <Resource name="cafes" options={{ label: '매장 목록' }} icon={StorefrontIcon} list={CafeList} edit={CafeEdit} />
      <Resource name="theme_tags" options={{ label: '태그 목록' }} icon={LocalOfferIcon} list={ThemeTagList} edit={ThemeTagEdit} create={ThemeTagCreate} />
      <Resource name="theme_taggings" options={{ label: '테마 태그' }} icon={LocalOfferIcon} list={ThemeTaggingList} edit={ThemeTaggingEdit} create={ThemeTaggingCreate} />
      <Resource name="theme_review_links" options={{ label: '후기 링크' }} icon={RateReviewIcon} list={ReviewLinkList} edit={ReviewLinkEdit} create={ReviewLinkCreate} />
      <Resource name="reports" options={{ label: '제보 목록' }} icon={ReportProblemIcon} list={ReportList} edit={ReportEdit} />
      <Resource name="cafe-approvals" options={{ label: '매장 검수' }} icon={HomeWorkIcon} list={CafeApprovalList} />
      <Resource name="theme-approvals" options={{ label: '테마 검수' }} icon={AssignmentTurnedInIcon} list={ThemeApprovalList} />
      <Resource name="theme-update-suggestions" options={{ label: '테마 변경 제안' }} icon={UpdateIcon} list={ThemeUpdateSuggestionList} />
    </Admin>
  )
}
