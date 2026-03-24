import {
  List,
  Datagrid,
  TextField,
  TextInput,
  TopToolbar,
  FilterButton,
  CreateButton,
  ExportButton,
  NumberField
} from 'react-admin';


const equipmentTypeFilters = [
  <TextInput key="q" source="q" label="Поиск" alwaysOn />,
  <TextInput key="name" source="name" label="Наименование вида" />,
  <TextInput key="manufacturer" source="manufacturer" label="Производитель" />
];

const EquipmentTypeListActions = () => (
  <TopToolbar>
    <FilterButton filters={equipmentTypeFilters} />
    <CreateButton />
    <ExportButton />
  </TopToolbar>
);

export const EquipmentTypeList = () => (
  <List actions={<EquipmentTypeListActions />} filters={equipmentTypeFilters} sort={{ field: 'code', order: 'ASC' }}>
    <Datagrid rowClick="show">
      <TextField source="code" label="Код вида оборудования" />
      <TextField source="name" label="Наименование вида" />
      <TextField source="manufacturer" label="Производитель" />
      <NumberField source="maintenanceIntervalHours" label="Периодичность ТО, моточасов" />
      <NumberField source="overhaulIntervalHours" label="Периодичность КР, моточасов" />
    </Datagrid>
  </List>
);
