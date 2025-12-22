import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Invitation } from '../types';

export const BackendService = {
  /**
   * Retrieves the most recent pending invitation created by a specific user.
   * Useful for restoring state across devices/sessions.
   */
  async getLastPendingInvitation(userId: string): Promise<Invitation | null> {
    try {
        // Query invitations created by this user
        // Note: Composite index (createdBy + status + createdAt) would be ideal for performance,
        // but client-side filtering is safer for this scale without forced index creation.
        const q = query(collection(db, 'invitations'), where('createdBy', '==', userId));
        const snapshot = await getDocs(q);
        
        const pending = snapshot.docs
            .map(doc => doc.data() as Invitation)
            .filter(inv => inv.status === 'PENDING')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return pending.length > 0 ? pending[0] : null;
    } catch (error) {
        console.error("Error fetching invitations:", error);
        return null;
    }
  }
};