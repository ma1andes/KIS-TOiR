/*
  КИС ТОиР — демонстрационная схема доменной модели
  Сущности: Equipment (Оборудование), EquipmentType (Вид оборудования), RepairOrder (Заявка на ремонт)
*/

enum EquipmentStatus {
  value Active {
    label "В эксплуатации";
  }
  value Repair {
    label "В ремонте";
  }
  value Reserve {
    label "В резерве";
  }
  value WriteOff {
    label "Списано";
  }
}

enum RepairKind {
  value TO {
    label "Техническое обслуживание";
  }
  value TR {
    label "Текущий ремонт";
  }
  value TRE {
    label "Текущий расширенный ремонт";
  }
  value KR {
    label "Капитальный ремонт";
  }
  value AR {
    label "Аварийный ремонт";
  }
  value MP {
    label "Метрологическая поверка";
  }
}

enum RepairOrderStatus {
  value Draft {
    label "Черновик";
  }
  value Approved {
    label "Утверждена";
  }
  value InWork {
    label "В работе";
  }
  value Done {
    label "Выполнена";
  }
  value Cancelled {
    label "Отменена";
  }
}

entity EquipmentType {
  description "Вид (марка) оборудования — нормативный справочник НСИ";

  attribute code {
    key primary;
    description "Код вида оборудования";
    type string;
    is required;
    is unique;
  }

  attribute name {
    description "Наименование вида";
    type string;
    is required;
  }

  attribute manufacturer {
    description "Производитель";
    type string;
  }

  attribute maintenanceIntervalHours {
    description "Периодичность ТО, моточасов";
    type integer;
  }

  attribute overhaulIntervalHours {
    description "Периодичность КР, моточасов";
    type integer;
  }
}

entity Equipment {
  description "Единица оборудования — объект ремонта и технического обслуживания";

  attribute id {
    type uuid;
    key primary;
  }

  attribute inventoryNumber {
    description "Инвентарный номер";
    type string;
    is required;
    is unique;
  }

  attribute serialNumber {
    description "Заводской (серийный) номер";
    type string;
  }

  attribute name {
    description "Наименование единицы оборудования";
    type string;
    is required;
  }

  attribute equipmentTypeCode {
    type string;
    key foreign {
      relates EquipmentType.code;
    }
    is required;
  }

  attribute status {
    description "Текущий статус";
    type EquipmentStatus;
    default Active;
    is required;
  }

  attribute location {
    description "Место эксплуатации / скважина / куст";
    type string;
  }

  attribute commissionedAt {
    description "Дата ввода в эксплуатацию";
    type date;
  }

  attribute totalEngineHours {
    description "Общая наработка, моточасов";
    type decimal;
  }

  attribute engineHoursSinceLastRepair {
    description "Наработка с последнего ремонта, моточасов";
    type decimal;
  }

  attribute lastRepairAt {
    description "Дата последнего ремонта";
    type date;
  }

  attribute notes {
    description "Примечания";
    type text;
  }
}

entity RepairOrder {
  description "Заявка на ремонт — формируется по ППР или по факту обнаруженного дефекта";

  attribute id {
    type uuid;
    key primary;
  }

  attribute number {
    description "Номер заявки";
    type string;
    is required;
    is unique;
  }

  attribute equipmentId {
    type uuid;
    key foreign {
      relates Equipment.id;
    }
    is required;
  }

  attribute repairKind {
    description "Вид ремонта";
    type RepairKind;
    is required;
  }

  attribute status {
    type RepairOrderStatus;
    default Draft;
    is required;
  }

  attribute plannedAt {
    description "Плановая дата начала";
    type date;
    is required;
  }

  attribute startedAt {
    description "Фактическая дата начала";
    type date;
  }

  attribute completedAt {
    description "Фактическая дата завершения";
    type date;
  }

  attribute contractor {
    description "Подрядная организация (если внешний ремонт)";
    type string;
  }

  attribute engineHoursAtRepair {
    description "Наработка на момент ремонта, моточасов";
    type decimal;
  }

  attribute description {
    description "Описание работ / дефекта";
    type text;
  }

  attribute notes {
    description "Примечания";
    type text;
  }
}
