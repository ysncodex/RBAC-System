import type { UserStatus } from '@/types/user-status';

export interface User {
  id: string;

  name: string;

  email: string;

  status: UserStatus;

  role: {
    id: string;

    name: string;

    slug: string;
  };

  userPermissions: {
    permission: {
      slug: string;
    };
  }[];
}
