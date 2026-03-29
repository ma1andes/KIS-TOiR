import { Show, SimpleShowLayout, TextField, NumberField, DateField, SelectField, ReferenceField } from 'react-admin';

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
export const RepairOrderShow = () => (
  <Show>
    <SimpleShowLayout>
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
    </SimpleShowLayout>
  </Show>
);
