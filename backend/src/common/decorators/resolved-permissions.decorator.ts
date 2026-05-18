import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ResolvedActorPermissions = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string[] => {
    const request = ctx.switchToHttp().getRequest();
    return (request.resolvedPermissions as string[] | undefined) ?? [];
  },
);
