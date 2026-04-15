import {
  BooleanInput,
  DateTimeInput,
  SelectInput,
  TextInput,
} from 'react-admin'

const STATUS_CHOICES = [
  { id: 'active', name: '활성' },
  { id: 'closed', name: '폐점' },
  { id: 'unknown', name: '미확인' },
  { id: 'rejected', name: '거절' },
]

export const CafeFormFields = () => (
  <>
    <TextInput source="name" label="매장명" fullWidth required />
    <TextInput source="branch_name" label="지점명" fullWidth />
    <TextInput source="area_label" label="지역" fullWidth required />
    <TextInput source="district" label="구/시" fullWidth required />
    <TextInput source="address" label="주소" fullWidth />
    <TextInput source="phone" label="전화번호" fullWidth />
    <SelectInput source="status" label="상태" choices={STATUS_CHOICES} required />
    <BooleanInput source="needs_review" label="검수 필요" />

    <TextInput source="website_url" label="홈페이지 URL" fullWidth />
    <TextInput source="booking_url" label="예약 URL" fullWidth />
    <TextInput source="source_url" label="출처 URL" fullWidth />

    <TextInput source="naver_place_url" label="네이버 플레이스 URL" fullWidth />
    <TextInput source="naver_place_id" label="네이버 플레이스 ID" fullWidth />
    <TextInput source="naver_place_name" label="네이버 플레이스 매장명" fullWidth />
    <TextInput source="naver_place_address" label="네이버 플레이스 주소" fullWidth />
    <DateTimeInput source="naver_place_checked_at" label="네이버 플레이스 확인일" />
  </>
)
