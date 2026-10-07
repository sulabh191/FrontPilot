import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC = "isPublic";

// Every endpoint requires a token by default ("secure by default").
// Mark the few that don't, like health checks and the public chat, with @Public().
export const Public = () => SetMetadata(IS_PUBLIC, true);
