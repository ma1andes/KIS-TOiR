import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../auth.constants';
import { RealmRole } from '../roles/realm-role.enum';

export const Roles = (...roles: RealmRole[]) => SetMetadata(ROLES_KEY, roles);

