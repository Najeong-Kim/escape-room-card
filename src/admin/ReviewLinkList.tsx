import { Datagrid, DateField, Edit, Create, FunctionField, List, NumberField, SimpleForm, TextField } from 'react-admin'
import { REVIEW_SOURCE_LABEL, type ReviewSourceType } from '../lib/themeReviewLinks'
import { ReviewLinkFormFields } from './ReviewLinkForm'

interface ReviewLinkRecord {
  source_type?: ReviewSourceType
  status?: string
  match_reason?: string[] | null
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

const STATUS_LABEL: Record<string, string> = {
  active: '노출',
  pending: '검수 대기',
  hidden: '숨김',
  rejected: '거절',
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
      <NumberField source="confidence_score" label="점수" />
      <TextField source="collected_by" label="수집 방식" />
      <FunctionField
        label="매칭 근거"
        render={(record: ReviewLinkRecord) => record.match_reason?.join(', ') ?? '-'}
      />
      <FunctionField
        label="상태"
        render={(record: ReviewLinkRecord) => record.status ? STATUS_LABEL[record.status] ?? record.status : '-'}
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
    <SimpleForm defaultValues={{ source_type: 'blog', status: 'active', sort_order: 0, collected_by: 'manual' }}>
      <ReviewLinkFormFields />
    </SimpleForm>
  </Create>
)
