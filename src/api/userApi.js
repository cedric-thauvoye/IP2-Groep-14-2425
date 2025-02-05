import axios from 'axios';
import { getAuth } from 'firebase/auth';

const API_URL = 'http://localhost:3000';

export const fetchUserDetailsBatch = async (uids) => {
    try {
        const auth = getAuth();
        const token = await auth.currentUser.getIdToken();
        const response = await axios.post(
            `${API_URL}/users/batch`,
            { uids },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching user details:', error);
        return [];
    }
};
