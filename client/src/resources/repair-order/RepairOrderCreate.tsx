import { Create, SimpleForm, TextInput, NumberInput, DateInput, SelectInput, ReferenceInput, AutocompleteInput } from 'react-admin';

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

export const RepairOrderCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="number" label="Номер заявки" isRequired />
      <ReferenceInput source="equipmentId" reference="equipment">
        <AutocompleteInput label="Оборудование" optionText={(record) => record.inventoryNumber ? `${record.inventoryNumber} — ${record.name ?? record.inventoryNumber}` : (record.name ?? record.id)} filterToQuery={(searchText) => ({ q: searchText })} />
      </ReferenceInput>
      <SelectInput source="repairKind" label="Вид ремонта" choices={repairKindChoices} emptyText="Не выбрано" />
      <SelectInput source="status" label="Статус" choices={statusChoices} emptyText="Не выбрано" />
      <DateInput source="plannedAt" label="Плановая дата начала" />
      <DateInput source="startedAt" label="Фактическая дата начала" />
      <DateInput source="completedAt" label="Фактическая дата завершения" />
      <TextInput source="contractor" label="Подрядная организация (если внешний ремонт)"  />
      <NumberInput source="engineHoursAtRepair" label="Наработка на момент ремонта, моточасов" />
      <TextInput source="description" label="Описание работ / дефекта"  />
      <TextInput source="notes" label="Примечания"  />
    </SimpleForm>
  </Create>
);
