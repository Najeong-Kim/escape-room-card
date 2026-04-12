import {
  TextInput,
  NumberInput,
  SelectInput,
  ArrayInput,
  SimpleFormIterator,
} from 'react-admin'

const LOCATION_CHOICES = [
  '홍대', '강남', '건대', '신촌', '성수', '잠실', '신림', '노원', '용산', '대학로',
].map(v => ({ id: v, name: v }))

export const GENRE_LABEL: Record<string, string> = {
  Horror: '공포',
  MysteryThriller: '미스터리/스릴러',
  Emotional: '감성',
  Comic: '코믹',
  FantasyAdventure: '판타지/어드벤처',
}

const GENRE_CHOICES = Object.entries(GENRE_LABEL).map(([id, name]) => ({ id, name }))

export const RoomFormFields = () => (
  <>
    <TextInput source="name" label="방 이름" fullWidth required />
    <TextInput source="brand" label="브랜드" fullWidth required />
    <SelectInput source="location" label="지역" choices={LOCATION_CHOICES} required />

    <ArrayInput source="genres" label="장르">
      <SimpleFormIterator>
        <SelectInput source="" label="장르" choices={GENRE_CHOICES} />
      </SimpleFormIterator>
    </ArrayInput>

    <NumberInput source="fear_level" label="공포도 (1-5)" min={1} max={5} step={1} />
    <NumberInput source="puzzle_weight" label="퍼즐 비중 (1-5)" min={1} max={5} step={1} />
    <NumberInput source="difficulty" label="난이도 (1-5)" min={1} max={5} step={1} />
    <NumberInput source="activity_level" label="활동성 (1-5)" min={1} max={5} step={1} />
    <NumberInput source="interior_score" label="인테리어 (1-5)" min={1} max={5} step={0.5} />

    <NumberInput source="hint_count" label="힌트 횟수" min={0} />
    <NumberInput source="duration_minutes" label="제한시간 (분)" min={30} />
    <NumberInput source="price_per_person" label="인당 가격 (원)" min={0} step={1000} />
    <NumberInput source="min_players" label="최소 인원" min={1} max={20} />
    <NumberInput source="max_players" label="최대 인원" min={1} max={20} />
    <NumberInput source="rating_avg" label="평점 (1-5)" min={1} max={5} step={0.1} />

    <TextInput source="website_url" label="홈페이지 URL" fullWidth />
    <TextInput source="image_url" label="이미지 URL" fullWidth />

    <ArrayInput source="tags" label="태그">
      <SimpleFormIterator>
        <TextInput source="" label="태그" />
      </SimpleFormIterator>
    </ArrayInput>
  </>
)
