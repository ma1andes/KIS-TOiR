import { Edit, SimpleForm, TextInput, NumberInput, DateInput, SelectInput, ReferenceInput, AutocompleteInput } from 'react-admin';

const statusChoices = [
  { id: 'Active', name: 'В эксплуатации' },
  { id: 'Repair', name: 'В ремонте' },
  { id: 'Reserve', name: 'В резерве' },
  { id: 'WriteOff', name: 'Списано' },
];

export const EquipmentEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" label="id" disabled />
      <TextInput source="inventoryNumber" label="Инвентарный номер" isRequired />
      <TextInput source="serialNumber" label="Заводской (серийный) номер"  />
      <TextInput source="name" label="Наименование единицы оборудования" isRequired />
      <ReferenceInput source="equipmentTypeCode" reference="equipment-types">
        <AutocompleteInput label="Вид оборудования" optionText={(record) => record.code ? `${record.code} — ${record.name ?? record.code}` : (record.name ?? record.id)} filterToQuery={(searchText) => ({ q: searchText })} />
      </ReferenceInput>
      <SelectInput source="status" label="Текущий статус" choices={statusChoices} emptyText="Не выбрано" />
      <TextInput source="location" label="Место эксплуатации / скважина / куст"  />
      <DateInput source="commissionedAt" label="Дата ввода в эксплуатацию" />
      <NumberInput source="totalEngineHours" label="Общая наработка, моточасов" />
      <NumberInput source="engineHoursSinceLastRepair" label="Наработка с последнего ремонта, моточасов" />
      <DateInput source="lastRepairAt" label="Дата последнего ремонта" />
      <TextInput source="notes" label="Примечания"  />
    </SimpleForm>
  </Edit>
);
