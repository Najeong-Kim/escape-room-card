import {
  TextInput,
  NumberInput,
  SelectInput,
  BooleanInput,
  ArrayInput,
  SimpleFormIterator,
} from 'react-admin'

const STATUS_CHOICES = [
  { id: 'active', name: '활성' },
  { id: 'closed', name: '사라짐/종료' },
  { id: 'inactive', name: '비활성' },
  { id: 'rejected', name: '거절' },
]

const IMAGE_STATUS_CHOICES = [
  { id: 'unverified', name: '검수 전' },
  { id: 'verified', name: '검수 완료' },
  { id: 'rejected', name: '사용 안 함' },
  { id: 'manual', name: '수동 등록' },
]

export const RoomFormFields = () => (
  <>
    <TextInput source="name" label="테마명" fullWidth required />
    <SelectInput source="status" label="상태" choices={STATUS_CHOICES} required />
    <BooleanInput source="needs_review" label="검수 필요" />

    <TextInput source="description" label="소개" fullWidth multiline />

    <NumberInput source="duration_minutes" label="제한시간 (분)" min={10} />
    <NumberInput source="min_players" label="최소 인원" min={1} max={20} />
    <NumberInput source="max_players" label="최대 인원" min={1} max={20} />

    <TextInput source="price_text" label="가격 원문" fullWidth />
    <NumberInput source="price_per_person" label="인당 가격 (원)" min={0} step={1000} />

    <TextInput source="difficulty_label" label="난이도 원문" fullWidth />
    <NumberInput source="difficulty_score" label="난이도 (0-10)" min={0} max={10} step={0.1} />

    <TextInput source="fear_label" label="공포도 원문" fullWidth />
    <NumberInput source="fear_score" label="공포도 (0-10)" min={0} max={10} step={0.1} />

    <TextInput source="activity_label" label="활동성 원문" fullWidth />
    <NumberInput source="activity_score" label="활동성 (0-10)" min={0} max={10} step={0.1} />

    <TextInput source="story_label" label="스토리 원문" fullWidth />
    <NumberInput source="story_score" label="스토리 (0-10)" min={0} max={10} step={0.1} />

    <TextInput source="interior_label" label="인테리어 원문" fullWidth />
    <NumberInput source="interior_score" label="인테리어 (0-10)" min={0} max={10} step={0.1} />

    <TextInput source="aging_label" label="노후화 원문" fullWidth />
    <NumberInput source="aging_score" label="노후화 (0-10)" min={0} max={10} step={0.1} />

    <TextInput source="image_url" label="이미지 URL" fullWidth />
    <TextInput source="image_source_url" label="이미지 출처 URL" fullWidth />
    <TextInput source="image_source_name" label="이미지 출처명" fullWidth />
    <SelectInput source="image_status" label="이미지 상태" choices={IMAGE_STATUS_CHOICES} />

    <TextInput source="booking_url" label="예약 URL" fullWidth />
    <TextInput source="source_url" label="출처 URL" fullWidth />

    <ArrayInput source="genre_labels" label="장르 레이블">
      <SimpleFormIterator>
        <TextInput source="" label="장르" />
      </SimpleFormIterator>
    </ArrayInput>
  </>
)
