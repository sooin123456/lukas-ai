/**
 * Authentication and Request Guards Module
 * 
 * This module provides utility functions for protecting routes and API endpoints
 * by enforcing authentication and HTTP method requirements. These guards are designed
 * to be used in React Router loaders and actions to ensure proper access control
 * and request validation.
 * 
 * The module includes:
 * - Authentication guard to ensure a user is logged in
 * - Department manager authentication guard
 * - HTTP method guard to ensure requests use the correct HTTP method
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { data } from "react-router";

/**
 * Require user authentication for a route or action
 * 
 * This function checks if a user is currently authenticated by querying the Supabase
 * client. If no user is found, it throws a 401 Unauthorized response, which will be
 * handled by React Router's error boundary system.
 * 
 * @example
 * // In a loader or action function
 * export async function loader({ request }: LoaderArgs) {
 *   const [client] = makeServerClient(request);
 *   await requireAuthentication(client);
 *   
 *   // Continue with authenticated logic...
 *   return json({ ... });
 * }
 * 
 * @param client - The Supabase client instance to use for authentication check
 * @throws {Response} 401 Unauthorized if no user is authenticated
 */
export async function requireAuthentication(client: SupabaseClient) {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    throw data(null, { status: 401 });
  }
}

/**
 * Require department manager authentication for a route or action
 * 
 * This function checks if a user is authenticated and has department manager role.
 * It first ensures the user is logged in, then checks their role in the database.
 * 
 * @example
 * // In a loader or action function
 * export async function loader({ request }: LoaderArgs) {
 *   const [client] = makeServerClient(request);
 *   await requireDepartmentManager(client);
 *   
 *   // Continue with department manager logic...
 *   return json({ ... });
 * }
 * 
 * @param client - The Supabase client instance to use for authentication check
 * @throws {Response} 401 Unauthorized if no user is authenticated
 * @throws {Response} 403 Forbidden if user is not a department manager
 */
export async function requireDepartmentManager(client: SupabaseClient) {
  // First, ensure user is authenticated
  const {
    data: { user },
  } = await client.auth.getUser();
  
  if (!user) {
    throw data(null, { status: 401 });
  }

  // Check if user has department manager role
  const { data: profile, error } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !profile || profile.role !== 'department_manager') {
    throw data(null, { status: 403 });
  }
}

/**
 * Require a specific HTTP method for a route action
 * 
 * This function returns a middleware that checks if the incoming request uses
 * the specified HTTP method. If not, it throws a 405 Method Not Allowed response.
 * This is useful for ensuring that endpoints only accept the intended HTTP methods.
 * 
 * @example
 * // In an action function
 * export async function action({ request }: ActionArgs) {
 *   requireMethod('POST')(request);
 *   
 *   // Continue with POST-specific logic...
 *   return json({ ... });
 * }
 * 
 * @param method - The required HTTP method (e.g., 'GET', 'POST', 'PUT', 'DELETE')
 * @returns A function that validates the request method
 * @throws {Response} 405 Method Not Allowed if the request uses an incorrect method
 */
export function requireMethod(method: string) {
  return (request: Request) => {
    if (request.method !== method) {
      throw data(null, { status: 405 });
    }
  };
}

/**
 * Require user authentication and return user data
 * 
 * This function checks if a user is currently authenticated and returns the user data.
 * If no user is found, it throws a 401 Unauthorized response.
 * 
 * @param request - The request object
 * @returns The authenticated user data
 * @throws {Response} 401 Unauthorized if no user is authenticated
 */
export async function requireUser(request: Request) {
  const makeServerClient = (await import("~/core/lib/supa-client.server")).default;
  const [client] = makeServerClient(request);
  
  const {
    data: { user },
  } = await client.auth.getUser();
  
  if (!user) {
    throw data(null, { status: 401 });
  }

  return user;
}
