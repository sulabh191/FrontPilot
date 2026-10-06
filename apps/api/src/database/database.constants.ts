// Injection token for the Drizzle database instance.
// Services ask for it with @Inject(DATABASE) instead of creating their own connection.
export const DATABASE = Symbol("DATABASE");
