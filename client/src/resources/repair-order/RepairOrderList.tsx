import {
  List,
  Datagrid,
  TextField,
  TextInput,
  TopToolbar,
  FilterButton,
  CreateButton,
  ExportButton,
  NumberField,
  DateField,
  SelectField,
  ReferenceField,
  SelectArrayInput,
  SelectInput,
  ReferenceInput,
  AutocompleteInput
} from 'react-admin';

const repairKindChoices = [
  { id: 'TO', name: 'Техническое обслуживание' },
  { id: 'TR', name: 'Текущий ремонт' },
  { id: 'TRE', name: 'Текущий расширенный ремонт' },
  { id: 'KR', name: 'Капитальный ремонт' },
  { id: 'AR', name: 'Аварийный ремонт' },
  { id: 'MP', name: 'Метрологическая поверка' },
];

const statusChoices = [
  { id: 'Draft', name: 'Черновик' },
  { id: 'Approved', name: 'Утверждена' },
  { id: 'InWork', name: 'В работе' },
  { id: 'Done', name: 'Выполнена' },
  { id: 'Cancelled', name: 'Отменена' },
];

const repairOrderFilters = [
  <TextInput key="q" source="q" label="Поиск" alwaysOn />,
  <TextInput key="number" source="number" label="Номер заявки" />,
  <ReferenceInput key="equipmentId" source="equipmentId" reference="equipment" label="Оборудование">
    <AutocompleteInput optionText={(record) => record.inventoryNumber ? `${record.inventoryNumber} — ${record.name ?? record.inventoryNumber}` : (record.name ?? record.id)} filterToQuery={(searchText) => ({ q: searchText })} />
  </ReferenceInput>,
  <SelectInput key="repairKind" source="repairKind" label="Вид ремонта" choices={repairKindChoices} emptyText="Все" />,
  <SelectArrayInput key="status" source="status" label="Статус" choices={statusChoices} />,
  <TextInput key="contractor" source="contractor" label="Подрядная организация (если внешний ремонт)" />,
  <TextInput key="description" source="description" label="Описание работ / дефекта" />,
  <TextInput key="notes" source="notes" label="Примечания" />
];

const RepairOrderListActions = () => (
  <TopToolbar>
    <FilterButton filters={repairOrderFilters} />
    <CreateButton />
    <ExportButton />
  </TopToolbar>
);

export const RepairOrderList = () => (
  <List actions={<RepairOrderListActions />} filters={repairOrderFilters} sort={{ field: 'number', order: 'ASC' }}>
    <Datagrid rowClick="show">
      <TextField source="id" label="Идентификатор" />
      <TextField source="number" label="Номер заявки" />
      <ReferenceField source="equipmentId" reference="equipment" label="Оборудование" link="show">
        <TextField source="inventoryNumber" />
      </ReferenceField>
      <SelectField source="repairKind" label="Вид ремонта" choices={repairKindChoices} />
      <SelectField source="status" label="Статус" choices={statusChoices} />
      <DateField source="plannedAt" label="Плановая дата начала" />
      <DateField source="startedAt" label="Фактическая дата начала" />
      <DateField source="completedAt" label="Фактическая дата завершения" />
      <TextField source="contractor" label="Подрядная организация (если внешний ремонт)" />
      <NumberField source="engineHoursAtRepair" label="Наработка на момент ремонта, моточасов" />
      <TextField source="description" label="Описание работ / дефекта" />
      <TextField source="notes" label="Примечания" />
    </Datagrid>
  </List>
);
