import {
  Datagrid,
  DateField,
  Edit,
  EditButton,
  FunctionField,
  List,
  SelectField,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  useRecordContext,
} from 'react-admin'

const REPORT_TYPE_CHOICES = [
  { id: 'incorrect_info', name: '정보 오류' },
  { id: 'closed_or_moved', name: '폐점/이전' },
  { id: 'missing_theme', name: '테마 누락' },
  { id: 'bug', name: '화면 오류' },
  { id: 'other', name: '기타' },
]

const STATUS_CHOICES = [
  { id: 'open', name: '접수' },
  { id: 'reviewing', name: '검토 중' },
  { id: 'resolved', name: '처리 완료' },
  { id: 'rejected', name: '반려' },
]

interface ReportRecord {
  title?: string
  message?: string
  reporter_name?: string | null
  reporter_email?: string | null
  themes?: {
    name?: string
    cafes?: {
      name?: string
      branch_name?: string | null
    } | null
  } | null
}

function ReporterField() {
  const record = useRecordContext<ReportRecord>()
  if (!record) return null
  const parts = [record.reporter_name, record.reporter_email].filter(Boolean)
  return <span>{parts.length > 0 ? parts.join(' / ') : '익명'}</span>
}

function ThemeField() {
  const record = useRecordContext<ReportRecord>()
  const theme = record?.themes
  if (!theme) return <span>-</span>
  const cafe = theme.cafes
  const cafeName = cafe ? `${cafe.name ?? ''}${cafe.branch_name ? ` ${cafe.branch_name}` : ''}` : ''
  return <span>{cafeName ? `${cafeName} · ${theme.name ?? ''}` : theme.name ?? '-'}</span>
}

export const ReportList = () => (
  <List
    perPage={50}
    sort={{ field: 'created_at', order: 'DESC' }}
    queryOptions={{ meta: { select: '*,themes(name,cafes(name,branch_name))' } }}
    filters={[
      <TextInput key="title" source="title" label="제목" alwaysOn />,
      <SelectInput key="status" source="status" label="상태" choices={STATUS_CHOICES} />,
    ]}
  >
    <Datagrid rowClick={false}>
      <DateField source="created_at" label="접수일" showTime />
      <SelectField source="status" label="상태" choices={STATUS_CHOICES} />
      <SelectField source="report_type" label="유형" choices={REPORT_TYPE_CHOICES} />
      <TextField source="title" label="제목" />
      <FunctionField label="테마" render={() => <ThemeField />} />
      <FunctionField label="제보자" render={() => <ReporterField />} />
      <EditButton label="확인" />
    </Datagrid>
  </List>
)

export const ReportEdit = () => (
  <Edit
    queryOptions={{ meta: { select: '*,themes(name,cafes(name,branch_name))' } }}
    transform={(data: Record<string, unknown>) => {
      const { themes: _themes, ...rest } = data
      return rest
    }}
  >
    <SimpleForm>
      <SelectInput source="status" label="상태" choices={STATUS_CHOICES} />
      <SelectInput source="report_type" label="유형" choices={REPORT_TYPE_CHOICES} disabled />
      <TextInput source="title" label="제목" fullWidth />
      <TextInput source="message" label="내용" fullWidth multiline minRows={5} />
      <FunctionField label="테마" render={() => <ThemeField />} />
      <FunctionField label="제보자" render={() => <ReporterField />} />
      <TextInput source="page_url" label="페이지 URL" fullWidth disabled />
      <TextInput source="admin_note" label="관리자 메모" fullWidth multiline minRows={4} />
    </SimpleForm>
  </Edit>
)
