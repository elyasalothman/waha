/** Local email/password accounts use this app's Better Auth database.
 * Production endpoints require the persistent database, signing secret and
 * public auth URL; enabling this flag never enables a temporary production DB.
 */
export const emailAndPasswordEnabled = true;
