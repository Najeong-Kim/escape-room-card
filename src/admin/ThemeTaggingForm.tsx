import { NumberInput, ReferenceInput, SelectInput } from 'react-admin'

export const TAGGING_SOURCE_CHOICES = [
  { id: 'manual', name: '수동' },
  { id: 'official', name: '공식' },
  { id: 'community', name: '커뮤니티' },
  { id: 'auto', name: '자동 추정' },
]

export const TAGGING_STATUS_CHOICES = [
  { id: 'active', name: '노출' },
  { id: 'pending', name: '검수 대기' },
  { id: 'hidden', name: '숨김' },
  { id: 'rejected', name: '거절' },
]

export const ThemeTaggingFormFields = () => (
  <>
    <ReferenceInput source="theme_id" reference="themes" label="테마">
      <SelectInput optionText="name" label="테마" required />
    </ReferenceInput>
    <ReferenceInput source="tag_id" reference="theme_tags" label="태그">
      <SelectInput optionText="name" label="태그" required />
    </ReferenceInput>
    <SelectInput source="source_type" label="출처 유형" choices={TAGGING_SOURCE_CHOICES} required />
    <NumberInput source="confidence_score" label="신뢰도 점수" min={0} max={100} />
    <SelectInput source="status" label="상태" choices={TAGGING_STATUS_CHOICES} required />
  </>
)
