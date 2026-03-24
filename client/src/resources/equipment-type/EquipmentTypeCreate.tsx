import { Create, SimpleForm, TextInput, NumberInput } from 'react-admin';


export const EquipmentTypeCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="code" label="Код вида оборудования" isRequired />
      <TextInput source="name" label="Наименование вида" isRequired />
      <TextInput source="manufacturer" label="Производитель"  />
      <NumberInput source="maintenanceIntervalHours" label="Периодичность ТО, моточасов" />
      <NumberInput source="overhaulIntervalHours" label="Периодичность КР, моточасов" />
    </SimpleForm>
  </Create>
);
