import { Datagrid, DateField, Edit, Create, FunctionField, List, NumberField, SimpleForm, TextField } from 'react-admin'
import { REVIEW_SOURCE_LABEL, type ReviewSourceType } from '../lib/themeReviewLinks'
import { ReviewLinkFormFields } from './ReviewLinkForm'

interface ReviewLinkRecord {
  source_type?: ReviewSourceType
  status?: string
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
}

function first<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function themeLabel(record: ReviewLinkRecord) {
  const theme = first(record.themes)
  const cafe = first(theme?.cafes)
  const cafeName = cafe ? `${cafe.name ?? ''}${cafe.branch_name ? ` ${cafe.branch_name}` : ''}`.trim() : ''
  return cafeName ? `${cafeName} · ${theme?.name ?? ''}` : theme?.name ?? '-'
}

export const ReviewLinkList = () => (
  <List
    perPage={50}
    sort={{ field: 'created_at', order: 'DESC' }}
    queryOptions={{ meta: { select: '*,themes(name,cafes(name,branch_name))' } }}
  >
    <Datagrid rowClick="edit">
      <NumberField source="theme_id" label="테마 ID" />
      <FunctionField label="테마" render={(record: ReviewLinkRecord) => themeLabel(record)} />
      <FunctionField
        label="유형"
        render={(record: ReviewLinkRecord) =>
          record.source_type ? REVIEW_SOURCE_LABEL[record.source_type] : '-'
        }
      />
      <TextField source="title" label="제목" />
      <TextField source="author" label="작성자" />
      <DateField source="published_at" label="게시일" />
      <FunctionField
        label="상태"
        render={(record: ReviewLinkRecord) => record.status === 'active' ? '노출' : '숨김'}
      />
    </Datagrid>
  </List>
)

export const ReviewLinkEdit = () => (
  <Edit>
    <SimpleForm>
      <ReviewLinkFormFields />
    </SimpleForm>
  </Edit>
)

export const ReviewLinkCreate = () => (
  <Create>
    <SimpleForm defaultValues={{ source_type: 'blog', status: 'active', sort_order: 0 }}>
      <ReviewLinkFormFields />
    </SimpleForm>
  </Create>
)
