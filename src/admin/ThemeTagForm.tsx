import { BooleanInput, NumberInput, SelectInput, TextInput } from 'react-admin'

export const TAG_CATEGORY_CHOICES = [
  { id: 'award', name: '수상/랭킹' },
  { id: 'community', name: '커뮤니티' },
  { id: 'feature', name: '테마 특성' },
  { id: 'operation', name: '운영/예약' },
  { id: 'audience', name: '추천 대상' },
  { id: 'warning', name: '주의/제약' },
]

export const ThemeTagFormFields = () => (
  <>
    <TextInput source="code" label="코드" fullWidth required />
    <TextInput source="name" label="태그명" fullWidth required />
    <SelectInput source="category" label="카테고리" choices={TAG_CATEGORY_CHOICES} required />
    <TextInput source="description" label="설명" fullWidth multiline />
    <NumberInput source="sort_order" label="정렬 순서" step={1} />
    <BooleanInput source="is_active" label="사용" />
  </>
)
