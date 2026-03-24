import { Show, SimpleShowLayout, TextField, NumberField, DateField, SelectField, ReferenceField } from 'react-admin';

const statusChoices = [
  { id: 'Active', name: 'В эксплуатации' },
  { id: 'Repair', name: 'В ремонте' },
  { id: 'Reserve', name: 'В резерве' },
  { id: 'WriteOff', name: 'Списано' },
];
export const EquipmentShow = () => (
  <Show>
    <SimpleShowLayout>
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
    </SimpleShowLayout>
  </Show>
);
