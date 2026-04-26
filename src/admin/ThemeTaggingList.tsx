import { Create, Datagrid, Edit, FunctionField, List, NumberField, SelectField, SelectInput, SimpleForm, TextField, TextInput } from 'react-admin'
import { TAGGING_SOURCE_CHOICES, TAGGING_STATUS_CHOICES, ThemeTaggingFormFields } from './ThemeTaggingForm'

const TAG_CATEGORY_LABEL: Record<string, string> = {
  award: '수상/랭킹',
  community: '커뮤니티',
  feature: '테마 특성',
  operation: '운영/예약',
  audience: '추천 대상',
  warning: '주의/제약',
}

interface ThemeTaggingRecord {
  themes?: {
    name?: string
    cafes?: {
      name?: string
      branch_name?: string | null
    } | {
      name?: string
      branch_name?: string | null
    }[] | null
  } | {
    name?: string
    cafes?: {
      name?: string
      branch_name?: string | null
    } | {
      name?: string
      branch_name?: string | null
    }[] | null
  }[] | null
  theme_tags?: {
    name?: string
    category?: string
  } | {
    name?: string
    category?: string
  }[] | null
}

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function themeLabel(record: ThemeTaggingRecord) {
  const theme = first(record.themes)
  const cafe = first(theme?.cafes)
  const cafeName = cafe ? `${cafe.name ?? ''}${cafe.branch_name ? ` ${cafe.branch_name}` : ''}`.trim() : ''
  return cafeName ? `${cafeName} · ${theme?.name ?? ''}` : theme?.name ?? '-'
}

export const ThemeTaggingList = () => (
  <List
    perPage={50}
    sort={{ field: 'created_at', order: 'DESC' }}
    queryOptions={{ meta: { select: '*,themes(name,cafes(name,branch_name)),theme_tags(name,category)' } }}
    filters={[
      <TextInput key="theme_id" source="theme_id" label="테마 ID" alwaysOn />,
      <SelectInput key="source_type" source="source_type" label="출처" choices={TAGGING_SOURCE_CHOICES} />,
      <SelectInput key="status" source="status" label="상태" choices={TAGGING_STATUS_CHOICES} />,
    ]}
  >
    <Datagrid rowClick="edit">
      <FunctionField label="테마" render={(record: ThemeTaggingRecord) => themeLabel(record)} />
      <FunctionField label="태그" render={(record: ThemeTaggingRecord) => first(record.theme_tags)?.name ?? '-'} />
      <FunctionField
        label="카테고리"
        render={(record: ThemeTaggingRecord) => {
          const category = first(record.theme_tags)?.category
          return category ? TAG_CATEGORY_LABEL[category] ?? category : '-'
        }}
      />
      <SelectField source="source_type" label="출처" choices={TAGGING_SOURCE_CHOICES} />
      <NumberField source="confidence_score" label="점수" />
      <SelectField source="status" label="상태" choices={TAGGING_STATUS_CHOICES} />
      <TextField source="created_at" label="등록일" />
    </Datagrid>
  </List>
)

export const ThemeTaggingEdit = () => (
  <Edit
    queryOptions={{ meta: { select: '*,themes(name,cafes(name,branch_name)),theme_tags(name,category)' } }}
    transform={(data: Record<string, unknown>) => {
      const { themes: _themes, theme_tags: _themeTags, ...rest } = data
      return rest
    }}
  >
    <SimpleForm>
      <ThemeTaggingFormFields />
    </SimpleForm>
  </Edit>
)

export const ThemeTaggingCreate = () => (
  <Create>
    <SimpleForm defaultValues={{ source_type: 'manual', status: 'active', confidence_score: 100 }}>
      <ThemeTaggingFormFields />
    </SimpleForm>
  </Create>
)
