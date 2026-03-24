import { Show, SimpleShowLayout, TextField, NumberField } from 'react-admin';

export const EquipmentTypeShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="code" label="Код вида оборудования" />
      <TextField source="name" label="Наименование вида" />
      <TextField source="manufacturer" label="Производитель" />
      <NumberField source="maintenanceIntervalHours" label="Периодичность ТО, моточасов" />
      <NumberField source="overhaulIntervalHours" label="Периодичность КР, моточасов" />
    </SimpleShowLayout>
  </Show>
);
