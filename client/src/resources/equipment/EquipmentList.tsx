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
  ReferenceInput,
  AutocompleteInput
} from 'react-admin';

const statusChoices = [
  { id: 'Active', name: 'В эксплуатации' },
  { id: 'Repair', name: 'В ремонте' },
  { id: 'Reserve', name: 'В резерве' },
  { id: 'WriteOff', name: 'Списано' },
];

const equipmentFilters = [
  <TextInput key="q" source="q" label="Поиск" alwaysOn />,
  <TextInput key="inventoryNumber" source="inventoryNumber" label="Инвентарный номер" />,
  <TextInput key="serialNumber" source="serialNumber" label="Заводской (серийный) номер" />,
  <TextInput key="name" source="name" label="Наименование единицы оборудования" />,
  <ReferenceInput key="equipmentTypeCode" source="equipmentTypeCode" reference="equipment-types" label="Вид оборудования">
    <AutocompleteInput optionText={(record) => record.code ? `${record.code} — ${record.name ?? record.code}` : (record.name ?? record.id)} filterToQuery={(searchText) => ({ q: searchText })} />
  </ReferenceInput>,
  <SelectArrayInput key="status" source="status" label="Текущий статус" choices={statusChoices} />,
  <TextInput key="location" source="location" label="Место эксплуатации / скважина / куст" />,
  <TextInput key="notes" source="notes" label="Примечания" />
];

const EquipmentListActions = () => (
  <TopToolbar>
    <FilterButton filters={equipmentFilters} />
    <CreateButton />
    <ExportButton />
  </TopToolbar>
);

export const EquipmentList = () => (
  <List actions={<EquipmentListActions />} filters={equipmentFilters} sort={{ field: 'inventoryNumber', order: 'ASC' }}>
    <Datagrid rowClick="show">
      <TextField source="id" label="id" />
      <TextField source="inventoryNumber" label="Инвентарный номер" />
      <TextField source="serialNumber" label="Заводской (серийный) номер" />
      <TextField source="name" label="Наименование единицы оборудования" />
      <ReferenceField source="equipmentTypeCode" reference="equipment-types" label="Вид оборудования" link="show">
        <TextField source="code" />
      </ReferenceField>
      <SelectField source="status" label="Текущий статус" choices={statusChoices} />
      <TextField source="location" label="Место эксплуатации / скважина / куст" />
      <DateField source="commissionedAt" label="Дата ввода в эксплуатацию" />
      <NumberField source="totalEngineHours" label="Общая наработка, моточасов" />
      <NumberField source="engineHoursSinceLastRepair" label="Наработка с последнего ремонта, моточасов" />
      <DateField source="lastRepairAt" label="Дата последнего ремонта" />
      <TextField source="notes" label="Примечания" />
    </Datagrid>
  </List>
);
