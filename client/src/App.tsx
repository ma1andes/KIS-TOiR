import { Admin, Resource } from 'react-admin';
import dataProvider from './dataProvider';
import authProvider from './auth/authProvider';

import { EquipmentTypeList } from './resources/equipment-type/EquipmentTypeList';
import { EquipmentTypeCreate } from './resources/equipment-type/EquipmentTypeCreate';
import { EquipmentTypeEdit } from './resources/equipment-type/EquipmentTypeEdit';
import { EquipmentTypeShow } from './resources/equipment-type/EquipmentTypeShow';

import { EquipmentList } from './resources/equipment/EquipmentList';
import { EquipmentCreate } from './resources/equipment/EquipmentCreate';
import { EquipmentEdit } from './resources/equipment/EquipmentEdit';
import { EquipmentShow } from './resources/equipment/EquipmentShow';

import { RepairOrderList } from './resources/repair-order/RepairOrderList';
import { RepairOrderCreate } from './resources/repair-order/RepairOrderCreate';
import { RepairOrderEdit } from './resources/repair-order/RepairOrderEdit';
import { RepairOrderShow } from './resources/repair-order/RepairOrderShow';

const App = () => (
  <Admin dataProvider={dataProvider} authProvider={authProvider} requireAuth>
    <Resource
      name="equipment-types"
      options={{ label: 'Виды оборудования' }}
      list={EquipmentTypeList}
      create={EquipmentTypeCreate}
      edit={EquipmentTypeEdit}
      show={EquipmentTypeShow}
    />
    <Resource
      name="equipment"
      options={{ label: 'Оборудование' }}
      list={EquipmentList}
      create={EquipmentCreate}
      edit={EquipmentEdit}
      show={EquipmentShow}
    />
    <Resource
      name="repair-orders"
      options={{ label: 'Заявки на ремонт' }}
      list={RepairOrderList}
      create={RepairOrderCreate}
      edit={RepairOrderEdit}
      show={RepairOrderShow}
    />
  </Admin>
);

export default App;
