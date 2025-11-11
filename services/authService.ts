import { User } from '../types';
import { loginUser } from './apiService'; // Impor fungsi API yang baru

/**
 * Simulates a login request by calling the backend API.
 * @param username The user's username.
 * @param password The user's password.
 * @returns A promise that resolves to a User object on success, or null on failure.
 */
export const login = async (username: string, password: string): Promise<User | null> => {
  console.log(`Attempting login for user: ${username} via API`);
  
  // Hapus data pengguna yang di-hardcode.
  // Sekarang panggil API yang sebenarnya.
  const user = await loginUser(username, password);

  if (user) {
    console.log(`API login successful for ${username}`);
    return user;
  }
  
  console.log(`API login failed for ${username}`);
  return null;
};
