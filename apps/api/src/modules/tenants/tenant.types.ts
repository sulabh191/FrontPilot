// The authenticated business, attached to the request by the auth guard.
export type Tenant = {
  id: string;
  name: string;
  slug: string;
  timeZone: string;
};
