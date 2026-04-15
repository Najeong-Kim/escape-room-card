import {
  DateInput,
  NumberInput,
  SelectInput,
  TextInput,
} from 'react-admin'

const SOURCE_CHOICES = [
  { id: 'blog', name: '블로그' },
  { id: 'youtube', name: '유튜브' },
  { id: 'instagram', name: '인스타' },
  { id: 'other', name: '기타' },
]

const STATUS_CHOICES = [
  { id: 'active', name: '노출' },
  { id: 'pending', name: '검수 대기' },
  { id: 'hidden', name: '숨김' },
  { id: 'rejected', name: '거절' },
]

export const ReviewLinkFormFields = () => (
  <>
    <NumberInput source="theme_id" label="테마 ID" min={1} required />
    <SelectInput source="source_type" label="출처 유형" choices={SOURCE_CHOICES} required />
    <TextInput source="title" label="후기 제목" fullWidth required />
    <TextInput source="url" label="후기 URL" fullWidth required />
    <TextInput source="author" label="작성자/채널" fullWidth />
    <DateInput source="published_at" label="게시일" />
    <TextInput source="thumbnail_url" label="썸네일 URL" fullWidth />
    <SelectInput source="status" label="상태" choices={STATUS_CHOICES} required />
    <NumberInput source="confidence_score" label="자동 매칭 점수" min={0} max={100} />
    <TextInput source="collected_by" label="수집 방식" fullWidth />
    <NumberInput source="sort_order" label="정렬 순서" step={1} />
  </>
)
