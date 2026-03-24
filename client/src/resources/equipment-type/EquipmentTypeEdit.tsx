import { Edit, SimpleForm, TextInput, NumberInput } from 'react-admin';


export const EquipmentTypeEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="code" label="Код вида оборудования" disabled />
      <TextInput source="name" label="Наименование вида" isRequired />
      <TextInput source="manufacturer" label="Производитель"  />
      <NumberInput source="maintenanceIntervalHours" label="Периодичность ТО, моточасов" />
      <NumberInput source="overhaulIntervalHours" label="Периодичность КР, моточасов" />
    </SimpleForm>
  </Edit>
);
